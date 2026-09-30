import React, { useState } from 'react';
import { Github, Download, Upload, Key, X, Check, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { parseGitHubUrl, fetchGitHubRepo, pushFileToGitHub } from '../services/githubService';
import { FileItem } from '../types/ide';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoLoaded: (files: FileItem[], repoInfo: { owner: string; repo: string; branch: string; token?: string }) => void;
  currentRepoInfo: { owner: string; repo: string; branch: string; token?: string } | null;
  activeFile: FileItem | null;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  onRepoLoaded,
  currentRepoInfo,
  activeFile,
}) => {
  const [tab, setTab] = useState<'clone' | 'push'>('clone');
  const [repoInput, setRepoInput] = useState('');
  const [branchInput, setBranchInput] = useState('main');
  const [tokenInput, setTokenInput] = useState(currentRepoInfo?.token || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Push state
  const [commitMessage, setCommitMessage] = useState('Update file via Kroma Cloud IDE');
  const [isPushing, setIsPushing] = useState(false);

  const handleClone = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsed = parseGitHubUrl(repoInput);
    if (!parsed) {
      setErrorMsg("Please enter a valid GitHub URL or 'owner/repo' (e.g. 'pallets/flask' or 'https://github.com/golang/example')");
      return;
    }

    setIsLoading(true);
    try {
      const { files, branch, commitSha } = await fetchGitHubRepo(
        parsed.owner,
        parsed.repo,
        branchInput.trim() || parsed.branch,
        tokenInput.trim() || undefined
      );

      if (files.length === 0) {
        throw new Error('No files found in this repository or branch.');
      }

      onRepoLoaded(files, {
        owner: parsed.owner,
        repo: parsed.repo,
        branch,
        token: tokenInput.trim() || undefined,
      });

      setSuccessMsg(`Successfully imported ${files.length} items from ${parsed.owner}/${parsed.repo} (${branch})`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to clone repository from GitHub. Check URL, branch, or access token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushCurrentFile = async () => {
    if (!currentRepoInfo) {
      setErrorMsg('No GitHub repository currently connected. Clone or connect one first.');
      return;
    }
    if (!tokenInput.trim()) {
      setErrorMsg('A GitHub Personal Access Token with "repo" scope is required to push changes.');
      return;
    }
    if (!activeFile || activeFile.isFolder) {
      setErrorMsg('Please open a file to push.');
      return;
    }

    setIsPushing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await pushFileToGitHub(
        currentRepoInfo.owner,
        currentRepoInfo.repo,
        activeFile.path,
        activeFile.content,
        commitMessage,
        currentRepoInfo.branch,
        tokenInput.trim()
      );

      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to push commit to GitHub.');
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#000000] border border-[#22252c] rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="h-12 px-4 bg-[#08090c] border-b border-[#22252c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#13151b] flex items-center justify-center text-white border border-[#2e3440]">
              <Github size={14} />
            </div>
            <span className="font-semibold text-white text-sm">GitHub Integration</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-[#13151b] rounded p-0.5 border border-[#22252c]">
              <button
                onClick={() => setTab('clone')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  tab === 'clone' ? 'bg-[#0066ff] text-white' : 'text-[#f5f0e6]/70 hover:text-white'
                }`}
              >
                Clone / Import
              </button>
              <button
                onClick={() => setTab('push')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  tab === 'push' ? 'bg-[#0066ff] text-white' : 'text-[#f5f0e6]/70 hover:text-white'
                }`}
              >
                Push / Commit
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-[#f5f0e6]/60 hover:text-white hover:bg-[#1a1c24] transition-colors ml-2"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 bg-[#0b0c10]">
          {tab === 'clone' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                  GitHub Repository URL or Shorthand
                </label>
                <input
                  type="text"
                  placeholder="e.g. pallets/flask or https://github.com/username/repo"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs outline-none focus:border-[#0066ff] transition-colors font-mono placeholder:text-[#f5f0e6]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs outline-none focus:border-[#0066ff] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                    Personal Access Token (For Private Repos)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs outline-none focus:border-[#0066ff] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="pt-1">
                <span className="text-[10px] text-[#f5f0e6]/60 font-semibold uppercase tracking-wider block mb-1.5">
                  Try Open-Source Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'pallets/flask', name: 'pallets/flask' },
                    { label: 'rust-lang/rust-by-example', name: 'rust-lang/rust-by-example' },
                    { label: 'golang/example', name: 'golang/example' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setRepoInput(p.name);
                        setBranchInput('master');
                      }}
                      className="px-2 py-1 rounded bg-[#13151b] hover:bg-[#1f222b] border border-[#22252c] text-[#f5f0e6] hover:text-white transition-colors font-mono text-[11px]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div className="p-2.5 rounded bg-[#ff2a3b]/10 border border-[#ff2a3b]/30 text-[#ff2a3b] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-xs">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <Check size={14} className="shrink-0" />
                  <span className="text-xs">{successMsg}</span>
                </div>
              )}

              <button
                onClick={handleClone}
                disabled={isLoading || !repoInput.trim()}
                className="w-full py-2.5 rounded-lg bg-[#0066ff] hover:bg-[#0055dd] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none mt-2 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Cloning Repository Trees...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Clone Repository into IDE</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Push / Commit Tab */
            <div className="space-y-3">
              <div className="p-2.5 rounded bg-[#13151b] border border-[#22252c] text-xs">
                <div className="flex items-center justify-between text-[#f5f0e6]/70 mb-1">
                  <span>Connected GitHub Repo:</span>
                  <span className="text-white font-mono font-semibold">
                    {currentRepoInfo ? `${currentRepoInfo.owner}/${currentRepoInfo.repo}` : 'None (Clone first)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#f5f0e6]/70">
                  <span>Target Branch:</span>
                  <span className="text-white font-mono">
                    {currentRepoInfo?.branch || 'main'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                  Active File to Commit
                </label>
                <input
                  type="text"
                  disabled
                  value={activeFile?.path || 'No file selected'}
                  className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs font-mono opacity-80"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                  Commit Message
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="e.g. Update algorithm in main.py"
                  className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs outline-none focus:border-[#0066ff] font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#f5f0e6] uppercase tracking-wider block mb-1">
                  GitHub Personal Access Token (Required for push)
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#13151b] border border-[#262934] text-white text-xs outline-none focus:border-[#0066ff] font-mono"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded bg-[#ff2a3b]/10 border border-[#ff2a3b]/30 text-[#ff2a3b] flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-xs">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <Check size={14} className="shrink-0" />
                  <span className="text-xs">{successMsg}</span>
                </div>
              )}

              <button
                onClick={handlePushCurrentFile}
                disabled={isPushing || !activeFile || !currentRepoInfo || !tokenInput.trim()}
                className="w-full py-2.5 rounded-lg bg-[#0066ff] hover:bg-[#0055dd] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none mt-2 active:scale-98"
              >
                {isPushing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Pushing Commit to GitHub...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Push Current File to GitHub</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
