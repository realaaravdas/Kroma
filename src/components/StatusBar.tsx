import React from 'react';
import {
  GitBranch,
  Boxes,
  Terminal,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { SupportedLanguage } from '../types/ide';

interface StatusBarProps {
  currentBranch: string;
  gitModifiedCount: number;
  condaEnv: string;
  language: SupportedLanguage;
  cursorLine: number;
  cursorCol: number;
  tabSize: number;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenGit: () => void;
  onOpenConda: () => void;
  problemsCount: number;
  isRunning: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentBranch,
  gitModifiedCount,
  condaEnv,
  language,
  cursorLine,
  cursorCol,
  tabSize,
  terminalOpen,
  onToggleTerminal,
  onOpenGit,
  onOpenConda,
  problemsCount,
  isRunning,
}) => {
  const getLanguageLabel = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'python':
        return 'Python 3.11';
      case 'rust':
        return 'Rust (rustc 1.78)';
      case 'go':
        return 'Go 1.22';
      case 'java':
        return 'Java (OpenJDK 21)';
      case 'yaml':
        return 'YAML';
      case 'json':
        return 'JSON';
      case 'markdown':
        return 'Markdown';
      case 'bash':
        return 'Bash';
      default:
        return 'Plain Text';
    }
  };

  return (
    <footer className="h-6 bg-[#000000] border-t border-[#222530] flex items-center justify-between px-3 text-[11px] text-[#f4ecd8]/70 select-none z-20 font-mono">
      {/* Left Info Group */}
      <div className="flex items-center gap-3">
        {/* Git Branch & Status */}
        <button
          onClick={onOpenGit}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
          title={`Git Branch: ${currentBranch} (${gitModifiedCount} uncommitted changes)`}
        >
          <GitBranch size={11} className="text-[#0066ff]" />
          <span className="text-white font-medium">{currentBranch}</span>
          {gitModifiedCount > 0 && (
            <span className="text-[10px] text-[#ff7300] font-bold">*{gitModifiedCount}</span>
          )}
        </button>

        {/* Conda Environment */}
        <button
          onClick={onOpenConda}
          className="flex items-center gap-1 hover:text-white transition-colors text-[#f4ecd8]"
          title="Active Conda Environment"
        >
          <Boxes size={11} className="text-[#ff7300]" />
          <span>conda: {condaEnv}</span>
        </button>

        {/* Language Runtime */}
        <div className="hidden sm:flex items-center gap-1 text-[#f4ecd8]/60">
          <Code2 size={11} className="text-[#0066ff]" />
          <span className="text-white">{getLanguageLabel(language)}</span>
        </div>

        {isRunning && (
          <div className="flex items-center gap-1 text-[#0066ff] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
            <span>Compiling in Linux...</span>
          </div>
        )}
      </div>

      {/* Right Info Group */}
      <div className="flex items-center gap-3">
        {/* Problems count */}
        <div
          className={`flex items-center gap-1 ${
            problemsCount > 0 ? 'text-[#ff2a3b] font-bold' : 'text-[#f4ecd8]/50'
          }`}
        >
          <AlertTriangle size={11} />
          <span>{problemsCount}</span>
        </div>

        {/* Line & Col */}
        <span className="hidden sm:inline text-white">
          Ln {cursorLine}, Col {cursorCol}
        </span>

        {/* Indent */}
        <span className="hidden md:inline text-[#f4ecd8]/50">
          Spaces: {tabSize}
        </span>

        {/* Encoding */}
        <span className="hidden md:inline text-[#f4ecd8]/50">
          UTF-8
        </span>

        {/* Terminal Toggle Button */}
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            terminalOpen ? 'text-white bg-[#14161f] border border-[#222530]' : 'hover:text-white'
          }`}
          title="Toggle Linux Terminal Drawer (Ctrl + `)"
        >
          <Terminal size={11} className="text-[#0066ff]" />
          <span className="hidden lg:inline text-[10px]">bash</span>
        </button>
      </div>
    </footer>
  );
};
