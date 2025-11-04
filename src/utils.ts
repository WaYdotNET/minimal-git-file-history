import * as vscode from 'vscode';
import * as path from 'path';

export function formatDate(date: Date, format: 'relative' | 'absolute' | 'both' = 'relative'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative = '';
  if (diffMins < 1) {
    relative = 'just now';
  } else if (diffMins < 60) {
    relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  const absolute = date.toLocaleString();

  switch (format) {
    case 'relative':
      return relative;
    case 'absolute':
      return absolute;
    case 'both':
      return `${relative} (${absolute})`;
    default:
      return relative;
  }
}

export function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }
  return workspaceFolders[0].uri.fsPath;
}

export function getRelativePath(filePath: string, workspaceRoot: string): string {
  // Normalize paths for comparison
  const normalizedFilePath = path.normalize(filePath);
  const normalizedWorkspaceRoot = path.normalize(workspaceRoot);

  // Check if filePath is already relative
  if (!path.isAbsolute(normalizedFilePath)) {
    return normalizedFilePath;
  }

  // Check if filePath is within workspace
  if (!normalizedFilePath.startsWith(normalizedWorkspaceRoot)) {
    // If not in workspace, return basename
    return path.basename(normalizedFilePath);
  }

  // Get relative path and normalize separators
  const relativePath = normalizedFilePath.substring(normalizedWorkspaceRoot.length + 1);
  return relativePath.replace(/\\/g, '/'); // Normalize to forward slashes
}

export function truncateMessage(message: string, maxLength: number = 72): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

export function getShortHash(hash: string): string {
  return hash.substring(0, 7);
}
