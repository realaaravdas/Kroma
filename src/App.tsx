import React, { useState, useEffect, useMemo, useCallback } from 'react';
import JSZip from 'jszip';
import {
  INITIAL_FILES,
  INITIAL_CONDA_ENVS,
} from './services/templates';
import {
  FileItem,
  GitStatus,
  GitCommit,
  CondaEnvironment,
  SidebarTab,
  IdeSettings,
  TerminalLine,
  ExecutionResult,
  Diagnostic,
} from './types/ide';
import {
  createInitialGitState,
  updateGitStatus,
  commitStagedChanges,
} from './services/gitService';
import {
  executeFileCode,
  executePython,
  executeRust,
  executeGo,
  executeJava,
} from './services/compilers';
import {
  detectLanguageByFilename,
  analyzeSyntaxDiagnostics,
} from './services/syntaxHighlighter';
import { downloadRepoZip } from './services/repoManager';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FileTree } from './components/FileTree';
import { GitPanel } from './components/GitPanel';
import { CondaPanel } from './components/CondaPanel';
import { SearchPanel } from './components/SearchPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { CodeEditor } from './components/CodeEditor';
import { DiffViewer } from './components/DiffViewer';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { GitHubModal } from './components/GitHubModal';
import { UploadRepoModal } from './components/UploadRepoModal';

const LOCAL_STORAGE_KEY = 'kroma_ide_workspace_v3';
const SETTINGS_STORAGE_KEY = 'kroma_ide_settings_v3';

