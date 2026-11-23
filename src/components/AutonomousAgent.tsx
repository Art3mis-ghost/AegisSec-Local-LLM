import React, { useState } from 'react';
import { researchAgent } from '../services/researchAgent';
import { AgentExecutionLog, ProxyConfig, ResearchAgentTask } from '../types';
import { 
  Bot, 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface AutonomousAgentProps {
  proxyConfig: ProxyConfig;
  onNavigateToRag: () => void;
}

export const AutonomousAgent: React.FC<AutonomousAgentProps> = ({
  proxyConfig,
  onNavigateToRag
}) => {
  const [tasks, setTasks] = useState<ResearchAgentTask[]>(researchAgent.getTasks());
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [activeRunningPhase, setActiveRunningPhase] = useState<AgentExecutionLog['phase'] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // New Task Modal / Form state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newScope, setNewScope] = useState('cve.mitre.org, oss-security');
  const [newQueries, setNewQueries] = useState('linux kernel privilege escalation 2024, openssh exploit');
  const [newFrequency, setNewFrequency] = useState(360);
  const [newScheduleLabel, setNewScheduleLabel] = useState('Every 6 hours');
  const [newSeverity, setNewSeverity] = useState<ResearchAgentTask['severityThreshold']>('HIGH');
  const [autoIngest, setAutoIngest] = useState(true);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  const handleRunTask = async (taskId: string) => {
    setIsExecuting(true);
    try {
      const updatedTask = await researchAgent.runTaskExecution(
        taskId, 
        proxyConfig,
        (phase) => {
          setActiveRunningPhase(phase);
        }
      );
      setTasks([...researchAgent.getTasks()]);
    } finally {
      setIsExecuting(false);
      setActiveRunningPhase(null);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newGoal.trim()) return;

    const queriesArray = newQueries.split(',').map(q => q.trim()).filter(Boolean);
    const created = researchAgent.addTask({
      title: newTitle.trim(),
      goal: newGoal.trim(),
      targetScope: newScope.trim(),
      cronSchedule: newScheduleLabel,
      frequencyMinutes: newFrequency,
      searchQueries: queriesArray,
      autoIngestToRAG: autoIngest,
      severityThreshold: newSeverity
    });

    setTasks([...researchAgent.getTasks()]);
    setSelectedTaskId(created.id);
    setShowNewTaskModal(false);
    setNewTitle('');
    setNewGoal('');
  };

  const handleDeleteTask = (id: string) => {
    researchAgent.deleteTask(id);
    const updated = researchAgent.getTasks();
    setTasks([...updated]);
    if (selectedTaskId === id) {
      setSelectedTaskId(updated[0]?.id || '');
    }
  };

  const GRAPH_NODES: { phase: AgentExecutionLog['phase']; label: string; desc: string }[] = [
    { phase: 'planning', label: '1. Planner Node', desc: 'Synthesizes recon vectors & verifies target scope' },
    { phase: 'sandboxed_fetch', label: '2. Fetcher Node', desc: 'SOCKS5/Tor proxy egress with IP masking' },
    { phase: 'scrubbing', label: '3. Sanitizer Node', desc: 'Strips tracking headers, cookies, and JS scripts' },
    { phase: 'analysis', label: '4. Reasoning Node', desc: 'Uncensored local LLM extracts root cause & CVSS' },
    { phase: 'vector_ingest', label: '5. Ingest Node', desc: 'Chunks and embeds findings into encrypted RAG' },
    { phase: 'report_generated', label: '6. Report Brief', desc: 'Executive security alert dispatch' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>Autonomous Web Research & Recon Agent</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recurring LangGraph autonomous cognitive loop. Scrapes threat feeds via Tor/SOCKS5, strips tracking tokens, and auto-ingests into local vector RAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Research Task</span>
          </button>
        </div>
      </div>

      {/* Visual LangGraph Cyclical Architecture Display */}
      <div className="p-5 rounded-lg bg-[#0c111d] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>LangGraph Cognitive Loop State Machine</span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {isExecuting ? (
              <span className="text-amber-400 animate-pulse font-semibold">Active Node: {activeRunningPhase?.toUpperCase()}</span>
            ) : (
              <span>Status: Ready for schedule</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {GRAPH_NODES.map((node) => {
            const isActive = activeRunningPhase === node.phase;
            return (
              <div
                key={node.phase}
                className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className={`font-semibold mb-1 ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {node.label}
                </div>
                <div className="text-[11px] leading-tight opacity-80">
                  {node.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Tasks List */}
        <div className="p-4 rounded-lg bg-[#0c111d] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-semibold uppercase tracking-wider">Scheduled Tasks ({tasks.length})</span>
            <span className="text-slate-500">Autonomous</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {tasks.map((task) => {
              const isSelected = task.id === selectedTaskId;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/80 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-100 truncate max-w-[190px]">{task.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-slate-400 text-[11px] line-clamp-2 mb-2 leading-relaxed">
                    {task.goal}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{task.cronSchedule}</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      task.status === 'completed' 
                        ? 'bg-emerald-950 text-emerald-300' 
                        : task.status === 'running' 
                        ? 'bg-amber-950 text-amber-300 animate-pulse' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Selected Task Details & Execution Trace */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-[#0c111d] border border-slate-800 flex flex-col justify-between">
          {selectedTask ? (
            <div className="space-y-5">
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white font-mono">{selectedTask.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
                    {selectedTask.goal}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunTask(selectedTask.id)}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-mono font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Running Loop...' : 'Execute Cycle Now'}</span>
                  </button>
                </div>
              </div>

              {/* Task Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Authorized Scope</span>
                  <span className="text-slate-200 font-semibold truncate block mt-0.5">{selectedTask.targetScope}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Recurrence Cadence</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{selectedTask.cronSchedule}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">RAG Auto-Ingest</span>
                  <span className="text-cyan-400 font-semibold block mt-0.5">
                    {selectedTask.autoIngestToRAG ? 'ACTIVE (AES-256)' : 'DISABLED'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Severity Threshold</span>
                  <span className="text-amber-400 font-semibold block mt-0.5">{selectedTask.severityThreshold}</span>
                </div>
              </div>

              {/* Step Execution Trace Log */}
              <div>
                <div className="flex items-center justify-between mb-2.5 text-xs font-mono">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agent Execution Trace & Findings</span>
                  </span>
                  <span className="text-slate-400">
                    {selectedTask.executionLogs.length} step(s) recorded
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-[#070a12] border border-slate-800 font-mono text-xs space-y-3 max-h-[300px] overflow-y-auto">
                  {selectedTask.executionLogs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No execution logs recorded yet. Click &quot;Execute Cycle Now&quot; to initiate the LangGraph research workflow.
                    </div>
                  ) : (
                    selectedTask.executionLogs.map((log) => (
                      <div key={log.id} className="border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold uppercase text-[11px] ${
                            log.status === 'success' ? 'text-emerald-400' :
                            log.status === 'warning' ? 'text-amber-400' :
                            log.status === 'error' ? 'text-red-400' : 'text-cyan-400'
                          }`}>
                            [{log.phase.replace('_', ' ')}]
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {log.message}
                        </p>
                        {log.dataSnippet && (
                          <pre className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 whitespace-pre-wrap overflow-x-auto">
                            <code>{log.dataSnippet}</code>
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-500 py-12 text-center">
              Select or create a research task.
            </div>
          )}

          {/* Quick Action to RAG */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Want to inspect findings inside the vector database?</span>
            <button
              onClick={onNavigateToRag}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Explore in Vector RAG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create New Research Task */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-lg bg-[#0c111d] border border-slate-800 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>New Autonomous Research Task</span>
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1">Task Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily Nuclei Template & Exploit Monitor"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Research Goal & Objective</label>
                <textarea
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Specify what vulnerabilities, advisories, or target assets to track..."
                  rows={3}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Scope / Domains</label>
                  <input
                    type="text"
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    placeholder="cve.mitre.org, github.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Recurrence Schedule</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value);
                      setNewFrequency(mins);
                      setNewScheduleLabel(mins === 60 ? 'Every 1 hour' : mins === 360 ? 'Every 6 hours' : 'Daily');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value={60}>Every 1 hour</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Daily (Every 24 hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Search Queries (comma-separated)</label>
                <input
                  type="text"
                  value={newQueries}
                  onChange={(e) => setNewQueries(e.target.value)}
                  placeholder="cve 2024 rce, openssh exploit, linux privesc"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoIngest}
                    onChange={(e) => setAutoIngest(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span>Auto-Ingest Findings to Encrypted RAG</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
