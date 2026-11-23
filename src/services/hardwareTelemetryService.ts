/**
 * Hardware Telemetry & Thermal Monitoring Service
 * Tracks real-time GPU/CPU temperatures, fan RPM, and thermal throttling status
 * during local LLM inference and air-gapped security operations.
 */

export type ThermalLevel = 'NOMINAL' | 'ELEVATED' | 'HIGH_WARNING' | 'CRITICAL';

export interface ThermalTelemetryData {
  gpuTempC: number;
  cpuTempC: number;
  gpuHotspotC: number;
  vramTempC: number;
  fanSpeedRpm: number;
  fanPercent: number;
  throttlingActive: boolean;
  throttlePercent: number;
  inferenceActive: boolean;
  thermalLevel: ThermalLevel;
  lastSpikeTimestamp?: number;
  coolingBoostActive: boolean;
  activeWorkload: string;
}

type ThermalListener = (data: ThermalTelemetryData) => void;

class HardwareTelemetryService {
  private data: ThermalTelemetryData = {
    gpuTempC: 51.5,
    cpuTempC: 47.0,
    gpuHotspotC: 60.2,
    vramTempC: 55.0,
    fanSpeedRpm: 1850,
    fanPercent: 38,
    throttlingActive: false,
    throttlePercent: 0,
    inferenceActive: false,
    thermalLevel: 'NOMINAL',
    coolingBoostActive: false,
    activeWorkload: 'Air-Gap Idle / Standby'
  };

  private listeners: Set<ThermalListener> = new Set();
  private intervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startSimulationLoop();
  }

  public getTelemetry(): ThermalTelemetryData {
    return { ...this.data };
  }

  public subscribe(listener: ThermalListener): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.getTelemetry();
    this.listeners.forEach(fn => fn(current));
  }

  public setInferenceActive(active: boolean, workloadName?: string) {
    this.data.inferenceActive = active;
    if (active) {
      this.data.activeWorkload = workloadName || 'Local LLM Inference (CUDA GEMM / KV Cache Ingestion)';
      this.data.lastSpikeTimestamp = Date.now();
      // Immediate quick thermal surge on local model dispatch
      this.data.gpuTempC = Math.max(this.data.gpuTempC, 76.5);
      this.data.cpuTempC = Math.max(this.data.cpuTempC, 72.0);
    } else {
      this.data.activeWorkload = 'Inference Complete · Thermal Dissipation';
    }
    this.recalculateThermalState();
    this.notify();
  }

  /**
   * Directly simulate a high temperature spike to test the air-gap visual warning indicator
   */
  public triggerThermalStress(enable: boolean) {
    if (enable) {
      this.data.inferenceActive = true;
      this.data.coolingBoostActive = false;
      this.data.gpuTempC = 86.8;
      this.data.cpuTempC = 83.4;
      this.data.gpuHotspotC = 96.5;
      this.data.vramTempC = 88.0;
      this.data.fanSpeedRpm = 4150;
      this.data.fanPercent = 98;
      this.data.activeWorkload = 'Heavy Local Stress Test: 70B FP16 Transformer Compute';
      this.data.lastSpikeTimestamp = Date.now();
    } else {
      this.data.inferenceActive = false;
      this.data.gpuTempC = 53.0;
      this.data.cpuTempC = 48.5;
      this.data.gpuHotspotC = 62.0;
      this.data.vramTempC = 56.0;
      this.data.fanSpeedRpm = 1900;
      this.data.fanPercent = 40;
      this.data.activeWorkload = 'Air-Gap Idle / Standby';
    }
    this.recalculateThermalState();
    this.notify();
  }

  public engageCoolingBoost() {
    this.data.coolingBoostActive = true;
    this.data.fanPercent = 100;
    this.data.fanSpeedRpm = 4400;
    this.data.gpuTempC = Math.max(54.0, this.data.gpuTempC - 14.0);
    this.data.cpuTempC = Math.max(50.0, this.data.cpuTempC - 12.0);
    this.data.activeWorkload = 'Emergency Fan Ramp Active (100% Exhaust)';
    this.recalculateThermalState();
    this.notify();

    setTimeout(() => {
      this.data.coolingBoostActive = false;
      this.recalculateThermalState();
      this.notify();
    }, 8000);
  }

  private recalculateThermalState() {
    const maxTemp = Math.max(this.data.gpuTempC, this.data.cpuTempC);

    if (maxTemp >= 83.0) {
      this.data.thermalLevel = 'CRITICAL';
      this.data.throttlingActive = true;
      this.data.throttlePercent = Math.min(35, Math.round((maxTemp - 82.0) * 8));
    } else if (maxTemp >= 75.0) {
      this.data.thermalLevel = 'HIGH_WARNING';
      this.data.throttlingActive = maxTemp >= 79.0;
      this.data.throttlePercent = maxTemp >= 79.0 ? 10 : 0;
    } else if (maxTemp >= 68.0) {
      this.data.thermalLevel = 'ELEVATED';
      this.data.throttlingActive = false;
      this.data.throttlePercent = 0;
    } else {
      this.data.thermalLevel = 'NOMINAL';
      this.data.throttlingActive = false;
      this.data.throttlePercent = 0;
    }

    this.data.gpuHotspotC = parseFloat((this.data.gpuTempC + 10.2).toFixed(1));
    this.data.vramTempC = parseFloat((this.data.gpuTempC + 4.5).toFixed(1));
  }

  private startSimulationLoop() {
    if (this.intervalTimer) return;

    this.intervalTimer = setInterval(() => {
      if (this.data.inferenceActive) {
        // Temps rise under active inference load
        const targetGpu = 85.0;
        const targetCpu = 81.5;
        if (this.data.gpuTempC < targetGpu) {
          this.data.gpuTempC = parseFloat((this.data.gpuTempC + 1.2).toFixed(1));
        } else {
          // slight jitter around peak
          this.data.gpuTempC = parseFloat((targetGpu + (Math.random() * 2 - 1)).toFixed(1));
        }

        if (this.data.cpuTempC < targetCpu) {
          this.data.cpuTempC = parseFloat((this.data.cpuTempC + 0.9).toFixed(1));
        } else {
          this.data.cpuTempC = parseFloat((targetCpu + (Math.random() * 1.5 - 0.75)).toFixed(1));
        }

        // Fan ramps up automatically under high heat
        if (this.data.fanPercent < 94) {
          this.data.fanPercent = Math.min(96, this.data.fanPercent + 6);
          this.data.fanSpeedRpm = Math.round(1800 + (this.data.fanPercent / 100) * 2300);
        }
      } else {
        // Cooldown when inference is idle
        const baseGpu = 51.0;
        const baseCpu = 47.0;

        if (this.data.gpuTempC > baseGpu) {
          this.data.gpuTempC = parseFloat((this.data.gpuTempC - (this.data.coolingBoostActive ? 2.5 : 1.1)).toFixed(1));
        }
        if (this.data.cpuTempC > baseCpu) {
          this.data.cpuTempC = parseFloat((this.data.cpuTempC - (this.data.coolingBoostActive ? 2.2 : 0.9)).toFixed(1));
        }

        // Fan speeds taper down
        if (this.data.fanPercent > 38 && !this.data.coolingBoostActive) {
          this.data.fanPercent = Math.max(38, this.data.fanPercent - 4);
          this.data.fanSpeedRpm = Math.round(1800 + (this.data.fanPercent / 100) * 2300);
        }
      }

      this.recalculateThermalState();
      this.notify();
    }, 1200);
  }
}

export const hardwareTelemetry = new HardwareTelemetryService();
