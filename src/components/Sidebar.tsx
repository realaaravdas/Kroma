import React from 'react';
import {
  Files,
  GitBranch,
  Boxes,
  Search,
  Settings,
} from 'lucide-react';
import { SidebarTab } from '../types/ide';

interface SidebarProps {
  activeTab: SidebarTab | null;
  onSelectTab: (tab: SidebarTab) => void;
  gitChangesCount: number;
  condaEnv: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  gitChangesCount,
  condaEnv,
}) => {
  const tabs: { id: SidebarTab; icon: React.ReactNode; label: string; badge?: number }[] = [
    {
      id: 'explorer',
      icon: <Files size={18} strokeWidth={1.8} />,
      label: 'Explorer (Cmd+Shift+E)',
    },
    {
      id: 'git',
      icon: <GitBranch size={18} strokeWidth={1.8} />,
      label: 'Source Control (Cmd+Shift+G)',
      badge: gitChangesCount > 0 ? gitChangesCount : undefined,
    },
    {
      id: 'conda',
      icon: <Boxes size={18} strokeWidth={1.8} />,
      label: `Anaconda & Compilers (${condaEnv})`,
    },
    {
      id: 'search',
      icon: <Search size={18} strokeWidth={1.8} />,
      label: 'Search across Workspace (Cmd+Shift+F)',
    },
    {
      id: 'settings',
      icon: <Settings size={18} strokeWidth={1.8} />,
      label: 'IDE Settings',
    },
  ];

  return (
    <div className="w-12 bg-[#000000] border-r border-[#222530] flex flex-col items-center py-2 select-none z-10 shrink-0">
      <div className="flex flex-col gap-1.5 w-full items-center">
        {tabs.slice(0, 4).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                isActive
                  ? 'text-white bg-[#14161f]'
                  : 'text-[#f4ecd8]/60 hover:text-white hover:bg-[#0d0f14]'
              }`}
              title={tab.label}
            >
              {tab.icon}
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#ff2a3b] text-white text-[9px] font-bold flex items-center justify-center border border-[#000000]">
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#0066ff]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 w-full items-center">
        {tabs.slice(4).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                isActive
                  ? 'text-white bg-[#14161f]'
                  : 'text-[#f4ecd8]/60 hover:text-white hover:bg-[#0d0f14]'
              }`}
              title={tab.label}
            >
              {tab.icon}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#0066ff]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
