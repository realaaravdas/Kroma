import React from 'react';
import {
  Play,
  Save,
  Terminal as TerminalIcon,
  GitBranch,
  Download,
  Upload,
  Command,
  Columns,
  Sparkles,
  RefreshCw,
  Github,
  FolderArchive
} from 'lucide-react';
import { FileItem, CondaEnvironment, SupportedLanguage } from '../types/ide';

interface HeaderProps {
  activeFile: FileItem | null;
  onRunCode: () => void;
  onSaveFile: () => void;
  isSaving: boolean;
  isRunning: boolean;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  currentBranch: string;
  condaEnv: string;
  onOpenCommandPalette: () => void;
  onExportZip: () => void;
  onOpenUploadRepo: () => void;
  onOpenGitHubModal: () => void;
  onResetWorkspace: () => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  connectedGitHubRepo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeFile,
  onRunCode,
  onSaveFile,
  isSaving,
  isRunning,
  terminalOpen,
  onToggleTerminal,
  currentBranch,
  condaEnv,
  onOpenCommandPalette,
  onExportZip,
  onOpenUploadRepo,
  onOpenGitHubModal,
  onResetWorkspace,
  splitView,
  onToggleSplitView,
  connectedGitHubRepo,
}) => {
  return (
    <header className="h-11 bg-[#000000] border-b border-[#222530] flex items-center justify-between px-3 text-xs select-none z-20">
      {/* Left: Branding & Quick Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <div className="w-5 h-5 rounded bg-[#0066ff] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(0,102,255,0.5)]">
            K
          </div>
          <span className="font-bold text-white text-sm">Kroma</span>
          <span className="text-[10px] text-[#f4ecd8]/60 font-mono hidden sm:inline">IDE</span>
        </div>

        <div className="h-4 w-px bg-[#222530]" />

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d0f14] hover:bg-[#14161f] border border-[#222530] text-[#f4ecd8]/80 hover:text-white transition-colors text-[11px]"
          title="Command Palette (Cmd/Ctrl + P)"
        >
          <Command size={12} className="text-[#0066ff]" />
          <span className="hidden md:inline">Commands</span>
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-[#1c1f2b] text-[#f4ecd8]/70 font-mono">⌘P</kbd>
        </button>

        {/* GitHub Integration Button */}
        <button
          onClick={onOpenGitHubModal}
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors text-[11px] ${
            connectedGitHubRepo
              ? 'bg-[#14161f] border-[#0066ff]/60 text-white font-medium'
              : 'bg-[#0d0f14] border-[#222530] text-[#f4ecd8]/80 hover:text-white hover:bg-[#14161f]'
          }`}
          title="Connect or Clone GitHub Repository"
        >
          <Github size={12} className="text-white" />
          <span className="hidden lg:inline">
            {connectedGitHubRepo ? connectedGitHubRepo : 'GitHub'}
          </span>
        </button>

        {/* Upload Local Repo Button */}
        <button
          onClick={onOpenUploadRepo}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#0d0f14] hover:bg-[#14161f] border border-[#222530] text-[#f4ecd8]/80 hover:text-white transition-colors text-[11px]"
          title="Upload Local Git Repo (.zip)"
        >
          <FolderArchive size={12} className="text-[#ff7300]" />
          <span className="hidden lg:inline">Upload Repo</span>
        </button>
      </div>

      {/* Center: Active File Path */}
      <div className="hidden md:flex items-center gap-2 text-zinc-400">
        <span className="text-[#f4ecd8]/40 text-[11px] font-mono">workspace /</span>
        <span className="font-semibold text-white text-[11px] font-mono">{activeFile?.path || 'No file selected'}</span>
        {activeFile?.isModified && (
          <span className="w-2 h-2 rounded-full bg-[#ff7300]" title="Unsaved changes" />
        )}
      </div>

      {/* Right: Actions (Run, Save, Terminal, Split, Export) */}
      <div className="flex items-center gap-1.5">
        {/* RUN CODE BUTTON: Vibrant Blue */}
        <button
          onClick={onRunCode}
          disabled={isRunning || !activeFile || activeFile.isFolder}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0066ff] hover:bg-[#0055dd] text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          title="Run / Compile Program in Linux Terminal (Cmd/Ctrl + Enter)"
        >
          <Play size={12} className={isRunning ? 'animate-spin' : 'fill-white'} />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
          <span className="text-[10px] text-white/70 font-mono hidden sm:inline">⌘⏎</span>
        </button>

        {/* Save File Button */}
        <button
          onClick={onSaveFile}
          disabled={!activeFile?.isModified || isSaving}
          className="p-1.5 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          title="Save File (Cmd/Ctrl + S)"
        >
          <Save size={14} />
        </button>

        {/* Terminal Toggle Button */}
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            terminalOpen
              ? 'bg-[#14161f] text-white border-[#0066ff]/60'
              : 'bg-[#0d0f14] text-[#f4ecd8]/70 hover:text-white border-[#222530]'
          }`}
          title="Toggle Linux Terminal (Ctrl + `)"
        >
          <TerminalIcon size={12} className="text-[#0066ff]" />
          <span className="hidden sm:inline text-[11px]">Terminal</span>
        </button>

        {/* Export / Storage Download */}
        <button
          onClick={onExportZip}
          className="p-1.5 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors"
          title="Export Workspace as .zip (Local Storage)"
        >
          <Download size={14} className="text-[#0066ff]" />
        </button>

        {/* Reset Workspace */}
        <button
          onClick={onResetWorkspace}
          className="p-1.5 rounded hover:bg-[#14161f] text-[#f4ecd8]/50 hover:text-white transition-colors"
          title="Reset to Starter Projects"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  );
};
