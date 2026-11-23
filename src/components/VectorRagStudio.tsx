import React, { useState } from 'react';
import { vectorDb } from '../services/vectorDb';
import { DocumentChunk, VectorDocument } from '../types';
import { 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Layers,
  ChevronRight
} from 'lucide-react';

export const VectorRagStudio: React.FC = () => {
  const [documents, setDocuments] = useState<VectorDocument[]>(vectorDb.getDocuments());
  const [chunks, setChunks] = useState<DocumentChunk[]>(vectorDb.getChunks());
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);

  // New Document Ingest Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<VectorDocument['category']>('cve');
  const [newTags, setNewTags] = useState('exploit, cve, security');
  const [chunkSize, setChunkSize] = useState(450);
  const [chunkOverlap, setChunkOverlap] = useState(80);
  const [ingestSuccessMessage, setIngestSuccessMessage] = useState<string | null>(null);

  // Interactive Similarity Search Tester
  const [searchQuery, setSearchQuery] = useState('linux privilege escalation suid capabilities');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.20);
  const [searchResults, setSearchResults] = useState<DocumentChunk[]>(
    vectorDb.searchVectorSimilarity('linux privilege escalation suid capabilities', 4, 0.20)
  );

  const metrics = vectorDb.getDatabaseMetrics();

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    const result = vectorDb.ingestDocument(
      newTitle, 
      newContent, 
      newCategory, 
      tagsArray, 
      chunkSize, 
      chunkOverlap
    );

    setDocuments([...vectorDb.getDocuments()]);
    setChunks([...vectorDb.getChunks()]);
    setSelectedDocId(result.docId);
    setNewTitle('');
    setNewContent('');
    setIngestSuccessMessage(`Successfully chunked and indexed into ${result.chunksAdded} vector chunks!`);
    setTimeout(() => setIngestSuccessMessage(null), 3500);

    // Refresh search
    setSearchResults(vectorDb.searchVectorSimilarity(searchQuery, 4, similarityThreshold));
  };

  const handleDelete = (docId: string) => {
    vectorDb.deleteDocument(docId);
    const updatedDocs = vectorDb.getDocuments();
    setDocuments([...updatedDocs]);
    setChunks([...vectorDb.getChunks()]);
    if (selectedDocId === docId) {
      setSelectedDocId(updatedDocs[0]?.id || null);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset vector database to preloaded default cybersecurity playbooks?')) {
      vectorDb.resetToDefaults();
      setDocuments([...vectorDb.getDocuments()]);
      setChunks([...vectorDb.getChunks()]);
      setSelectedDocId(vectorDb.getDocuments()[0]?.id || null);
      setSearchResults(vectorDb.searchVectorSimilarity(searchQuery, 4, similarityThreshold));
    }
  };

  const handleSearch = (query: string, thresh: number) => {
    setSearchQuery(query);
    const results = vectorDb.searchVectorSimilarity(query, 5, thresh);
    setSearchResults(results);
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const selectedDocChunks = chunks.filter(c => c.docId === selectedDocId);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header and Pipeline Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Private Vector Database & Ingestion Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local vector embeddings, recursive chunking, and cosine similarity search. AES-256 encrypted on disk with zero external API calls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Knowledge Base</span>
          </button>
        </div>
      </div>

      {/* Visual LangChain / LangGraph Pipeline Flow */}
      <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
        <div className="text-xs font-mono font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
          <span>LangChain / LangGraph Document Ingestion Architecture</span>
          <span className="text-emerald-400 font-normal">Air-Gap Isolated · Fully Local</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div className="text-cyan-400 font-semibold mb-1">1. Document Loader</div>
            <div className="text-slate-400 text-[11px]">CVE Advisories, Nmap XML, Codebase, Bug Bounty writeups</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div className="text-cyan-400 font-semibold mb-1">2. Recursive Splitter</div>
            <div className="text-slate-400 text-[11px]">{chunkSize} char chunks · {chunkOverlap} char overlap</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div className="text-cyan-400 font-semibold mb-1">3. Vector Embedder</div>
            <div className="text-slate-400 text-[11px]">64-dim L2 Normalized TF-IDF / Subword N-grams</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div className="text-cyan-400 font-semibold mb-1">4. Encrypted Vault</div>
            <div className="text-slate-400 text-[11px]">IndexedDB AES-256 Storage · Zero Data Leakage</div>
          </div>
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono col-span-2 md:col-span-1">
            <div className="text-emerald-400 font-semibold mb-1">5. Cosine Retriever</div>
            <div className="text-slate-400 text-[11px]">Top-K similarity context injected to prompt</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-1">Total Documents</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{metrics.totalDocuments}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-1">Vector Chunks</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{metrics.totalChunks}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-1">Vault Storage</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{metrics.estimatedMemoryKb} KB</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 mb-1">Encryption Cipher</div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-1">AES-256-GCM</div>
        </div>
      </div>

      {/* Ingestion & Search Testing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion Form */}
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Ingest Document to Private RAG</span>
              </h2>
            </div>

            {ingestSuccessMessage && (
              <div className="mb-4 p-3 rounded bg-emerald-950/60 border border-emerald-600/60 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{ingestSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleIngest} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Document Title / Advisory Identifier</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CVE-2024-38077: MadLicense RCE Analysis"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="cve">CVE Advisory</option>
                    <option value="pentest_guide">Pentest Guide</option>
                    <option value="payload">Payload / Exploit</option>
                    <option value="recon_log">Recon Log</option>
                    <option value="custom">Custom Intel</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="cve, rce, windows, poc"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Document Body / Vulnerability Code / Writeup</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste exploit writeup, source code snippet, or threat analysis here..."
                  rows={5}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 text-xs focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Chunk Size</span>
                    <span className="text-slate-200 tabular-nums">{chunkSize} chars</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="1200"
                    step="50"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Chunk Overlap</span>
                    <span className="text-slate-200 tabular-nums">{chunkOverlap} chars</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-xs transition-colors cursor-pointer mt-2"
              >
                Chunk, Embed & Ingest to Vault
              </button>
            </form>
          </div>
        </div>

        {/* Interactive Cosine Similarity Search Tester */}
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Cosine Similarity Search Tester</span>
            </h2>
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="text-xs font-mono">
              <label className="text-slate-400 block mb-1">Semantic Query String</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value, similarityThreshold)}
                  placeholder="e.g. race condition sshd syslog malloc"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="text-xs font-mono">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Similarity Threshold</span>
                <span className="text-slate-200 tabular-nums">{(similarityThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimilarityThreshold(val);
                  handleSearch(searchQuery, val);
                }}
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-2 max-h-[320px]">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded">
                  No vector chunks matched above {(similarityThreshold * 100).toFixed(0)}% similarity. Lower the threshold or adjust terms.
                </div>
              ) : (
                searchResults.map((result, idx) => (
                  <div key={idx} className="p-3 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200 truncate">{result.title}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold text-[11px] tabular-nums">
                        {((result.similarityScore || 0) * 100).toFixed(1)}% Match
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-3 leading-relaxed">
                      {result.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents & Chunks Inspection Table */}
      <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Local Vault Repository ({documents.length} Indexed Documents)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Documents List */}
          <div className="space-y-2 md:col-span-1 max-h-[380px] overflow-y-auto pr-2">
            {documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/80 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-cyan-300 truncate max-w-[180px]">{doc.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Delete document and chunks"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="tabular-nums">{doc.chunksCount} chunks</span>
                    <span>·</span>
                    <span>{doc.category}</span>
                    <span>·</span>
                    <span className="text-emerald-400">AES-256</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Document Details & Chunks */}
          <div className="md:col-span-2 p-4 rounded-lg bg-slate-900/60 border border-slate-800 max-h-[380px] overflow-y-auto">
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-100 font-mono">{selectedDoc.title}</h3>
                    <span className="text-xs font-mono text-slate-400">{selectedDoc.dateAdded}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedDoc.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono font-semibold text-slate-400 mb-2 uppercase">
                    Indexed Chunks ({selectedDocChunks.length})
                  </div>
                  <div className="space-y-2">
                    {selectedDocChunks.map((chunk, cIdx) => (
                      <div key={cIdx} className="p-3 rounded bg-[#090d16] border border-slate-800 text-xs font-mono">
                        <div className="text-cyan-400 text-[11px] mb-1 font-semibold">
                          Chunk {cIdx + 1} ({chunk.content.length} chars)
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 p-8 text-center">
                Select a document from the left list to inspect its vector chunks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
