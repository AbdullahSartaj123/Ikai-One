export function escapeCsvCell(value) {
  const cell = String(value ?? '')
  const safe = /^[\u0000-\u0020]*[=+\-@]/.test(cell) ? "'" + cell : cell
  return '"' + safe.replaceAll('"', '""') + '"'
}

export function toCsv(rows) {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
}
