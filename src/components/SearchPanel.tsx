import React, { useState } from 'react';
import { Search, Replace, FileCode } from 'lucide-react';
import { FileItem } from '../types/ide';

interface SearchPanelProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  onReplaceInFile: (fileId: string, newContent: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  files,
  onSelectFile,
  onReplaceInFile,
}) => {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];

    const matches: {
      file: FileItem;
      lines: { lineNum: number; text: string; matchStart: number }[];
    }[] = [];

    files.forEach((file) => {
      if (file.isFolder) return;

      const lines = file.content.split('\n');
      const matchedLines: { lineNum: number; text: string; matchStart: number }[] = [];

      lines.forEach((lineText, idx) => {
        let doesMatch = false;
        let start = -1;

        if (matchCase) {
          start = lineText.indexOf(query);
          doesMatch = start !== -1;
        } else {
          start = lineText.toLowerCase().indexOf(query.toLowerCase());
          doesMatch = start !== -1;
        }

        if (doesMatch) {
          matchedLines.push({
            lineNum: idx + 1,
            text: lineText,
            matchStart: start,
          });
        }
      });

      if (matchedLines.length > 0) {
        matches.push({ file, lines: matchedLines });
      }
    });

    return matches;
  }, [files, query, matchCase]);

  const handleReplaceAllInFile = (file: FileItem) => {
    if (!query) return;
    const regex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      matchCase ? 'g' : 'gi'
    );
    const newContent = file.content.replace(regex, replaceQuery);
    onReplaceInFile(file.id, newContent);
  };

  const totalMatches = results.reduce((acc, curr) => acc + curr.lines.length, 0);

  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-300 text-xs select-none">
      <div className="h-9 px-3 border-b border-[#222530] flex items-center justify-between font-semibold uppercase tracking-wider text-[#f4ecd8]">
        <span className="text-[11px] font-bold">Search</span>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded hover:bg-[#14161f] transition-colors ${
            showReplace ? 'text-[#0066ff]' : 'text-[#f4ecd8]/60'
          }`}
          title="Toggle Replace"
        >
          <Replace size={13} />
        </button>
      </div>

      <div className="p-3 border-b border-[#222530] space-y-2 bg-[#08090c]">
        {/* Search input */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search across files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-2.5 pr-8 py-1.5 bg-[#13151b] border border-[#262934] rounded text-white text-xs outline-none focus:border-[#0066ff] font-mono"
          />
          <button
            onClick={() => setMatchCase(!matchCase)}
            className={`absolute right-2 px-1 py-0.5 rounded text-[10px] font-mono ${
              matchCase ? 'bg-[#0066ff] text-white font-bold' : 'text-[#f4ecd8]/50 hover:text-white'
            }`}
            title="Match Case"
          >
            Aa
          </button>
        </div>

        {/* Replace input */}
        {showReplace && (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Replace with"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-[#13151b] border border-[#262934] rounded text-white text-xs outline-none focus:border-[#0066ff] font-mono"
            />
          </div>
        )}

        <div className="text-[11px] text-[#f4ecd8]/60">
          {query.trim() ? (
            <span>
              {totalMatches} result{totalMatches !== 1 ? 's' : ''} in {results.length} file
              {results.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>Type keyword to search workspace</span>
          )}
        </div>
      </div>

      {/* Results Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#000000]">
        {results.map(({ file, lines }) => (
          <div key={file.id} className="rounded-lg bg-[#0d0f14] border border-[#222530] overflow-hidden">
            <div
              className="flex items-center justify-between px-2.5 py-1.5 bg-[#13151b] cursor-pointer hover:bg-[#1a1c26]"
              onClick={() => onSelectFile(file)}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileCode size={13} className="text-[#0066ff] shrink-0" />
                <span className="font-mono text-white font-medium truncate">{file.name}</span>
                <span className="text-[#f4ecd8]/50 font-mono text-[10px]">({lines.length})</span>
              </div>
              {showReplace && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplaceAllInFile(file);
                  }}
                  className="text-[10px] text-[#0066ff] hover:text-[#00aaff] px-1 py-0.5"
                  title="Replace all in this file"
                >
                  Replace All
                </button>
              )}
            </div>

            <div className="divide-y divide-[#181a24]">
              {lines.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectFile(file)}
                  className="px-2.5 py-1 text-[11px] font-mono flex items-baseline gap-2 hover:bg-[#14161f] cursor-pointer text-zinc-300 hover:text-white"
                >
                  <span className="text-[#4b5266] shrink-0 select-none text-[10px]">
                    {item.lineNum}:
                  </span>
                  <span className="truncate">{item.text.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
