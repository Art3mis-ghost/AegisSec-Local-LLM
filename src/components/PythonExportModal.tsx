import React, { useState } from 'react';
import { LLMConfig, ProxyConfig } from '../types';
import { 
  generateDockerCompose, 
  generatePythonLangGraphAgentScript, 
  generatePythonRAGPipelineScript, 
  generateRequirementsTxt 
} from '../services/codeExportService';
import { 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  Layers, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface PythonExportModalProps {
  llmConfig: LLMConfig;
  proxyConfig: ProxyConfig;
}

export const PythonExportModal: React.FC<PythonExportModalProps> = ({
  llmConfig,
  proxyConfig
}) => {
  const [activeFile, setActiveFile] = useState<
    'airgap_agent.py' | 'local_rag_pipeline.py' | 'requirements.txt' | 'docker-compose.yml'
  >('airgap_agent.py');
  
  const [copied, setCopied] = useState(false);

  const filesMap: Record<string, { code: string; language: string; filename: string }> = {
    'airgap_agent.py': {
      code: generatePythonLangGraphAgentScript(llmConfig, proxyConfig),
      language: 'python',
      filename: 'airgap_agent.py'
    },
    'local_rag_pipeline.py': {
      code: generatePythonRAGPipelineScript(),
      language: 'python',
      filename: 'local_rag_pipeline.py'
    },
    'requirements.txt': {
      code: generateRequirementsTxt(),
      language: 'text',
      filename: 'requirements.txt'
    },
    'docker-compose.yml': {
      code: generateDockerCompose(),
      language: 'yaml',
      filename: 'docker-compose.yml'
    }
  };

  const currentFile = filesMap[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = () => {
    // Sequentially download each file for quick air-gapped bootstrapping
    Object.values(filesMap).forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = f.filename;
        link.click();
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <span>Exportable Python & LangGraph Air-Gapped Stack</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Zero cloud dependencies. Save and execute these production scripts on your local Kali, Ubuntu, or air-gapped workstation with Ollama and ChromaDB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAllZip}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Files (.py, .txt, .yml)</span>
          </button>
        </div>
      </div>

      {/* Terminal Quick Start Guide */}
      <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800 text-xs font-mono">
        <div className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Local CLI Quick Start Setup Guide:</span>
        </div>
        <pre className="p-3 rounded bg-[#070a12] border border-slate-800 text-emerald-300 overflow-x-auto leading-relaxed">
          <code>{`# 1. Create your isolated local security laboratory folder
mkdir -p ~/aegis_sec_lab && cd ~/aegis_sec_lab

# 2. Place the downloaded files in the folder and install dependencies
pip install -r requirements.txt

# 3. Ensure your local Ollama is running with your preferred coding model
ollama run ${llmConfig.modelName}

# 4. Launch the autonomous research agent in background recurring daemon mode
python3 airgap_agent.py --daemon`}</code>
        </pre>
      </div>

      {/* File Navigation & Code Viewer */}
      <div className="rounded-lg bg-[#0c111d] border border-slate-800 overflow-hidden flex flex-col h-[560px]">
        {/* File Tabs Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 overflow-x-auto">
            {Object.keys(filesMap).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveFile(filename as any)}
                className={`px-3 py-1.5 rounded-md font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeFile === filename
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{filename}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <pre className="flex-1 p-5 bg-[#070a12] text-slate-200 font-mono text-xs leading-relaxed overflow-y-auto selection:bg-slate-700">
          <code>{currentFile.code}</code>
        </pre>
      </div>
    </div>
  );
};
