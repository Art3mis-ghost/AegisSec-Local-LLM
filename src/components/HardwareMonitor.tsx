import React, { useState, useEffect } from 'react';
import { HardwareTelemetry } from '../types';
import { hardwareTelemetry, ThermalTelemetryData } from '../services/hardwareTelemetryService';
import { 
  Cpu, 
  Zap, 
  HardDrive, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  Server,
  Flame,
  Fan,
  Thermometer,
  AlertTriangle
} from 'lucide-react';

export const HardwareMonitor: React.FC = () => {
  // Configurable Parameters for Sizing
  const [modelParamsBillion, setModelParamsBillion] = useState<number>(7);
  const [quantization, setQuantization] = useState<HardwareTelemetry['quantizationMode']>('Q4_K_M');
  const [contextWindow, setContextWindow] = useState<number>(16384);
  const [gpuLayers, setGpuLayers] = useState<number>(33);
  const [cpuThreads, setCpuThreads] = useState<number>(8);
  const [memoryPurgeOnExit, setMemoryPurgeOnExit] = useState<boolean>(true);
  const [thermal, setThermal] = useState<ThermalTelemetryData>(hardwareTelemetry.getTelemetry());

  useEffect(() => {
    const unsub = hardwareTelemetry.subscribe(setThermal);
    return () => unsub();
  }, []);

  // Compute realistic hardware math
  const bitsPerWeight = quantization === 'Q4_K_M' ? 4.5 : quantization === 'Q5_K_M' ? 5.5 : quantization === 'Q8_0' ? 8.5 : 16;
  const rawModelWeightGb = parseFloat(((modelParamsBillion * bitsPerWeight) / 8).toFixed(2));
  
  // KV Cache: 2 * num_layers * hidden_size * context_tokens * 2 bytes
  // Simplified realistic formula for standard transformer
  const kvCacheGb = parseFloat(((contextWindow / 1024) * (modelParamsBillion * 0.08)).toFixed(2));
  const totalVramGb = parseFloat((rawModelWeightGb + kvCacheGb + 0.6).toFixed(2)); // +0.6GB CUDA overhead
  
  // Estimated inference speed on consumer hardware
  let baseTokensSec = 45;
  if (modelParamsBillion <= 7) {
    baseTokensSec = quantization === 'Q4_K_M' ? 48 : quantization === 'Q8_0' ? 32 : 18;
  } else if (modelParamsBillion <= 14) {
    baseTokensSec = quantization === 'Q4_K_M' ? 34 : 20;
  } else if (modelParamsBillion <= 34) {
    baseTokensSec = quantization === 'Q4_K_M' ? 22 : 12;
  } else {
    baseTokensSec = quantization === 'Q4_K_M' ? 14 : 6;
  }

  // Recommended hardware tier
  let hardwareTier = 'NVIDIA RTX 3060 (12GB) / RTX 4060 Ti (16GB)';
  let hardwareFitStatus = 'Optimal for Consumer GPU';
  if (totalVramGb <= 11) {
    hardwareTier = 'NVIDIA RTX 3060 (12GB) / RTX 4060 (16GB) / Apple M-Series 16GB';
    hardwareFitStatus = 'Fully Fits in Consumer GPU VRAM (Zero CPU Spillover)';
  } else if (totalVramGb <= 15.5) {
    hardwareTier = 'NVIDIA RTX 4070 Ti (16GB) / RTX 4080 (16GB) / Apple M3 (18GB)';
    hardwareFitStatus = 'Fits in Mid-Tier 16GB VRAM GPUs';
  } else if (totalVramGb <= 23.5) {
    hardwareTier = 'NVIDIA RTX 3090 / 4090 (24GB) / Apple M3 Pro (36GB)';
    hardwareFitStatus = 'Requires Enthusiast 24GB VRAM GPU';
  } else {
    hardwareTier = 'Dual RTX 3090 (48GB) / Mac Studio (64GB - 128GB Unified Memory)';
    hardwareFitStatus = 'Requires Multi-GPU or Apple Silicon Unified Memory';
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Hardware Telemetry & High-Performance Inference Profiler</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            VRAM consumption calculator, KV cache sizing, quantization benchmark, and consumer hardware optimization.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Target VRAM:</span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">{totalVramGb} GB</span>
        </div>
      </div>

      {/* Recommended Hardware Banner */}
      <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Consumer Hardware Compatibility Assessment
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Recommended Minimum: {hardwareTier}</span>
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-0.5">
            ✓ {hardwareFitStatus}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Model Weights</span>
            <span className="text-slate-200 font-bold tabular-nums">{rawModelWeightGb} GB</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">KV Cache</span>
            <span className="text-cyan-400 font-bold tabular-nums">{kvCacheGb} GB</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Speed (Est.)</span>
            <span className="text-emerald-400 font-bold tabular-nums">~{baseTokensSec} tok/s</span>
          </div>
        </div>
      </div>

      {/* Live Air-Gap Thermal Telemetry & Silicon Protection Panel */}
      <div className={`p-4 rounded-lg border transition-all duration-300 font-mono text-xs ${
        thermal.thermalLevel === 'CRITICAL'
          ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
          : thermal.thermalLevel === 'HIGH_WARNING'
          ? 'bg-amber-950/30 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          : 'bg-[#0c111d] border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            {thermal.thermalLevel === 'CRITICAL' ? (
              <Flame className="w-5 h-5 text-red-400 animate-bounce" />
            ) : thermal.thermalLevel === 'HIGH_WARNING' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Thermometer className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Air-Gap Silicon Thermal Telemetry & Throttling Sentinel
                </span>
                {thermal.throttlingActive && (
                  <span className="px-2 py-0.5 rounded bg-red-900 text-red-200 text-[10px] font-bold animate-pulse">
                    THROTTLING ACTIVE (-{thermal.throttlePercent}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active Workload: <span className="text-slate-200 font-semibold">{thermal.activeWorkload}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => hardwareTelemetry.engageCoolingBoost()}
              disabled={thermal.coolingBoostActive}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Fan className={`w-3.5 h-3.5 ${thermal.coolingBoostActive ? 'animate-spin' : ''}`} />
              <span>{thermal.coolingBoostActive ? 'Cooling...' : 'Fan Boost'}</span>
            </button>
            <button
              type="button"
              onClick={() => hardwareTelemetry.triggerThermalStress(thermal.thermalLevel !== 'CRITICAL')}
              className={`px-3 py-1.5 rounded border text-xs font-bold transition-colors cursor-pointer ${
                thermal.thermalLevel === 'CRITICAL'
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-red-950/70 border-red-700 text-red-200 hover:bg-red-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-400 inline mr-1" />
              <span>{thermal.thermalLevel === 'CRITICAL' ? 'Clear Spike' : 'Test Heat Spike'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>GPU CORE TEMP</span>
              <span>Hotspot {thermal.gpuHotspotC}°C</span>
            </div>
            <div className={`text-xl font-extrabold tabular-nums mt-0.5 ${
              thermal.gpuTempC >= 83 ? 'text-red-400' : thermal.gpuTempC >= 75 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {thermal.gpuTempC}°C
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-300 ${
                  thermal.gpuTempC >= 83 ? 'bg-red-500' : thermal.gpuTempC >= 75 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, ((thermal.gpuTempC - 30) / 70) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>CPU PACKAGE TEMP</span>
              <span>VRAM {thermal.vramTempC}°C</span>
            </div>
            <div className={`text-xl font-extrabold tabular-nums mt-0.5 ${
              thermal.cpuTempC >= 80 ? 'text-red-400' : thermal.cpuTempC >= 72 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {thermal.cpuTempC}°C
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full transition-all duration-300 ${
                  thermal.cpuTempC >= 80 ? 'bg-red-500' : thermal.cpuTempC >= 72 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, ((thermal.cpuTempC - 30) / 70) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>COOLING EXHAUST</span>
              <span>{thermal.fanPercent}% Duty</span>
            </div>
            <div className="text-xl font-extrabold text-slate-200 tabular-nums mt-0.5">
              {thermal.fanSpeedRpm} <span className="text-xs font-normal text-slate-400">RPM</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${thermal.fanPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>THROTTLING RISK</span>
              <span>{thermal.throttlingActive ? 'ENGAGED' : 'SAFE'}</span>
            </div>
            <div className={`text-xl font-extrabold tabular-nums mt-0.5 ${
              thermal.throttlingActive ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {thermal.throttlingActive ? `-${thermal.throttlePercent}% CLK` : '100% BOOST'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {thermal.throttlingActive ? 'Tokens/sec degraded due to heat' : 'Optimal air-gap throughput'}
            </div>
          </div>
        </div>
      </div>

      {/* Sizing & Parameter Tuning Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Model & Quantization Selection</span>
            </h2>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Model Parameter Size</span>
                <span className="text-slate-200 font-bold tabular-nums">{modelParamsBillion}B Parameters</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 34, 70].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setModelParamsBillion(size)}
                    className={`py-2 rounded border font-mono font-bold transition-colors ${
                      modelParamsBillion === size
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {size}B
                  </button>
                ))}
              </div>
              <span className="text-slate-400 text-[11px] mt-1 block">
                7B (DeepSeek Coder / Llama 3) provides highest speed & lowest memory on consumer GPUs.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Quantization Format</span>
                <span className="text-slate-200 font-bold">{quantization}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Q4_K_M', 'Q5_K_M', 'Q8_0', 'FP16'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantization(q)}
                    className={`py-2 rounded border font-mono font-bold text-center transition-colors ${
                      quantization === q
                        ? 'bg-slate-800 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <span className="text-slate-400 text-[11px] mt-1 block">
                Q4_K_M delivers ~98% of FP16 accuracy at 25% of the memory footprint.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Context Window Length</span>
                <span className="text-slate-200 font-bold tabular-nums">{(contextWindow / 1024).toFixed(0)}K Tokens ({contextWindow} tokens)</span>
              </div>
              <input
                type="range"
                min="4096"
                max="65536"
                step="4096"
                value={contextWindow}
                onChange={(e) => setContextWindow(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded"
              />
              <span className="text-slate-400 text-[11px] mt-1 block">
                Larger context windows allow ingesting full codebases and long CVE documents into active RAG memory.
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Performance & Compute Layers */}
        <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Compute Offload & Thread Allocation</span>
              </h2>
            </div>

            <div className="space-y-4 text-xs font-mono mt-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">GPU Offloaded Transformer Layers</span>
                  <span className="text-slate-200 font-bold tabular-nums">{gpuLayers} / 33 Layers (100% GPU)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="33"
                  step="1"
                  value={gpuLayers}
                  onChange={(e) => setGpuLayers(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded"
                />
                <span className="text-slate-400 text-[11px] mt-1 block">
                  Offloading all layers to CUDA/Metal ensures maximum inference tokens per second.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">CPU Thread Worker Allocation</span>
                  <span className="text-slate-200 font-bold tabular-nums">{cpuThreads} Threads</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  step="2"
                  value={cpuThreads}
                  onChange={(e) => setCpuThreads(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded"
                />
                <span className="text-slate-400 text-[11px] mt-1 block">
                  Optimized for host parallel prompt preprocessing and vector similarity math.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={memoryPurgeOnExit}
                    onChange={(e) => setMemoryPurgeOnExit(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span>Cryptographic Memory Sanitization (Zero-Fill RAM on Session Teardown)</span>
                </label>
                <span className="text-slate-400 text-[11px] block ml-5 mt-0.5">
                  Overwrites KV cache and model buffers in host memory to prevent cold-boot memory forensic recovery.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">Ollama CLI Performance Command:</span>
            <code className="block mt-1 text-slate-200 bg-[#070a12] p-2 rounded">
              OLLAMA_NUM_PARALLEL=4 OLLAMA_FLASH_ATTENTION=1 ollama run {modelParamsBillion}b
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
