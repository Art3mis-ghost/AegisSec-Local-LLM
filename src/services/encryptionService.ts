import { ChatMessage, LLMConfig } from '../types';

export interface EncryptedBackupPayload {
  format: 'AEGIS_SEC_ENCRYPTED_BACKUP';
  version: '2.0';
  cipher: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256-100K';
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
  metadata: {
    messageCount: number;
    exportedAt: string;
    model: string;
    scope: string;
    securityMode: string;
    dataHashSha256: string;
  };
}

function assertSecureCryptoContext(): SubtleCrypto {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
    throw new Error(
      'Web Crypto API (AES-256-GCM) requires a secure context. Please open this app via http://localhost:3000 or http://127.0.0.1:3000 (not a LAN IP address).'
    );
  }
  return globalThis.crypto.subtle;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(parts.join(''));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptChatHistory(
  messages: ChatMessage[],
  llmConfig: LLMConfig,
  passphrase: string
): Promise<EncryptedBackupPayload> {
  const subtle = assertSecureCryptoContext();
  const enc = new TextEncoder();
  const rawData = JSON.stringify({
    messages,
    llmConfig,
    exportedAt: new Date().toISOString()
  });

  // Calculate SHA-256 checksum of raw data for data integrity validation
  const digestBuffer = await subtle.digest('SHA-256', enc.encode(rawData));
  const dataHashSha256 = bufferToBase64(digestBuffer);

  // Generate 16 bytes cryptographic salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive AES key via PBKDF2
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate 12 bytes initialization vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt with AES-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    enc.encode(rawData)
  );

  return {
    format: 'AEGIS_SEC_ENCRYPTED_BACKUP',
    version: '2.0',
    cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256-100K',
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
    metadata: {
      messageCount: messages.length,
      exportedAt: new Date().toISOString(),
      model: llmConfig.modelName,
      scope: llmConfig.authorizationScope,
      securityMode: llmConfig.systemPromptPreset,
      dataHashSha256
    }
  };
}

export async function decryptChatHistory(
  payload: EncryptedBackupPayload,
  passphrase: string
): Promise<{ messages: ChatMessage[]; exportedAt: string }> {
  const subtle = assertSecureCryptoContext();
  if (payload.format !== 'AEGIS_SEC_ENCRYPTED_BACKUP') {
    throw new Error('Invalid backup file format.');
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const saltBuffer = base64ToBuffer(payload.salt);
  const ivBuffer = base64ToBuffer(payload.iv);
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);

  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltBuffer),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      aesKey,
      ciphertextBuffer
    );

    const jsonString = dec.decode(decryptedBuffer);
    const parsed = JSON.parse(jsonString);

    // Verify SHA-256 integrity
    const testDigest = await subtle.digest('SHA-256', enc.encode(jsonString));
    if (bufferToBase64(testDigest) !== payload.metadata.dataHashSha256) {
      console.warn('Backup checksum mismatch: file integrity warning.');
    }

    return {
      messages: parsed.messages || [],
      exportedAt: parsed.exportedAt || payload.metadata.exportedAt
    };
  } catch (err: unknown) {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted encrypted payload.');
  }
}
