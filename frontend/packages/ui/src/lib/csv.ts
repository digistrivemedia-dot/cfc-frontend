/**
 * CSV export.
 *
 * Runs entirely in the browser — the rows are already in memory, so there is no
 * reason to ask a server for a file the client can build itself.
 */

/**
 * Escapes one cell.
 *
 * A customer named O'Brien, an address containing a comma, or a service note
 * with a line break all corrupt a naive CSV. Anything containing a quote, comma,
 * or newline is quoted, and inner quotes are doubled.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => cell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => cell(c.value(row))).join(","))
    .join("\r\n");
  return `${head}\r\n${body}`;
}

/**
 * Triggers a download.
 *
 * The BOM is deliberate: without it Excel on Windows reads UTF-8 as the system
 * codepage and mangles every non-ASCII name in the file.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
