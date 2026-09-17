import type { Grid } from "./read";

const SCAN_ROWS = 20;
/** Only digits and the marks numbers and dates are written with. */
const NUMBER_OR_DATE = /^(?=.*\d)[\d\s.,:+/\-€$£%]+$/;

/**
 * The grid line that holds the column headers. Excel sheets often open with a
 * title ("Clientes 2025") or a blank area, so this is the first line with at
 * least two labels, none of them a number or a date, that is at least as wide
 * as the line under it. 0 when nothing fits; the wizard lets the agent move it.
 */
export function findHeaderRow(grid: Grid): number {
  const last = Math.min(grid.length, SCAN_ROWS);
  for (let r = 0; r < last; r++) {
    const labels = grid[r].filter(Boolean);
    if (labels.length < 2) continue;
    if (labels.some((label) => NUMBER_OR_DATE.test(label))) continue;
    const next = grid[r + 1];
    if (next && next.filter(Boolean).length > labels.length) continue;
    return r;
  }
  return 0;
}
