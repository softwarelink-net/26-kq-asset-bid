/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }
  export interface Database {
    run(sql: string, params?: SqlValue[]): Database
    exec(sql: string): QueryExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }
  export interface Statement {
    bind(params?: SqlValue[]): boolean
    step(): boolean
    getAsObject(params?: SqlValue[]): Record<string, SqlValue>
    free(): void
  }
  export interface QueryExecResult {
    columns: string[]
    values: SqlValue[][]
  }
  export type SqlValue = string | number | null | Uint8Array
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}
