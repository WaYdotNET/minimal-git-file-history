import * as vscode from 'vscode';
import { Commit } from './types';
import { GitService } from './gitService';
import { formatDate, truncateMessage, getShortHash } from './utils';

/**
 * Tree item representing a single commit in the file history view.
 */
export class CommitTreeItem extends vscode.TreeItem {
  /**
   * Creates a new CommitTreeItem.
   * @param commit - The commit object
   * @param filePath - The file path this commit belongs to
   * @param collapsibleState - The collapsible state of the tree item
   */
  constructor(
    public readonly commit: Commit,
    public readonly filePath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(commit.message, collapsibleState);

    const config = vscode.workspace.getConfiguration('minimalGitFileHistory');
    const dateFormat = config.get<'relative' | 'absolute' | 'both'>('dateFormat', 'relative');

    this.label = truncateMessage(commit.message);
    this.description = `${commit.author} • ${formatDate(commit.date, dateFormat)}`;
    this.tooltip = `${getShortHash(commit.hash)}\n${commit.author} <${commit.email}>\n${formatDate(commit.date, 'both')}\n\n${commit.message}`;
    this.contextValue = 'commit';

    // Command to view commit diff without modifying the panel
    this.command = {
      command: 'minimalGitFileHistory.viewCommitSilent',
      title: 'View Commit',
      arguments: [this.filePath, commit.hash],
    };
  }

  iconPath = new vscode.ThemeIcon('git-commit');
}

/**
 * Tree item representing a file in the file history view.
 */
export class FileHistoryTreeItem extends vscode.TreeItem {
  /**
   * Creates a new FileHistoryTreeItem.
   * @param filePath - The file path
   */
  constructor(public readonly filePath: string) {
    super(vscode.workspace.asRelativePath(filePath), vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = 'file';
    this.iconPath = vscode.ThemeIcon.File;
  }
}

/**
 * Tree data provider for the Git file history view.
 * Manages the display of file history and caches commit data.
 */
export class FileHistoryProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private commits: Map<string, Commit[]> = new Map();
  private currentFilePath: string | undefined;
  private gitService: GitService;

  /**
   * Creates a new FileHistoryProvider instance.
   * @param gitService - The GitService instance to use for Git operations
   */
  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  /**
   * Refreshes the tree view, optionally for a specific file.
   * @param filePath - Optional file path to refresh (clears cache for that file)
   */
  refresh(filePath?: string): void {
    this.currentFilePath = filePath;
    this.commits.delete(filePath || '');
    this._onDidChangeTreeData.fire();
  }

  /**
   * Gets the tree item representation of an element.
   * @param element - The tree item element
   * @returns The tree item
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Gets the children of a tree item.
   * @param element - The parent tree item (undefined for root)
   * @returns Array of child tree items
   */
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      // Root level - show current file or empty state
      if (this.currentFilePath) {
        return [new FileHistoryTreeItem(this.currentFilePath)];
      }
      return [new vscode.TreeItem('Select a file to view its Git history', vscode.TreeItemCollapsibleState.None)];
    }

    if (element instanceof FileHistoryTreeItem) {
      // Get commits for this file
      const filePath = element.filePath;
      let commits = this.commits.get(filePath);

      if (!commits) {
        try {
          const config = vscode.workspace.getConfiguration('minimalGitFileHistory');
          const maxCommits = config.get<number>('maxCommits', 100);

          commits = await this.gitService.getFileHistory(filePath, maxCommits);
          this.commits.set(filePath, commits);
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to load Git history: ${error.message}`);
          return [];
        }
      }

      if (commits.length === 0) {
        return [new vscode.TreeItem('No commits found', vscode.TreeItemCollapsibleState.None)];
      }

      return commits.map(commit => new CommitTreeItem(commit, filePath));
    }

    return [];
  }

  /**
   * Gets the parent of a tree item.
   * @param element - The child tree item
   * @returns The parent tree item, or undefined if no parent
   */
  async getParent(element: vscode.TreeItem): Promise<vscode.TreeItem | undefined> {
    if (element instanceof CommitTreeItem) {
      return new FileHistoryTreeItem(element.filePath);
    }
    return undefined;
  }

  /**
   * Sets the current file and refreshes the view.
   * @param filePath - The file path to display history for
   */
  setCurrentFile(filePath: string): void {
    this.currentFilePath = filePath;
    // Clear cache to force reload
    this.commits.delete(filePath);
    this.refresh(filePath);
  }

  /**
   * Clears the current file and refreshes the view.
   */
  clearCurrentFile(): void {
    this.currentFilePath = undefined;
    this.refresh();
  }
}
