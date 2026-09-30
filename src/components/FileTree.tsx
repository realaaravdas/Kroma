import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  Upload,
  ChevronRight,
  ChevronDown,
  Terminal,
  File,
  Github,
  FolderArchive
} from 'lucide-react';
import { FileItem, SupportedLanguage } from '../types/ide';
import { detectLanguageByFilename } from '../services/syntaxHighlighter';

interface FileTreeProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  onCreateFile: (name: string, isFolder: boolean, parentId: string | null) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  modifiedFiles: Set<string>;
  untrackedFiles: Set<string>;
  onOpenUploadRepo?: () => void;
  onOpenGitHubModal?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  modifiedFiles,
  untrackedFiles,
  onOpenUploadRepo,
  onOpenGitHubModal,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['f-root', 'f-src', 'f-rust', 'f-go', 'f-java'])
  );
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [targetParentId, setTargetParentId] = useState<string | null>('f-root');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startCreate = (type: 'file' | 'folder', parentId: string | null = 'f-root') => {
    setCreatingType(type);
    setTargetParentId(parentId);
    setNewItemName('');
  };

  const handleFinishCreate = () => {
    if (newItemName.trim() && creatingType) {
      onCreateFile(newItemName.trim(), creatingType === 'folder', targetParentId);
    }
    setCreatingType(null);
    setNewItemName('');
  };

  const handleFinishRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameFile(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((uploadedFile) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        onCreateFile(uploadedFile.name, false, targetParentId);
      };
      reader.readAsText(uploadedFile);
    });
    e.target.value = '';
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isFolder) {
      return expandedFolders.has(file.id) ? (
        <FolderOpen size={14} className="text-[#ff7300] shrink-0" />
      ) : (
        <Folder size={14} className="text-[#ff7300] shrink-0" />
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <span className="text-[#0066ff] text-xs font-mono font-bold shrink-0">py</span>;
      case 'rs':
        return <span className="text-[#ff7300] text-xs font-mono font-bold shrink-0">rs</span>;
      case 'go':
        return <span className="text-cyan-400 text-xs font-mono font-bold shrink-0">go</span>;
      case 'java':
        return <span className="text-[#ff2a3b] text-xs font-mono font-bold shrink-0">jv</span>;
      case 'yml':
      case 'yaml':
        return <span className="text-[#f4ecd8] text-xs font-mono font-bold shrink-0">ym</span>;
      case 'json':
        return <span className="text-amber-300 text-xs font-mono shrink-0">{}</span>;
      case 'md':
        return <span className="text-emerald-400 text-xs font-mono shrink-0">md</span>;
      default:
        return <FileCode size={13} className="text-[#f4ecd8]/60 shrink-0" />;
    }
  };

  const renderFileNode = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isActive = activeFileId === item.id;
    const isModified = modifiedFiles.has(item.path);
    const isUntracked = untrackedFiles.has(item.path);
    const children = files.filter((f) => f.parentId === item.id);

    return (
      <div key={item.id} className="w-full">
        <div
          onClick={() => {
            if (item.isFolder) {
              toggleFolder(item.id);
            } else {
              onSelectFile(item);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between pr-2 py-1 cursor-pointer text-xs transition-colors rounded-sm select-none ${
            isActive
              ? 'bg-[#14161f] text-white font-medium border-l-2 border-[#0066ff]'
              : 'text-[#f4ecd8]/70 hover:text-white hover:bg-[#0d0f14]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {item.isFolder && (
              <span className="text-[#f4ecd8]/50">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            )}
            {getFileIcon(item)}

            {renamingId === item.id ? (
              <input
                type="text"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleFinishRename(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename(item.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#000000] border border-[#0066ff] rounded px-1 py-0 text-white text-xs outline-none w-28 font-mono"
              />
            ) : (
              <span className="truncate text-zinc-200 group-hover:text-white font-mono text-[11px]">
                {item.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreate('file', item.id);
                  }}
                  className="p-0.5 hover:text-white text-[#f4ecd8]/60"
                  title="New File in folder"
                >
                  <FilePlus size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreate('folder', item.id);
                  }}
                  className="p-0.5 hover:text-white text-[#f4ecd8]/60"
                  title="New Subfolder"
                >
                  <FolderPlus size={12} />
                </button>
              </>
            )}

            {item.id !== 'f-root' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(item.id);
                    setRenameValue(item.name);
                  }}
                  className="p-0.5 hover:text-white text-[#f4ecd8]/60"
                  title="Rename"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(item.id);
                  }}
                  className="p-0.5 hover:text-[#ff2a3b] text-[#f4ecd8]/60"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </>
            )}

            {/* Git change status */}
            {isModified && (
              <span className="text-[10px] text-[#ff7300] font-mono font-bold ml-1">M</span>
            )}
            {isUntracked && (
              <span className="text-[10px] text-[#0066ff] font-mono font-bold ml-1">U</span>
            )}
          </div>
        </div>

        {/* Render child elements if folder is expanded */}
        {item.isFolder && isExpanded && (
          <div>
            {creatingType && targetParentId === item.id && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
                className="py-1 flex items-center gap-1.5"
              >
                {creatingType === 'folder' ? (
                  <Folder size={14} className="text-[#ff7300] shrink-0" />
                ) : (
                  <FileCode size={13} className="text-[#0066ff] shrink-0" />
                )}
                <input
                  type="text"
                  value={newItemName}
                  placeholder={creatingType === 'folder' ? 'folder_name' : 'filename.ext'}
                  autoFocus
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={handleFinishCreate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishCreate();
                    if (e.key === 'Escape') setCreatingType(null);
                  }}
                  className="bg-[#000000] border border-[#0066ff] rounded px-1.5 py-0.5 text-white text-xs outline-none w-36 font-mono"
                />
              </div>
            )}

            {children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootItems = files.filter((f) => f.parentId === null);

  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-300 select-none">
      {/* Explorer Top Toolbar */}
      <div className="h-9 px-3 border-b border-[#222530] flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#f4ecd8]">
        <span className="text-[11px] font-bold">Explorer</span>
        <div className="flex items-center gap-1">
          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="p-1 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors"
              title="Clone or Sync with GitHub"
            >
              <Github size={13} />
            </button>
          )}
          {onOpenUploadRepo && (
            <button
              onClick={onOpenUploadRepo}
              className="p-1 rounded hover:bg-[#14161f] text-[#ff7300] hover:text-white transition-colors"
              title="Upload Local Git Repo (.zip)"
            >
              <FolderArchive size={13} />
            </button>
          )}
          <button
            onClick={() => startCreate('file', 'f-root')}
            className="p-1 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors"
            title="New File in workspace"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={() => startCreate('folder', 'f-root')}
            className="p-1 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors"
            title="New Folder in workspace"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {rootItems.map((item) => renderFileNode(item, 0))}
      </div>
    </div>
  );
};
