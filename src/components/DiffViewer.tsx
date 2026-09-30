import React, { useState } from 'react';
import { X, Plus, RotateCcw, Columns, AlignLeft } from 'lucide-react';
import { computeLineDiff } from '../services/gitService';
import { GitCommit } from '../types/ide';

interface DiffViewerProps {
  filePath: string;
  currentContent: string;
  headCommit: GitCommit | null;
  onClose: () => void;
  onStageFile: (path: string) => void;
  onDiscardChanges: (path: string) => void;
  isStaged: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  currentContent,
  headCommit,
  onClose,
  onStageFile,
  onDiscardChanges,
  isStaged,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const originalContent = headCommit?.snapshot[filePath] || '';
  const diff = computeLineDiff(originalContent, currentContent);

  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-200 select-none">
      {/* Header */}
      <div className="h-10 px-4 bg-[#08090c] border-b border-[#222530] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#f4ecd8]/50">diff --git</span>
            <span className="text-[#0066ff] font-bold">{filePath}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-emerald-400">+{diff.additions}</span>
            <span className="text-[#ff2a3b]">-{diff.deletions}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-[#13151b] rounded p-0.5 border border-[#222530]">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                viewMode === 'unified'
                  ? 'bg-[#0066ff] text-white font-medium'
                  : 'text-[#f4ecd8]/60 hover:text-white'
              }`}
            >
              <AlignLeft size={12} />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-[#0066ff] text-white font-medium'
                  : 'text-[#f4ecd8]/60 hover:text-white'
              }`}
            >
              <Columns size={12} />
              <span>Side-by-Side</span>
            </button>
          </div>

          {!isStaged && (
            <button
              onClick={() => onStageFile(filePath)}
              className="px-2.5 py-1 rounded bg-[#0066ff] hover:bg-[#0055dd] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={12} />
              <span>Stage File</span>
            </button>
          )}

          <button
            onClick={() => onDiscardChanges(filePath)}
            className="p-1.5 rounded hover:bg-[#ff2a3b]/20 text-[#f4ecd8]/60 hover:text-[#ff2a3b] transition-colors"
            title="Discard changes"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#14161f] text-[#f4ecd8]/60 hover:text-white transition-colors"
            title="Close Diff"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Diff Content Viewport */}
      <div className="flex-1 overflow-auto font-mono text-xs bg-[#0d0f14]">
        {viewMode === 'unified' ? (
          <div className="min-w-full divide-y divide-transparent">
            {diff.lines.map((line, idx) => {
              let bg = '';
              let textColor = 'text-white';
              let sign = ' ';

              if (line.type === 'added') {
                bg = 'bg-emerald-950/40 hover:bg-emerald-950/50 border-l-2 border-emerald-500';
                textColor = 'text-emerald-300 font-medium';
                sign = '+';
              } else if (line.type === 'deleted') {
                bg = 'bg-[#ff2a3b]/15 hover:bg-[#ff2a3b]/25 border-l-2 border-[#ff2a3b]';
                textColor = 'text-[#ff2a3b] line-through opacity-80';
                sign = '-';
              }

              return (
                <div
                  key={idx}
                  className={`flex items-baseline py-0.5 px-2 select-text ${bg}`}
                >
                  <span className="w-9 text-right text-[#4b5266] pr-2 select-none shrink-0 text-[11px]">
                    {line.oldLineNumber || ''}
                  </span>
                  <span className="w-9 text-right text-[#4b5266] pr-3 select-none shrink-0 text-[11px]">
                    {line.newLineNumber || ''}
                  </span>
                  <span
                    className={`w-4 text-center select-none font-bold shrink-0 ${
                      line.type === 'added'
                        ? 'text-emerald-400'
                        : line.type === 'deleted'
                        ? 'text-[#ff2a3b]'
                        : 'text-zinc-700'
                    }`}
                  >
                    {sign}
                  </span>
                  <span className={`whitespace-pre flex-1 ${textColor}`}>{line.text}</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Split View */
          <div className="grid grid-cols-2 divide-x divide-[#222530] min-h-full">
            {/* Left: Original */}
            <div className="overflow-x-auto py-1 bg-[#0a0c10]">
              <div className="text-[10px] text-[#f4ecd8]/60 uppercase px-3 pb-1 border-b border-[#222530] font-bold">
                HEAD (Base Revision)
              </div>
              {originalContent.split('\n').map((lineText, idx) => (
                <div key={idx} className="flex items-baseline py-0.5 px-2 select-text hover:bg-white/[0.02]">
                  <span className="w-8 text-right text-[#4b5266] pr-2 select-none shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre text-[#f4ecd8]/70">{lineText}</span>
                </div>
              ))}
            </div>

            {/* Right: Working Copy */}
            <div className="overflow-x-auto py-1 bg-[#0d0f14]">
              <div className="text-[10px] text-[#f4ecd8]/60 uppercase px-3 pb-1 border-b border-[#222530] font-bold">
                Working Copy (Modified)
              </div>
              {currentContent.split('\n').map((lineText, idx) => (
                <div key={idx} className="flex items-baseline py-0.5 px-2 select-text hover:bg-white/[0.02]">
                  <span className="w-8 text-right text-[#4b5266] pr-2 select-none shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="whitespace-pre text-white">{lineText}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
