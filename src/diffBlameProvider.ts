import * as vscode from 'vscode';
import { GitService } from './gitService';
import { BlameLine } from './types';
import { formatDate, getShortHash } from './utils';
import * as path from 'path';
import * as os from 'os';

export class DiffBlameProvider {
  private gitService: GitService;
  private disposables: vscode.Disposable[] = [];
  private blameCache: Map<string, BlameLine[]> = new Map();
  private tempDir: string;

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

  private isDiffTempFile(filePath: string): boolean {
    return filePath.startsWith(this.tempDir) && (filePath.includes('.left') || filePath.includes('.right'));
  }

  async setBlameForFile(fileUri: vscode.Uri, commitHash: string, originalFilePath: string): Promise<void> {
    try {
      const blameLines = await this.gitService.getBlameAtCommit(originalFilePath, commitHash);
      this.blameCache.set(fileUri.fsPath, blameLines);
    } catch (error) {
      console.log('Could not get blame for diff file:', error);
    }
  }

  clearCache(filePath?: string): void {
    if (filePath) {
      this.blameCache.delete(filePath);
    } else {
      this.blameCache.clear();
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.blameCache.clear();
  }
}
