import { IMPORT_BATCH_ROWS } from "@/lib/validation/import";

/*
  `import_clients()` takes at most 200 rows, and a Server Action body at most
  1 MB. Notes can reach 5 KB a row, so a batch is also kept under 500 KB.
*/
const MAX_BATCH_BYTES = 500_000;

export function toBatches<T>(
  rows: T[],
  { maxRows = IMPORT_BATCH_ROWS, maxBytes = MAX_BATCH_BYTES } = {}
): T[][] {
  const encoder = new TextEncoder();
  const batches: T[][] = [];
  let batch: T[] = [];
  let bytes = 0;
  for (const row of rows) {
    const size = encoder.encode(JSON.stringify(row)).length;
    if (batch.length > 0 && (batch.length >= maxRows || bytes + size > maxBytes)) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(row);
    bytes += size;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}
