import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Formats a date according to the specified format type.
 * @param date - The date to format
 * @param format - Format type: 'relative' (e.g., "2 hours ago"), 'absolute' (e.g., "2024-01-15 14:30:00"), or 'both'
 * @returns Formatted date string
 */
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

/**
 * Gets the workspace root directory path.
 * @returns The workspace root path, or undefined if no workspace is open
 */
export function getWorkspaceRoot(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }
  return workspaceFolders[0].uri.fsPath;
}

/**
 * Converts an absolute file path to a relative path within the workspace.
 * @param filePath - The absolute or relative file path
 * @param workspaceRoot - The workspace root directory path
 * @returns Relative path from workspace root, or basename if file is outside workspace
 */
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

/**
 * Truncates a commit message to a maximum length, appending '...' if truncated.
 * @param message - The commit message to truncate
 * @param maxLength - Maximum length (default: 72 characters)
 * @returns Truncated message with '...' suffix if needed
 */
export function truncateMessage(message: string, maxLength: number = 72): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Gets the short version of a Git commit hash (first 7 characters).
 * @param hash - Full commit hash (40 characters)
 * @returns Short hash (7 characters)
 */
export function getShortHash(hash: string): string {
  return hash.substring(0, 7);
}
