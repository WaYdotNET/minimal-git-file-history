import * as vscode from 'vscode';
import { GitService } from './gitService';
import { BlameLine } from './types';
import { formatDate, getShortHash } from './utils';
import * as path from 'path';
import * as os from 'os';

/**
 * Provides hover information for temporary diff files created by DiffViewer.
 * Shows author and commit information when hovering over lines in diff views.
 */
export class DiffBlameProvider {
  private gitService: GitService;
  private disposables: vscode.Disposable[] = [];
  private blameCache: Map<string, BlameLine[]> = new Map();
  private tempDir: string;

  /**
   * Creates a new DiffBlameProvider instance.
   * @param gitService - The GitService instance to use for Git operations
   */
  constructor(gitService: GitService) {
    this.gitService = gitService;
    this.tempDir = path.join(os.tmpdir(), 'fz-git-file-histrory');

    // Register hover provider for files in temp directory
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
      provideHover: async (document: vscode.TextDocument, position: vscode.Position) => {
        // Check if this is a diff temp file
        if (!this.isDiffTempFile(document.uri.fsPath)) {
          return null;
        }

        const blameData = this.blameCache.get(document.uri.fsPath);
        if (!blameData || blameData.length === 0) {
          return null;
        }

        // Find blame line for current position
        const lineNumber = position.line + 1;
        const blameLine = blameData.find(bl => bl.line === lineNumber);

        if (!blameLine) {
          return null;
        }

        const commit = blameLine.commit;
        const dateFormat = vscode.workspace.getConfiguration('minimalGitFileHistory').get<'relative' | 'absolute' | 'both'>('dateFormat', 'relative');

        // Create hover content similar to GitHub
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;

        markdown.appendMarkdown(`**${commit.author}**`);
        markdown.appendText(` <${commit.email}>\n\n`);
        markdown.appendMarkdown(`\`${getShortHash(commit.hash)}\` • ${formatDate(commit.date, dateFormat)}\n\n`);
        markdown.appendMarkdown(`**${commit.message}**`);

        return new vscode.Hover(markdown);
      },
    });

    this.disposables.push(hoverProvider);
  }

  /**
   * Checks if a file path belongs to a temporary diff file.
   * @param filePath - The file path to check
   * @returns true if the file is a temporary diff file
   * @private
   */
  private isDiffTempFile(filePath: string): boolean {
    return filePath.startsWith(this.tempDir) && (filePath.includes('.left') || filePath.includes('.right'));
  }

  /**
   * Loads and caches blame information for a temporary diff file.
   * @param fileUri - The URI of the temporary file
   * @param commitHash - The commit hash to get blame information for
   * @param originalFilePath - The original file path in the repository
   */
  async setBlameForFile(fileUri: vscode.Uri, commitHash: string, originalFilePath: string): Promise<void> {
    try {
      const blameLines = await this.gitService.getBlameAtCommit(originalFilePath, commitHash);
      this.blameCache.set(fileUri.fsPath, blameLines);
    } catch (error) {
      console.log('Could not get blame for diff file:', error);
    }
  }

  /**
   * Clears cached blame information for a specific file or all files.
   * @param filePath - Optional file path to clear cache for (clears all if not provided)
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.blameCache.delete(filePath);
    } else {
      this.blameCache.clear();
    }
  }

  /**
   * Disposes of all resources and clears caches.
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.blameCache.clear();
  }
}
