// Minimal ambient types for the built-in `node:sqlite` module (Node 22.5+,
// available behind the --experimental-sqlite flag). @types/node@20 does not
// ship these typings yet, so we declare the subset used by the app.

declare module 'node:sqlite' {
  export interface SqliteResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface StatementSync {
    run(...params: unknown[]): SqliteResult;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
    iterate(...params: unknown[]): IterableIterator<Record<string, unknown>>;
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}