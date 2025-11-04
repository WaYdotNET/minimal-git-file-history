import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { Commit, BlameLine, GitDiff, FileChange } from './types';
import { getWorkspaceRoot, getRelativePath } from './utils';

const execAsync = promisify(exec);

export class GitService {
  private workspaceRoot: string | undefined;

  constructor() {
    this.workspaceRoot = getWorkspaceRoot();
  }

  private async executeGitCommand(command: string, cwd?: string): Promise<string> {
    const workDir = cwd || this.workspaceRoot;
    if (!workDir) {
      throw new Error('No workspace folder found');
    }

    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, {
        cwd: workDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes('warning:')) {
        throw new Error(stderr);
      }

      return stdout.trim();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('Git is not installed or not in PATH');
      }
      throw error;
    }
  }

  async getFileHistory(filePath: string, maxCommits: number = 100): Promise<Commit[]> {
    const relativePath = this.workspaceRoot
      ? getRelativePath(filePath, this.workspaceRoot)
      : path.basename(filePath);

    // Escape special characters in path
    const escapedPath = relativePath.replace(/"/g, '\\"');

    const format = '%H|%an|%ae|%ai|%P|%s';
    const command = `log --format="${format}" --max-count=${maxCommits} --follow -- "${escapedPath}"`;

    const output = await this.executeGitCommand(command);
    if (!output) {
      return [];
    }

    const commits: Commit[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split('|');
      if (parts.length < 6) continue;

      const [hash, author, email, dateStr, parentStr, ...messageParts] = parts;
      const message = messageParts.join('|');
      const parentHashes = parentStr.trim() ? parentStr.trim().split(' ') : [];

      // Parse date: YYYY-MM-DD HH:MM:SS +TIMEZONE
      const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      const date = dateMatch ? new Date(dateMatch[1]) : new Date();

      commits.push({
        hash: hash.trim(),
        author: author.trim(),
        email: email.trim(),
        date,
        message: message.trim(),
        parentHashes,
      });
    }

    return commits;
  }

  async getFileContentAtCommit(filePath: string, commitHash: string): Promise<string> {
    const relativePath = this.workspaceRoot
      ? getRelativePath(filePath, this.workspaceRoot)
      : path.basename(filePath);

    const escapedPath = relativePath.replace(/"/g, '\\"');
    const command = `show ${commitHash}:${escapedPath}`;

    try {
      return await this.executeGitCommand(command);
    } catch (error) {
      // File might not exist at this commit
      return '';
    }
  }

  async getBlameAtCommit(filePath: string, commitHash: string): Promise<BlameLine[]> {
    const relativePath = this.workspaceRoot
      ? getRelativePath(filePath, this.workspaceRoot)
      : path.basename(filePath);

    const escapedPath = relativePath.replace(/"/g, '\\"');
    const command = `blame --line-porcelain ${commitHash} -- "${escapedPath}"`;

    try {
      const output = await this.executeGitCommand(command);
      if (!output) {
        return [];
      }

      const lines = output.split('\n');
      const blameLines: BlameLine[] = [];
      const commitMap = new Map<string, Commit>();
      let currentCommitHash = '';
      let currentCommit: Partial<Commit> = {};
      let currentLineStart = 0;
      let currentLineCount = 0;
      let currentLineIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Commit hash line: <hash> <original-line> <final-line> <num-lines>
        if (line.match(/^[0-9a-f]{40}\s+\d+\s+\d+\s+\d+/)) {
          const parts = line.split(/\s+/);
          currentCommitHash = parts[0];
          currentLineStart = parseInt(parts[2], 10); // final-line (line number in current file)
          currentLineCount = parseInt(parts[3], 10); // num-lines
          currentLineIndex = 0;

          // Check if we already have this commit cached
          if (commitMap.has(currentCommitHash)) {
            currentCommit = commitMap.get(currentCommitHash)!;
          } else {
            currentCommit = { hash: currentCommitHash, parentHashes: [] };
          }
        } else if (line.startsWith('author ')) {
          currentCommit.author = line.substring(7).trim();
        } else if (line.startsWith('author-mail ')) {
          currentCommit.email = line.substring(12).trim().replace(/[<>]/g, '');
        } else if (line.startsWith('author-time ')) {
          const timestamp = parseInt(line.substring(12).trim(), 10);
          currentCommit.date = new Date(timestamp * 1000);
        } else if (line.startsWith('summary ')) {
          currentCommit.message = line.substring(8).trim();
        } else if (line.startsWith('previous ')) {
          const prevHash = line.substring(9).split(' ')[0];
          if (currentCommit.parentHashes) {
            currentCommit.parentHashes.push(prevHash);
          } else {
            currentCommit.parentHashes = [prevHash];
          }
        } else if (line.startsWith('\t')) {
          // Line content (starts with tab)
          const content = line.substring(1);
          if (currentCommit.hash && currentLineIndex < currentLineCount) {
            // Cache the commit if not already cached
            if (!commitMap.has(currentCommit.hash)) {
              commitMap.set(currentCommit.hash, currentCommit as Commit);
            }

            const lineNumber = currentLineStart + currentLineIndex;
            blameLines.push({
              line: lineNumber,
              commit: currentCommit as Commit,
              content,
            });
            currentLineIndex++;
          }
        }
      }

      return blameLines;
    } catch (error) {
      console.error('Error getting blame at commit:', error);
      return [];
    }
  }

  async getBlame(filePath: string): Promise<BlameLine[]> {
    const relativePath = this.workspaceRoot
      ? getRelativePath(filePath, this.workspaceRoot)
      : path.basename(filePath);

    const escapedPath = relativePath.replace(/"/g, '\\"');
    const command = `blame --line-porcelain -- "${escapedPath}"`;

    try {
      const output = await this.executeGitCommand(command);
      if (!output) {
        return [];
      }

      const lines = output.split('\n');
      const blameLines: BlameLine[] = [];
      const commitMap = new Map<string, Commit>();
      let currentCommitHash = '';
      let currentCommit: Partial<Commit> = {};
      let currentLineStart = 0;
      let currentLineCount = 0;
      let currentLineIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Commit hash line: <hash> <original-line> <final-line> <num-lines>
        if (line.match(/^[0-9a-f]{40}\s+\d+\s+\d+\s+\d+/)) {
          const parts = line.split(/\s+/);
          currentCommitHash = parts[0];
          currentLineStart = parseInt(parts[2], 10); // final-line (line number in current file)
          currentLineCount = parseInt(parts[3], 10); // num-lines
          currentLineIndex = 0;

          // Check if we already have this commit cached
          if (commitMap.has(currentCommitHash)) {
            currentCommit = commitMap.get(currentCommitHash)!;
          } else {
            currentCommit = { hash: currentCommitHash, parentHashes: [] };
          }
        } else if (line.startsWith('author ')) {
          currentCommit.author = line.substring(7).trim();
        } else if (line.startsWith('author-mail ')) {
          currentCommit.email = line.substring(12).trim().replace(/[<>]/g, '');
        } else if (line.startsWith('author-time ')) {
          const timestamp = parseInt(line.substring(12).trim(), 10);
          currentCommit.date = new Date(timestamp * 1000);
        } else if (line.startsWith('summary ')) {
          currentCommit.message = line.substring(8).trim();
        } else if (line.startsWith('previous ')) {
          const prevHash = line.substring(9).split(' ')[0];
          if (currentCommit.parentHashes) {
            currentCommit.parentHashes.push(prevHash);
          } else {
            currentCommit.parentHashes = [prevHash];
          }
        } else if (line.startsWith('\t')) {
          // Line content (starts with tab)
          const content = line.substring(1);
          if (currentCommit.hash && currentLineIndex < currentLineCount) {
            // Cache the commit if not already cached
            if (!commitMap.has(currentCommit.hash)) {
              commitMap.set(currentCommit.hash, currentCommit as Commit);
            }

            const lineNumber = currentLineStart + currentLineIndex;
            blameLines.push({
              line: lineNumber,
              commit: currentCommit as Commit,
              content,
            });
            currentLineIndex++;
          }
        }
      }

      return blameLines;
    } catch (error) {
      console.error('Error getting blame:', error);
      return [];
    }
  }

  async getDiff(
    filePath: string,
    commit1?: string,
    commit2?: string,
    compareWithWorking: boolean = false
  ): Promise<GitDiff> {
    const relativePath = this.workspaceRoot
      ? getRelativePath(filePath, this.workspaceRoot)
      : path.basename(filePath);

    const escapedPath = relativePath.replace(/"/g, '\\"');

    let command: string;
    if (compareWithWorking) {
      // Compare commit with working directory
      command = commit1
        ? `diff --no-ext-diff ${commit1.trim()} -- "${escapedPath}"`
        : `diff --no-ext-diff -- "${escapedPath}"`;
    } else if (commit1 && commit2) {
      // Compare two commits - trim to avoid whitespace issues
      const hash1 = commit1.trim();
      const hash2 = commit2.trim();
      command = `diff --no-ext-diff ${hash1} ${hash2} -- "${escapedPath}"`;
    } else if (commit1) {
      // Compare commit with its parent - get parent hash explicitly
      const hash = commit1.trim();
      try {
        // Get parent commit hash
        const parentHash = await this.executeGitCommand(`rev-parse ${hash}^`);
        const parentHashTrimmed = parentHash.trim();
        command = `diff --no-ext-diff ${parentHashTrimmed} ${hash} -- "${escapedPath}"`;
      } catch {
        // If parent doesn't exist (e.g., initial commit), compare with empty tree
        command = `diff --no-ext-diff ${hash} -- "${escapedPath}"`;
      }
    } else {
      // Compare HEAD with working directory
      command = `diff --no-ext-diff HEAD -- "${escapedPath}"`;
    }

    const output = await this.executeGitCommand(command);

    // Parse unified diff format
    const hunks = this.parseDiffHunks(output);
    const stats = this.parseDiffStats(output);

    let oldContent = '';
    let newContent = '';

    if (compareWithWorking) {
      // Get old content from commit
      if (commit1) {
        oldContent = await this.getFileContentAtCommit(filePath, commit1.trim());
      }
      // Get new content from working directory
      try {
        const fs = await import('fs/promises');
        newContent = await fs.readFile(filePath, 'utf-8');
      } catch {
        newContent = '';
      }
    } else if (commit1 && commit2) {
      oldContent = await this.getFileContentAtCommit(filePath, commit1.trim());
      newContent = await this.getFileContentAtCommit(filePath, commit2.trim());
    } else if (commit1) {
      // Compare with parent - get parent hash
      const hash = commit1.trim();
      try {
        const parentHash = await this.executeGitCommand(`rev-parse ${hash}^`);
        oldContent = await this.getFileContentAtCommit(filePath, parentHash.trim());
      } catch {
        oldContent = '';
      }
      newContent = await this.getFileContentAtCommit(filePath, hash);
    }

    return {
      file: relativePath,
      oldContent,
      newContent,
      additions: stats.additions,
      deletions: stats.deletions,
      hunks,
    };
  }

  private parseDiffHunks(diffOutput: string): GitDiff['hunks'] {
    const hunks: GitDiff['hunks'] = [];
    const lines = diffOutput.split('\n');

    let currentHunk: Partial<GitDiff['hunks'][0]> | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // New hunk header: @@ -oldStart,oldLines +newStart,newLines @@
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          if (currentHunk) {
            hunks.push(currentHunk as GitDiff['hunks'][0]);
          }
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[3], 10);
          currentHunk = {
            oldStart: oldLineNum,
            oldLines: parseInt(match[2] || '1', 10),
            newStart: newLineNum,
            newLines: parseInt(match[4] || '1', 10),
            lines: [],
          };
        }
      } else if (currentHunk && line.startsWith(' ')) {
        // Context line
        currentHunk.lines!.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
      } else if (currentHunk && line.startsWith('-')) {
        // Removed line
        currentHunk.lines!.push({
          type: 'removed',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
        });
      } else if (currentHunk && line.startsWith('+')) {
        // Added line
        currentHunk.lines!.push({
          type: 'added',
          content: line.substring(1),
          newLineNumber: newLineNum++,
        });
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk as GitDiff['hunks'][0]);
    }

    return hunks;
  }

  private parseDiffStats(diffOutput: string): { additions: number; deletions: number } {
    let additions = 0;
    let deletions = 0;

    for (const line of diffOutput.split('\n')) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return { additions, deletions };
  }

  async getCommitFiles(commitHash: string): Promise<FileChange[]> {
    const command = `show --name-status --format="" ${commitHash}`;
    const output = await this.executeGitCommand(command);

    const changes: FileChange[] = [];
    for (const line of output.split('\n')) {
      if (!line.trim()) continue;

      const match = line.match(/^([AMD]|R\d+)\s+(.+)$/);
      if (match) {
        const status = match[1];
        const file = match[2];

        let changeType: FileChange['status'] = 'modified';
        if (status === 'A') {
          changeType = 'added';
        } else if (status === 'D') {
          changeType = 'deleted';
        } else if (status.startsWith('R')) {
          changeType = 'renamed';
        }

        changes.push({
          file,
          status: changeType,
        });
      }
    }

    return changes;
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.executeGitCommand('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      return await this.executeGitCommand('rev-parse --abbrev-ref HEAD');
    } catch {
      return '';
    }
  }
}
