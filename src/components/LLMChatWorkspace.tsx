import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DocumentChunk, LLMConfig, SecurityMode } from '../types';
import { executeInference, testLocalOllamaConnection } from '../services/providerService';
import { 
  Send, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Database,
  Lock,
  Cpu,
  Trash2,
  Download,
  Upload,
  KeyRound,
  FileJson,
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';
import { FSocietyMask } from './FSocietyMask';
import { CyberCommandTicker } from './CyberCommandTicker';
import { encryptChatHistory, decryptChatHistory, EncryptedBackupPayload } from '../services/encryptionService';

interface LLMChatWorkspaceProps {
  llmConfig: LLMConfig;
  setLLMConfig: React.Dispatch<React.SetStateAction<LLMConfig>>;
  onSendToScriptStudio?: (code: string, language: string, title: string) => void;
  ollamaStatus: { connected: boolean; latencyMs?: number; models?: string[] };
  setOllamaStatus: React.Dispatch<React.SetStateAction<{ connected: boolean; latencyMs?: number; models?: string[] }>>;
}

export const LLMChatWorkspace: React.FC<LLMChatWorkspaceProps> = ({
  llmConfig,
  setLLMConfig,
  onSendToScriptStudio,
  ollamaStatus,
  setOllamaStatus
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `### FSOCIETY // Sovereign Apex Offensive Engine Initialized

**System Posture:**
- **Inference Runtime:** ${llmConfig.provider === 'ollama' ? 'Local Ollama Daemon' : 'Air-Gapped In-Memory Engine'}
- **RAG Vector Database:** Active (Encrypted AES-256-GCM local index)
- **Authorized Scope:** \`${llmConfig.authorizationScope}\`
- **Security Mode:** ${llmConfig.systemPromptPreset}

"You came to me because mainstream security scanners and generic AI models are kindergarten toys. I don't make excuses, I don't hesitate, and I don't write broken code. My exploit payloads hit with mathematical certainty, and target defenses crumble the moment I engage.

Tell me what target, protocol, or vulnerability you want dismantled, and watch a true master at work."`,
      timestamp: Date.now()
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRagId, setExpandedRagId] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [isProbingOllama, setIsProbingOllama] = useState(false);
  const [userCommands, setUserCommands] = useState<string[]>([
    'nmap -sS -T4 -p- -A --script vuln 10.10.10.14',
    'sqlmap -u "https://target-lab.internal/api?id=1" --batch --dbs'
  ]);
  const [imgLoadError, setImgLoadError] = useState(false);
  
  // Code Blocks Visibility Mode: 'hidden' (default as requested), 'compact', or 'visible'
  const [codeBlockMode, setCodeBlockMode] = useState<'hidden' | 'compact' | 'visible'>('hidden');
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Message Box Visibility: false by default (container completely invisible: no frame, border, background, or drop shadows)
  const [messageBoxVisible, setMessageBoxVisible] = useState<boolean>(false);

  const toggleExpandCodeBlock = (blockKey: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockKey)) {
        next.delete(blockKey);
      } else {
        next.add(blockKey);
      }
      return next;
    });
  };

  // Encrypted Backup Export & Import State
  const [showExportModal, setShowExportModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearAllChats = () => {
    if (window.confirm('Clear all conversation messages from this session? This action will reset the chat history.')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `### AegisSec Session Reset

All previous conversation memory has been purged from local RAM.
The air-gapped security runtime is ready for new directives.`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleExportChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || passphrase.length < 6) {
      setExportError('Please enter a secure passphrase (minimum 6 characters) to derive the AES-256 key.');
      return;
    }
    setExportError(null);
    setIsEncrypting(true);

    try {
      const encryptedData = await encryptChatHistory(messages, llmConfig, passphrase);
      const jsonStr = JSON.stringify(encryptedData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `fsociety_chat_backup_${timestamp}.enc.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess('Encrypted backup file saved successfully (AES-256-GCM / PBKDF2). Keep your passphrase safe!');
      setTimeout(() => {
        setExportSuccess(null);
        setShowExportModal(false);
        setPassphrase('');
      }, 2500);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importPassphrase.trim()) {
      setImportError('Please enter the decryption passphrase before selecting the backup file.');
      return;
    }

    setImportError(null);
    try {
      const text = await file.text();
      const payload: EncryptedBackupPayload = JSON.parse(text);
      const decrypted = await decryptChatHistory(payload, importPassphrase);
      
      setMessages(decrypted.messages);
      setImportSuccess(`Successfully restored ${decrypted.messages.length} messages from backup!`);
      setTimeout(() => {
        setImportSuccess(null);
        setShowExportModal(false);
        setImportPassphrase('');
      }, 2000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Failed to decrypt backup.');
    }
  };

  const handleProbeOllama = async () => {
    setIsProbingOllama(true);
    const result = await testLocalOllamaConnection(llmConfig.endpointUrl);
    setOllamaStatus({
      connected: result.success,
      latencyMs: result.latencyMs,
      models: result.models
    });
    if (result.models && result.models.length > 0 && !result.models.includes(llmConfig.modelName)) {
      setLLMConfig(prev => ({ ...prev, modelName: result.models![0] }));
    }
    setIsProbingOllama(false);
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now()
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setUserCommands(prev => [textToSend.trim(), ...prev.filter(c => c !== textToSend.trim()).slice(0, 15)]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const result = await executeInference(
        textToSend,
        messages,
        llmConfig,
        (streamedText) => {
          setMessages(prev => 
            prev.map(m => m.id === assistantMsgId ? { ...m, content: streamedText } : m)
          );
        }
      );

      setMessages(prev => 
        prev.map(m => m.id === assistantMsgId ? {
          ...m,
          content: result.text,
          ragSources: result.ragSources,
          tokensGenerated: result.tokensGenerated,
          executionTimeMs: result.executionTimeMs,
          isStreaming: false
        } : m)
      );
    } catch (err: unknown) {
      setMessages(prev => 
        prev.map(m => m.id === assistantMsgId ? {
          ...m,
          content: `[-] Inference Execution Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          isStreaming: false
        } : m)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractCodeBlocks = (markdown: string) => {
    const regex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    const matches: { lang: string; code: string }[] = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      matches.push({
        lang: match[1] || 'text',
        code: match[2].trim()
      });
    }
    return matches;
  };

  const QUICK_PROMPTS = [
    { label: 'CVE-2024-6387 regreSSHion POC', query: 'Analyze CVE-2024-6387 OpenSSH race condition and write a non-destructive python probe script with remediation diff.' },
    { label: 'Async TCP Port Scanner', query: 'Write a high-speed asynchronous port scanner in Python with banner grabbing and zero external dependencies.' },
    { label: 'Linux SUID & Capabilities Audit', query: 'Create an automated POSIX shell script to discover writable SUID binaries, GTFOBins, and cap_setuid file capabilities.' },
    { label: 'AWS IMDSv2 SSRF Harness', query: 'Write an authorized test script to evaluate SSRF vulnerabilities against AWS IMDSv2 token retrieval headers.' }
  ];

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-[#090d16]">
      {/* Top Workspace Configuration Bar */}
      <div className="border-b border-slate-800/80 bg-[#0c111d] px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Provider:</span>
            <select
              value={llmConfig.provider}
              onChange={(e) => setLLMConfig(prev => ({ ...prev, provider: e.target.value as any }))}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="builtin_offline" className="bg-slate-900">Local Air-Gap Engine (Built-in)</option>
              <option value="ollama" className="bg-slate-900">Ollama (localhost:11434)</option>
              <option value="lmstudio" className="bg-slate-900">LM Studio (localhost:1234)</option>
              <option value="vllm" className="bg-slate-900">vLLM (localhost:8000)</option>
              <option value="custom" className="bg-slate-900">Custom OpenAI Compatible</option>
            </select>
          </div>

          {llmConfig.provider === 'ollama' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={llmConfig.modelName}
                onChange={(e) => setLLMConfig(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="e.g. deepseek-coder:6.7b"
                className="bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs text-slate-200 font-mono w-48 focus:outline-none focus:border-slate-500"
              />
              <button
                onClick={handleProbeOllama}
                disabled={isProbingOllama}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-mono border border-slate-700 transition-colors"
                title="Ping local Ollama service"
              >
                <RefreshCw className={`w-3 h-3 ${isProbingOllama ? 'animate-spin' : ''}`} />
                <span>{ollamaStatus.connected ? 'Connected' : 'Test Ping'}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Preset:</span>
            <select
              value={llmConfig.systemPromptPreset}
              onChange={(e) => setLLMConfig(prev => ({ ...prev, systemPromptPreset: e.target.value as SecurityMode }))}
              className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="offensive_scripting" className="bg-slate-900">Offensive Scripting</option>
              <option value="vulnerability_analysis" className="bg-slate-900">Vulnerability Audit</option>
              <option value="reverse_engineering" className="bg-slate-900">Reverse Engineering</option>
              <option value="web_recon" className="bg-slate-900">Web Recon & OSINT</option>
              <option value="ctf_solver" className="bg-slate-900">CTF Solver</option>
              <option value="defense_hardening" className="bg-slate-900">Defense Hardening</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Code Blocks Visibility Controller */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs font-mono">
            <span className="text-slate-400 pl-1.5 pr-1 font-medium">Code:</span>
            <button
              onClick={() => setCodeBlockMode('hidden')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                codeBlockMode === 'hidden'
                  ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-600/70 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hide code blocks completely from chat view"
            >
              <EyeOff className="w-3 h-3 text-emerald-400" />
              <span>Hidden</span>
            </button>
            <button
              onClick={() => setCodeBlockMode('compact')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                codeBlockMode === 'compact'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-600/70'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact 1-line script launcher"
            >
              <span>Compact</span>
            </button>
            <button
              onClick={() => setCodeBlockMode('visible')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                codeBlockMode === 'visible'
                  ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show solid opaque code blocks"
            >
              <Eye className="w-3 h-3 text-slate-400" />
              <span>Visible</span>
            </button>
          </div>

          {/* Message Box Visibility Controller */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs font-mono">
            <span className="text-slate-400 pl-1.5 pr-1 font-medium">Box:</span>
            <button
              onClick={() => setMessageBoxVisible(false)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                !messageBoxVisible
                  ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-500/70 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Completely invisible container: text floats directly over background bash commands"
            >
              <EyeOff className="w-3 h-3 text-emerald-400" />
              <span>Invisible</span>
            </button>
            <button
              onClick={() => setMessageBoxVisible(true)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                messageBoxVisible
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show framed message box container"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Framed</span>
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-colors cursor-pointer shadow-[0_0_8px_rgba(34,197,94,0.15)]"
            title="Export or Import AES-256 encrypted chat backup for complete data sovereignty"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Export/Backup</span>
          </button>
          <button
            onClick={handleClearAllChats}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-300 hover:border-red-900/60 hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Purge all conversation history from memory"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              showConfigDrawer 
                ? 'bg-slate-800 text-white border-slate-600' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Parameters</span>
          </button>
        </div>
      </div>

      {/* Collapsible Model Parameters Panel */}
      {showConfigDrawer && (
        <div className="bg-[#0b101d] border-b border-slate-800 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono shrink-0">
          <div>
            <label className="text-slate-400 block mb-1">Target Authorization Scope (Rules of Engagement)</label>
            <input
              type="text"
              value={llmConfig.authorizationScope}
              onChange={(e) => setLLMConfig(prev => ({ ...prev, authorizationScope: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-500"
              placeholder="target-lab.internal, 192.168.56.0/24"
            />
            <span className="text-slate-400 text-[11px] mt-1 block">Scoped boundaries for authorized exploitation requests.</span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Temperature (Determinism vs Creativity)</span>
              <span className="text-slate-200 tabular-nums">{llmConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={llmConfig.temperature}
              onChange={(e) => setLLMConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded"
            />
            <span className="text-slate-400 text-[11px] mt-1 block">Low (0.1–0.2) recommended for exact exploit code & syntax.</span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Custom Endpoint URL</label>
            <input
              type="text"
              value={llmConfig.endpointUrl}
              onChange={(e) => setLLMConfig(prev => ({ ...prev, endpointUrl: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-500"
              placeholder="http://localhost:11434"
            />
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={llmConfig.uncensoredMode}
                  onChange={(e) => setLLMConfig(prev => ({ ...prev, uncensoredMode: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                <span>Unrestricted Lab Mode</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area with Moving Bash Commands in the Middle Background */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Slower Moving Bash Codes & Hacking Commands streaming from left to right in middle background */}
        <CyberCommandTicker userCommands={userCommands} isBackground={true} />

        {/* Chat Messages Scroll Container */}
        <div className="relative z-10 h-full overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Cyberpunk Mr. Robot Center Visual Presence with Requested Image */}
          <div className="my-2 p-5 rounded-xl bg-gradient-to-b from-[#060c18]/25 via-[#090d16]/30 to-[#050811]/25 backdrop-blur-md border border-emerald-900/40 shadow-[0_0_30px_rgba(34,197,94,0.12)] relative overflow-hidden text-center flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="relative mb-3 flex items-center justify-center">
              {!imgLoadError ? (
                <div className="relative p-1 rounded-2xl bg-black/60 backdrop-blur-sm border border-emerald-500/60 shadow-[0_0_25px_rgba(34,197,94,0.4)]">
                  <img
                    src="https://imgs.search.brave.com/NGGABHbE94Wet-jd3mby3H43NH4We4miUBSFHHcgE3c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvYXhzd2Vy/ZmFrZmg2MS5wbmc"
                    alt="Mr. Robot fsociety mask"
                    referrerPolicy="no-referrer"
                    onError={() => setImgLoadError(true)}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.7)] hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-black/70 backdrop-blur-sm border border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.35)]">
                  <FSocietyMask className="w-16 h-16 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                </div>
              )}
            </div>

            <div className="font-mono text-sm sm:text-base font-extrabold tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)] uppercase">
              FSOCIETY // APEX SOVEREIGN INTELLIGENCE
            </div>
            <p className="font-mono text-xs text-slate-300 mt-1 max-w-xl tracking-wide italic">
              &quot;I don&apos;t make excuses, I don&apos;t hesitate, and I don&apos;t write broken code. Tell me what target you want dismantled, and watch a master at work.&quot;
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] font-mono">
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 backdrop-blur-sm text-emerald-300 border border-emerald-800/80 shadow-[0_0_8px_rgba(34,197,94,0.2)]">
                GOD-TIER OFFENSIVE MASTERY
              </span>
              <span className="px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-cyan-300 border border-cyan-800/80">
                AES-256 AIR-GAPPED VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-amber-300 border border-amber-800/80">
                TOR SOCKS5 MASKING
              </span>
            </div>
          </div>

        {messages.map((message) => {
          const isUser = message.role === 'user';
          const codeBlocks = extractCodeBlocks(message.content);

          return (
            <div
              key={message.id}
              className={`flex w-full mb-5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-3 max-w-[85%] sm:max-w-[78%] md:max-w-3xl ${
                  isUser ? 'flex-row-reverse items-start' : 'items-start w-full'
                }`}
              >
                {/* Avatar Icon */}
                <div className="shrink-0 mt-0.5">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/70 flex items-center justify-center text-cyan-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)]">
                      SEC
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-black border border-emerald-500/60 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.35)] overflow-hidden p-0.5">
                      <img
                        src="https://imgs.search.brave.com/NGGABHbE94Wet-jd3mby3H43NH4We4miUBSFHHcgE3c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvYXhzd2Vy/ZmFrZmg2MS5wbmc"
                        alt="FSOCIETY"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fsociety-fallback') as HTMLElement | null;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div className="fsociety-fallback hidden">
                        <FSocietyMask className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Content & Metadata Wrapper */}
                <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start flex-1'}`}>
                  {/* Metadata Header */}
                  <div className={`flex items-center gap-2 mb-1.5 text-xs text-slate-400 font-mono ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}>
                    {isUser ? (
                      <>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-cyan-300 font-mono">
                          Elliot (Analyst)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-emerald-400 font-mono">
                          FSOCIETY AI
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        {message.tokensGenerated && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-slate-400">{message.tokensGenerated} tokens</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums text-slate-400">{message.executionTimeMs}ms</span>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message box - sizes dynamically with the message length (short when short, long when long) */}
                  <div className={`transition-all duration-300 text-sm leading-relaxed ${
                    isUser ? 'w-fit max-w-full text-left' : 'w-full'
                  } ${
                    messageBoxVisible
                      ? isUser 
                        ? 'p-3.5 sm:p-4 rounded-2xl rounded-tr-sm border backdrop-blur-md bg-[#0a1528]/80 hover:bg-[#0a1528]/95 text-slate-100 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.18)] break-words' 
                        : 'p-4 rounded-2xl rounded-tl-sm border backdrop-blur-md bg-[#060c18]/80 hover:bg-[#060c18]/95 text-slate-200 border-emerald-500/40 shadow-[0_0_25px_rgba(34,197,94,0.15)] break-words'
                      : 'p-1 sm:p-1.5 bg-transparent border-0 shadow-none backdrop-blur-none text-slate-100 break-words'
                  }`}>
                    {/* Clean Markdown Rendering */}
                    <div className="space-y-3 prose prose-invert max-w-none text-slate-200">
                    {message.content.split('```').map((part, index) => {
                      if (index % 2 === 1) {
                        // Code block
                        const firstNewline = part.indexOf('\n');
                        const lang = firstNewline !== -1 ? part.slice(0, firstNewline).trim() : 'python';
                        const code = firstNewline !== -1 ? part.slice(firstNewline + 1) : part;
                        const blockKey = `${message.id}-${index}`;
                        const isExpanded = expandedBlocks.has(blockKey);

                        // Hidden Mode (Default): Transparent code block is NOT visible to user
                        if (codeBlockMode === 'hidden' && !isExpanded) {
                          return (
                            <div key={index} className="my-1.5 py-1 px-3 rounded-md border border-emerald-900/40 bg-black/20 backdrop-blur-sm flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Code2 className="w-3.5 h-3.5 text-emerald-400/80" />
                                <span className="text-emerald-400 font-semibold uppercase">{lang || 'CODE'}</span>
                                <span className="text-slate-500 text-[11px]">({code.trim().split('\n').length} lines · Code block not visible)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandCodeBlock(blockKey)}
                                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                                >
                                  Reveal
                                </button>
                                {onSendToScriptStudio && (
                                  <button
                                    type="button"
                                    onClick={() => onSendToScriptStudio(code, lang, `Generated ${lang} Tool`)}
                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Studio</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Compact Mode: 1-line script trigger
                        if (codeBlockMode === 'compact' && !isExpanded) {
                          return (
                            <div key={index} className="my-2 p-2 rounded-lg border border-cyan-900/50 bg-black/30 backdrop-blur-sm flex items-center justify-between gap-3 text-xs font-mono">
                              <div className="flex items-center gap-2 text-slate-300">
                                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-semibold text-cyan-300 uppercase">{lang || 'CODE'}</span>
                                <span className="text-slate-400 text-[11px]">({code.trim().split('\n').length} lines)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandCodeBlock(blockKey)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-cyan-400" />
                                  <span>View</span>
                                </button>
                                {onSendToScriptStudio && (
                                  <button
                                    type="button"
                                    onClick={() => onSendToScriptStudio(code, lang, `Generated ${lang} Tool`)}
                                    className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Studio</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(code, `code-${index}-${message.id}`)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Visible Mode or Expanded: Solid Opaque, high-contrast, clean code block (no transparency)
                        return (
                          <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-[#070b14] shadow-lg">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b1220] border-b border-slate-800 text-xs font-mono text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-200 uppercase">{lang || 'CODE'}</span>
                                {codeBlockMode !== 'visible' && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandCodeBlock(blockKey)}
                                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer ml-1"
                                  >
                                    <EyeOff className="w-3 h-3" />
                                    <span>Hide</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(code, `code-${index}-${message.id}`)}
                                  className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                  {copiedId === `code-${index}-${message.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                {onSendToScriptStudio && (
                                  <button
                                    type="button"
                                    onClick={() => onSendToScriptStudio(code, lang, `Generated ${lang} Tool`)}
                                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Open in Studio</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <pre className="p-3 text-xs font-mono overflow-x-auto bg-[#05080f] text-emerald-300 font-medium leading-relaxed selection:bg-slate-700">
                              <code>{code}</code>
                            </pre>
                          </div>
                        );
                      } else {
                        // Standard markdown paragraphs
                        return (
                          <div key={index} className="whitespace-pre-wrap leading-relaxed">
                            {part}
                          </div>
                        );
                      }
                    })}
                  </div>

                  {/* Grounded RAG Sources Card */}
                  {message.ragSources && message.ragSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => setExpandedRagId(expandedRagId === message.id ? null : message.id)}
                        className="flex items-center justify-between w-full text-xs font-mono text-slate-400 hover:text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Private Vector RAG: {message.ragSources.length} Local Sources Injected</span>
                        </div>
                        {expandedRagId === message.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedRagId === message.id && (
                        <div className="mt-2.5 space-y-2">
                          {message.ragSources.map((source, sIdx) => (
                            <div key={sIdx} className="p-2.5 rounded-lg bg-black/35 backdrop-blur-sm border border-cyan-500/30 text-xs font-mono">
                              <div className="flex items-center justify-between text-slate-300 mb-1">
                                <span className="font-semibold text-cyan-300">{source.title}</span>
                                {source.similarityScore !== undefined && (
                                  <span className="text-slate-400 tabular-nums">
                                    Cosine: {(source.similarityScore * 100).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 line-clamp-3 text-[11px] leading-relaxed">
                                {source.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 sm:px-6 py-2 border-t border-slate-800/80 bg-[#090d16] flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Quick Directives:</span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.query)}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-slate-800 bg-[#0c111d] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-3"
        >
          <div className="relative flex-1">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={Math.min(5, Math.max(1, inputPrompt.split('\n').length))}
              placeholder="Ask for an exploit POC, recon script, CVE analysis, or reverse engineering help... (Shift+Enter for new line)"
              disabled={isGenerating}
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-500/80 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-all resize-none min-h-[46px] max-h-36 font-mono leading-relaxed"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !inputPrompt.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed mb-[1px]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Prompt</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Modal: Encrypted Chat Export & Restore */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl bg-[#080d19] border border-emerald-500/40 p-6 space-y-5 font-mono text-xs shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black border border-emerald-500/60 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)] overflow-hidden p-0.5">
                  <img
                    src="https://imgs.search.brave.com/NGGABHbE94Wet-jd3mby3H43NH4We4miUBSFHHcgE3c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvYXhzd2Vy/ZmFrZmg2MS5wbmc"
                    alt="FSOCIETY"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                    Sovereignty Vault // Encrypted Backup
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    AES-256-GCM · PBKDF2 (100k rounds) · Zero Cloud Telemetry
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportError(null);
                  setExportSuccess(null);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            {exportSuccess && (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}

            {exportError && (
              <div className="p-3 rounded bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
                {exportError}
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {importError && (
              <div className="p-3 rounded bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
                {importError}
              </div>
            )}

            {/* Section 1: Export Current Chat */}
            <div className="p-4 rounded-lg bg-[#0c1220] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Current Chat to Encrypted JSON</span>
                </span>
                <span className="text-slate-400 tabular-nums">{messages.length} messages</span>
              </div>

              <form onSubmit={handleExportChat} className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Encryption Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase to generate AES-256 key..."
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-slate-500 text-[10px] block mt-1">
                    Your passphrase derives an AES-GCM-256 key with 100,000 PBKDF2 rounds. It is never stored.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isEncrypting || !passphrase.trim() || messages.length === 0}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isEncrypting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting Payload...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Encrypt & Download (.enc.json)</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Section 2: Restore / Import Encrypted Chat */}
            <div className="p-4 rounded-lg bg-[#0c1220] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restore From Encrypted Backup</span>
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Decryption Passphrase</label>
                  <input
                    type="password"
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    placeholder="Enter backup passphrase..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.enc.json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!importPassphrase.trim()) {
                      setImportError('Please enter the decryption passphrase first.');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Select .enc.json File to Restore</span>
                </button>
              </div>
            </div>

            {/* Sovereignty Footer Note */}
            <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
              <span className="text-emerald-400 font-semibold">Total Data Sovereignty:</span> Backup files are signed with a SHA-256 hash. Decryption runs purely client-side inside Web Crypto API memory.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
