export type SupportedLanguage =
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'yaml'
  | 'json'
  | 'markdown'
  | 'bash'
  | 'text';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: SupportedLanguage;
  isFolder: boolean;
  parentId: string | null;
  isModified?: boolean;
  isOpen?: boolean;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  timestamp: number;
  filesChanged: {
    path: string;
    status: 'added' | 'modified' | 'deleted';
    additions: number;
    deletions: number;
  }[];
  snapshot: Record<string, string>; // path -> content
}

export interface GitStatus {
  currentBranch: string;
  branches: string[];
  staged: string[]; // file paths
  unstaged: string[]; // file paths
  untracked: string[]; // file paths
  commits: GitCommit[];
  isClean: boolean;
}

export interface CondaPackage {
  name: string;
  version: string;
  build?: string;
  channel?: string;
  description?: string;
}

export interface CondaEnvironment {
  name: string;
  pythonVersion: string;
  packages: CondaPackage[];
  isDefault?: boolean;
}

export interface Diagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
}

export interface ExecutionResult {
  language: SupportedLanguage;
  compiler: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  diagnostics?: Diagnostic[];
  timestamp: number;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'stdout' | 'stderr' | 'system' | 'info' | 'success' | 'prompt';
  text: string;
  timestamp: number;
}

export type SidebarTab = 'explorer' | 'git' | 'conda' | 'search' | 'settings';

export type IdeTheme = 'zen-dark' | 'obsidian' | 'tokyo-night' | 'zen-light';

export interface IdeSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  theme: IdeTheme;
  autoSave: boolean;
  autoSaveDelayMs: number;
  fontFamily: string;
}
