import { FileItem, GitCommit, GitStatus } from '../types/ide';

export interface DiffLine {
  type: 'added' | 'deleted' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export interface FileDiff {
  path: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

/**
 * Simple diff algorithm comparing line by line
 */
export function computeLineDiff(oldText: string, newText: string): FileDiff {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  const diffLines: DiffLine[] = [];

  let additions = 0;
  let deletions = 0;

  let i = 0;
  let j = 0;

  // Simple LCS-like diff approximation for editor diff view
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diffLines.push({
        type: 'unchanged',
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
        text: oldLines[i],
      });
      i++;
      j++;
    } else {
      // Lookahead to see if next lines match
      const nextInNew = newLines.indexOf(oldLines[i], j);
      const nextInOld = oldLines.indexOf(newLines[j], i);

      if (i < oldLines.length && (nextInNew === -1 || (nextInOld !== -1 && nextInOld - i < nextInNew - j))) {
        diffLines.push({
          type: 'deleted',
          oldLineNumber: i + 1,
          text: oldLines[i],
        });
        deletions++;
        i++;
      } else if (j < newLines.length) {
        diffLines.push({
          type: 'added',
          newLineNumber: j + 1,
          text: newLines[j],
        });
        additions++;
        j++;
      } else {
        if (i < oldLines.length) {
          diffLines.push({
            type: 'deleted',
            oldLineNumber: i + 1,
            text: oldLines[i],
          });
          deletions++;
          i++;
        }
      }
    }
  }

  return {
    path: '',
    lines: diffLines,
    additions,
    deletions,
  };
}

/**
 * Generate random 40-char hex string mimicking git commit SHA
 */
export function generateCommitHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Creates the initial Git commit snapshot from starting workspace files
 */
export function createInitialGitState(initialFiles: FileItem[]): {
  status: GitStatus;
  headCommit: GitCommit;
} {
  const snapshot: Record<string, string> = {};
  initialFiles.forEach((file) => {
    if (!file.isFolder) {
      snapshot[file.path] = file.content;
    }
  });

  const hash = 'a47b19df82c398e041fbc8e2098492049182390a';
  const initialCommit: GitCommit = {
    hash,
    shortHash: hash.slice(0, 7),
    message: 'Initial project setup (Python, Rust, Go, Java templates)',
    author: 'Dev Engineer <developer@kroma-ide.cloud>',
    timestamp: Date.now() - 1000 * 60 * 35, // 35 min ago
    filesChanged: Object.keys(snapshot).map((path) => ({
      path,
      status: 'added',
      additions: snapshot[path].split('\n').length,
      deletions: 0,
    })),
    snapshot,
  };

  const status: GitStatus = {
    currentBranch: 'main',
    branches: ['main', 'feature/fast-pipeline', 'dev'],
    staged: [],
    unstaged: [],
    untracked: [],
    commits: [initialCommit],
    isClean: true,
  };

  return { status, headCommit: initialCommit };
}

/**
 * Recomputes Git status based on current file tree vs HEAD commit snapshot
 */
export function updateGitStatus(
  currentFiles: FileItem[],
  headCommit: GitCommit | null,
  currentStaged: string[],
  currentBranch: string,
  branches: string[],
  commits: GitCommit[]
): GitStatus {
  const headSnapshot = headCommit?.snapshot || {};
  const currentFileMap: Record<string, string> = {};
  
  currentFiles.forEach((f) => {
    if (!f.isFolder) {
      currentFileMap[f.path] = f.content;
    }
  });

  const stagedSet = new Set(currentStaged);
  const unstaged: string[] = [];
  const untracked: string[] = [];
  const staged: string[] = [];

  // Check current files
  for (const path in currentFileMap) {
    const currentContent = currentFileMap[path];
    const headContent = headSnapshot[path];

    if (headContent === undefined) {
      // Untracked or staged as new
      if (stagedSet.has(path)) {
        staged.push(path);
      } else {
        untracked.push(path);
      }
    } else if (headContent !== currentContent) {
      // Modified
      if (stagedSet.has(path)) {
        staged.push(path);
      } else {
        unstaged.push(path);
      }
    }
  }

  // Check deleted files
  for (const headPath in headSnapshot) {
    if (!(headPath in currentFileMap)) {
      if (stagedSet.has(headPath)) {
        staged.push(headPath);
      } else {
        unstaged.push(headPath);
      }
    }
  }

  const isClean = staged.length === 0 && unstaged.length === 0 && untracked.length === 0;

  return {
    currentBranch,
    branches,
    staged,
    unstaged,
    untracked,
    commits,
    isClean,
  };
}

/**
 * Creates a new commit from staged files
 */
export function commitStagedChanges(
  message: string,
  currentFiles: FileItem[],
  stagedPaths: string[],
  headCommit: GitCommit | null,
  commits: GitCommit[],
  author: string = 'Developer <dev@kroma-ide.cloud>'
): { newCommit: GitCommit; newCommits: GitCommit[] } {
  const headSnapshot = headCommit?.snapshot || {};
  const newSnapshot: Record<string, string> = { ...headSnapshot };

  const currentFileMap: Record<string, string> = {};
  currentFiles.forEach((f) => {
    if (!f.isFolder) {
      currentFileMap[f.path] = f.content;
    }
  });

  const filesChanged: GitCommit['filesChanged'] = [];

  stagedPaths.forEach((path) => {
    const isNew = !(path in headSnapshot);
    const isDeleted = !(path in currentFileMap);

    if (isDeleted) {
      delete newSnapshot[path];
      filesChanged.push({
        path,
        status: 'deleted',
        additions: 0,
        deletions: (headSnapshot[path] || '').split('\n').length,
      });
    } else {
      const content = currentFileMap[path];
      newSnapshot[path] = content;
      const oldContent = headSnapshot[path] || '';
      const diff = computeLineDiff(oldContent, content);
      filesChanged.push({
        path,
        status: isNew ? 'added' : 'modified',
        additions: diff.additions,
        deletions: diff.deletions,
      });
    }
  });

  const hash = generateCommitHash();
  const newCommit: GitCommit = {
    hash,
    shortHash: hash.slice(0, 7),
    message: message.trim() || 'Update files',
    author,
    timestamp: Date.now(),
    filesChanged,
    snapshot: newSnapshot,
  };

  const newCommits = [newCommit, ...commits];
  return { newCommit, newCommits };
}
