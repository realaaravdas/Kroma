import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Check,
  Cpu,
  Package
} from 'lucide-react';
import { CondaEnvironment } from '../types/ide';

interface CondaPanelProps {
  environments: CondaEnvironment[];
  activeEnv: string;
  onSelectEnv: (envName: string) => void;
  onCreateEnv: (name: string, pythonVersion: string) => void;
  onInstallPackage: (envName: string, packageName: string) => void;
}

export const CondaPanel: React.FC<CondaPanelProps> = ({
  environments,
  activeEnv,
  onSelectEnv,
  onCreateEnv,
  onInstallPackage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvPyVersion, setNewEnvPyVersion] = useState('3.11');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPkgInput, setNewPkgInput] = useState('');

  const currentEnvironment =
    environments.find((e) => e.name === activeEnv) || environments[0];

  const filteredPackages = (currentEnvironment?.packages || []).filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (newEnvName.trim()) {
      onCreateEnv(newEnvName.trim(), newEnvPyVersion);
      setNewEnvName('');
      setShowCreateModal(false);
    }
  };

  const handleInstall = () => {
    if (newPkgInput.trim()) {
      onInstallPackage(activeEnv, newPkgInput.trim());
      setNewPkgInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-300 text-xs select-none">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#222530] flex items-center justify-between font-semibold uppercase tracking-wider text-[#f4ecd8]">
        <span className="text-[11px] font-bold">Anaconda & Toolchains</span>
        <button
          onClick={() => setShowCreateModal(!showCreateModal)}
          className="p-1 rounded hover:bg-[#14161f] text-[#0066ff] hover:text-[#00aaff] transition-colors"
          title="Create New Conda Environment"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="p-3 border-b border-[#222530] space-y-3 bg-[#08090c]">
        {/* Environment Selector */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#f4ecd8]/70 mb-1">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]">
              <Boxes size={12} className="text-[#ff7300]" />
              Active Conda Environment
            </span>
          </div>

          <div className="space-y-1">
            {environments.map((env) => {
              const isActive = env.name === activeEnv;
              return (
                <div
                  key={env.name}
                  onClick={() => onSelectEnv(env.name)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer border transition-colors ${
                    isActive
                      ? 'bg-[#14161f] border-[#0066ff]/60 text-white'
                      : 'bg-[#0d0f14] border-[#222530] text-[#f4ecd8]/70 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,0.7)]' : 'bg-zinc-600'
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-white">{env.name}</span>
                      <span className="text-[10px] text-[#f4ecd8]/60">Python {env.pythonVersion}</span>
                    </div>
                  </div>
                  {isActive && <Check size={14} className="text-[#0066ff]" />}
                </div>
              );
            })}
          </div>

          {showCreateModal && (
            <div className="mt-2 p-2.5 bg-[#14161f] border border-[#0066ff]/50 rounded-lg space-y-2">
              <span className="text-[11px] text-white font-medium">Create Conda Environment</span>
              <input
                type="text"
                placeholder="env-name (e.g. data-sci)"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                className="w-full px-2 py-1 rounded bg-[#000000] border border-[#282c38] text-white font-mono text-xs outline-none"
              />
              <div className="flex items-center justify-between text-[11px] text-[#f4ecd8]/70">
                <span>Python Version:</span>
                <select
                  value={newEnvPyVersion}
                  onChange={(e) => setNewEnvPyVersion(e.target.value)}
                  className="bg-[#000000] border border-[#282c38] rounded px-1.5 py-0.5 text-white text-xs outline-none font-mono"
                >
                  <option value="3.12">3.12 (Latest)</option>
                  <option value="3.11">3.11 (Default)</option>
                  <option value="3.10">3.10</option>
                  <option value="3.9">3.9</option>
                </select>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-2 py-0.5 rounded text-[#f4ecd8]/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-2.5 py-0.5 rounded bg-[#0066ff] hover:bg-[#0055dd] text-white font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Install Package */}
        <div className="space-y-1">
          <label className="text-[10px] text-[#f4ecd8]/70 font-semibold uppercase tracking-wider">
            Install Package into ({activeEnv})
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. polars, fastapi, rich"
              value={newPkgInput}
              onChange={(e) => setNewPkgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
              className="flex-1 px-2.5 py-1 bg-[#13151b] border border-[#262934] rounded text-white text-xs outline-none focus:border-[#0066ff] font-mono"
            />
            <button
              onClick={handleInstall}
              disabled={!newPkgInput.trim()}
              className="px-3 py-1 rounded bg-[#0066ff] hover:bg-[#0055dd] text-white text-xs font-semibold disabled:opacity-40"
            >
              Install
            </button>
          </div>
        </div>
      </div>

      {/* Compiler Toolchains Info Banner */}
      <div className="p-3 border-b border-[#222530] bg-[#0d0f14] space-y-2">
        <span className="text-[10px] text-[#f4ecd8] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Cpu size={12} className="text-[#0066ff]" />
          Available Cloud Compilers
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="p-1.5 rounded bg-[#13151b] border border-[#222530] flex flex-col">
            <span className="text-[#0066ff] font-bold">Python 3.11</span>
            <span className="text-[9px] text-[#f4ecd8]/50">Pyodide Wasm</span>
          </div>
          <div className="p-1.5 rounded bg-[#13151b] border border-[#222530] flex flex-col">
            <span className="text-[#ff7300] font-bold">rustc 1.78</span>
            <span className="text-[9px] text-[#f4ecd8]/50">Cargo Runner</span>
          </div>
          <div className="p-1.5 rounded bg-[#13151b] border border-[#222530] flex flex-col">
            <span className="text-cyan-400 font-bold">Go 1.22.4</span>
            <span className="text-[9px] text-[#f4ecd8]/50">gc toolchain</span>
          </div>
          <div className="p-1.5 rounded bg-[#13151b] border border-[#222530] flex flex-col">
            <span className="text-[#ff2a3b] font-bold">OpenJDK 21</span>
            <span className="text-[9px] text-[#f4ecd8]/50">HotSpot JVM</span>
          </div>
        </div>
      </div>

      {/* Installed Packages List */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#000000]">
        <div className="p-2 border-b border-[#222530] flex items-center gap-1.5 bg-[#08090c]">
          <Search size={12} className="text-[#f4ecd8]/50 shrink-0" />
          <input
            type="text"
            placeholder="Search installed conda packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#f4ecd8]/30 font-mono"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] text-[#f4ecd8]/60 uppercase tracking-wider font-semibold px-1 mb-1">
            Packages in ({activeEnv}) • {filteredPackages.length}
          </div>

          {filteredPackages.map((pkg) => (
            <div
              key={pkg.name}
              className="p-1.5 rounded bg-[#0d0f14] border border-[#222530] flex items-center justify-between text-xs hover:border-[#0066ff]/40 transition-colors"
            >
              <div className="flex flex-col truncate pr-2">
                <span className="font-mono text-white font-medium truncate">{pkg.name}</span>
                {pkg.description && (
                  <span className="text-[10px] text-[#f4ecd8]/50 truncate">{pkg.description}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] text-[#f4ecd8] bg-[#1a1d26] px-1.5 py-0.5 rounded">
                  v{pkg.version}
                </span>
              </div>
            </div>
          ))}

          {filteredPackages.length === 0 && (
            <div className="p-4 text-center text-[#f4ecd8]/40 italic">No matching packages found</div>
          )}
        </div>
      </div>
    </div>
  );
};