export default function App() {
  // 1. Files & Workspace State
  const [files, setFiles] = useState<FileItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved workspace:', e);
    }
    return INITIAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string | null>('file-py-main');
  const [openFileIds, setOpenFileIds] = useState<string[]>([
    'file-py-main',
    'file-rust-main',
    'file-go-main',
    'file-java-main',
  ]);

  // 2. Settings State
  const [settings, setSettings] = useState<IdeSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      fontSize: 13,
      tabSize: 4,
      wordWrap: true,
      lineNumbers: true,
      theme: 'obsidian',
      autoSave: true,
      autoSaveDelayMs: 2000,
      fontFamily: 'JetBrains Mono',
    };
  });

  // 3. Git State
  const initialGit = useMemo(() => createInitialGitState(INITIAL_FILES), []);
  const [headCommit, setHeadCommit] = useState<GitCommit>(initialGit.headCommit);
  const [gitStatus, setGitStatus] = useState<GitStatus>(initialGit.status);
  const [diffFilePath, setDiffFilePath] = useState<string | null>(null);
  const [isSyncingGit, setIsSyncingGit] = useState(false);

  // 4. GitHub Connection
  const [connectedGitHubRepo, setConnectedGitHubRepo] = useState<{
    owner: string;
    repo: string;
    branch: string;
    token?: string;
  } | null>(null);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isUploadRepoModalOpen, setIsUploadRepoModalOpen] = useState(false);

  // 5. Conda Environments
  const [condaEnvs, setCondaEnvs] = useState<CondaEnvironment[]>(INITIAL_CONDA_ENVS);
  const [activeCondaEnv, setActiveCondaEnv] = useState<string>('base');

  // 6. Layout & UI Panes
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab | null>('explorer');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [splitView, setSplitView] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // 7. Execution & Compilers State
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [latestExecution, setLatestExecution] = useState<ExecutionResult | null>(null);

  // 8. Linux Terminal Lines
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'info',
      text: 'Linux cloud-instance 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
      timestamp: Date.now() - 3000,
    },
    {
      id: 'init-2',
      type: 'stdout',
      text: 'Ubuntu 24.04 LTS (Noble Numbat) — bash 5.2.26(1)-release',
      timestamp: Date.now() - 2000,
    },
    {
      id: 'init-3',
      type: 'stdout',
      text: 'Toolchains: Python 3.11.8 (Conda base), rustc 1.78.0, go 1.22.4, OpenJDK 21.0.3, git 2.43.0.',
      timestamp: Date.now() - 1500,
    },
    {
      id: 'init-4',
      type: 'system',
      text: "Tip: Hit 'Run' (Cmd+Enter) to execute the active program in this terminal, or type Linux commands directly.",
      timestamp: Date.now() - 1000,
    },
  ]);
  const [isPythonReplActive, setIsPythonReplActive] = useState(false);

  // Derived state
  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || null,
    [files, activeFileId]
  );

  const openFiles = useMemo(
    () => files.filter((f) => openFileIds.includes(f.id)),
    [files, openFileIds]
  );

  const modifiedPaths = useMemo(
    () => new Set(gitStatus.unstaged),
    [gitStatus.unstaged]
  );

  const untrackedPaths = useMemo(
    () => new Set(gitStatus.untracked),
    [gitStatus.untracked]
  );

  // Diagnostics for active file
  const diagnostics = useMemo(() => {
    if (!activeFile || activeFile.isFolder) return [];
    return analyzeSyntaxDiagnostics(activeFile.content, activeFile.language);
  }, [activeFile?.content, activeFile?.language]);

  // Sync Git Status when files change
  useEffect(() => {
    setGitStatus((prev) =>
      updateGitStatus(
        files,
        headCommit,
        prev.staged,
        prev.currentBranch,
        prev.branches,
        prev.commits
      )
    );
  }, [files, headCommit]);

  // Persist files to localStorage
  useEffect(() => {
    if (settings.autoSave) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
      } catch (e) {
        console.warn('Storage save failed:', e);
      }
    }
  }, [files, settings.autoSave]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
        return;
      }

      // Cmd/Ctrl + Enter: Run
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
        return;
      }

      // Ctrl + ` : Toggle Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + P: Command Palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setActiveSidebarTab((prev) => (prev ? null : 'explorer'));
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeFile, files, activeCondaEnv]);

  // Select a file
  const handleSelectFile = (file: FileItem) => {
    if (file.isFolder) return;
    setActiveFileId(file.id);
    setDiffFilePath(null);
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds((prev) => [...prev, file.id]);
    }
  };

  // Close tab
  const handleCloseFile = (fileId: string) => {
    const nextOpen = openFileIds.filter((id) => id !== fileId);
    setOpenFileIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null);
    }
  };

  // Update content of active file
  const handleUpdateContent = (newContent: string) => {
    if (!activeFileId) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent, isModified: true } : f))
    );
  };

  // Save current active file
  const handleSaveFile = () => {
    if (!activeFileId) return;
    setIsSaving(true);
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, isModified: false } : f))
    );
    setTimeout(() => setIsSaving(false), 200);
  };

  // Create new file or folder
  const handleCreateFile = (name: string, isFolder: boolean, parentId: string | null) => {
    const parent = files.find((f) => f.id === parentId);
    const parentPath = parent && parent.id !== 'f-root' ? `${parent.path}/` : '';
    const fullPath = isFolder ? `${parentPath}${name}` : `${parentPath}${name}`;

    const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newFile: FileItem = {
      id: newId,
      name,
      path: fullPath,
      content: isFolder ? '' : `# ${name}\n`,
      language: isFolder ? 'text' : detectLanguageByFilename(name),
      isFolder,
      parentId,
      isModified: true,
      isOpen: !isFolder,
    };

    setFiles((prev) => [...prev, newFile]);
    if (!isFolder) {
      setActiveFileId(newId);
      setOpenFileIds((prev) => [...prev, newId]);
    }
  };

  // Delete file or folder
  const handleDeleteFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const idsToDelete = new Set<string>([fileId]);
    let changed = true;
    while (changed) {
      changed = false;
      files.forEach((f) => {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          changed = true;
        }
      });
    }

    setFiles((prev) => prev.filter((f) => !idsToDelete.has(f.id)));
    setOpenFileIds((prev) => prev.filter((id) => !idsToDelete.has(id)));
    if (activeFileId && idsToDelete.has(activeFileId)) {
      setActiveFileId(null);
    }
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const parts = f.path.split('/');
          parts[parts.length - 1] = newName;
          const newPath = parts.join('/');
          return {
            ...f,
            name: newName,
            path: newPath,
            language: f.isFolder ? 'text' : detectLanguageByFilename(newName),
          };
        }
        return f;
      })
    );
  };

  // Format document
  const handleFormatDocument = () => {
    if (!activeFile || activeFile.isFolder) return;
    let formatted = activeFile.content;

    formatted = formatted
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');

    formatted = formatted.trimEnd() + '\n';
    handleUpdateContent(formatted);
  };

  // RUN CODE IN THE LINUX TERMINAL
  const handleRunCode = async () => {
    if (!activeFile || activeFile.isFolder || isRunning) return;

    // 1. Ensure terminal is open
    setTerminalOpen(true);
    setIsRunning(true);

    // 2. Format command string
    const cmdStr =
      activeFile.language === 'python'
        ? `python3 ${activeFile.name}`
        : activeFile.language === 'rust'
        ? `cargo run --bin ${activeFile.name.replace('.rs', '')}`
        : activeFile.language === 'go'
        ? `go run ${activeFile.name}`
        : activeFile.language === 'java'
        ? `javac ${activeFile.name} && java Main`
        : `./${activeFile.name}`;

    // 3. Print command prompt into terminal
    const execInputLine: TerminalLine = {
      id: `run-${Date.now()}`,
      type: 'input',
      text: cmdStr,
      timestamp: Date.now(),
    };
    setTerminalLines((prev) => [...prev, execInputLine]);

    // 4. Run compilation & execution
    try {
      const result = await executeFileCode(activeFile, files, activeCondaEnv);
      setLatestExecution(result);

      // Print standard output directly into terminal
      if (result.stdout) {
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `out-${Date.now()}`,
            type: 'stdout',
            text: result.stdout,
            timestamp: Date.now(),
          },
        ]);
      }

      // Print standard error if any
      if (result.stderr) {
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            type: 'stderr',
            text: result.stderr,
            timestamp: Date.now(),
          },
        ]);
      }

      // Exit status line
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `res-${Date.now()}`,
          type: result.exitCode === 0 ? 'success' : 'stderr',
          text: `[Process completed with exit code ${result.exitCode} in ${result.executionTimeMs}ms]`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `fatal-${Date.now()}`,
          type: 'stderr',
          text: `Execution failed: ${String(err?.message || err)}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Linux Terminal Command Handler
  const handleExecuteTerminalCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Echo command input
    const inputLine: TerminalLine = {
      id: `cmd-${Date.now()}`,
      type: 'input',
      text: cmd,
      timestamp: Date.now(),
    };
    setTerminalLines((prev) => [...prev, inputLine]);

    // Handle Python REPL state
    if (isPythonReplActive) {
      if (cmd === 'exit()' || cmd === 'quit()') {
        setIsPythonReplActive(false);
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `repl-exit-${Date.now()}`,
            type: 'info',
            text: 'Exited Python interactive session.',
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      try {
        const res = await executePython(cmd, files, activeCondaEnv);
        if (res.stdout) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `repl-out-${Date.now()}`, type: 'stdout', text: res.stdout, timestamp: Date.now() },
          ]);
        }
        if (res.stderr) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `repl-err-${Date.now()}`, type: 'stderr', text: res.stderr, timestamp: Date.now() },
          ]);
        }
      } catch (e: any) {
        setTerminalLines((prev) => [
          ...prev,
          { id: `repl-err-${Date.now()}`, type: 'stderr', text: String(e), timestamp: Date.now() },
        ]);
      }
      return;
    }

    const parts = cmd.split(' ').filter(Boolean);
    const base = parts[0]?.toLowerCase();

    switch (base) {
      case 'clear':
        setTerminalLines([]);
        break;

      case 'help':
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `help-${Date.now()}`,
            type: 'stdout',
            text: `GNU/Linux Cloud Terminal (bash 5.2):
  • python3 <file.py>            Execute Python program with Pyodide / Conda
  • python                       Enter interactive Python REPL
  • cargo run / rustc <file.rs>  Compile & execute Rust project
  • go run <file.go>             Compile & execute Go application
  • javac <file.java> && java Main Compile & execute Java JVM class
  • ls [-la]                     List files with permissions and sizes
  • cat <file>                   Output file contents
  • grep <pattern> <file>        Search for patterns in files
  • mkdir <dir> / rm <file>      File management
  • pwd / whoami / uname -a      System environment details
  • git [status|add|commit|log|branch|push] Git version control
  • conda [list|activate|create|install] Anaconda environment manager
  • clear                        Clear terminal screen`,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'pwd':
        setTerminalLines((prev) => [
          ...prev,
          { id: `pwd-${Date.now()}`, type: 'stdout', text: '/home/developer/workspace', timestamp: Date.now() },
        ]);
        break;

      case 'whoami':
        setTerminalLines((prev) => [
          ...prev,
          { id: `whoami-${Date.now()}`, type: 'stdout', text: 'developer', timestamp: Date.now() },
        ]);
        break;

      case 'uname': {
        const flag = parts[1];
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `uname-${Date.now()}`,
            type: 'stdout',
            text:
              flag === '-a'
                ? 'Linux cloud-instance 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'
                : 'Linux',
            timestamp: Date.now(),
          },
        ]);
        break;
      }

      case 'date':
        setTerminalLines((prev) => [
          ...prev,
          { id: `date-${Date.now()}`, type: 'stdout', text: new Date().toUTCString(), timestamp: Date.now() },
        ]);
        break;

      case 'uptime':
        setTerminalLines((prev) => [
          ...prev,
          {
            id: `uptime-${Date.now()}`,
            type: 'stdout',
            text: ' 01:20:04 up 14 days, 3:12,  1 user,  load average: 0.12, 0.08, 0.05',
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'ls': {
        const isLong = parts.includes('-la') || parts.includes('-l') || parts.includes('-al');
        const rootChildren = files.filter((f) => f.parentId === 'f-root' || f.parentId === null);

        if (isLong) {
          const lines = [
            'total 48',
            'drwxr-xr-x 6 developer developer 4096 Sep 30 01:00 .',
            'drwxr-xr-x 3 developer developer 4096 Sep 30 00:50 ..',
            ...rootChildren.map((f) => {
              const size = f.content.length || 4096;
              const perms = f.isFolder ? 'drwxr-xr-x' : '-rw-r--r--';
              return `${perms} 1 developer developer ${String(size).padStart(6, ' ')} Sep 30 01:00 ${f.name}${f.isFolder ? '/' : ''}`;
            }),
          ];
          setTerminalLines((prev) => [
            ...prev,
            { id: `ls-${Date.now()}`, type: 'stdout', text: lines.join('\n'), timestamp: Date.now() },
          ]);
        } else {
          const listing = rootChildren
            .map((f) => (f.isFolder ? `${f.name}/` : f.name))
            .join('   ');
          setTerminalLines((prev) => [
            ...prev,
            { id: `ls-${Date.now()}`, type: 'stdout', text: listing || '(empty directory)', timestamp: Date.now() },
          ]);
        }
        break;
      }

      case 'cat': {
        const targetName = parts[1];
        if (!targetName) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `cat-err-${Date.now()}`, type: 'stderr', text: 'cat: missing file operand', timestamp: Date.now() },
          ]);
          break;
        }
        const file = files.find((f) => !f.isFolder && (f.name === targetName || f.path === targetName));
        if (file) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `cat-${Date.now()}`, type: 'stdout', text: file.content, timestamp: Date.now() },
          ]);
        } else {
          setTerminalLines((prev) => [
            ...prev,
            { id: `cat-nf-${Date.now()}`, type: 'stderr', text: `cat: ${targetName}: No such file or directory`, timestamp: Date.now() },
          ]);
        }
        break;
      }

      case 'grep': {
        const pattern = parts[1];
        const targetName = parts[2];
        if (!pattern || !targetName) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `grep-usage-${Date.now()}`, type: 'stderr', text: 'usage: grep <pattern> <file>', timestamp: Date.now() },
          ]);
          break;
        }
        const file = files.find((f) => !f.isFolder && (f.name === targetName || f.path === targetName));
        if (!file) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `grep-nf-${Date.now()}`, type: 'stderr', text: `grep: ${targetName}: No such file or directory`, timestamp: Date.now() },
          ]);
          break;
        }
        const matches = file.content
          .split('\n')
          .filter((l) => l.includes(pattern))
          .join('\n');
        setTerminalLines((prev) => [
          ...prev,
          { id: `grep-${Date.now()}`, type: 'stdout', text: matches || '(no matches)', timestamp: Date.now() },
        ]);
        break;
      }

      case 'python':
      case 'python3': {
        const scriptName = parts[1];
        if (!scriptName) {
          // Interactive REPL
          setIsPythonReplActive(true);
          setTerminalLines((prev) => [
            ...prev,
            {
              id: `py-repl-${Date.now()}`,
              type: 'info',
              text: `Python 3.11.8 (main, Sep 30 2026) [Pyodide Wasm / Conda: ${activeCondaEnv}]
