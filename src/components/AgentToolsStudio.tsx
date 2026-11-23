import React, { useState } from 'react';
import { toolService } from '../services/toolService';
import { AgentTool } from '../types';
import { 
  Wrench, 
  Github, 
  Plus, 
  Play, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink, 
  Search, 
  Terminal, 
  RefreshCw, 
  Sliders,
  Check,
  Copy
} from 'lucide-react';

export const AgentToolsStudio: React.FC = () => {
  const [tools, setTools] = useState<AgentTool[]>(toolService.getTools());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Install Modal State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [binaryName, setBinaryName] = useState('');
  const [cliTemplate, setCliTemplate] = useState('');
  const [category, setCategory] = useState<AgentTool['category']>('recon');
  const [isAirGap, setIsAirGap] = useState(true);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Test Run Drawer State
  const [activeTestTool, setActiveTestTool] = useState<AgentTool | null>(null);
  const [testTarget, setTestTarget] = useState('127.0.0.1');
  const [testOutput, setTestOutput] = useState<{
    commandExecuted: string;
    exitCode: number;
    rawOutput: string;
    elapsedMs: number;
  } | null>(null);

  const POPULAR_GITHUB_TOOLS = [
    { name: 'Naabu Port Scanner', repo: 'projectdiscovery/naabu', category: 'recon' as const, binary: 'naabu', template: 'naabu -host {target} -p - -silent' },
    { name: 'FFUF Web Fuzzer', repo: 'ffuf/ffuf', category: 'vulnerability' as const, binary: 'ffuf', template: 'ffuf -u http://{target}/FUZZ -w /usr/share/wordlists/dirb/common.txt -x {proxy}' },
    { name: 'RustScan Fast Scanner', repo: 'RustScan/RustScan', category: 'recon' as const, binary: 'rustscan', template: 'rustscan -a {target} -- -sC -sV' },
    { name: 'Gitleaks Secret Scanner', repo: 'gitleaks/gitleaks', category: 'osint' as const, binary: 'gitleaks', template: 'gitleaks detect --source ./target_repo -v' }
  ];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.binaryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleTool = (id: string) => {
    toolService.toggleTool(id);
    setTools([...toolService.getTools()]);
  };

  const handleUninstall = (id: string) => {
    toolService.uninstallTool(id);
    setTools([...toolService.getTools()]);
    if (activeTestTool?.id === id) {
      setActiveTestTool(null);
      setTestOutput(null);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset agent tools to initial default set?')) {
      const reset = toolService.resetToDefaults();
      setTools([...reset]);
    }
  };

  const handleInstallFromGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstallError(null);
    setIsCloning(true);

    // Simulate git clone & verification delay
    await new Promise(r => setTimeout(r, 900));

    const res = toolService.installToolFromGitHub({
      githubUrl,
      customName: customName || undefined,
      binaryName: binaryName || undefined,
      category,
      cliCommandTemplate: cliTemplate || undefined,
      isAirGapCompatible: isAirGap
    });

    setIsCloning(false);

    if (res.success && res.tool) {
      setTools([...toolService.getTools()]);
      setInstallSuccess(`Successfully cloned and installed '${res.tool.name}' from GitHub! Tool is enabled for autonomous agent use.`);
      setTimeout(() => {
        setInstallSuccess(null);
        setShowInstallModal(false);
        setGithubUrl('');
        setCustomName('');
        setBinaryName('');
        setCliTemplate('');
      }, 1800);
    } else {
      setInstallError(res.error || 'Failed to install tool from GitHub.');
    }
  };

  const handleQuickInstall = (item: typeof POPULAR_GITHUB_TOOLS[0]) => {
    setGithubUrl(`https://github.com/${item.repo}`);
    setCustomName(item.name);
    setBinaryName(item.binary);
    setCliTemplate(item.template);
    setCategory(item.category);
    setShowInstallModal(true);
  };

  const handleRunTest = (tool: AgentTool) => {
    setActiveTestTool(tool);
    const result = toolService.simulateToolRun(tool.id, testTarget);
    setTestOutput(result);
  };

  const enabledCount = tools.filter(t => t.isEnabled).length;
  const airgapCount = tools.filter(t => t.isAirGapCompatible).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <span>AI Agent Tooling Hub & GitHub Package Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Modular tool execution suite for autonomous recon, vulnerability scanning, and protocol manipulation. Install any security tool directly from GitHub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            <Github className="w-4 h-4" />
            <span>Install Tool from GitHub</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Reset to default tools"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Installed Tools</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">{tools.length}</span>
        </div>
        <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Enabled for Agent</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{enabledCount} Active</span>
        </div>
        <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Air-Gap Compatible</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{airgapCount} Verified</span>
        </div>
        <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">GitHub Custom Tools</span>
          <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {tools.filter(t => t.category === 'custom_github' || t.id.startsWith('tool-gh')).length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, binary or keyword..."
            className="w-full bg-[#0c111d] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'recon', 'vulnerability', 'osint', 'exploit', 'custom_github'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md font-mono transition-colors whitespace-nowrap capitalize ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
              tool.isEnabled 
                ? 'bg-[#0c111d] border-slate-800/90' 
                : 'bg-[#090d16]/70 border-slate-900 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100 font-mono">{tool.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                    <span className="text-slate-300 font-semibold">{tool.binaryName}</span>
                    <span>·</span>
                    <span>{tool.version}</span>
                    <span>·</span>
                    <span className="capitalize">{tool.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={tool.isEnabled}
                    onChange={() => handleToggleTool(tool.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-mono line-clamp-2 mb-3">
                {tool.description}
              </p>

              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Air-Gap Safety:</span>
                  <span className={tool.isAirGapCompatible ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {tool.isAirGapCompatible ? '✓ Offline Safe' : 'Requires Egress Proxy'}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#070a12] border border-slate-800/80 text-slate-300 overflow-x-auto text-[10px] break-all">
                  <code>{tool.cliCommandTemplate}</code>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs font-mono">
              <a
                href={tool.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="View GitHub repository"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">GitHub</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunTest(tool)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Run simulated test on target"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Dry Run</span>
                </button>
                <button
                  onClick={() => handleUninstall(tool.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove tool"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popular GitHub Tools Quick-Add Strip */}
      <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800">
        <span className="text-xs font-mono font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
          Recommended Open-Source Security Tools on GitHub:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_GITHUB_TOOLS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickInstall(item)}
              className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs font-mono group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-200 font-semibold mb-0.5 group-hover:text-emerald-400">
                <span>{item.name}</span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{item.repo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Test Execution Output Drawer */}
      {activeTestTool && testOutput && (
        <div className="p-4 rounded-lg bg-[#070a12] border border-slate-800 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Dry Run Output: {activeTestTool.name}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 tabular-nums">Elapsed: {testOutput.elapsedMs}ms</span>
              <button
                onClick={() => {
                  setActiveTestTool(null);
                  setTestOutput(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            Command: <code className="text-emerald-300">{testOutput.commandExecuted}</code>
          </div>

          <pre className="p-3 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {testOutput.rawOutput}
          </pre>
        </div>
      )}

      {/* Modal: Install Tool from GitHub */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#0c111d] border border-slate-800 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Github className="w-4 h-4 text-emerald-400" />
                <span>Install Security Tool from GitHub</span>
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {installSuccess && (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{installSuccess}</span>
              </div>
            )}

            {installError && (
              <div className="p-3 rounded bg-red-950/80 border border-red-800/80 text-red-300 text-xs">
                {installError}
              </div>
            )}

            <form onSubmit={handleInstallFromGitHub} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">GitHub Repository URL or owner/repo</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/projectdiscovery/naabu or owner/repo"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tool Display Name (Optional)</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Naabu Scanner"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Binary Name (Optional)</label>
                  <input
                    type="text"
                    value={binaryName}
                    onChange={(e) => setBinaryName(e.target.value)}
                    placeholder="e.g. naabu"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="recon">Reconnaissance</option>
                    <option value="vulnerability">Vulnerability Scanner</option>
                    <option value="osint">OSINT Discovery</option>
                    <option value="exploit">Exploitation</option>
                    <option value="custom_github">Custom GitHub Tool</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Air-Gap Posture</label>
                  <select
                    value={isAirGap ? 'yes' : 'no'}
                    onChange={(e) => setIsAirGap(e.target.value === 'yes')}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="yes">Air-Gap Safe (Runs 100% Offline)</option>
                    <option value="no">Requires Proxy Egress</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CLI Command Template (Optional)</label>
                <input
                  type="text"
                  value={cliTemplate}
                  onChange={(e) => setCliTemplate(e.target.value)}
                  placeholder="{binary} -target {target} -proxy {proxy}"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono text-[11px]"
                />
                <span className="text-slate-500 text-[10px] mt-0.5 block">Placeholders: &#123;target&#125;, &#123;proxy&#125;</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  disabled={isCloning}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCloning || !githubUrl.trim()}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold transition-colors flex items-center gap-2"
                >
                  {isCloning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Cloning & Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Install Package</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
