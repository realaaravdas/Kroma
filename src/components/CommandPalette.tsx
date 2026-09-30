import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileCode,
  Play,
  Terminal,
  Download,
  Sparkles,
  Boxes,
} from 'lucide-react';
import { FileItem, CondaEnvironment } from '../types/ide';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  onRunCode: () => void;
  onToggleTerminal: () => void;
  onFormatDocument: () => void;
  onExportZip: () => void;
  condaEnvs: CondaEnvironment[];
  onSelectCondaEnv: (envName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onRunCode,
  onToggleTerminal,
  onFormatDocument,
  onExportZip,
  condaEnvs,
  onSelectCondaEnv,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const nonFolderFiles = files.filter((f) => !f.isFolder);

  const staticActions = [
    {
      id: 'cmd-run',
      title: 'Run: Compile and execute current file in Linux terminal',
      category: 'Command',
      icon: <Play size={13} className="text-[#0066ff]" />,
      action: onRunCode,
    },
    {
      id: 'cmd-terminal',
      title: 'View: Toggle Linux bash terminal',
      category: 'Command',
      icon: <Terminal size={13} className="text-[#0066ff]" />,
      action: onToggleTerminal,
    },
    {
      id: 'cmd-format',
      title: 'Editor: Format Document',
      category: 'Command',
      icon: <Sparkles size={13} className="text-[#f4ecd8]" />,
      action: onFormatDocument,
    },
    {
      id: 'cmd-export',
      title: 'Workspace: Download Project as ZIP archive',
      category: 'Command',
      icon: <Download size={13} className="text-[#ff7300]" />,
      action: onExportZip,
    },
    ...condaEnvs.map((env) => ({
      id: `conda-${env.name}`,
      title: `Anaconda: Activate environment (${env.name}) - Python ${env.pythonVersion}`,
      category: 'Conda',
      icon: <Boxes size={13} className="text-[#ff7300]" />,
      action: () => onSelectCondaEnv(env.name),
    })),
  ];

  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim();

    const matchedFiles = nonFolderFiles
      .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
      .map((f) => ({
        id: f.id,
        title: f.path,
        category: 'File',
        icon: <FileCode size={13} className="text-[#f4ecd8]/60" />,
        action: () => onSelectFile(f),
      }));

    const matchedActions = staticActions.filter((a) =>
      a.title.toLowerCase().includes(q)
    );

    return [...matchedFiles, ...matchedActions];
  }, [query, nonFolderFiles, staticActions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 z-50 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#000000] border border-[#222530] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input Bar */}
        <div className="h-12 px-3 border-b border-[#222530] flex items-center gap-2.5 bg-[#08090c]">
          <Search size={16} className="text-[#0066ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or file name to jump to..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder:text-[#f4ecd8]/40 outline-none font-sans"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#161822] text-[#f4ecd8]/70 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 bg-[#0b0c10]">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-[#f4ecd8]/40 text-xs italic">
              No matching files or commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#0066ff] text-white font-medium'
                      : 'text-zinc-200 hover:bg-[#14161f]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.icon}
                    <span className="font-mono truncate">{item.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-[#0055dd] text-white' : 'bg-[#181a24] text-[#f4ecd8]/60'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
