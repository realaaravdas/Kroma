import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  StopCircle
} from 'lucide-react';
import { TerminalLine, FileItem, ExecutionResult, Diagnostic } from '../types/ide';

interface TerminalProps {
  lines: TerminalLine[];
  onExecuteCommand: (command: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
  activeEnv: string;
  files: FileItem[];
  latestExecution: ExecutionResult | null;
  diagnostics: Diagnostic[];
  activeFile: FileItem | null;
  isRunningProgram?: boolean;
  onStopProgram?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  onExecuteCommand,
  onClear,
  isOpen,
  onClose,
  activeEnv,
  files,
  latestExecution,
  diagnostics,
  activeFile,
  isRunningProgram = false,
  onStopProgram,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems'>('terminal');
  const [inputVal, setInputVal] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'python main.py',
    'git status',
    'ls -la',
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal output whenever lines change
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, isRunningProgram]);

  // Focus input when clicking anywhere in terminal
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // History UP
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
      return;
    }

    // History DOWN
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
      return;
    }

    // Tab autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim();
      if (!current) return;

      const words = current.split(' ');
      const lastWord = words[words.length - 1];

      // Match files
      const matchedFile = files.find(
        (f) => !f.isFolder && f.name.toLowerCase().startsWith(lastWord.toLowerCase())
      );

      if (matchedFile) {
        words[words.length - 1] = matchedFile.name;
        setInputVal(words.join(' ') + ' ');
      } else {
        // Match standard commands
        const cmds = [
          'python', 'rustc', 'cargo', 'go', 'javac', 'java', 'conda', 'git',
          'status', 'commit', 'diff', 'branch', 'activate', 'install', 'clear', 'help',
          'ls', 'cat', 'pwd', 'whoami', 'uname', 'mkdir', 'rm', 'grep'
        ];
        const matchedCmd = cmds.find((c) => c.startsWith(lastWord.toLowerCase()));
        if (matchedCmd) {
          words[words.length - 1] = matchedCmd;
          setInputVal(words.join(' ') + ' ');
        }
      }
      return;
    }

    // Enter: execute
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputVal.trim();
      if (cmd) {
        setCommandHistory((prev) => [...prev, cmd]);
        setHistoryIndex(-1);
        onExecuteCommand(cmd);
      } else {
        onExecuteCommand('');
      }
      setInputVal('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleContainerClick}
      className={`border-t border-[#222530] bg-[#000000] flex flex-col transition-all z-20 font-code select-none ${
        isMaximized ? 'h-[80vh]' : 'h-72'
      }`}
    >
      {/* Terminal Title & Tabs Header */}
      <div className="h-9 px-3 bg-[#08090c] border-b border-[#222530] flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-1.5">
          {/* Linux Shell Tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors font-medium ${
              activeTab === 'terminal'
                ? 'bg-[#14161f] text-white border border-[#2a2e3d]'
                : 'text-[#f4ecd8]/60 hover:text-white'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,0.7)]" />
            <span className="text-white font-semibold">Linux Bash</span>
            <span className="text-[10px] text-[#f4ecd8]/70 font-mono">({activeEnv})</span>
          </button>

          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors font-medium ${
              activeTab === 'problems'
                ? 'bg-[#14161f] text-white border border-[#2a2e3d]'
                : 'text-[#f4ecd8]/60 hover:text-white'
            }`}
          >
            <AlertTriangle
              size={12}
              className={diagnostics.length > 0 ? 'text-[#ff7300]' : 'text-zinc-500'}
            />
            <span>Problems</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                diagnostics.length > 0
                  ? 'bg-[#ff2a3b]/20 text-[#ff2a3b] font-bold'
                  : 'text-zinc-500'
              }`}
            >
              {diagnostics.length}
            </span>
          </button>

          {isRunningProgram && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0066ff]/20 border border-[#0066ff]/40 text-[#0066ff] text-[11px] font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#0066ff]" />
              <span>Program Running...</span>
              {onStopProgram && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStopProgram();
                  }}
                  className="hover:text-[#ff2a3b] ml-1"
                  title="Stop Process"
                >
                  <StopCircle size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Tools (Clear, Maximize, Close) */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1 rounded hover:bg-[#161822] text-[#f4ecd8]/60 hover:text-white transition-colors"
            title="Clear Terminal Output (Ctrl + L)"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMaximized(!isMaximized);
            }}
            className="p-1 rounded hover:bg-[#161822] text-[#f4ecd8]/60 hover:text-white transition-colors"
            title={isMaximized ? 'Restore Terminal' : 'Maximize Terminal'}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded hover:bg-[#161822] text-[#f4ecd8]/60 hover:text-white transition-colors"
            title="Close Terminal Drawer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs bg-[#000000]">
        {activeTab === 'terminal' && (
          <div className="space-y-1">
            {lines.map((l) => {
              let color = 'text-[#ffffff]';
              if (l.type === 'stdout') color = 'text-[#f4ecd8]';
              else if (l.type === 'stderr') color = 'text-[#ff2a3b] font-mono font-medium';
              else if (l.type === 'info') color = 'text-[#0066ff] font-medium';
              else if (l.type === 'success') color = 'text-emerald-400 font-medium';
              else if (l.type === 'system') color = 'text-[#ff7300]';

              if (l.type === 'input') {
                return (
                  <div key={l.id} className="flex items-baseline gap-1.5 py-0.5 select-text">
                    <span className="text-[#0066ff] font-mono text-[11px] font-bold shrink-0">
                      user@cloud-linux
                    </span>
                    <span className="text-[#f4ecd8]/50 text-[11px]">:</span>
                    <span className="text-[#ff7300] font-mono text-[11px] font-medium shrink-0">
                      ~/workspace
                    </span>
                    <span className="text-[#ffffff] font-bold text-[11px] shrink-0">$</span>
                    <span className="text-white font-bold ml-1">{l.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={l.id}
                  className={`whitespace-pre-wrap select-text leading-relaxed ${color}`}
                >
                  {l.text}
                </div>
              );
            })}

            {/* Interactive Linux Prompt Line */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[#0066ff] font-mono text-[11px] font-bold shrink-0 select-none">
                user@cloud-linux
              </span>
              <span className="text-[#f4ecd8]/50 text-[11px] select-none">:</span>
              <span className="text-[#ff7300] font-mono text-[11px] font-medium shrink-0 select-none">
                ~/workspace
              </span>
              <span className="text-[#ffffff] font-bold text-[11px] shrink-0 select-none">$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="flex-1 bg-transparent text-[#ffffff] text-xs outline-none border-none p-0 m-0 font-code caret-[#0066ff] selection:bg-[#0066ff]/40"
              />
            </div>
            <div ref={terminalEndRef} />
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-2">
            {diagnostics.length === 0 ? (
              <div className="p-8 text-center text-[#f4ecd8]/60 flex flex-col items-center gap-1">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>No problems detected in workspace files.</span>
              </div>
            ) : (
              <div className="divide-y divide-[#222530]">
                {diagnostics.map((diag, idx) => (
                  <div key={idx} className="py-2 flex items-start gap-2.5 text-xs">
                    {diag.severity === 'error' ? (
                      <XCircle size={14} className="text-[#ff2a3b] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={14} className="text-[#ff7300] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-mono">
                      <span className="text-white font-medium">{diag.message}</span>
                      <span className="text-[#f4ecd8]/50 ml-2">
                        [{activeFile?.name || 'file'}:{diag.line}:{diag.column}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
