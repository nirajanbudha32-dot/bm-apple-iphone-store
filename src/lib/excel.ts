import * as XLSX from "xlsx";

function sanitizeCellValue(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + val;
  }
  return val;
}

export function exportRows(rows: Record<string, unknown>[], sheetName: string, fileName: string) {
  const sanitized = rows.map((row) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k] = sanitizeCellValue(v);
    }
    return clean;
  });
  const ws = XLSX.utils.json_to_sheet(sanitized);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
