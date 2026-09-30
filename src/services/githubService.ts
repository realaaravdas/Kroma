import { FileItem, SupportedLanguage } from '../types/ide';
import { detectLanguageByFilename } from './syntaxHighlighter';

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  fullName: string;
  defaultBranch?: string;
  description?: string;
}

/**
 * Parses GitHub repository URL or shorthand 'owner/repo'
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string; branch?: string } | null {
  const clean = input.trim();
  // Match https://github.com/owner/repo or https://github.com/owner/repo/tree/branch
  const urlMatch = clean.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)(?:\/tree\/([^\/\s#?]+))?/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/i, ''),
      branch: urlMatch[3],
    };
  }

  // Match owner/repo
  const shortMatch = clean.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2].replace(/\.git$/i, ''),
    };
  }

  return null;
}

/**
 * Fetch GitHub repository tree and files
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
): Promise<{ files: FileItem[]; branch: string; commitSha: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Get repository info to find default branch if branch not specified
  let targetBranch: string = branch || '';
  if (!targetBranch) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      const errJson = await repoRes.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch repo ${owner}/${repo} (HTTP ${repoRes.status})`);
    }
    const repoData = await repoRes.json();
    targetBranch = repoData.default_branch || 'main';
  }

  // 2. Fetch the git tree recursively
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch file tree for branch '${targetBranch}' (HTTP ${treeRes.status})`);
  }
  const treeData = await treeRes.json();
  const commitSha = treeData.sha || 'github-head';

  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('Repository is empty or tree is not accessible.');
  }

  // 3. Process tree items into FileItems
  // Folders map to maintain parent hierarchy
  const fileItems: FileItem[] = [];
  const folderIdMap = new Map<string, string>();

  // Root folder
  folderIdMap.set('', 'f-root');
  fileItems.push({
    id: 'f-root',
    name: repo,
    path: repo,
    content: '',
    language: 'text',
    isFolder: true,
    parentId: null,
  });

  // Limit to max 60 files to avoid rate limiting and memory explosion on huge repos
  const treeEntries = treeData.tree.slice(0, 80);

  // First pass: create all directory items
  treeEntries
    .filter((entry: any) => entry.type === 'tree')
    .forEach((entry: any) => {
      const pathParts = entry.path.split('/');
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');
      const parentId = folderIdMap.get(parentPath) || 'f-root';
      const folderId = `folder-${Math.random().toString(36).substring(2, 9)}`;

      folderIdMap.set(entry.path, folderId);
      fileItems.push({
        id: folderId,
        name,
        path: entry.path,
        content: '',
        language: 'text',
        isFolder: true,
        parentId,
      });
    });

  // Second pass: fetch text contents for blob files (limit fetch sizes)
  const blobEntries = treeEntries.filter((entry: any) => entry.type === 'blob');

  // Fetch blobs in parallel chunks of 6
  const fetchFileContent = async (entry: any) => {
    const pathParts = entry.path.split('/');
    const name = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    const parentId = folderIdMap.get(parentPath) || 'f-root';

    // Skip binary files
    const ext = name.split('.').pop()?.toLowerCase();
    const isBinary = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'pdf', 'zip', 'tar', 'gz', 'exe', 'bin', 'wasm', 'woff', 'ttf'].includes(ext || '');

    let content = '';
    if (!isBinary && entry.size && entry.size < 300000) {
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${targetBranch}/${entry.path}`,
          token ? { headers: { Authorization: `token ${token}` } } : {}
        );
        if (rawRes.ok) {
          content = await rawRes.text();
        }
      } catch (err) {
        content = `// Failed to load content for ${entry.path}`;
      }
    } else if (isBinary) {
      content = `// [Binary File: ${entry.size || 0} bytes]`;
    }

    return {
      id: `file-${Math.random().toString(36).substring(2, 9)}`,
      name,
      path: entry.path,
      content,
      language: detectLanguageByFilename(name),
      isFolder: false,
      parentId,
    };
  };

  const results: FileItem[] = [];
  const chunkSize = 8;
  for (let i = 0; i < blobEntries.length; i += chunkSize) {
    const chunk = blobEntries.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fetchFileContent));
    results.push(...chunkResults);
  }

  fileItems.push(...results);

  return {
    files: fileItems,
    branch: targetBranch,
    commitSha,
  };
}

/**
 * Push / Commit file to GitHub using GitHub API
 */
export async function pushFileToGitHub(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  token: string
): Promise<{ success: boolean; commitUrl?: string; message: string }> {
  try {
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // 1. Get current file sha if exists
    let sha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 2. Put file contents (base64 encoded)
    // UTF-8 base64 encoding
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    const body: Record<string, any> = {
      message: message || `Update ${path} via Kroma Cloud IDE`,
      content: encodedContent,
      branch,
    };
    if (sha) {
      body.sha = sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return { success: false, message: err.message || `Failed with status ${putRes.status}` };
    }

    const putData = await putRes.json();
    return {
      success: true,
      commitUrl: putData.commit?.html_url,
      message: `Committed ${path} successfully to branch '${branch}'`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error communicating with GitHub' };
  }
}
