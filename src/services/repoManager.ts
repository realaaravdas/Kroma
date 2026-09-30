import JSZip from 'jszip';
import { FileItem } from '../types/ide';
import { detectLanguageByFilename } from './syntaxHighlighter';

/**
 * Unpacks a local .zip archive of a Git repository and converts it to FileItem[]
 */
export async function unpackZipRepo(zipFile: File): Promise<{ files: FileItem[]; repoName: string }> {
  const zip = await JSZip.loadAsync(zipFile);
  const repoName = zipFile.name.replace(/\.zip$/i, '');

  const fileItems: FileItem[] = [];
  const folderIdMap = new Map<string, string>();

  // Root folder
  folderIdMap.set('', 'f-root');
  fileItems.push({
    id: 'f-root',
    name: repoName,
    path: repoName,
    content: '',
    language: 'text',
    isFolder: true,
    parentId: null,
  });

  const zipEntries = Object.keys(zip.files);

  // Check if all files are wrapped in a common top-level directory (e.g. 'my-repo-main/')
  let commonPrefix = '';
  const firstSlash = zipEntries[0]?.indexOf('/');
  if (firstSlash !== -1 && zipEntries.length > 1) {
    const candidate = zipEntries[0].substring(0, firstSlash + 1);
    if (zipEntries.every((e) => e.startsWith(candidate))) {
      commonPrefix = candidate;
    }
  }

  for (const rawPath of zipEntries) {
    const entry = zip.files[rawPath];
    let path = rawPath;
    if (commonPrefix && path.startsWith(commonPrefix)) {
      path = path.substring(commonPrefix.length);
    }
    if (!path || path === '/') continue;

    // Remove trailing slash for folder name computation
    const isDir = entry.dir || path.endsWith('/');
    const cleanPath = path.replace(/\/$/, '');
    const pathParts = cleanPath.split('/');
    const name = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');
    const parentId = folderIdMap.get(parentPath) || 'f-root';

    if (isDir) {
      const folderId = `f-${Math.random().toString(36).substring(2, 9)}`;
      folderIdMap.set(cleanPath, folderId);
      fileItems.push({
        id: folderId,
        name,
        path: cleanPath,
        content: '',
        language: 'text',
        isFolder: true,
        parentId,
      });
    } else {
      let content = '';
      try {
        content = await entry.async('string');
      } catch {
        content = '// Binary or unreadable content';
      }

      fileItems.push({
        id: `file-${Math.random().toString(36).substring(2, 9)}`,
        name,
        path: cleanPath,
        content,
        language: detectLanguageByFilename(name),
        isFolder: false,
        parentId,
      });
    }
  }

  return { files: fileItems, repoName };
}

/**
 * Handles raw files uploaded via directory selector
 */
export function processDirectoryUpload(fileList: FileList): { files: FileItem[]; repoName: string } {
  const fileItems: FileItem[] = [];
  const folderIdMap = new Map<string, string>();

  // Determine top folder name
  const firstPath = fileList[0]?.webkitRelativePath || fileList[0]?.name || 'uploaded_repo';
  const repoName = firstPath.split('/')[0] || 'uploaded_repo';

  folderIdMap.set('', 'f-root');
  fileItems.push({
    id: 'f-root',
    name: repoName,
    path: repoName,
    content: '',
    language: 'text',
    isFolder: true,
    parentId: null,
  });

  return { files: fileItems, repoName };
}

/**
 * Packs all workspace files into a downloadable ZIP storage archive
 */
export async function downloadRepoZip(files: FileItem[], repoName: string = 'kroma_repo') {
  const zip = new JSZip();

  files.forEach((f) => {
    if (!f.isFolder) {
      zip.file(f.path, f.content);
    }
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repoName}_export_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
