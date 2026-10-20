export interface BulkOrderColorRow {
  color: string;
  hex?: string;
  sizes: Record<string, number>;
}

/**
 * Normalise the DB `sizeColorMatrix` JSON into the `colorRows` shape used by
 * the customer request page and the admin detail panel.
 *
 * DB rows look like: { colorName, colorHex, quantities, total }
 * UI rows look like: { color, hex, sizes }
 */
export function mapSizeColorMatrixToColorRows(matrix: unknown): BulkOrderColorRow[] {
  if (!Array.isArray(matrix)) return [];

  return matrix
    .map((raw): BulkOrderColorRow | null => {
      if (!raw || typeof raw !== 'object') return null;
      const row = raw as Record<string, unknown>;

      const color =
        typeof row.color === 'string'
          ? row.color
          : typeof row.colorName === 'string'
            ? row.colorName
            : '';
      if (!color) return null;

      const hex =
        typeof row.hex === 'string'
          ? row.hex
          : typeof row.colorHex === 'string'
            ? row.colorHex
            : undefined;

      const sizesSource =
        row.sizes && typeof row.sizes === 'object'
          ? row.sizes
          : row.quantities && typeof row.quantities === 'object'
            ? row.quantities
            : {};

      const sizes: Record<string, number> = {};
      for (const [size, qty] of Object.entries(sizesSource as Record<string, unknown>)) {
        if (typeof qty === 'number' && Number.isFinite(qty) && qty > 0) {
          sizes[size] = qty;
        }
      }

      return { color, hex, sizes };
    })
    .filter((row): row is BulkOrderColorRow => Boolean(row));
}
