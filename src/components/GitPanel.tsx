import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  Plus,
  Minus,
  Check,
  RefreshCw,
  Clock,
  Copy,
  ChevronDown,
  RotateCcw,
  Upload
} from 'lucide-react';
import { GitStatus, GitCommit } from '../types/ide';

interface GitPanelProps {
  gitStatus: GitStatus;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onCommit: (message: string) => void;
  onSwitchBranch: (branch: string) => void;
  onCreateBranch: (branchName: string) => void;
  onOpenDiff: (path: string) => void;
  onDiscardChanges: (path: string) => void;
  onSyncPushPull: () => void;
  isSyncing: boolean;
  onOpenGitHubModal?: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  gitStatus,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onUnstageAll,
  onCommit,
  onSwitchBranch,
  onCreateBranch,
  onOpenDiff,
  onDiscardChanges,
  onSyncPushPull,
  isSyncing,
  onOpenGitHubModal,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const handleCreateBranch = () => {
    if (newBranchInput.trim()) {
      onCreateBranch(newBranchInput.trim());
      setNewBranchInput('');
      setShowNewBranchModal(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-300 text-xs select-none">
      {/* Header & Branch Switcher */}
      <div className="h-9 px-3 border-b border-[#222530] flex items-center justify-between font-semibold uppercase tracking-wider text-[#f4ecd8]">
        <span className="text-[11px] font-bold">Source Control</span>
        <div className="flex items-center gap-1">
          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="p-1 rounded hover:bg-[#14161f] text-[#0066ff] hover:text-white transition-colors"
              title="Sync with GitHub Repo"
            >
              <Upload size={12} />
            </button>
          )}
          <button
            onClick={onSyncPushPull}
            disabled={isSyncing}
            className="p-1 rounded hover:bg-[#14161f] text-[#f4ecd8]/70 hover:text-white transition-colors"
            title="Sync with Remote (Fetch / Push / Pull)"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-[#222530] space-y-2 bg-[#08090c]">
        {/* Branch selector */}
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] text-[#f4ecd8]/70 mb-1">
            <span>Branch</span>
            <button
              onClick={() => setShowNewBranchModal(!showNewBranchModal)}
              className="text-[#0066ff] hover:text-[#00aaff] text-[10px] font-medium"
            >
              + New Branch
            </button>
          </div>

          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-[#13151b] border border-[#262934] text-white hover:bg-[#1c1f28] transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              <GitBranch size={13} className="text-[#0066ff] shrink-0" />
              <span className="font-mono truncate font-medium">{gitStatus.currentBranch}</span>
            </div>
            <ChevronDown size={12} className="text-[#f4ecd8]/50" />
          </button>

          {showBranchMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#13151b] border border-[#2a2e3d] rounded-lg shadow-2xl z-30 py-1">
              {gitStatus.branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    onSwitchBranch(b);
                    setShowBranchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#1c202c] transition-colors ${
                    b === gitStatus.currentBranch ? 'text-[#0066ff] font-bold' : 'text-white'
                  }`}
                >
                  <span className="font-mono">{b}</span>
                  {b === gitStatus.currentBranch && <Check size={12} className="text-[#0066ff]" />}
                </button>
              ))}
            </div>
          )}

          {showNewBranchModal && (
            <div className="mt-2 p-2 bg-[#13151b] border border-[#0066ff]/50 rounded space-y-1.5">
              <span className="text-[11px] text-white font-medium">Create New Branch</span>
              <input
                type="text"
                value={newBranchInput}
                placeholder="branch-name"
                onChange={(e) => setNewBranchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                className="w-full px-2 py-1 rounded bg-[#000000] border border-[#282c38] text-white font-mono text-xs outline-none"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-2 py-0.5 rounded text-[#f4ecd8]/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBranch}
                  className="px-2.5 py-0.5 rounded bg-[#0066ff] text-white font-medium hover:bg-[#0055dd]"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Commit Input Box */}
        <div className="space-y-1.5 pt-1">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message (Cmd+Enter to commit)"
            rows={2}
            className="w-full p-2 bg-[#13151b] border border-[#262934] rounded text-white text-xs outline-none resize-none focus:border-[#0066ff] transition-colors font-mono"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleCommit();
              }
            }}
          />
          <button
            onClick={handleCommit}
            disabled={gitStatus.staged.length === 0 || !commitMessage.trim()}
            className="w-full py-1.5 rounded bg-[#0066ff] hover:bg-[#0055dd] text-white font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
          >
            <GitCommitIcon size={13} />
            <span>Commit to {gitStatus.currentBranch}</span>
          </button>
        </div>
      </div>

      {/* Changes list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e222d]">
        {/* Staged Changes */}
        <div className="p-2">
          <div className="flex items-center justify-between text-[#f4ecd8] text-[11px] mb-1 px-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              Staged Changes
              <span className="text-[#0066ff] font-mono font-bold">({gitStatus.staged.length})</span>
            </span>
            {gitStatus.staged.length > 0 && (
              <button
                onClick={onUnstageAll}
                className="text-[#f4ecd8]/60 hover:text-white text-[10px]"
                title="Unstage all"
              >
                Unstage All
              </button>
            )}
          </div>

          {gitStatus.staged.length === 0 ? (
            <div className="px-2 py-1 text-[#f4ecd8]/40 italic text-[11px]">No staged files</div>
          ) : (
            <div className="space-y-0.5">
              {gitStatus.staged.map((path) => (
                <div
                  key={path}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#14161f] cursor-pointer"
                  onClick={() => onOpenDiff(path)}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#0066ff] font-bold font-mono text-[10px]">A</span>
                    <span className="text-white truncate font-mono text-[11px]">{path}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstageFile(path);
                      }}
                      className="p-1 hover:text-white text-[#f4ecd8]/60"
                      title="Unstage"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unstaged & Untracked Changes */}
        <div className="p-2">
          <div className="flex items-center justify-between text-[#f4ecd8] text-[11px] mb-1 px-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              Changes
              <span className="text-[#ff7300] font-mono font-bold">
                ({gitStatus.unstaged.length + gitStatus.untracked.length})
              </span>
            </span>
            {gitStatus.unstaged.length + gitStatus.untracked.length > 0 && (
              <button
                onClick={onStageAll}
                className="text-[#0066ff] hover:text-[#00aaff] text-[10px] font-medium"
                title="Stage all"
              >
                Stage All
              </button>
            )}
          </div>

          {gitStatus.unstaged.length === 0 && gitStatus.untracked.length === 0 ? (
            <div className="px-2 py-1 text-[#f4ecd8]/40 italic text-[11px]">Working tree clean</div>
          ) : (
            <div className="space-y-0.5">
              {gitStatus.unstaged.map((path) => (
                <div
                  key={path}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#14161f] cursor-pointer"
                  onClick={() => onOpenDiff(path)}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#ff7300] font-bold font-mono text-[10px]">M</span>
                    <span className="text-white truncate font-mono text-[11px]">{path}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDiscardChanges(path);
                      }}
                      className="p-1 hover:text-[#ff2a3b] text-[#f4ecd8]/60"
                      title="Discard changes"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(path);
                      }}
                      className="p-1 hover:text-white text-[#f4ecd8]/60"
                      title="Stage"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {gitStatus.untracked.map((path) => (
                <div
                  key={path}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#14161f] cursor-pointer"
                  onClick={() => onOpenDiff(path)}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#0066ff] font-bold font-mono text-[10px]">U</span>
                    <span className="text-white truncate font-mono text-[11px]">{path}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(path);
                      }}
                      className="p-1 hover:text-white text-[#f4ecd8]/60"
                      title="Stage"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Log History */}
        <div className="p-2">
          <div className="text-[#f4ecd8] text-[11px] font-semibold uppercase tracking-wider mb-2 px-1">
            Commit History ({gitStatus.commits.length})
          </div>
          <div className="space-y-2">
            {gitStatus.commits.map((commit) => (
              <div
                key={commit.hash}
                className="p-2 rounded bg-[#0d0f14] border border-[#222530] space-y-1 hover:border-[#0066ff]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate pr-2">
                    {commit.message}
                  </span>
                  <button
                    onClick={() => copyHash(commit.hash)}
                    className="font-mono text-[10px] text-[#0066ff] hover:text-[#00aaff] flex items-center gap-1 shrink-0"
                    title="Copy full hash"
                  >
                    <span>{commit.shortHash}</span>
                    {copiedHash === commit.hash ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#f4ecd8]/60">
                  <span>{commit.author.split('<')[0].trim()}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatTimeAgo(commit.timestamp)}
                  </span>
                </div>
                <div className="text-[10px] text-[#f4ecd8]/40 font-mono">
                  {commit.filesChanged.length} file{commit.filesChanged.length !== 1 ? 's' : ''} changed
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
