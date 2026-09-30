import React, { useState } from 'react';
import { Upload, FolderArchive, FolderOpen, Download, X, Check, AlertCircle, FileText } from 'lucide-react';
import { unpackZipRepo, downloadRepoZip } from '../services/repoManager';
import { FileItem } from '../types/ide';

interface UploadRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoLoaded: (files: FileItem[], repoName: string) => void;
  currentFiles: FileItem[];
}

export const UploadRepoModal: React.FC<UploadRepoModalProps> = ({
  isOpen,
  onClose,
  onRepoLoaded,
  currentFiles,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { files, repoName } = await unpackZipRepo(file);
      if (files.length === 0) {
        throw new Error('No files could be extracted from this zip file.');
      }
      onRepoLoaded(files, repoName);
      setSuccessMsg(`Extracted ${files.length} items from ${file.name}`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to unpack ZIP archive.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleDownloadZip = async () => {
    try {
      await downloadRepoZip(currentFiles, 'kroma_workspace');
      setSuccessMsg('Workspace downloaded as .zip for local storage.');
    } catch (err: any) {
      setErrorMsg('Failed to create download archive.');
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
        className="w-full max-w-md bg-[#000000] border border-[#22252c] rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="h-12 px-4 bg-[#08090c] border-b border-[#22252c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#13151b] flex items-center justify-center text-white border border-[#2e3440]">
              <FolderArchive size={14} className="text-[#ff7300]" />
            </div>
            <span className="font-semibold text-white text-sm">Upload Local Repository</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#f5f0e6]/60 hover:text-white hover:bg-[#1a1c24] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4 bg-[#0b0c10]">
          <p className="text-zinc-400 text-xs leading-relaxed">
            Upload your local Git repository (.zip archive) to edit and run in the browser. You can export it back anytime.
          </p>

          {/* Upload Drop Zone */}
          <label className="border-2 border-dashed border-[#272b38] hover:border-[#0066ff] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#08090c] group">
            <Upload size={24} className="text-[#0066ff] mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium text-xs mb-1">Click to select .zip repo</span>
            <span className="text-zinc-500 text-[10px]">Supports standard Git repo zip or project folder zip</span>
            <input
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </label>

          {/* Download Current Workspace */}
          <div className="pt-2 border-t border-[#22252c]">
            <div className="flex items-center justify-between text-zinc-300 mb-2">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-[#f5f0e6]/70">
                Redownload for Local Storage
              </span>
            </div>
            <button
              onClick={handleDownloadZip}
              className="w-full py-2 px-3 rounded-lg bg-[#13151b] hover:bg-[#1c1f28] border border-[#282c38] text-white flex items-center justify-center gap-2 transition-colors font-medium text-xs"
            >
              <Download size={13} className="text-[#0066ff]" />
              <span>Export Current Workspace (.zip)</span>
            </button>
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
        </div>
      </div>
    </div>
  );
};
