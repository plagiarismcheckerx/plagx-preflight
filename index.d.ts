export type Level = 'error' | 'warning' | 'info';
export type Style = 'apa' | 'mla';
export type Check = 'length' | 'references' | 'punctuation' | 'grammar' | 'passive-voice';

export interface Options {
  /** Minimum word count (reference list excluded). */
  minWords?: number;
  /** Maximum word count (reference list excluded). */
  maxWords?: number;
  /** Citation pattern to look for. Default 'apa'. */
  style?: Style;
  /** Check groups to run. Default: all except 'passive-voice'. */
  checks?: Check[];
  /** Headings the draft should contain, e.g. ['Introduction', 'Conclusion']. */
  requiredHeadings?: string[];
}

export interface Stats {
  words: number;
  sentences: number;
  paragraphs: number;
  /** Unicode code points in the whole text. */
  characters: number;
  readingTimeMinutes: number;
  fleschReadingEase: number;
}

export interface Issue {
  level: Level;
  code: string;
  message: string;
  /** UTF-16 code-unit offset. */
  start: number;
  /** UTF-16 code-unit offset (exclusive). */
  end: number;
  line: number;
  column: number;
  text: string;
  suggestion: string | null;
}

export interface Result {
  stats: Stats;
  errors: number;
  warnings: number;
  infos: number;
  issues: Issue[];
}

export interface Span {
  text: string;
  start: number;
  end: number;
}

export interface Citation extends Span {
  author: string;
  key: string;
  year: string | null;
}

export function checkDraft(text: string, options?: Options): Result;
export function countWords(text: string): number;
export function splitSentences(text: string): Span[];
export function findCitations(text: string, style?: Style): Citation[];
export const VERSION: string;
export const CHECKS: Check[];
export const DEFAULT_CHECKS: Check[];
export const STYLES: Style[];
