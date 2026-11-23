import React from 'react';
import { ActiveTab, ProxyConfig } from '../types';
import { Shield, ShieldAlert, Cpu, Terminal, Database, Bot, Network, Code2, Download, Wrench } from 'lucide-react';
import { FSocietyMask } from './FSocietyMask';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  proxyConfig: ProxyConfig;
  setProxyConfig: React.Dispatch<React.SetStateAction<ProxyConfig>>;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  proxyConfig,
  setProxyConfig
}) => {
  const toggleAirGap = () => {
    setProxyConfig(prev => ({
      ...prev,
      airGapStrict: !prev.airGapStrict
    }));
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'llm_workstation', label: 'LLM Console', icon: Terminal },
    { id: 'vector_rag', label: 'Vector RAG', icon: Database },
    { id: 'web_agent', label: 'Web Agent', icon: Bot },
    { id: 'agent_tools', label: 'Agent Tools', icon: Wrench },
    { id: 'script_studio', label: 'Script Studio', icon: Code2 },
    { id: 'proxy_security', label: 'Proxy & Tor', icon: Network },
    { id: 'hardware_monitor', label: 'Hardware', icon: Cpu },
    { id: 'python_export', label: 'Export .py', icon: Download }
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 py-2.5 bg-[#050811]/95 backdrop-blur-md border-b border-emerald-950/80 w-full max-w-full overflow-hidden shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
      {/* Zone 1: Brand Wordmark with Mr. Robot Clown Mask Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-black border border-emerald-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-transform hover:scale-105 overflow-hidden p-0.5">
          <img
            src="https://imgs.search.brave.com/NGGABHbE94Wet-jd3mby3H43NH4We4miUBSFHHcgE3c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnJl/ZGQuaXQvYXhzd2Vy/ZmFrZmg2MS5wbmc"
            alt="FSOCIETY Clown Mask"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fsociety-fallback') as HTMLElement | null;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div className="fsociety-fallback hidden">
            <FSocietyMask className="w-7 h-7 drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold tracking-wider text-emerald-400 whitespace-nowrap font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
            FSOCIETY<span className="text-red-500">_</span>AI
          </span>
          <span className="text-xs text-slate-400 font-mono hidden md:inline whitespace-nowrap">
            Air-Gap SecOps
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-1 xl:gap-1.5 text-xs font-medium text-slate-300 overflow-x-auto min-w-0 max-w-full py-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-emerald-300 font-semibold border border-emerald-500/80 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-500/60 hover:shadow-[0_0_14px_rgba(34,197,94,0.55)] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Air-Gap Control */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleAirGap}
          title={proxyConfig.airGapStrict ? "Strict Air-Gap active: all external sockets severed" : "Proxy Egress active: outbound routed through SOCKS5"}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all whitespace-nowrap shrink-0 border ${
            proxyConfig.airGapStrict
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/70 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-amber-950/40 text-amber-300 border-amber-600/60'
          }`}
        >
          {proxyConfig.airGapStrict ? (
            <>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>AIR-GAP: STRICT (OFFLINE)</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>SANDBOX PROXY EGRESS</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
