import React from 'react';
import { Type, Moon, Shield } from 'lucide-react';
import { IdeSettings, IdeTheme } from '../types/ide';

interface SettingsPanelProps {
  settings: IdeSettings;
  onUpdateSettings: (newSettings: Partial<IdeSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="h-full flex flex-col bg-[#000000] text-zinc-300 text-xs select-none">
      <div className="h-9 px-3 border-b border-[#222530] flex items-center justify-between font-semibold uppercase tracking-wider text-[#f4ecd8]">
        <span className="text-[11px] font-bold">Preferences</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#08090c]">
        {/* Theme */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#f4ecd8] flex items-center gap-1.5 uppercase tracking-wider">
            <Moon size={13} className="text-[#0066ff]" />
            Editor Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'obsidian', label: 'Obsidian Black', preview: 'bg-[#000000]' },
              { id: 'zen-dark', label: 'Jet Dark', preview: 'bg-[#0d0f14]' },
              { id: 'tokyo-night', label: 'Midnight Blue', preview: 'bg-[#0b1021]' },
              { id: 'zen-light', label: 'Cream Minimal', preview: 'bg-[#f4ecd8]' },
            ].map((theme) => {
              const isActive = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onUpdateSettings({ theme: theme.id as IdeTheme })}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    isActive
                      ? 'border-[#0066ff] bg-[#14161f] text-white shadow-sm'
                      : 'border-[#222530] bg-[#0d0f14] text-[#f4ecd8]/60 hover:text-white'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border border-white/20 ${theme.preview}`} />
                  <span className="text-xs font-medium">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size & Typography */}
        <div className="space-y-3 pt-2 border-t border-[#222530]">
          <label className="text-[11px] font-semibold text-[#f4ecd8] flex items-center gap-1.5 uppercase tracking-wider">
            <Type size={13} className="text-[#0066ff]" />
            Typography & Layout
          </label>

          <div className="flex items-center justify-between">
            <span className="text-[#f4ecd8]/70">Font Size ({settings.fontSize}px)</span>
            <div className="flex gap-1">
              {[12, 13, 14, 16].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    settings.fontSize === size
                      ? 'bg-[#0066ff] text-white font-bold'
                      : 'bg-[#13151b] text-[#f4ecd8]/60 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#f4ecd8]/70">Tab Indentation</span>
            <div className="flex gap-1">
              {[2, 4].map((spaces) => (
                <button
                  key={spaces}
                  onClick={() => onUpdateSettings({ tabSize: spaces })}
                  className={`px-2.5 py-0.5 rounded text-xs font-mono ${
                    settings.tabSize === spaces
                      ? 'bg-[#0066ff] text-white font-bold'
                      : 'bg-[#13151b] text-[#f4ecd8]/60 hover:text-white'
                  }`}
                >
                  {spaces} spaces
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#f4ecd8]/70">Word Wrap</span>
            <button
              onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                settings.wordWrap ? 'bg-[#0066ff]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.wordWrap ? 'left-4' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#f4ecd8]/70">Line Numbers</span>
            <button
              onClick={() => onUpdateSettings({ lineNumbers: !settings.lineNumbers })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                settings.lineNumbers ? 'bg-[#0066ff]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.lineNumbers ? 'left-4' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Persistence */}
        <div className="space-y-3 pt-2 border-t border-[#222530]">
          <label className="text-[11px] font-semibold text-[#f4ecd8] flex items-center gap-1.5 uppercase tracking-wider">
            <Shield size={13} className="text-[#0066ff]" />
            Local Storage Autosave
          </label>

          <div className="flex items-center justify-between">
            <span className="text-[#f4ecd8]/70">Auto-save changes locally</span>
            <button
              onClick={() => onUpdateSettings({ autoSave: !settings.autoSave })}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                settings.autoSave ? 'bg-[#0066ff]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.autoSave ? 'left-4' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
