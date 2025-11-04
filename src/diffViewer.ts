import * as vscode from 'vscode';
import { GitService } from './gitService';
import { GitDiff } from './types';
import { DiffBlameProvider } from './diffBlameProvider';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export class DiffViewer {
  private gitService: GitService;
  private blameProvider: DiffBlameProvider;

  constructor(gitService: GitService, blameProvider: DiffBlameProvider) {
    this.gitService = gitService;
    this.blameProvider = blameProvider;
  }

  async compareWithPrevious(filePath: string, commitHash: string): Promise<void> {
    try {
      const diff = await this.gitService.getDiff(filePath, commitHash);
      // Get parent commit hash for blame
      let parentHash: string | undefined;
      try {
        const parentHashOutput = await this.gitService['executeGitCommand'](`rev-parse ${commitHash}^`);
        parentHash = parentHashOutput.trim();
      } catch {
        // Parent doesn't exist, skip blame for left side
      }
      await this.showDiff(diff, filePath, `${commitHash}^`, commitHash, parentHash, commitHash);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to compare with previous: ${error.message}`);
    }
  }

  async compareWithWorking(filePath: string, commitHash?: string): Promise<void> {
    try {
      const diff = await this.gitService.getDiff(filePath, commitHash, undefined, true);
      const oldLabel = commitHash ? `Commit ${commitHash.substring(0, 7)}` : 'HEAD';
      await this.showDiff(diff, filePath, oldLabel, 'Working Directory', commitHash || 'HEAD', undefined);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to compare with working directory: ${error.message}`);
    }
  }

  async compareVersions(filePath: string, commit1: string, commit2: string): Promise<void> {
    try {
      const diff = await this.gitService.getDiff(filePath, commit1, commit2);
      await this.showDiff(diff, filePath, commit1, commit2, commit1, commit2);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to compare versions: ${error.message}`);
    }
  }

  async viewFileAtCommit(filePath: string, commitHash: string): Promise<void> {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const uri = vscode.Uri.parse(`git-file-history:${encodedPath}?${commitHash}`);

      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to view file at commit: ${error.message}`);
    }
  }

  private async showDiff(diff: GitDiff, filePath: string, leftLabel: string, rightLabel: string, leftCommitHash?: string, rightCommitHash?: string): Promise<void> {
    try {
      // Create temporary files for the diff
      const tempDir = path.join(os.tmpdir(), 'fz-git-file-histrory');
      await fs.mkdir(tempDir, { recursive: true });

      const fileName = path.basename(filePath);
      // Extract base name and extension separately to preserve the extension
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);

      // Sanitize labels for file names (remove invalid characters)
      const sanitizeLabel = (label: string) => label.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');

      // Create file names with extension preserved: baseName.label.left.ext
      const leftUri = vscode.Uri.file(path.join(tempDir, `${baseName}.${sanitizeLabel(leftLabel)}.left${ext}`));
      const rightUri = vscode.Uri.file(path.join(tempDir, `${baseName}.${sanitizeLabel(rightLabel)}.right${ext}`));

      // Write file contents
      await fs.writeFile(leftUri.fsPath, diff.oldContent || '', 'utf-8');
      await fs.writeFile(rightUri.fsPath, diff.newContent || '', 'utf-8');

      // Try to extract commit hashes from labels if not provided
      let leftHash = leftCommitHash;
      let rightHash = rightCommitHash;

      if (!leftHash) {
        const leftCommitMatch = leftLabel.match(/([0-9a-f]{7,40})/);
        if (leftCommitMatch) {
          leftHash = leftCommitMatch[1];
        }
      }

      if (!rightHash) {
        const rightCommitMatch = rightLabel.match(/([0-9a-f]{7,40})/);
        if (rightCommitMatch) {
          rightHash = rightCommitMatch[1];
        }
      }

      // Get full commit hashes if we have short hashes
      if (leftHash && leftHash.length < 40) {
        try {
          const fullHash = await this.gitService['executeGitCommand'](`rev-parse ${leftHash}`);
          leftHash = fullHash.trim();
        } catch {
          // Keep original hash if rev-parse fails
        }
      }

      if (rightHash && rightHash.length < 40) {
        try {
          const fullHash = await this.gitService['executeGitCommand'](`rev-parse ${rightHash}`);
          rightHash = fullHash.trim();
        } catch {
          // Keep original hash if rev-parse fails
        }
      }

      // Load blame information for both files (async, won't block diff opening)
      if (leftHash && diff.oldContent && leftHash !== 'Working Directory') {
        this.blameProvider.setBlameForFile(leftUri, leftHash, filePath).catch(() => {});
      }

      if (rightHash && diff.newContent && rightHash !== 'Working Directory') {
        this.blameProvider.setBlameForFile(rightUri, rightHash, filePath).catch(() => {});
      }

      // Open diff view
      await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${leftLabel} ↔ ${rightLabel}`);

      // Clean up temp files after a delay
      setTimeout(async () => {
        try {
          this.blameProvider.clearCache(leftUri.fsPath);
          this.blameProvider.clearCache(rightUri.fsPath);
          await fs.unlink(leftUri.fsPath).catch(() => {});
          await fs.unlink(rightUri.fsPath).catch(() => {});
        } catch {
          // Ignore cleanup errors
        }
      }, 60000); // Clean up after 60 seconds
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to show diff: ${error.message}`);
    }
  }

  async showDiffInPanel(diff: GitDiff, filePath: string, commit1?: string, commit2?: string): Promise<void> {
    // This would open a webview panel with detailed diff view
    // For now, we'll use the built-in diff viewer
    const leftLabel = commit1 ? commit1.substring(0, 7) : 'HEAD';
    const rightLabel = commit2 ? commit2.substring(0, 7) : 'Working Directory';
    await this.showDiff(diff, filePath, leftLabel, rightLabel);
  }
}
