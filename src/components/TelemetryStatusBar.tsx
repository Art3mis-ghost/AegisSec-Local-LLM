import React, { useState, useEffect } from 'react';
import { LLMConfig, ProxyConfig } from '../types';
import { vectorDb } from '../services/vectorDb';
import { hardwareTelemetry, ThermalTelemetryData } from '../services/hardwareTelemetryService';
import { 
  Flame, 
  AlertTriangle, 
  Thermometer, 
  Fan, 
  Zap, 
  ShieldAlert, 
  Sliders, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Cpu
} from 'lucide-react';

interface TelemetryStatusBarProps {
  llmConfig: LLMConfig;
  proxyConfig: ProxyConfig;
  ollamaStatus: { connected: boolean; latencyMs?: number };
  onNavigateToHardware?: () => void;
}

export const TelemetryStatusBar: React.FC<TelemetryStatusBarProps> = ({
  llmConfig,
  proxyConfig,
  ollamaStatus,
  onNavigateToHardware
}) => {
  const dbMetrics = vectorDb.getDatabaseMetrics();
  const [thermal, setThermal] = useState<ThermalTelemetryData>(hardwareTelemetry.getTelemetry());
  const [showThermalDetails, setShowThermalDetails] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = hardwareTelemetry.subscribe(setThermal);
    return () => unsubscribe();
  }, []);

  // Close thermal modal on Escape key press
  useEffect(() => {
    if (!showThermalDetails) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowThermalDetails(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showThermalDetails]);

  const isWarning = thermal.thermalLevel === 'HIGH_WARNING';
  const isCritical = thermal.thermalLevel === 'CRITICAL';
  const hasThermalAlert = isWarning || isCritical;

  const handleToggleStress = () => {
    hardwareTelemetry.triggerThermalStress(!isCritical);
  };

  const handleCoolingBoost = () => {
    hardwareTelemetry.engageCoolingBoost();
  };

  return (
    <div className="relative w-full bg-[#070a12] border-b border-slate-800/80 px-4 sm:px-6 py-2 text-xs text-slate-400 font-mono shrink-0">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Zone 1: Model, Runtime & Scope */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-slate-300 font-semibold">MODEL</span>
          <span className="text-slate-200">{llmConfig.modelName.split(':')[0]}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          
          <span className="text-slate-300 font-semibold">RUNTIME</span>
          <span className={llmConfig.provider === 'ollama' && ollamaStatus.connected ? 'text-emerald-400' : 'text-slate-300'}>
            {llmConfig.provider === 'ollama' 
              ? (ollamaStatus.connected ? `Ollama (${ollamaStatus.latencyMs}ms)` : 'Ollama (Connecting...)')
              : 'Built-in Air-Gap Engine'}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>

          <span className="text-slate-300 font-semibold">SECURITY ROE</span>
          <span className="text-amber-400 truncate max-w-[170px]" title={llmConfig.authorizationScope}>
            {llmConfig.authorizationScope}
          </span>
        </div>

        {/* Zone 2: Telemetry Indicators with Thermal Screen positioned to the far right */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto justify-end">
          {/* Vector RAG & Egress stats */}
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">VECTOR RAG</span>
            <span className="text-slate-200 tabular-nums">{dbMetrics.totalChunks} chunks</span>
            <span aria-hidden="true" className="text-slate-600">·</span>

            <span className="text-slate-300 font-semibold">VAULT</span>
            <span className="text-emerald-400">AES-256-GCM</span>
            <span aria-hidden="true" className="text-slate-600">·</span>

            <span className="text-slate-300 font-semibold">EGRESS</span>
            <span className={proxyConfig.airGapStrict ? 'text-emerald-400' : 'text-amber-400'}>
              {proxyConfig.airGapStrict ? 'AIR-GAP ISOLATED' : `SOCKS5:${proxyConfig.upstreamPort}`}
            </span>
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          {/* Main Visual Thermal Warning Indicator - Positioned to the right */}
          <div className="relative">
            {hasThermalAlert ? (
              <button
                type="button"
                onClick={() => setShowThermalDetails(!showThermalDetails)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isCritical
                    ? 'bg-red-950/90 border border-red-500 text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.7)] animate-pulse'
                    : 'bg-amber-950/85 border border-amber-500/80 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.5)]'
                }`}
                title="Click to view air-gap thermal diagnostics & cooling controls"
                aria-expanded={showThermalDetails}
              >
                <div className="relative flex items-center justify-center">
                  {isCritical ? (
                    <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  )}
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${
                    isCritical ? 'bg-red-500' : 'bg-amber-400'
                  }`} />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="uppercase tracking-wider">
                    {isCritical ? 'THERMAL CRITICAL' : 'THERMAL WARNING'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-black/60 rounded text-[11px] tabular-nums font-extrabold text-white">
                    GPU {thermal.gpuTempC}°C
                  </span>
                  <span className="hidden md:inline px-1 py-0.2 bg-black/50 rounded text-[10px] tabular-nums text-slate-300">
                    CPU {thermal.cpuTempC}°C
                  </span>
                  {thermal.throttlingActive && (
                    <span className="px-1 py-0.2 bg-red-900/80 rounded text-[10px] text-red-200 font-bold">
                      THROTTLE -{thermal.throttlePercent}%
                    </span>
                  )}
                </div>

                <ChevronDown className={`w-3 h-3 transition-transform ${showThermalDetails ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowThermalDetails(!showThermalDetails)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 text-xs font-mono transition-colors cursor-pointer group"
                title="Inspect local GPU/CPU inference thermals"
                aria-expanded={showThermalDetails}
              >
                <Thermometer className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 font-medium">THERMALS:</span>
                <span className="text-emerald-400 tabular-nums font-semibold">
                  GPU {thermal.gpuTempC}°C
                </span>
                <span aria-hidden="true" className="text-slate-600">/</span>
                <span className="text-cyan-400 tabular-nums">
                  CPU {thermal.cpuTempC}°C
                </span>
                {thermal.inferenceActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" title="Inference active" />
                )}
              </button>
            )}

            {/* Thermal Diagnostics & Mitigation Modal/Screen - Viewport Clamped to Right */}
            {showThermalDetails && (
              <>
                {/* Backdrop dismiss */}
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity"
                  onClick={() => setShowThermalDetails(false)}
                  aria-hidden="true"
                />

                {/* Viewport-clamped dialog container strictly aligned to right */}
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="thermal-sentinel-title"
                  className="fixed z-50 top-12 sm:top-14 right-2 sm:right-4 md:right-6 w-[calc(100vw-1rem)] sm:w-[410px] max-w-[420px] max-h-[calc(100vh-4.5rem)] flex flex-col rounded-xl bg-[#090d19]/98 backdrop-blur-2xl border border-emerald-500/40 font-mono text-xs shadow-[0_0_40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                >
                  {/* Dialog Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/90 px-4 py-3 bg-[#060912] shrink-0">
                    <div className="flex items-center gap-2">
                      <Cpu className={`w-4 h-4 ${hasThermalAlert ? (isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400') : 'text-emerald-400'}`} />
                      <span id="thermal-sentinel-title" className="font-bold text-white uppercase tracking-wider text-xs">
                        Air-Gap Thermal Sentinel
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowThermalDetails(false)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="Close thermal sentinel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Body - Guaranteed within viewport boundaries */}
                  <div className="overflow-y-auto overscroll-contain p-4 space-y-3.5 flex-1 min-h-0">
                    {/* Status Alert Banner */}
                    {hasThermalAlert ? (
                      <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
                        isCritical 
                          ? 'bg-red-950/80 border-red-600 text-red-200' 
                          : 'bg-amber-950/70 border-amber-600 text-amber-200'
                      }`}>
                        <Flame className="w-4 h-4 shrink-0 mt-0.5 text-red-400 animate-bounce" />
                        <div>
                          <div className="font-bold uppercase tracking-wider">
                            {isCritical ? 'CRITICAL THERMAL THROTTLING DETECTED' : 'ELEVATED INFERENCE CORE HEAT'}
                          </div>
                          <p className="text-[11px] mt-1 text-slate-300 leading-normal">
                            {isCritical
                              ? 'Local matrix operations have caused silicon temperatures to exceed safe air-gapped thresholds. GPU frequency scaled down to prevent hardware damage.'
                              : 'Transformer layers offload is driving temperatures near thermal limit. Monitor fan ventilation to avoid token throughput degradation.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span>Thermals Nominal: Compute silicon operating in safe air-gap parameters.</span>
                      </div>
                    )}

                    {/* Sensor Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">GPU Core Temp</span>
                        <span className={`text-base font-extrabold tabular-nums ${
                          thermal.gpuTempC >= 83 ? 'text-red-400' : thermal.gpuTempC >= 75 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {thermal.gpuTempC}°C
                        </span>
                        <span className="text-[10px] text-slate-500 block">Hotspot: {thermal.gpuHotspotC}°C</span>
                      </div>

                      <div className="p-2.5 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">CPU Package Temp</span>
                        <span className={`text-base font-extrabold tabular-nums ${
                          thermal.cpuTempC >= 80 ? 'text-red-400' : thermal.cpuTempC >= 72 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {thermal.cpuTempC}°C
                        </span>
                        <span className="text-[10px] text-slate-500 block">VRAM: {thermal.vramTempC}°C</span>
                      </div>

                      <div className="p-2.5 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Exhaust Fans</span>
                        <span className="text-sm font-bold text-slate-200 tabular-nums">
                          {thermal.fanSpeedRpm} RPM
                        </span>
                        <span className="text-[10px] text-slate-400 block">Duty: {thermal.fanPercent}%</span>
                      </div>

                      <div className="p-2.5 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Silicon Throttling</span>
                        <span className={`text-sm font-bold tabular-nums ${
                          thermal.throttlingActive ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {thermal.throttlingActive ? `ACTIVE (-${thermal.throttlePercent}%)` : 'NONE (100% Boost)'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Performance Impact</span>
                      </div>
                    </div>

                    {/* Active Workload description */}
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      <span className="text-slate-400 block text-[10px]">Active Workload Engine:</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {thermal.activeWorkload}
                      </span>
                    </div>

                    {/* Mitigation & Testing Action Controls */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCoolingBoost}
                          disabled={thermal.coolingBoostActive}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Fan className={`w-3.5 h-3.5 ${thermal.coolingBoostActive ? 'animate-spin' : ''}`} />
                          <span>{thermal.coolingBoostActive ? 'Cooling Active...' : 'Emergency Fan Boost'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleStress}
                          className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCritical
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              : 'bg-red-950/80 hover:bg-red-900 border-red-700 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          }`}
                          title="Simulate or reset high temperature thermal condition"
                        >
                          <Flame className="w-3.5 h-3.5 text-red-400" />
                          <span>{isCritical ? 'Clear Heat Spike' : 'Simulate Heat Spike'}</span>
                        </button>
                      </div>

                      {onNavigateToHardware && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowThermalDetails(false);
                            onNavigateToHardware();
                          }}
                          className="w-full py-2 text-center text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer bg-slate-900/50 hover:bg-slate-800/80 rounded border border-slate-800"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Open Hardware Telemetry & Inference Profiler →</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
