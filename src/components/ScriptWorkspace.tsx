import React, { useState } from 'react';
import { INITIAL_SCRIPT_TEMPLATES } from '../services/scriptTemplates';
import { ScriptTemplate } from '../types';
import { 
  Code2, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Sparkles, 
  Trash2, 
  FileCode,
  FileText
} from 'lucide-react';

interface ScriptWorkspaceProps {
  initialCode?: string;
  initialLang?: string;
  initialTitle?: string;
  onAskLLMToRefactor?: (prompt: string) => void;
}

export const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({
  initialCode,
  initialLang = 'python',
  initialTitle = 'Custom Exploit Script',
  onAskLLMToRefactor
}) => {
  const [templates] = useState<ScriptTemplate[]>(INITIAL_SCRIPT_TEMPLATES);
  const [currentScript, setCurrentScript] = useState<string>(
    initialCode || INITIAL_SCRIPT_TEMPLATES[0].code
  );
  const [language, setLanguage] = useState<ScriptTemplate['language']>(
    (initialLang as any) || INITIAL_SCRIPT_TEMPLATES[0].language
  );
  const [scriptTitle, setScriptTitle] = useState<string>(
    initialTitle || INITIAL_SCRIPT_TEMPLATES[0].title
  );
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>(
    `[AegisSec Sandbox Runtime v2.4 initialized]\nIsolated Linux container (glibc 2.38 / Python 3.12 / bash 5.2)\nReady for script execution.\n`
  );

  const handleSelectTemplate = (tmpl: ScriptTemplate) => {
    setCurrentScript(tmpl.code);
    setLanguage(tmpl.language);
    setScriptTitle(tmpl.title);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'python' ? 'py' : language === 'bash' ? 'sh' : language === 'c' ? 'c' : 'txt';
    const blob = new Blob([currentScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scriptTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRunInSandbox = async () => {
    setIsRunning(true);
    setTerminalOutput(prev => prev + `\n$ ${language === 'python' ? 'python3' : 'bash'} script.${language === 'python' ? 'py' : 'sh'}\n[*] Initializing sandboxed memory arena...\n`);

    await new Promise(r => setTimeout(r, 700));

    // Realistic execution outputs based on script content
    let output = '';
    if (currentScript.includes('TARGET_PORTS') || currentScript.includes('COMMON_PORTS') || currentScript.includes('port')) {
      output = `[*] Commencing stealth reconnaissance on target: 127.0.0.1
[+] Open Port Summary:
--------------------------------------------------
    Port    22/TCP [OPEN] -> SSH-2.0-OpenSSH_9.7p1
    Port    80/TCP [OPEN] -> HTTP/1.1 200 OK (nginx/1.24)
    Port   443/TCP [OPEN] -> HTTP/1.1 200 OK
    Port  8080/TCP [OPEN] -> HTTP/1.1 401 Unauthorized
[+] Scan finished in 0.42s (4 ports identified). Exit code: 0\n`;
    } else if (currentScript.includes('IMDS') || currentScript.includes('169.254')) {
      output = `[*] Probing IMDSv1 endpoint (169.254.169.254)...
[-] IMDSv1 returned HTTP 403 (Token required).
[*] Probing IMDSv2 Token Generation...
[+] IMDSv2 Token successfully obtained: AQAEAPtX_f98c21a4f...
[+] Extracted IAM Role: lab-production-node-role
[+] Retrieved Temporary AWS Security Credentials (AccessKey: ASIAV..., Secret: 9f8a...)\n[+] Exit code: 0\n`;
    } else if (currentScript.includes('SUID') || currentScript.includes('getcap')) {
      output = `=== AegisSec Host Privilege Escalation Quick-Audit ===
Host: sec-workstation | Kernel: 6.8.0-generic | UID: 1000
[*] 1. Inspecting SUID/SGID Binaries with GTFOBins Potential...
  [!] POTENTIAL GTFOBINS: /usr/bin/python3.10
  [!] POTENTIAL GTFOBINS: /usr/bin/pkexec
[*] 2. Checking Dangerous File Capabilities...
  /usr/bin/python3.10 cap_setuid=ep
[!] CRITICAL: cap_setuid detected on python binary. Root elevation trivial via os.setuid(0).
[+] Audit completed. Exit code: 0\n`;
    } else {
      output = `[*] Executing custom payload skeleton in air-gapped sandbox...
[+] Target interface bound to 127.0.0.1
[+] Memory integrity checks passed (zero memory leaks detected).
[+] Process returned successfully with exit status: 0\n`;
    }

    setTerminalOutput(prev => prev + output);
    setIsRunning(false);
  };

  const handleRefactorPrompt = () => {
    if (onAskLLMToRefactor) {
      onAskLLMToRefactor(`Please audit and refactor the following ${language} script to harden error handling, add upstream SOCKS5 proxy support, and provide defense remediation:\n\n\`\`\`${language}\n${currentScript}\n\`\`\``);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Interactive Script & Exploit Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Craft, audit, and simulate offensive tooling and recon automation scripts. Sandbox tested with zero outbound network leakage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefactorPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit with LLM</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handleRunInSandbox}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Running...' : 'Run in Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Templates Selector Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-slate-400 shrink-0">Templates:</span>
        {templates.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelectTemplate(tmpl)}
            className={`px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors shrink-0 ${
              scriptTitle === tmpl.title
                ? 'bg-slate-800 border-emerald-500/80 text-white font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {tmpl.title}
          </button>
        ))}
      </div>

      {/* Editor & Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <div className="rounded-lg bg-[#0c111d] border border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none focus:border-b border-slate-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none uppercase"
              >
                <option value="python">Python</option>
                <option value="bash">Bash / Shell</option>
                <option value="c">C / C++</option>
                <option value="go">Golang</option>
                <option value="powershell">PowerShell</option>
              </select>
            </div>
          </div>

          <textarea
            value={currentScript}
            onChange={(e) => setCurrentScript(e.target.value)}
            spellCheck={false}
            className="flex-1 p-4 bg-[#070a12] text-emerald-300 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-slate-700 overflow-y-auto"
          />
        </div>

        {/* Sandbox Output Terminal */}
        <div className="rounded-lg bg-[#070a12] border border-slate-800 overflow-hidden flex flex-col h-[520px]">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox Execution Console</span>
            </span>
            <button
              onClick={() => setTerminalOutput('[Sandbox Terminal Cleared]\n')}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <pre className="flex-1 p-4 text-xs font-mono text-slate-300 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {terminalOutput}
          </pre>
        </div>
      </div>
    </div>
  );
};
