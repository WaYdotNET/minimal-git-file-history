import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { GitService } from './gitService';
import { FileHistoryProvider, CommitTreeItem } from './fileHistoryView';
import { DiffViewer } from './diffViewer';
import { BlameProvider } from './blameProvider';
import { DiffBlameProvider } from './diffBlameProvider';

let gitService: GitService;
let fileHistoryProvider: FileHistoryProvider;
let diffViewer: DiffViewer;
let blameProvider: BlameProvider;
let diffBlameProvider: DiffBlameProvider;

export function activate(context: vscode.ExtensionContext) {
  // Initialize services
  gitService = new GitService();
  fileHistoryProvider = new FileHistoryProvider(gitService);
  diffBlameProvider = new DiffBlameProvider(gitService);
  diffViewer = new DiffViewer(gitService, diffBlameProvider);
  blameProvider = new BlameProvider(gitService);

  // Register tree view
  const treeView = vscode.window.createTreeView('gitFileHistory.view', {
    treeDataProvider: fileHistoryProvider,
    showCollapseAll: true,
    canSelectMany: true, // Enable multi-selection for comparing commits
  });

  // Handle commit selection - compare when 2 commits are selected
  treeView.onDidChangeSelection(async (e) => {
    const selectedItems = e.selection.filter(item => item instanceof CommitTreeItem) as CommitTreeItem[];

    // Skip if no commits selected
    if (selectedItems.length === 0) {
      return;
    }

    // If exactly 2 commits are selected, show diff between them
    if (selectedItems.length === 2) {
      const [commit1, commit2] = selectedItems;

      // Ensure they're from the same file
      if (commit1.filePath !== commit2.filePath) {
        vscode.window.showWarningMessage('Selected commits must be from the same file');
        return;
      }

      try {
        // Get commits in chronological order (newest first)
        const commits = await gitService.getFileHistory(commit1.filePath, 100);
        const index1 = commits.findIndex(c => c.hash === commit1.commit.hash);
        const index2 = commits.findIndex(c => c.hash === commit2.commit.hash);

        // Determine which is older (higher index = older)
        let olderCommit: CommitTreeItem;
        let newerCommit: CommitTreeItem;

        if (index1 > index2) {
          // commit1 is older
          olderCommit = commit1;
          newerCommit = commit2;
        } else {
          // commit2 is older
          olderCommit = commit2;
          newerCommit = commit1;
        }

        // Show diff between the two commits
        await diffViewer.compareVersions(
          newerCommit.filePath,
          olderCommit.commit.hash,
          newerCommit.commit.hash
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to compare commits: ${error.message}`);
      }
    }
    // Single commit selection is handled by the command in CommitTreeItem
  });

  // Expose treeView to command handlers
  context.subscriptions.push(treeView);

  // Register commands
  const commands = [
    // Show file history
    vscode.commands.registerCommand('gitFileHistory.showHistory', async (uri?: vscode.Uri) => {
      try {
        const filePath = await getFilePath(uri);
        if (!filePath) {
          vscode.window.showWarningMessage('No file selected. Please select a file to view its Git history.');
          return;
        }

        // Check if Git is available
        const isGitRepo = await gitService.isGitRepository();
        if (!isGitRepo) {
          vscode.window.showErrorMessage('Not a Git repository. Please open a Git repository to use this feature.');
          return;
        }

        // Set the current file - this will trigger a refresh
        fileHistoryProvider.setCurrentFile(filePath);

        // Try to reveal the view (if not visible, it will be shown)
        try {
          const children = await fileHistoryProvider.getChildren();
          if (children.length > 0) {
            await treeView.reveal(children[0], { focus: true, expand: true });
          }
        } catch (error) {
          // If reveal fails, that's okay - the view will still update
          console.log('Could not reveal tree item:', error);
        }

        // Show info message
        const relativePath = vscode.workspace.asRelativePath(filePath);
        vscode.window.showInformationMessage(`Loading Git history for: ${relativePath}`);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to show Git history: ${error.message}`);
        console.error('Error in showHistory:', error);
      }
    }),

    // Toggle Git Blame
    vscode.commands.registerCommand('gitFileHistory.showBlame', async (uri?: vscode.Uri) => {
      const filePath = await getFilePath(uri);
      if (filePath) {
        await blameProvider.toggle(filePath);
      }
    }),

    // Compare with previous commit
    vscode.commands.registerCommand('gitFileHistory.compareWithPrevious', async (uri?: vscode.Uri, commitHash?: string) => {
      const filePath = await getFilePath(uri);
      if (!filePath) {
        return;
      }

      if (!commitHash) {
        // Get the most recent commit for this file
        const commits = await gitService.getFileHistory(filePath, 1);
        if (commits.length === 0) {
          vscode.window.showErrorMessage('No commits found for this file');
          return;
        }
        commitHash = commits[0].hash;
      }

      await diffViewer.compareWithPrevious(filePath, commitHash);
    }),

    // Compare with working directory
    vscode.commands.registerCommand('gitFileHistory.compareWithWorking', async (uri?: vscode.Uri, commitHash?: string) => {
      const filePath = await getFilePath(uri);
      if (filePath) {
        await diffViewer.compareWithWorking(filePath, commitHash);
      }
    }),

    // Compare two commits
    vscode.commands.registerCommand('gitFileHistory.compareVersions', async (uri?: vscode.Uri) => {
      const filePath = await getFilePath(uri);
      if (!filePath) {
        return;
      }

      // Get commits to select from
      const commits = await gitService.getFileHistory(filePath, 50);
      if (commits.length < 2) {
        vscode.window.showErrorMessage('Need at least 2 commits to compare');
        return;
      }

      const commit1Items = commits.map(c => ({
        label: c.message.substring(0, 50),
        description: `${c.hash.substring(0, 7)} - ${c.author}`,
        commit: c,
      }));

      const commit1 = await vscode.window.showQuickPick(commit1Items, {
        placeHolder: 'Select first commit',
      });

      if (!commit1) {
        return;
      }

      const commit2Items = commits
        .filter(c => c.hash !== commit1.commit.hash)
        .map(c => ({
          label: c.message.substring(0, 50),
          description: `${c.hash.substring(0, 7)} - ${c.author}`,
          commit: c,
        }));

      const commit2 = await vscode.window.showQuickPick(commit2Items, {
        placeHolder: 'Select second commit',
      });

      if (commit2) {
        await diffViewer.compareVersions(filePath, commit1.commit.hash, commit2.commit.hash);
      }
    }),

    // View file at commit - shows diff with previous commit (silent version that doesn't modify panel)
    vscode.commands.registerCommand('gitFileHistory.viewCommitSilent', async (filePath: string, commitHash: string) => {
      try {
        // Get commits to find the previous one without modifying the panel
        // Use gitService directly to avoid triggering panel refresh
        const commits = await gitService.getFileHistory(filePath, 100);
        const currentIndex = commits.findIndex(c => c.hash === commitHash);

        if (currentIndex === -1) {
          // Commit not found in list, try to show diff with parent
          await diffViewer.compareWithPrevious(filePath, commitHash);
          return;
        }

        if (currentIndex < commits.length - 1) {
          // There is a previous (older) commit - show diff
          // commits[currentIndex] = current commit (newer)
          // commits[currentIndex + 1] = previous commit (older)
          const previousCommit = commits[currentIndex + 1];
          await diffViewer.compareVersions(filePath, previousCommit.hash, commitHash);
        } else {
          // This is the oldest commit (last in list) - compare with parent
          await diffViewer.compareWithPrevious(filePath, commitHash);
        }
      } catch (error: any) {
        // Fallback: try to show diff with parent
        await diffViewer.compareWithPrevious(filePath, commitHash);
      }
    }),

    // View file at commit - shows diff with previous commit
    vscode.commands.registerCommand('gitFileHistory.viewCommit', async (arg1?: string | CommitTreeItem, commitHash?: string) => {
      // Handle both cases: called with arguments or from menu context (CommitTreeItem)
      let filePath: string;
      let hash: string;

      if (arg1 instanceof CommitTreeItem) {
        // Called from menu context - extract from CommitTreeItem
        filePath = arg1.filePath;
        hash = arg1.commit.hash;
      } else if (typeof arg1 === 'string' && commitHash) {
        // Called with string arguments
        filePath = arg1;
        hash = commitHash;
      } else {
        vscode.window.showErrorMessage('Invalid arguments for viewCommit command');
        return;
      }

      try {
        // Get commits to find the previous one
        // Commits are ordered from newest to oldest (index 0 = most recent)
        const commits = await gitService.getFileHistory(filePath, 100);
        const currentIndex = commits.findIndex(c => c.hash === hash);

        if (currentIndex === -1) {
          // Commit not found in list, try to show diff with parent
          await diffViewer.compareWithPrevious(filePath, hash);
          return;
        }

        if (currentIndex < commits.length - 1) {
          // There is a previous (older) commit - show diff
          // commits[currentIndex] = current commit (newer)
          // commits[currentIndex + 1] = previous commit (older)
          const previousCommit = commits[currentIndex + 1];
          await diffViewer.compareVersions(filePath, previousCommit.hash, hash);
        } else {
          // This is the oldest commit (last in list) - compare with parent
          await diffViewer.compareWithPrevious(filePath, hash);
        }
      } catch (error: any) {
        // Fallback: try to show diff with parent
        await diffViewer.compareWithPrevious(filePath, hash);
      }
    }),

    // Refresh history
    vscode.commands.registerCommand('gitFileHistory.refresh', () => {
      fileHistoryProvider.refresh();
    }),

    // Open diff panel
    vscode.commands.registerCommand('gitFileHistory.openDiffPanel', async (uri?: vscode.Uri, commit1?: string, commit2?: string) => {
      const filePath = await getFilePath(uri);
      if (!filePath) {
        return;
      }

      const diff = await gitService.getDiff(filePath, commit1, commit2);
      await diffViewer.showDiffInPanel(diff, filePath, commit1, commit2);
    }),

  ];

  // Register all commands
  commands.forEach(command => context.subscriptions.push(command));

  // Register text document provider for git-file-history scheme
  const textDocumentProvider = new (class implements vscode.TextDocumentContentProvider {
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
      try {
        const filePath = decodeURIComponent(uri.path);
        const commitHash = uri.query;
        if (commitHash && filePath) {
          return await gitService.getFileContentAtCommit(filePath, commitHash);
        }
        return '';
      } catch (error: any) {
        return `Error loading file: ${error.message}`;
      }
    }
  })();

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('git-file-history', textDocumentProvider)
  );

  // Helper function to load file history automatically
  async function loadFileHistoryAuto(filePath: string, uri?: vscode.Uri): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('minimalGitHistory');
      const autoLoad = config.get<boolean>('autoLoadOnFileSelect', false);
      if (!autoLoad) {
        return;
      }

      // Exclude temporary diff files and git-file-history scheme files
      if (uri) {
        // Exclude git-file-history scheme files
        if (uri.scheme === 'git-file-history') {
          return;
        }

        // Exclude temporary diff files created by our extension
        const tempDir = path.join(os.tmpdir(), 'fz-git-file-histrory');
        if (uri.fsPath.includes(tempDir) || uri.fsPath.includes('.left') || uri.fsPath.includes('.right')) {
          return;
        }
      }

      // Exclude temporary diff files by path pattern
      const tempDirPattern = path.join(os.tmpdir(), 'fz-git-file-histrory');
      if (filePath.includes(tempDirPattern) || filePath.includes('.left') || filePath.includes('.right')) {
        return;
      }

      // Check if Git is available
      const isGitRepo = await gitService.isGitRepository();
      if (!isGitRepo) {
        return;
      }

      // Set the current file - this will trigger history loading
      fileHistoryProvider.setCurrentFile(filePath);

      // Try to reveal the view and expand the file node
      try {
        const children = await fileHistoryProvider.getChildren();
        if (children.length > 0) {
          await treeView.reveal(children[0], { focus: false, expand: true });
        }
      } catch (error) {
        // If reveal fails, that's okay - the view will still update
        console.log('Could not reveal tree item:', error);
      }
    } catch (error: any) {
      // Silently fail - don't show error messages for automatic loading
      console.log('Failed to auto-load file history:', error);
    }
  }

  // Handle file selection/opening - automatically load history when enabled
  const onDidChangeActiveTextEditorDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor) {
      // Only process file scheme, exclude git-file-history and temporary diff files
      if (editor.document.uri.scheme === 'file') {
        await loadFileHistoryAuto(editor.document.uri.fsPath, editor.document.uri);
      }
    }
  });

  // Also handle when a document is opened (in case it's not the active editor)
  const onDidOpenTextDocumentDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    // Only process file scheme, exclude git-file-history and temporary diff files
    if (document.uri.scheme === 'file') {
      // Only load if this is the active editor
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.fsPath === document.uri.fsPath) {
        await loadFileHistoryAuto(document.uri.fsPath, document.uri);
      }
    }
  });

  // Listen for configuration changes to react immediately
  const onDidChangeConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('minimalGitHistory.autoLoadOnFileSelect')) {
      // If auto-load was just enabled and there's an active editor, load its history
      const config = vscode.workspace.getConfiguration('minimalGitHistory');
      const autoLoad = config.get<boolean>('autoLoadOnFileSelect', false);

      if (autoLoad) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
          await loadFileHistoryAuto(activeEditor.document.uri.fsPath, activeEditor.document.uri);
        }
      }
    }
  });

  context.subscriptions.push(onDidChangeActiveTextEditorDisposable);
  context.subscriptions.push(onDidOpenTextDocumentDisposable);
  context.subscriptions.push(onDidChangeConfigurationDisposable);

  // Show welcome message (only once)
    const hasShownWelcome = context.globalState.get<boolean>('minimalGitHistory.hasShownWelcome', false);
    if (!hasShownWelcome) {
      vscode.window.showInformationMessage('Minimal Git file history extension is now active! Right-click a file to view its history.');
      context.globalState.update('minimalGitHistory.hasShownWelcome', true);
    }
}

export function deactivate() {
  blameProvider?.dispose();
  diffBlameProvider?.dispose();
}

async function getFilePath(uri?: vscode.Uri): Promise<string | undefined> {
  if (uri) {
    return uri.fsPath;
  }

  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.uri.scheme === 'file') {
    return editor.document.uri.fsPath;
  }

  // Prompt user to select a file
  const fileUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
  });

  return fileUri && fileUri.length > 0 ? fileUri[0].fsPath : undefined;
}
