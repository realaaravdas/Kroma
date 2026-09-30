import React, { useRef, useState, useMemo } from 'react';
import {
  X,
  FileCode,
  Search,
  Replace,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';
import { FileItem, IdeSettings, Diagnostic } from '../types/ide';
import { highlightLine } from '../services/syntaxHighlighter';

interface CodeEditorProps {
  openFiles: FileItem[];
  activeFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onCloseFile: (fileId: string) => void;
  onUpdateContent: (content: string) => void;
  settings: IdeSettings;
  onFormatDocument: () => void;
  diagnostics: Diagnostic[];
  onCursorChange: (line: number, col: number) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  openFiles,
  activeFile,
  onSelectFile,
  onCloseFile,
  onUpdateContent,
  settings,
  onFormatDocument,
  diagnostics,
  onCursorChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // In-editor Find & Replace
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);

  // Sync scrolling between textarea, highlighted pre, and line numbers
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;

    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = top;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current || !activeFile) return;
    const pos = textareaRef.current.selectionStart || 0;
    const textUpToCursor = activeFile.content.slice(0, pos);
    const lines = textUpToCursor.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;

    setCursorLine(line);
    setCursorCol(col);
    onCursorChange(line, col);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Quick Find: Ctrl/Cmd + F
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      setShowFind((prev) => !prev);
      return;
    }

    // Format Document: Shift + Option/Alt + F or Ctrl/Cmd + Shift + I
    if (
      ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'F' || e.key === 'f')) ||
      (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F'))
    ) {
      e.preventDefault();
      onFormatDocument();
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 1500);
      return;
    }

    // Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!textareaRef.current || !activeFile) return;

      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const spaces = ' '.repeat(settings.tabSize || 4);

      const newContent =
        activeFile.content.substring(0, start) +
        spaces +
        activeFile.content.substring(end);

      onUpdateContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + spaces.length;
          textareaRef.current.selectionEnd = start + spaces.length;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    // Auto-close brackets: (, {, [, ", ', `
    const bracketPairs: Record<string, string> = {
      '(': ')',
      '{': '}',
      '[': ']',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (bracketPairs[e.key]) {
      const openChar = e.key;
      const closeChar = bracketPairs[openChar];
      if (!textareaRef.current || !activeFile) return;

      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;

      e.preventDefault();
      const selection = activeFile.content.substring(start, end);
      const newContent =
        activeFile.content.substring(0, start) +
        openChar +
        selection +
        closeChar +
        activeFile.content.substring(end);

      onUpdateContent(newContent);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 1;
          textareaRef.current.selectionEnd = end + 1;
          updateCursorPosition();
        }
      }, 0);
      return;
    }
  };

  const handleFindReplace = (replaceAll: boolean = false) => {
    if (!findText || !activeFile) return;
    const regex = new RegExp(
      findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      matchCase ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i')
    );

    const newContent = activeFile.content.replace(regex, replaceText);
    onUpdateContent(newContent);
  };

  const contentLines = useMemo(() => {
    return activeFile ? activeFile.content.split('\n') : [];
  }, [activeFile?.content]);

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0d0f14] text-[#f4ecd8]/60 select-none">
        <div className="w-12 h-12 rounded-xl bg-[#14161f] border border-[#222530] flex items-center justify-center mb-3 text-white">
          <FileCode size={24} className="text-[#0066ff]" />
        </div>
        <h3 className="text-white font-semibold text-sm mb-1">No Active File</h3>
        <p className="text-xs text-[#f4ecd8]/60 max-w-xs text-center mb-4">
          Select a file from the explorer or press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-[#1c1f2b] text-white font-mono text-[10px]">
            ⌘P
          </kbd>{' '}
          to quick open.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0f14] overflow-hidden select-none">
      {/* Tab Bar */}
      <div className="h-9 bg-[#000000] border-b border-[#222530] flex items-center overflow-x-auto no-scrollbar select-none px-1">
        {openFiles.map((file) => {
          const isActive = activeFile.id === file.id;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file)}
              className={`h-full group flex items-center gap-2 px-3 border-r border-[#222530] cursor-pointer text-xs transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#0d0f14] text-white font-semibold border-t-2 border-t-[#0066ff]'
                  : 'bg-[#000000] text-[#f4ecd8]/60 hover:text-white hover:bg-[#08090c]'
              }`}
            >
              <span className="font-mono text-xs">{file.name}</span>
              {file.isModified ? (
                <span className="w-2 h-2 rounded-full bg-[#ff7300] group-hover:hidden" />
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.id);
                }}
                className={`p-0.5 rounded hover:bg-[#222530] text-[#f4ecd8]/40 hover:text-white ${
                  file.isModified ? 'hidden group-hover:block' : ''
                }`}
                title="Close Tab"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Breadcrumb Path & In-Editor Toolbar */}
      <div className="h-7 px-3 bg-[#0a0c10] border-b border-[#1c1f2b] flex items-center justify-between text-[11px] text-[#f4ecd8]/50">
        <div className="flex items-center gap-1.5 truncate font-mono">
          <span className="text-[#0066ff]">workspace</span>
          <ChevronRight size={10} className="text-[#f4ecd8]/30" />
          {activeFile.path.split('/').map((seg, idx, arr) => (
            <React.Fragment key={idx}>
              <span className={idx === arr.length - 1 ? 'text-white font-semibold' : 'text-[#f4ecd8]/50'}>
                {seg}
              </span>
              {idx < arr.length - 1 && <ChevronRight size={10} className="text-[#f4ecd8]/30" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Format Document Button */}
          <button
            onClick={() => {
              onFormatDocument();
              setFormatSuccess(true);
              setTimeout(() => setFormatSuccess(false), 1500);
            }}
            className="flex items-center gap-1 text-[#f4ecd8]/70 hover:text-white transition-colors"
            title="Format Code (Shift + Option + F)"
          >
            {formatSuccess ? (
              <Check size={11} className="text-emerald-400" />
            ) : (
              <Sparkles size={11} className="text-[#0066ff]" />
            )}
            <span className="hidden sm:inline">Format</span>
          </button>

          {/* Find & Replace toggle */}
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1 rounded transition-colors ${
              showFind ? 'text-[#0066ff]' : 'text-[#f4ecd8]/50 hover:text-white'
            }`}
            title="Find & Replace (Cmd/Ctrl + F)"
          >
            <Search size={12} />
          </button>
        </div>
      </div>

      {/* Find & Replace Floating Toolbar */}
      {showFind && (
        <div className="px-3 py-1.5 bg-[#14161f] border-b border-[#222530] flex items-center gap-2 text-xs z-10">
          <input
            type="text"
            placeholder="Find in file"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="px-2 py-0.5 bg-[#000000] border border-[#222530] rounded text-white text-xs outline-none focus:border-[#0066ff] w-44 font-mono"
          />
          <input
            type="text"
            placeholder="Replace with"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="px-2 py-0.5 bg-[#000000] border border-[#222530] rounded text-white text-xs outline-none focus:border-[#0066ff] w-44 font-mono"
          />
          <button
            onClick={() => handleFindReplace(false)}
            className="px-2 py-0.5 rounded bg-[#1c1f2b] hover:bg-[#282c3d] text-white"
          >
            Replace
          </button>
          <button
            onClick={() => handleFindReplace(true)}
            className="px-2 py-0.5 rounded bg-[#0066ff] hover:bg-[#0055dd] text-white font-medium"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFind(false)}
            className="p-1 text-[#f4ecd8]/50 hover:text-white ml-auto"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editor Main Canvas with Synchronized Line Numbers and Viewport */}
      <div className="flex-1 relative flex overflow-hidden font-code bg-[#0d0f14]">
        {/* Line Numbers Gutter */}
        {settings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-12 bg-[#0a0c10] border-r border-[#1c1f2b] py-3 select-none overflow-hidden text-right pr-3 text-xs leading-[1.625rem] text-[#4b5266] shrink-0"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            {contentLines.map((_, idx) => {
              const lineNum = idx + 1;
              const isActive = lineNum === cursorLine;
              const hasDiag = diagnostics.some((d) => d.line === lineNum);

              return (
                <div key={idx} className="relative flex items-center justify-end">
                  {hasDiag && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a3b] absolute left-1" />
                  )}
                  <span
                    className={
                      isActive
                        ? 'text-white font-bold'
                        : 'text-[#4b5266] hover:text-[#f4ecd8]'
                    }
                  >
                    {lineNum}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax Highlighted Background Rendering */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-3 m-0 overflow-hidden pointer-events-none leading-[1.625rem] whitespace-pre select-none"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
            }}
          >
            {contentLines.map((lineText, lineIdx) => {
              const tokens = highlightLine(lineText, activeFile.language);
              const isCurrentLine = lineIdx + 1 === cursorLine;

              return (
                <div
                  key={lineIdx}
                  className={`${isCurrentLine ? 'bg-white/[0.04] rounded-sm' : ''}`}
                >
                  {tokens.length === 0 ? (
                    <span> </span>
                  ) : (
                    tokens.map((token, tIdx) => {
                      let color = 'text-white';
                      if (token.type === 'keyword') color = 'text-[#ff4060] font-medium'; // crisp red/coral
                      else if (token.type === 'type') color = 'text-[#f4ecd8] font-medium'; // warm cream
                      else if (token.type === 'string') color = 'text-[#a6e22e]'; // vibrant green
                      else if (token.type === 'number') color = 'text-[#ff7300]'; // vibrant orange
                      else if (token.type === 'comment') color = 'text-[#6c7285] italic'; // muted grey
                      else if (token.type === 'function') color = 'text-[#00aaff] font-medium'; // bright blue
                      else if (token.type === 'decorator') color = 'text-[#e06c75]';
                      else if (token.type === 'operator') color = 'text-[#00d0ff]';
                      else if (token.type === 'punctuation') color = 'text-[#f4ecd8]/60';

                      return (
                        <span key={tIdx} className={color}>
                          {token.text}
                        </span>
                      );
                    })
                  )}
                </div>
              );
            })}
          </pre>

          {/* Interactive Textarea on Top */}
          <textarea
            ref={textareaRef}
            value={activeFile.content}
            onChange={(e) => onUpdateContent(e.target.value)}
            onScroll={handleScroll}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full p-3 m-0 bg-transparent text-transparent caret-white selection:bg-[#0066ff]/35 resize-none outline-none leading-[1.625rem] whitespace-pre overflow-auto font-code"
            style={{
              fontSize: `${settings.fontSize}px`,
              tabSize: settings.tabSize,
            }}
          />
        </div>
      </div>
    </div>
  );
};
