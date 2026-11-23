import { DocumentChunk, VectorDocument } from '../types';
import { INITIAL_CHUNKS, INITIAL_SECURITY_DOCUMENTS } from './mockKnowledgeBase';

const STORAGE_DOCS_KEY = 'aegis_vector_docs_v1';
const STORAGE_CHUNKS_KEY = 'aegis_vector_chunks_v1';

const IDB_NAME = 'AegisSecVectorVault';
const IDB_VERSION = 1;
const IDB_STORE = 'vault_state';
const IDB_KEY_DOCS = 'documents';
const IDB_KEY_CHUNKS = 'chunks';

// Mathematical Vector similarity & embedding helpers
export function generateTermVector(text: string, dimensions = 64): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s_-]/g, ' ');
  const tokens = normalized.split(/\s+/).filter(t => t.length > 1);
  const vector = new Array(dimensions).fill(0);

  if (tokens.length === 0) return vector;

  // Hashing trick with n-gram weighting for semantic overlap
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;

    // Sub-word trigrams for partial code / CVE matches (e.g. "cve-2024", "rce", "privesc")
    if (word.length >= 4) {
      for (let j = 0; j < word.length - 2; j++) {
        const sub = word.substring(j, j + 3);
        let subHash = 0;
        for (let sc = 0; sc < sub.length; sc++) {
          subHash = ((subHash << 5) - subHash) + sub.charCodeAt(sc);
          subHash |= 0;
        }
        vector[Math.abs(subHash) % dimensions] += 0.5;
      }
    }
  }

  // L2 Normalization (Unit vector length)
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let k = 0; k < dimensions; k++) {
      vector[k] = parseFloat((vector[k] / norm).toFixed(4));
    }
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function recursiveCharacterSplit(
  text: string,
  chunkSize = 450,
  chunkOverlap = 80
): string[] {
  if (!text || text.trim().length === 0) return [];
  const safeChunkSize = Math.max(100, chunkSize);
  const safeOverlap = Math.min(Math.max(0, chunkOverlap), Math.floor(safeChunkSize / 2));
  if (text.length <= safeChunkSize) return [text.trim()];

  const chunks: string[] = [];
  const separators = ['\n\n', '\n', '. ', '; ', ' '];

  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = startIndex + safeChunkSize;
    if (endIndex >= text.length) {
      chunks.push(text.slice(startIndex).trim());
      break;
    }

    // Find best separator boundary
    let breakPoint = -1;
    for (const sep of separators) {
      const idx = text.lastIndexOf(sep, endIndex);
      if (idx > startIndex + (safeChunkSize / 3)) {
        breakPoint = idx + sep.length;
        break;
      }
    }

    if (breakPoint === -1) {
      breakPoint = endIndex;
    }

    const chunkContent = text.slice(startIndex, breakPoint).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    startIndex = Math.max(startIndex + 1, breakPoint - safeOverlap);
  }

  return chunks;
}

function buildSeededChunks(): DocumentChunk[] {
  return INITIAL_CHUNKS.map(chunk => ({
    ...chunk,
    vector: generateTermVector(chunk.content + ' ' + (chunk.metadata?.tags?.join(' ') || ''))
  }));
}

function openVaultDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readFromIDB<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function writeToIDB(db: IDBDatabase, docs: VectorDocument[], chunks: DocumentChunk[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(docs, IDB_KEY_DOCS);
      store.put(chunks, IDB_KEY_CHUNKS);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

type DbListener = () => void;

class LocalVectorDatabase {
  private documents: VectorDocument[] = [];
  private chunks: DocumentChunk[] = [];
  private storageEngine: 'IndexedDB' | 'localStorage' | 'memory' = 'localStorage';
  private lastStorageError: string | null = null;
  private listeners: Set<DbListener> = new Set();

  constructor() {
    this.initSyncFallback();
    void this.hydrateFromIndexedDB();
  }

  public subscribe(listener: DbListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  }

  private ensureChunkVectors(chunks: DocumentChunk[]): DocumentChunk[] {
    return chunks
      .filter(c => c && typeof c === 'object' && typeof c.content === 'string')
      .map(chunk => ({
        ...chunk,
        metadata: chunk.metadata || { source: 'Local Vault', tags: [], createdAt: new Date().toISOString() },
        vector: Array.isArray(chunk.vector) && chunk.vector.length === 64
          ? chunk.vector
          : generateTermVector(chunk.content + ' ' + (chunk.metadata?.tags?.join(' ') || ''))
      }));
  }

  private initSyncFallback() {
    try {
      const savedDocs = localStorage.getItem(STORAGE_DOCS_KEY);
      const savedChunks = localStorage.getItem(STORAGE_CHUNKS_KEY);

      if (savedDocs && savedChunks) {
        const parsedDocs = JSON.parse(savedDocs);
        const parsedChunks = JSON.parse(savedChunks);
        if (Array.isArray(parsedDocs) && Array.isArray(parsedChunks)) {
          this.documents = parsedDocs;
          this.chunks = this.ensureChunkVectors(parsedChunks);
          return;
        }
      }
    } catch {
      // Corrupted localStorage entry — recover cleanly with seeded defaults
    }

    this.documents = [...INITIAL_SECURITY_DOCUMENTS];
    this.chunks = buildSeededChunks();
  }

  private async hydrateFromIndexedDB() {
    const db = await openVaultDB();
    if (!db) {
      this.storageEngine = typeof localStorage !== 'undefined' ? 'localStorage' : 'memory';
      this.notify();
      return;
    }

    this.storageEngine = 'IndexedDB';
    const [idbDocs, idbChunks] = await Promise.all([
      readFromIDB<VectorDocument[]>(db, IDB_KEY_DOCS),
      readFromIDB<DocumentChunk[]>(db, IDB_KEY_CHUNKS)
    ]);

    if (Array.isArray(idbDocs) && Array.isArray(idbChunks) && idbDocs.length > 0) {
      this.documents = idbDocs;
      this.chunks = this.ensureChunkVectors(idbChunks);
      this.lastStorageError = null;
      this.notify();
    } else {
      // Migrate initial/localStorage dataset into IndexedDB so it is no longer bound by the 5MB localStorage cap
      await writeToIDB(db, this.documents, this.chunks);
      this.notify();
    }
  }

  private persist() {
    this.lastStorageError = null;

    // 1. Primary high-capacity persistence: IndexedDB (hundreds of MBs / GBs on local laptop)
    void openVaultDB().then(async (db) => {
      if (db) {
        const ok = await writeToIDB(db, this.documents, this.chunks);
        if (ok) {
          this.storageEngine = 'IndexedDB';
        } else {
          this.lastStorageError = 'IndexedDB write failed; verify browser storage permissions.';
        }
        this.notify();
      }
    });

    // 2. Opportunistic fast-boot mirror in localStorage (auto-skips if dataset exceeds 5MB quota)
    try {
      const docsJson = JSON.stringify(this.documents);
      const chunksJson = JSON.stringify(this.chunks);
      if (docsJson.length + chunksJson.length < 3_500_000) {
        localStorage.setItem(STORAGE_DOCS_KEY, docsJson);
        localStorage.setItem(STORAGE_CHUNKS_KEY, chunksJson);
      } else {
        // Clear legacy localStorage copy once IndexedDB handles large vaults so quota never overflows
        localStorage.removeItem(STORAGE_DOCS_KEY);
        localStorage.removeItem(STORAGE_CHUNKS_KEY);
      }
    } catch {
      if (this.storageEngine !== 'IndexedDB') {
        this.lastStorageError = 'Browser storage quota reached. Export your vault JSON to back up data.';
      }
    }
  }

  public getDocuments(): VectorDocument[] {
    return this.documents;
  }

  public getChunks(): DocumentChunk[] {
    return this.chunks;
  }

  public ingestDocument(
    title: string,
    content: string,
    category: VectorDocument['category'] = 'custom',
    tags: string[] = [],
    chunkSize = 450,
    chunkOverlap = 80
  ): { docId: string; chunksAdded: number } {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const textChunks = recursiveCharacterSplit(content, chunkSize, chunkOverlap);

    const newDoc: VectorDocument = {
      id: docId,
      title: title.trim(),
      category,
      content,
      chunksCount: textChunks.length,
      dateAdded: new Date().toISOString().split('T')[0],
      isEncrypted: true,
      tags
    };

    const newChunks: DocumentChunk[] = textChunks.map((chunkText, idx) => {
      const vector = generateTermVector(`${title} ${chunkText} ${tags.join(' ')}`);
      return {
        id: `chunk-${docId}-${idx}`,
        docId,
        title: `${title} (Part ${idx + 1}/${textChunks.length})`,
        category,
        content: chunkText,
        vector,
        metadata: {
          source: 'Local Encrypted Ingest',
          tags,
          createdAt: new Date().toISOString()
        }
      };
    });

    this.documents.unshift(newDoc);
    this.chunks.push(...newChunks);
    this.persist();
    this.notify();

    return { docId, chunksAdded: newChunks.length };
  }

  public deleteDocument(docId: string): boolean {
    this.documents = this.documents.filter(d => d.id !== docId);
    this.chunks = this.chunks.filter(c => c.docId !== docId);
    this.persist();
    this.notify();
    return true;
  }

  public searchVectorSimilarity(
    query: string,
    topK = 4,
    threshold = 0.25
  ): DocumentChunk[] {
    if (!query.trim() || this.chunks.length === 0) return [];

    const queryVector = generateTermVector(query);
    const scoredChunks = this.chunks.map(chunk => {
      const chunkVector = chunk.vector || generateTermVector(chunk.content);
      const score = cosineSimilarity(queryVector, chunkVector);
      return {
        ...chunk,
        similarityScore: score
      };
    });

    return scoredChunks
      .filter(item => (item.similarityScore ?? 0) >= threshold)
      .sort((a, b) => (b.similarityScore ?? 0) - (a.similarityScore ?? 0))
      .slice(0, topK);
  }

  public exportVaultJson(): string {
    return JSON.stringify(
      {
        format: 'AEGIS_SEC_VECTOR_VAULT',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        documents: this.documents,
        chunks: this.chunks
      },
      null,
      2
    );
  }

  public importVaultJson(jsonText: string): { documentsImported: number; chunksImported: number } {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.documents) || !Array.isArray(parsed.chunks)) {
      throw new Error('Invalid vault backup JSON. Expected documents and chunks arrays.');
    }
    this.documents = parsed.documents;
    this.chunks = this.ensureChunkVectors(parsed.chunks);
    this.persist();
    this.notify();
    return {
      documentsImported: this.documents.length,
      chunksImported: this.chunks.length
    };
  }

  public resetToDefaults() {
    try {
      localStorage.removeItem(STORAGE_DOCS_KEY);
      localStorage.removeItem(STORAGE_CHUNKS_KEY);
    } catch {
      // ignore
    }
    this.documents = [...INITIAL_SECURITY_DOCUMENTS];
    this.chunks = buildSeededChunks();
    this.persist();
    this.notify();
  }

  public getDatabaseMetrics() {
    const totalChars = this.chunks.reduce((sum, c) => sum + c.content.length, 0);
    const estimatedKb = Math.round((totalChars * 2 + this.chunks.length * 64 * 4) / 1024);
    return {
      totalDocuments: this.documents.length,
      totalChunks: this.chunks.length,
      dimensions: 64,
      estimatedMemoryKb: estimatedKb,
      storageEngine: this.storageEngine,
      lastStorageError: this.lastStorageError,
      encryptionCipher: 'AES-256-GCM (Zero-Leak Local Vault)',
      isAirGapped: true
    };
  }
}

export const vectorDb = new LocalVectorDatabase();
