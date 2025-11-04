import * as vscode from 'vscode';
import { GitService } from './gitService';
import { BlameLine } from './types';
import { formatDate, getShortHash } from './utils';

/**
 * Provides Git blame annotations (CodeLens) for regular files in the editor.
 * Shows who last modified each line and allows clicking to jump to that commit.
 */
export class BlameProvider {
  private gitService: GitService;
  private codeLensProvider: vscode.CodeLensProvider;
  private disposables: vscode.Disposable[] = [];
  private blameCache: Map<string, BlameLine[]> = new Map();
  private enabled: boolean = false;
  private currentDocument: vscode.TextDocument | undefined;

  /**
   * Creates a new BlameProvider instance.
   * @param gitService - The GitService instance to use for Git operations
   */
  constructor(gitService: GitService) {
    this.gitService = gitService;

    this.codeLensProvider = {
      provideCodeLenses: async (document: vscode.TextDocument): Promise<vscode.CodeLens[]> => {
        if (!this.enabled || document.uri.scheme !== 'file') {
          return [];
        }

        const config = vscode.workspace.getConfiguration('minimalGitFileHistory');
        if (!config.get<boolean>('blameEnabled', true)) {
          return [];
        }

        try {
          const blameLines = await this.getBlame(document.uri.fsPath);
          const codeLenses: vscode.CodeLens[] = [];

          for (const blameLine of blameLines) {
            const range = new vscode.Range(blameLine.line - 1, 0, blameLine.line - 1, 0);
            const commit = blameLine.commit;
            const dateFormat = config.get<'relative' | 'absolute' | 'both'>('dateFormat', 'relative');

            const lens = new vscode.CodeLens(range, {
              title: `${commit.author} • ${getShortHash(commit.hash)} • ${formatDate(commit.date, dateFormat)}`,
              command: 'minimalGitFileHistory.viewCommit',
              arguments: [document.uri.fsPath, commit.hash],
              tooltip: `${commit.author} <${commit.email}>\n${getShortHash(commit.hash)}\n${formatDate(commit.date, 'both')}\n\n${commit.message}`,
            });

            codeLenses.push(lens);
          }

          return codeLenses;
        } catch (error) {
          return [];
        }
      },
    };

    const registration = vscode.languages.registerCodeLensProvider('*', this.codeLensProvider);
    this.disposables.push(registration);
  }

  /**
   * Toggles blame annotations on or off for a specific file.
   * @param filePath - Optional file path to toggle blame for
   */
  async toggle(filePath?: string): Promise<void> {
    this.enabled = !this.enabled;

    if (this.enabled && filePath) {
      const document = await vscode.workspace.openTextDocument(filePath);
      this.currentDocument = document;

      // Refresh code lenses
      await this.refresh(document);
    } else {
      this.currentDocument = undefined;
    }

    // Refresh all visible text editors
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.scheme === 'file') {
        await this.refresh(editor.document);
      }
    }
  }

  /**
   * Refreshes blame annotations for a specific document.
   * @param document - Optional document to refresh (defaults to current document)
   */
  async refresh(document?: vscode.TextDocument): Promise<void> {
    const doc = document || this.currentDocument;
    if (!doc) {
      return;
    }

    // Clear cache for this file
    this.blameCache.delete(doc.uri.fsPath);

    // Trigger code lens refresh
    vscode.commands.executeCommand('vscode.executeCodeLensProvider', doc.uri);
  }

  /**
   * Gets blame information for a file (cached).
   * @param filePath - The file path to get blame for
   * @returns Array of BlameLine objects
   * @private
   */
  private async getBlame(filePath: string): Promise<BlameLine[]> {
    // Check cache first
    if (this.blameCache.has(filePath)) {
      return this.blameCache.get(filePath)!;
    }

    try {
      const blameLines = await this.gitService.getBlame(filePath);
      this.blameCache.set(filePath, blameLines);
      return blameLines;
    } catch (error) {
      return [];
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
