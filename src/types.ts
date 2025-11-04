export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  parentHashes: string[];
  children?: Commit[];
}

export interface FileChange {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions?: number;
  deletions?: number;
}

export interface BlameLine {
  line: number;
  commit: Commit;
  content: string;
}

export interface GitDiff {
  file: string;
  oldPath?: string;
  newPath?: string;
  oldContent?: string;
  newContent?: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'added' | 'removed';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface CompareOptions {
  file: string;
  commit1?: string;
  commit2?: string;
  compareWithWorking?: boolean;
}
