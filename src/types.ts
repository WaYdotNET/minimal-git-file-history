/**
 * Represents a Git commit with all relevant metadata.
 */
export interface Commit {
  /** Full commit hash (40 characters) */
  hash: string;
  /** Author name */
  author: string;
  /** Author email address */
  email: string;
  /** Commit date */
  date: Date;
  /** Commit message */
  message: string;
  /** Array of parent commit hashes */
  parentHashes: string[];
  /** Optional array of child commits (populated when building commit graph) */
  children?: Commit[];
}

/**
 * Represents a file change in a commit.
 */
export interface FileChange {
  /** File path relative to repository root */
  file: string;
  /** Type of change: added, modified, deleted, or renamed */
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Number of lines added (optional) */
  additions?: number;
  /** Number of lines deleted (optional) */
  deletions?: number;
}

/**
 * Represents a line in Git blame output.
 */
export interface BlameLine {
  /** Line number in the file (1-based) */
  line: number;
  /** Commit that last modified this line */
  commit: Commit;
  /** Content of the line */
  content: string;
}

/**
 * Represents a Git diff between two versions of a file.
 */
export interface GitDiff {
  /** File path relative to repository root */
  file: string;
  /** Original file path (for renamed files) */
  oldPath?: string;
  /** New file path (for renamed files) */
  newPath?: string;
  /** Content of the file in the older version */
  oldContent?: string;
  /** Content of the file in the newer version */
  newContent?: string;
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
  /** Array of diff hunks */
  hunks: DiffHunk[];
}

/**
 * Represents a hunk in a Git diff (a contiguous block of changes).
 */
export interface DiffHunk {
  /** Starting line number in the old version */
  oldStart: number;
  /** Number of lines in the old version */
  oldLines: number;
  /** Starting line number in the new version */
  newStart: number;
  /** Number of lines in the new version */
  newLines: number;
  /** Array of diff lines within this hunk */
  lines: DiffLine[];
}

/**
 * Represents a single line in a diff hunk.
 */
export interface DiffLine {
  /** Type of line: context (unchanged), added, or removed */
  type: 'context' | 'added' | 'removed';
  /** Content of the line */
  content: string;
  /** Line number in the old version (for context and removed lines) */
  oldLineNumber?: number;
  /** Line number in the new version (for context and added lines) */
  newLineNumber?: number;
}

/**
 * Options for comparing file versions.
 */
export interface CompareOptions {
  /** File path to compare */
  file: string;
  /** First commit hash (optional) */
  commit1?: string;
  /** Second commit hash (optional) */
  commit2?: string;
  /** Whether to compare with working directory */
  compareWithWorking?: boolean;
}
