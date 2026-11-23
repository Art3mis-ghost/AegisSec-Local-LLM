import React, { useState } from 'react';
import { ProxyConfig } from '../types';
import { auditPrivacyPosture, executeSandboxedWebFetch, FetchResult } from '../services/proxyService';
import { 
  Network, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  RefreshCw, 
  Terminal,
  Send,
  EyeOff
} from 'lucide-react';

interface ProxySecurityAuditProps {
  proxyConfig: ProxyConfig;
  setProxyConfig: React.Dispatch<React.SetStateAction<ProxyConfig>>;
}

export const ProxySecurityAudit: React.FC<ProxySecurityAuditProps> = ({
  proxyConfig,
  setProxyConfig
}) => {
  const [testUrl, setTestUrl] = useState('https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-6387');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);

  const auditReport = auditPrivacyPosture(proxyConfig);

  const handleTestFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    setIsFetching(true);
    try {
      const result = await executeSandboxedWebFetch(testUrl, proxyConfig);
      setFetchResult(result);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            <span>Secure Proxy & Air-Gap Privacy Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Zero-leak egress architecture. Chain through local Tor SOCKS5 or upstream Burp proxies with automated header stripping and remote DNS resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Privacy Posture:</span>
            <span className={`font-semibold tabular-nums ${auditReport.overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {auditReport.overallScore}% Protected
            </span>
          </div>
        </div>
      </div>

      {/* Primary Air-Gap Hero Toggle */}
      <div className={`p-5 rounded-lg border transition-all ${
        proxyConfig.airGapStrict
          ? 'bg-emerald-950/40 border-emerald-600/70'
          : 'bg-amber-950/30 border-amber-600/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              proxyConfig.airGapStrict 
                ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-500/60' 
                : 'bg-amber-900/60 text-amber-400 border border-amber-500/60'
            }`}>
              {proxyConfig.airGapStrict ? <Shield className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>{proxyConfig.airGapStrict ? 'Strict Air-Gap Isolation Mode (100% Offline)' : 'Sandboxed Proxy Egress Active'}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  proxyConfig.airGapStrict ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {proxyConfig.airGapStrict ? 'SEALED' : 'PROXY ARMED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed max-w-3xl">
                {proxyConfig.airGapStrict
                  ? 'All outbound TCP/UDP socket traffic is immediately dropped at the application layer. The system relies entirely on locally cached vector embeddings, preloaded playbooks, and local Ollama.'
                  : `Outbound research queries are channeled through ${proxyConfig.proxyType.toUpperCase()}://${proxyConfig.upstreamHost}:${proxyConfig.upstreamPort}. Tracking headers, cookies, and fingerprinting tokens are stripped prior to egress.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setProxyConfig(prev => ({ ...prev, airGapStrict: !prev.airGapStrict }))}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
              proxyConfig.airGapStrict
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
            }`}
          >
            {proxyConfig.airGapStrict ? 'Disable Strict Air-Gap' : 'Enforce Strict Air-Gap'}
          </button>
        </div>
      </div>

      {/* Proxy Settings & Audit Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proxy Module Configuration */}
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Upstream Proxy Configuration</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">OPSEC Layer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Proxy Protocol</label>
              <select
                value={proxyConfig.proxyType}
                onChange={(e) => setProxyConfig(prev => ({ ...prev, proxyType: e.target.value as any }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-slate-100 text-xs focus:outline-none"
              >
                <option value="socks5">SOCKS5 (Tor Circuit 127.0.0.1:9050)</option>
                <option value="http">HTTP/HTTPS (Burp Suite 127.0.0.1:8080)</option>
                <option value="direct_sandboxed">Direct Sandboxed (Header Stripping Only)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Upstream Port</label>
              <input
                type="number"
                value={proxyConfig.upstreamPort}
                onChange={(e) => setProxyConfig(prev => ({ ...prev, upstreamPort: parseInt(e.target.value) || 9050 }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="text-xs font-mono">
            <label className="text-slate-400 block mb-1">Upstream Host</label>
            <input
              type="text"
              value={proxyConfig.upstreamHost}
              onChange={(e) => setProxyConfig(prev => ({ ...prev, upstreamHost: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono"
              placeholder="127.0.0.1"
            />
          </div>

          <div className="text-xs font-mono">
            <label className="text-slate-400 block mb-1">Masked User-Agent String</label>
            <input
              type="text"
              value={proxyConfig.customUserAgent}
              onChange={(e) => setProxyConfig(prev => ({ ...prev, customUserAgent: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none font-mono text-[11px]"
            />
          </div>

          {/* Privacy Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={proxyConfig.stripTrackingHeaders}
                onChange={(e) => setProxyConfig(prev => ({ ...prev, stripTrackingHeaders: e.target.checked }))}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500"
              />
              <span>Strip Tracking Headers (Referer, Cookies, Sec-CH-UA, X-Forwarded-For)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={proxyConfig.blockExternalDns}
                onChange={(e) => setProxyConfig(prev => ({ ...prev, blockExternalDns: e.target.checked }))}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500"
              />
              <span>Force Remote Proxy DNS Resolution (SOCKS5h) to eliminate ISP leaks</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={proxyConfig.maskUserAgent}
                onChange={(e) => setProxyConfig(prev => ({ ...prev, maskUserAgent: e.target.checked }))}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500"
              />
              <span>Tor Browser ESR Fingerprint Spoofing</span>
            </label>
          </div>
        </div>

        {/* Privacy & Leak Audit Checklist */}
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Leak Security Audit</span>
              </h2>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {auditReport.overallScore}% Passing
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {auditReport.tests.map((test) => (
                <div key={test.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{test.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      test.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {test.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400 font-semibold">Air-Gap Seal Guarantee:</span> When strict mode is enabled, no outbound socket calls escape your physical machine. All LLM model weights, vector databases, and scratchpad scripts remain strictly local.
          </div>
        </div>
      </div>

      {/* Sandboxed URL Egress Tester */}
      <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Sandboxed Web Egress Tester</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Simulate Anonymized Fetch</span>
        </div>

        <form onSubmit={handleTestFetch} className="flex gap-3 text-xs font-mono">
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-6387"
            required
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-slate-500 font-mono"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold rounded text-xs transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isFetching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Routing through Proxy...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Fetch via Sandbox</span>
              </>
            )}
          </button>
        </form>

        {fetchResult && (
          <div className="mt-4 p-4 rounded-lg bg-[#070a12] border border-slate-800 text-xs font-mono space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  fetchResult.success ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                }`}>
                  HTTP {fetchResult.status}
                </span>
                <span className="text-slate-300 font-semibold">{fetchResult.proxyHop}</span>
              </div>
              <span className="text-slate-400 tabular-nums">Latency: {fetchResult.latencyMs}ms</span>
            </div>

            {fetchResult.error && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
                {fetchResult.error}
              </div>
            )}

            {fetchResult.headersScrubbed.length > 0 && (
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">
                  Scrubbed Headers & Sanitized Fingerprints:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fetchResult.headersScrubbed.map((h, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 text-[10px] border border-slate-800">
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fetchResult.sanitizedMarkdown && (
              <div>
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold">
                  Sanitized Text Extracted for RAG Ingestion:
                </span>
                <pre className="p-3 rounded bg-slate-900/90 border border-slate-800 text-slate-300 text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {fetchResult.sanitizedMarkdown}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
