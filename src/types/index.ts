export type LLMProviderType = 'builtin_offline' | 'ollama' | 'lmstudio' | 'vllm' | 'custom';

export type SecurityMode = 
  | 'offensive_scripting' 
  | 'vulnerability_analysis' 
  | 'reverse_engineering' 
  | 'web_recon' 
  | 'ctf_solver' 
  | 'threat_intel' 
  | 'defense_hardening';

export interface LLMConfig {
  provider: LLMProviderType;
  endpointUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  topP: number;
  apiKey?: string;
  systemPromptPreset: SecurityMode;
  uncensoredMode: boolean;
  streamResponse: boolean;
  authorizationScope: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  ragSources?: DocumentChunk[];
  executionTimeMs?: number;
  tokensGenerated?: number;
  isStreaming?: boolean;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  title: string;
  category: 'cve' | 'pentest_guide' | 'payload' | 'advisory' | 'recon_log' | 'custom';
  content: string;
  vector?: number[];
  similarityScore?: number;
  metadata: {
    source: string;
    cveId?: string;
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    tags: string[];
    createdAt: string;
  };
}

export interface VectorDocument {
  id: string;
  title: string;
  category: 'cve' | 'pentest_guide' | 'payload' | 'advisory' | 'recon_log' | 'custom';
  content: string;
  chunksCount: number;
  dateAdded: string;
  isEncrypted: boolean;
  tags: string[];
}

export interface ProxyConfig {
  airGapStrict: boolean;
  proxyType: 'socks5' | 'http' | 'tor_circuit' | 'direct_sandboxed';
  upstreamHost: string;
  upstreamPort: number;
  stripTrackingHeaders: boolean;
  maskUserAgent: boolean;
  customUserAgent: string;
  blockExternalDns: boolean;
  tlsFingerprintMask: boolean;
  trafficEncryption: boolean;
  allowedHostsWhitelist: string[];
}

export interface ResearchAgentTask {
  id: string;
  title: string;
  goal: string;
  cronSchedule: string;
  frequencyMinutes: number;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'failed';
  lastRunTimestamp?: number;
  nextRunTimestamp?: number;
  targetScope: string;
  searchQueries: string[];
  autoIngestToRAG: boolean;
  severityThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executionLogs: AgentExecutionLog[];
}

export interface AgentExecutionLog {
  id: string;
  timestamp: number;
  phase: 'planning' | 'sandboxed_fetch' | 'scrubbing' | 'analysis' | 'vector_ingest' | 'report_generated';
  message: string;
  dataSnippet?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface HardwareTelemetry {
  modelVramEstimateGb: number;
  kvCacheFootprintGb: number;
  systemRamEstimateGb: number;
  inferenceSpeedTokensSec: number;
  quantizationMode: 'Q4_K_M' | 'Q5_K_M' | 'Q8_0' | 'FP16';
  contextWindowCapacity: number;
  contextWindowUsed: number;
  gpuOffloadLayers: number;
  threadsAllocated: number;
  simulatedGpuTempC: number;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  language: 'python' | 'bash' | 'powershell' | 'c' | 'go' | 'json';
  category: 'recon' | 'exploit_poc' | 'fuzzer' | 'privesc' | 'post_exploit' | 'crypto';
  description: string;
  code: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: 'recon' | 'vulnerability' | 'osint' | 'exploit' | 'proxy' | 'custom_github';
  version: string;
  sourceUrl: string;
  binaryName: string;
  isInstalled: boolean;
  isEnabled: boolean;
  isAirGapCompatible: boolean;
  permissionsRequired: string[];
  lastUsedTimestamp?: number;
  cliCommandTemplate: string;
  outputFormat: 'json' | 'text' | 'xml' | 'markdown';
}

export type ActiveTab = 
  | 'llm_workstation' 
  | 'vector_rag' 
  | 'web_agent' 
  | 'agent_tools'
  | 'script_studio' 
  | 'proxy_security' 
  | 'hardware_monitor'
  | 'python_export';
