import React, { useState, useEffect } from 'react';
import { ActiveTab, LLMConfig, ProxyConfig } from './types';
import { DEFAULT_LLM_CONFIG, testLocalOllamaConnection } from './services/providerService';
import { DEFAULT_PROXY_CONFIG } from './services/proxyService';
import { TopNav } from './components/TopNav';
import { TelemetryStatusBar } from './components/TelemetryStatusBar';
import { LLMChatWorkspace } from './components/LLMChatWorkspace';
import { VectorRagStudio } from './components/VectorRagStudio';
import { AutonomousAgent } from './components/AutonomousAgent';
import { ProxySecurityAudit } from './components/ProxySecurityAudit';
import { ScriptWorkspace } from './components/ScriptWorkspace';
import { HardwareMonitor } from './components/HardwareMonitor';
import { PythonExportModal } from './components/PythonExportModal';
import { AgentToolsStudio } from './components/AgentToolsStudio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('llm_workstation');
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>(DEFAULT_PROXY_CONFIG);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    latencyMs?: number;
    models?: string[];
  }>({
    connected: false
  });

  // Inter-module script handoff state
  const [scriptHandoff, setScriptHandoff] = useState<{
    code: string;
    language: string;
    title: string;
  } | null>(null);

  // Background ping to Ollama on mount to auto-detect if user has local daemon running
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const res = await testLocalOllamaConnection(llmConfig.endpointUrl);
      if (isMounted) {
        setOllamaStatus({
          connected: res.success,
          latencyMs: res.latencyMs,
          models: res.models
        });
      }
    };
    probe();
    return () => {
      isMounted = false;
    };
  }, [llmConfig.endpointUrl]);

  const handleSendToScriptStudio = (code: string, language: string, title: string) => {
    setScriptHandoff({ code, language, title });
    setActiveTab('script_studio');
  };

  const handleAskLLMToRefactor = (prompt: string) => {
    setActiveTab('llm_workstation');
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-slate-700 selection:text-white">
      {/* 3-Zone Header Contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        proxyConfig={proxyConfig}
        setProxyConfig={setProxyConfig}
      />

      {/* Unboxed Metadata Telemetry Status Bar */}
      <TelemetryStatusBar
        llmConfig={llmConfig}
        proxyConfig={proxyConfig}
        ollamaStatus={ollamaStatus}
        onNavigateToHardware={() => setActiveTab('hardware_monitor')}
      />

      {/* Main Viewport Strictly Contained Within Screen */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full">
        {activeTab === 'llm_workstation' && (
          <LLMChatWorkspace
            llmConfig={llmConfig}
            setLLMConfig={setLLMConfig}
            onSendToScriptStudio={handleSendToScriptStudio}
            ollamaStatus={ollamaStatus}
            setOllamaStatus={setOllamaStatus}
          />
        )}

        {activeTab === 'vector_rag' && (
          <VectorRagStudio />
        )}

        {activeTab === 'web_agent' && (
          <AutonomousAgent
            proxyConfig={proxyConfig}
            onNavigateToRag={() => setActiveTab('vector_rag')}
          />
        )}

        {activeTab === 'agent_tools' && (
          <AgentToolsStudio />
        )}

        {activeTab === 'script_studio' && (
          <ScriptWorkspace
            initialCode={scriptHandoff?.code}
            initialLang={scriptHandoff?.language}
            initialTitle={scriptHandoff?.title}
            onAskLLMToRefactor={handleAskLLMToRefactor}
          />
        )}

        {activeTab === 'proxy_security' && (
          <ProxySecurityAudit
            proxyConfig={proxyConfig}
            setProxyConfig={setProxyConfig}
          />
        )}

        {activeTab === 'hardware_monitor' && (
          <HardwareMonitor />
        )}

        {activeTab === 'python_export' && (
          <PythonExportModal
            llmConfig={llmConfig}
            proxyConfig={proxyConfig}
          />
        )}
      </main>
    </div>
  );
}