Type "help", "copyright", "credits" or "license" for more information.
>>> Type exit() or quit() to return to bash.`,
              timestamp: Date.now(),
            },
          ]);
          return;
        }

        const pyFile = files.find((f) => !f.isFolder && (f.name === scriptName || f.path === scriptName));
        if (!pyFile) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `py-err-${Date.now()}`, type: 'stderr', text: `python3: can't open file '${scriptName}': [Errno 2] No such file or directory`, timestamp: Date.now() },
          ]);
          return;
        }

        setIsRunning(true);
        try {
          const res = await executePython(pyFile.content, files, activeCondaEnv);
          setLatestExecution(res);
          if (res.stdout) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `out-${Date.now()}`, type: 'stdout', text: res.stdout, timestamp: Date.now() },
            ]);
          }
          if (res.stderr) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, type: 'stderr', text: res.stderr, timestamp: Date.now() },
            ]);
          }
          setTerminalLines((prev) => [
            ...prev,
            { id: `res-${Date.now()}`, type: res.exitCode === 0 ? 'success' : 'stderr', text: `[Process completed with exit code ${res.exitCode}]`, timestamp: Date.now() },
          ]);
        } finally {
          setIsRunning(false);
        }
        break;
      }

      case 'cargo':
      case 'rustc': {
        const rustFile = files.find((f) => f.language === 'rust' && !f.isFolder);
        if (!rustFile) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `rust-err-${Date.now()}`, type: 'stderr', text: 'cargo: error: no rust target found in workspace', timestamp: Date.now() },
          ]);
          return;
        }
        setIsRunning(true);
        try {
          const res = await executeRust(rustFile.content);
          setLatestExecution(res);
          if (res.stdout) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `out-${Date.now()}`, type: 'stdout', text: res.stdout, timestamp: Date.now() },
            ]);
          }
          if (res.stderr) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, type: 'stderr', text: res.stderr, timestamp: Date.now() },
            ]);
          }
        } finally {
          setIsRunning(false);
        }
        break;
      }

      case 'go': {
        const goFile = files.find((f) => f.language === 'go' && !f.isFolder);
        if (!goFile) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `go-err-${Date.now()}`, type: 'stderr', text: 'go: no Go source files found in workspace', timestamp: Date.now() },
          ]);
          return;
        }
        setIsRunning(true);
        try {
          const res = await executeGo(goFile.content);
          setLatestExecution(res);
          if (res.stdout) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `out-${Date.now()}`, type: 'stdout', text: res.stdout, timestamp: Date.now() },
            ]);
          }
          if (res.stderr) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, type: 'stderr', text: res.stderr, timestamp: Date.now() },
            ]);
          }
        } finally {
          setIsRunning(false);
        }
        break;
      }

      case 'javac':
      case 'java': {
        const javaFile = files.find((f) => f.language === 'java' && !f.isFolder);
        if (!javaFile) {
          setTerminalLines((prev) => [
            ...prev,
            { id: `java-err-${Date.now()}`, type: 'stderr', text: 'java: no .java files found', timestamp: Date.now() },
          ]);
          return;
        }
        setIsRunning(true);
        try {
          const res = await executeJava(javaFile.content);
          setLatestExecution(res);
          if (res.stdout) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `out-${Date.now()}`, type: 'stdout', text: res.stdout, timestamp: Date.now() },
            ]);
          }
          if (res.stderr) {
            setTerminalLines((prev) => [
              ...prev,
              { id: `err-${Date.now()}`, type: 'stderr', text: res.stderr, timestamp: Date.now() },
            ]);
          }
        } finally {
          setIsRunning(false);
        }
        break;
      }

      case 'conda': {
        const sub = parts[1];
        if (sub === 'list') {
          const currentEnv = condaEnvs.find((e) => e.name === activeCondaEnv);
          const pkgLines = [
            `# packages in environment at /opt/conda/envs/${activeCondaEnv}:`,
            '# Name                    Version                   Build  Channel',
            ...(currentEnv?.packages.map(
              (p) => `${p.name.padEnd(24)} ${p.version.padEnd(25)} ${p.channel || 'conda-forge'}`
            ) || []),
          ];
          setTerminalLines((prev) => [
            ...prev,
            { id: `conda-list-${Date.now()}`, type: 'stdout', text: pkgLines.join('\n'), timestamp: Date.now() },
          ]);
        } else if (sub === 'activate') {
          const target = parts[2];
          if (target && condaEnvs.some((e) => e.name === target)) {
            setActiveCondaEnv(target);
            setTerminalLines((prev) => [
              ...prev,
              { id: `conda-act-${Date.now()}`, type: 'success', text: `Activated environment (${target}).`, timestamp: Date.now() },
            ]);
          } else {
            setTerminalLines((prev) => [
              ...prev,
              { id: `conda-err-${Date.now()}`, type: 'stderr', text: `Environment '${target}' not found.`, timestamp: Date.now() },
            ]);
          }
        } else if (sub === 'create') {
          const nFlag = parts.indexOf('-n');
          const envName = nFlag !== -1 ? parts[nFlag + 1] : parts[2];
          if (envName) {
            handleCreateCondaEnv(envName, '3.11');
            setTerminalLines((prev) => [
              ...prev,
              { id: `conda-create-${Date.now()}`, type: 'success', text: `Conda environment '${envName}' created.`, timestamp: Date.now() },
            ]);
          }
        } else if (sub === 'install') {
          const pkg = parts[2];
          if (pkg) {
            handleInstallCondaPackage(activeCondaEnv, pkg);
            setTerminalLines((prev) => [
              ...prev,
              { id: `conda-inst-${Date.now()}`, type: 'success', text: `Successfully installed ${pkg} in (${activeCondaEnv}).`, timestamp: Date.now() },
            ]);
          }
        } else {
          setTerminalLines((prev) => [
            ...prev,
            { id: `conda-usage-${Date.now()}`, type: 'stdout', text: 'conda: supported subcommands: list, activate, create, install', timestamp: Date.now() },
          ]);
        }
        break;
      }

      case 'git': {
        const sub = parts[1];
        if (sub === 'status') {
          const statusText = [
            `On branch ${gitStatus.currentBranch}`,
            gitStatus.isClean
              ? 'nothing to commit, working tree clean'
              : [
                  gitStatus.staged.length > 0
                    ? `Changes to be committed:\n${gitStatus.staged.map((p) => `\tnew/modified:   ${p}`).join('\n')}`
                    : '',
                  gitStatus.unstaged.length > 0
                    ? `Changes not staged for commit:\n${gitStatus.unstaged.map((p) => `\tmodified:   ${p}`).join('\n')}`
                    : '',
                  gitStatus.untracked.length > 0
                    ? `Untracked files:\n${gitStatus.untracked.map((p) => `\tuntracked:  ${p}`).join('\n')}`
                    : '',
                ]
                  .filter(Boolean)
                  .join('\n\n'),
          ].join('\n');

          setTerminalLines((prev) => [
            ...prev,
            { id: `git-st-${Date.now()}`, type: 'stdout', text: statusText, timestamp: Date.now() },
          ]);
        } else if (sub === 'add') {
          handleStageAll();
          setTerminalLines((prev) => [
            ...prev,
            { id: `git-add-${Date.now()}`, type: 'stdout', text: 'Staged files for commit.', timestamp: Date.now() },
          ]);
        } else if (sub === 'commit') {
          const msgMatch = cmd.match(/-m\s+["']([^"']+)["']/);
          const msg = msgMatch ? msgMatch[1] : 'Update project files';
          handleCommitGit(msg);
          setTerminalLines((prev) => [
            ...prev,
            { id: `git-comm-${Date.now()}`, type: 'success', text: `[${gitStatus.currentBranch} ${headCommit?.shortHash || 'head'}] ${msg}`, timestamp: Date.now() },
          ]);
        } else if (sub === 'push') {
          handleSyncPushPull();
        } else {
          setTerminalLines((prev) => [
            ...prev,
            { id: `git-usage-${Date.now()}`, type: 'stdout', text: 'git: supported commands: status, add, commit -m "<msg>", push, log, branch', timestamp: Date.now() },
          ]);
        }
        break;
      }

      default:
        setTerminalLines((prev) => [
          ...prev,
          { id: `unk-${Date.now()}`, type: 'stderr', text: `bash: ${base}: command not found. Type 'help' for available commands.`, timestamp: Date.now() },
        ]);
        break;
    }
  };

  // Git handlers
  const handleStageFile = (path: string) => {
    setGitStatus((prev) => ({
      ...prev,
      staged: Array.from(new Set([...prev.staged, path])),
      unstaged: prev.unstaged.filter((p) => p !== path),
      untracked: prev.untracked.filter((p) => p !== path),
    }));
  };

  const handleUnstageFile = (path: string) => {
    setGitStatus((prev) => ({
      ...prev,
      staged: prev.staged.filter((p) => p !== path),
      unstaged: Array.from(new Set([...prev.unstaged, path])),
    }));
  };

  const handleStageAll = () => {
    setGitStatus((prev) => ({
      ...prev,
      staged: Array.from(new Set([...prev.staged, ...prev.unstaged, ...prev.untracked])),
      unstaged: [],
      untracked: [],
    }));
  };

  const handleUnstageAll = () => {
    setGitStatus((prev) => ({
      ...prev,
      staged: [],
      unstaged: Array.from(new Set([...prev.unstaged, ...prev.staged])),
    }));
  };

  const handleCommitGit = (message: string) => {
    if (gitStatus.staged.length === 0) return;
    const { newCommit, newCommits } = commitStagedChanges(
      message,
      files,
      gitStatus.staged,
      headCommit,
      gitStatus.commits
    );

    setHeadCommit(newCommit);
    setGitStatus((prev) => ({
      ...prev,
      staged: [],
      commits: newCommits,
      isClean: prev.unstaged.length === 0 && prev.untracked.length === 0,
    }));
  };

  const handleSwitchBranch = (branch: string) => {
    setGitStatus((prev) => ({
      ...prev,
      currentBranch: branch,
    }));
  };

  const handleCreateBranch = (branchName: string) => {
    setGitStatus((prev) => ({
      ...prev,
      branches: Array.from(new Set([...prev.branches, branchName])),
      currentBranch: branchName,
    }));
  };

  const handleDiscardChanges = (path: string) => {
    if (!headCommit) return;
    const original = headCommit.snapshot[path];
    if (original !== undefined) {
      setFiles((prev) =>
        prev.map((f) => (f.path === path ? { ...f, content: original, isModified: false } : f))
      );
    }
    setDiffFilePath(null);
  };

  const handleSyncPushPull = () => {
    setIsSyncingGit(true);
    setTimeout(() => {
      setIsSyncingGit(false);
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `sync-${Date.now()}`,
          type: 'success',
          text: `Everything up-to-date with remote branch '${gitStatus.currentBranch}'.`,
          timestamp: Date.now(),
        },
      ]);
    }, 1000);
  };

  // Conda management
  const handleCreateCondaEnv = (name: string, pythonVersion: string) => {
    const newEnv: CondaEnvironment = {
      name,
      pythonVersion,
      packages: [
        { name: 'python', version: `${pythonVersion}.0`, channel: 'conda-forge' },
        { name: 'pip', version: '24.0', channel: 'conda-forge' },
      ],
    };
    setCondaEnvs((prev) => [...prev, newEnv]);
    setActiveCondaEnv(name);
  };

  const handleInstallCondaPackage = (envName: string, packageName: string) => {
    setCondaEnvs((prev) =>
      prev.map((e) => {
        if (e.name === envName) {
          return {
            ...e,
            packages: [
              ...e.packages,
              {
                name: packageName,
                version: '1.0.0',
                channel: 'conda-forge',
                description: `Installed package`,
              },
            ],
          };
        }
        return e;
      })
    );
  };

  // Local repo uploaded
  const handleLocalRepoLoaded = (uploadedFiles: FileItem[], repoName: string) => {
    setFiles(uploadedFiles);
    const nonFolder = uploadedFiles.filter((f) => !f.isFolder);
    if (nonFolder.length > 0) {
      setActiveFileId(nonFolder[0].id);
      setOpenFileIds(nonFolder.slice(0, 4).map((f) => f.id));
    }
    const gitState = createInitialGitState(uploadedFiles);
    setHeadCommit(gitState.headCommit);
    setGitStatus(gitState.status);

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `upload-${Date.now()}`,
        type: 'success',
        text: `Loaded local Git repository '${repoName}' (${uploadedFiles.length} files/folders).`,
        timestamp: Date.now(),
      },
    ]);
  };

  // GitHub repo loaded
  const handleGitHubRepoLoaded = (
    loadedFiles: FileItem[],
    repoInfo: { owner: string; repo: string; branch: string; token?: string }
  ) => {
    setFiles(loadedFiles);
    setConnectedGitHubRepo(repoInfo);

    const nonFolder = loadedFiles.filter((f) => !f.isFolder);
    if (nonFolder.length > 0) {
      setActiveFileId(nonFolder[0].id);
      setOpenFileIds(nonFolder.slice(0, 4).map((f) => f.id));
    }

    const gitState = createInitialGitState(loadedFiles);
    gitState.status.currentBranch = repoInfo.branch;
    setHeadCommit(gitState.headCommit);
    setGitStatus(gitState.status);

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `gh-${Date.now()}`,
        type: 'success',
        text: `Cloned GitHub repository '${repoInfo.owner}/${repoInfo.repo}' on branch '${repoInfo.branch}'.`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Download project as ZIP
  const handleExportZip = async () => {
    try {
      const repoName = connectedGitHubRepo
        ? connectedGitHubRepo.repo
        : 'kroma_workspace';
      await downloadRepoZip(files, repoName);
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `zip-${Date.now()}`,
          type: 'success',
          text: `Workspace exported and downloaded as '${repoName}.zip'.`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      console.error('Failed to export ZIP:', err);
    }
  };

  // Reset to initial demo workspace
  const handleResetWorkspace = () => {
    if (window.confirm('Reset workspace to initial demo templates? Current changes will be overwritten.')) {
      setFiles(INITIAL_FILES);
      setActiveFileId('file-py-main');
      setOpenFileIds(['file-py-main', 'file-rust-main', 'file-go-main', 'file-java-main']);
      const reinit = createInitialGitState(INITIAL_FILES);
      setHeadCommit(reinit.headCommit);
      setGitStatus(reinit.status);
      setConnectedGitHubRepo(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#000000] text-[#ffffff] font-sans">
      {/* 1. Header Toolbar */}
      <Header
        activeFile={activeFile}
        onRunCode={handleRunCode}
        onSaveFile={handleSaveFile}
        isSaving={isSaving}
        isRunning={isRunning}
        terminalOpen={terminalOpen}
        onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        currentBranch={gitStatus.currentBranch}
        condaEnv={activeCondaEnv}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onExportZip={handleExportZip}
        onOpenUploadRepo={() => setIsUploadRepoModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onResetWorkspace={handleResetWorkspace}
        splitView={splitView}
        onToggleSplitView={() => setSplitView((prev) => !prev)}
        connectedGitHubRepo={
          connectedGitHubRepo ? `${connectedGitHubRepo.owner}/${connectedGitHubRepo.repo}` : undefined
        }
      />

      {/* 2. Main Workbench Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar */}
        <Sidebar
          activeTab={activeSidebarTab}
          onSelectTab={(tab) =>
            setActiveSidebarTab((prev) => (prev === tab ? null : tab))
          }
          gitChangesCount={gitStatus.unstaged.length + gitStatus.untracked.length + gitStatus.staged.length}
          condaEnv={activeCondaEnv}
        />

        {/* Sidebar Panel Drawer */}
        {activeSidebarTab && (
          <aside className="w-64 border-r border-[#222530] bg-[#000000] shrink-0 overflow-hidden flex flex-col">
            {activeSidebarTab === 'explorer' && (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                modifiedFiles={modifiedPaths}
                untrackedFiles={untrackedPaths}
                onOpenUploadRepo={() => setIsUploadRepoModalOpen(true)}
                onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
              />
            )}

            {activeSidebarTab === 'git' && (
              <GitPanel
                gitStatus={gitStatus}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
                onCommit={handleCommitGit}
                onSwitchBranch={handleSwitchBranch}
                onCreateBranch={handleCreateBranch}
                onOpenDiff={(path) => setDiffFilePath(path)}
                onDiscardChanges={handleDiscardChanges}
                onSyncPushPull={handleSyncPushPull}
                isSyncing={isSyncingGit}
                onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
              />
            )}

            {activeSidebarTab === 'conda' && (
              <CondaPanel
                environments={condaEnvs}
                activeEnv={activeCondaEnv}
                onSelectEnv={(env) => setActiveCondaEnv(env)}
                onCreateEnv={handleCreateCondaEnv}
                onInstallPackage={handleInstallCondaPackage}
              />
            )}

            {activeSidebarTab === 'search' && (
              <SearchPanel
                files={files}
                onSelectFile={handleSelectFile}
                onReplaceInFile={(fileId, newContent) => {
                  setFiles((prev) =>
                    prev.map((f) => (f.id === fileId ? { ...f, content: newContent, isModified: true } : f))
                  );
                }}
              />
            )}

            {activeSidebarTab === 'settings' && (
              <SettingsPanel
                settings={settings}
                onUpdateSettings={(newSettings) =>
                  setSettings((prev) => ({ ...prev, ...newSettings }))
                }
              />
            )}
          </aside>
        )}

        {/* Center: Editor Canvas / Diff Viewer */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d0f14] overflow-hidden">
          {diffFilePath ? (
            <DiffViewer
              filePath={diffFilePath}
              currentContent={files.find((f) => f.path === diffFilePath)?.content || ''}
              headCommit={headCommit}
              onClose={() => setDiffFilePath(null)}
              onStageFile={handleStageFile}
              onDiscardChanges={handleDiscardChanges}
              isStaged={gitStatus.staged.includes(diffFilePath)}
            />
          ) : (
            <div className={`flex-1 flex min-h-0 ${splitView ? 'divide-x divide-[#222530]' : ''}`}>
              <div className="flex-1 h-full min-w-0 flex flex-col">
                <CodeEditor
                  openFiles={openFiles}
                  activeFile={activeFile}
                  onSelectFile={handleSelectFile}
                  onCloseFile={handleCloseFile}
                  onUpdateContent={handleUpdateContent}
                  settings={settings}
                  onFormatDocument={handleFormatDocument}
                  diagnostics={diagnostics}
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              </div>

              {splitView && (
                <div className="flex-1 h-full min-w-0 bg-[#000000] p-4 overflow-y-auto font-code text-xs">
                  <div className="text-[#f4ecd8] font-semibold mb-2 flex items-center justify-between pb-2 border-b border-[#222530]">
                    <span>Split View: Live Execution Output</span>
                    <span className="text-[10px] text-[#0066ff] font-mono">
                      {latestExecution ? latestExecution.compiler : 'Idle'}
                    </span>
                  </div>
                  {latestExecution ? (
                    <div className="space-y-3">
                      <div className="text-white font-medium">Standard Output:</div>
                      <pre className="p-3 rounded bg-[#0d0f14] border border-[#222530] text-white whitespace-pre overflow-x-auto">
                        {latestExecution.stdout || '(no output)'}
                      </pre>
                      {latestExecution.stderr && (
                        <>
                          <div className="text-[#ff2a3b] font-medium">Standard Error:</div>
                          <pre className="p-3 rounded bg-[#ff2a3b]/10 border border-[#ff2a3b]/30 text-[#ff2a3b] whitespace-pre overflow-x-auto">
                            {latestExecution.stderr}
                          </pre>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#f4ecd8]/40 italic">
                      Click 'Run' or press ⌘⏎ to view program execution output.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Integrated Linux Terminal Drawer */}
          <Terminal
            lines={terminalLines}
            onExecuteCommand={handleExecuteTerminalCommand}
            onClear={() => setTerminalLines([])}
            isOpen={terminalOpen}
            onClose={() => setTerminalOpen(false)}
            activeEnv={activeCondaEnv}
            files={files}
            latestExecution={latestExecution}
            diagnostics={diagnostics}
            activeFile={activeFile}
            isRunningProgram={isRunning}
            onStopProgram={() => setIsRunning(false)}
          />
        </main>
      </div>

      {/* 3. Bottom Status Bar */}
      <StatusBar
        currentBranch={gitStatus.currentBranch}
        gitModifiedCount={gitStatus.unstaged.length + gitStatus.untracked.length}
        condaEnv={activeCondaEnv}
        language={activeFile?.language || 'text'}
        cursorLine={cursorPos.line}
        cursorCol={cursorPos.col}
        tabSize={settings.tabSize}
        terminalOpen={terminalOpen}
        onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        onOpenGit={() => setActiveSidebarTab('git')}
        onOpenConda={() => setActiveSidebarTab('conda')}
        problemsCount={diagnostics.length}
        isRunning={isRunning}
      />

      {/* 4. Command Palette (Cmd + P) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        files={files}
        onSelectFile={handleSelectFile}
        onRunCode={handleRunCode}
        onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        onFormatDocument={handleFormatDocument}
        onExportZip={handleExportZip}
        condaEnvs={condaEnvs}
        onSelectCondaEnv={(env) => setActiveCondaEnv(env)}
      />

      {/* 5. GitHub Integration Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onRepoLoaded={handleGitHubRepoLoaded}
        currentRepoInfo={connectedGitHubRepo}
        activeFile={activeFile}
      />

      {/* 6. Upload Local Repository Modal */}
      <UploadRepoModal
        isOpen={isUploadRepoModalOpen}
        onClose={() => setIsUploadRepoModalOpen(false)}
        onRepoLoaded={handleLocalRepoLoaded}
        currentFiles={files}
      />
    </div>
  );
}
