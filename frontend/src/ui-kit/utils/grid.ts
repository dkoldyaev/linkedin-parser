/**
 * Blueprint 32px grid helpers.
 * Converts grid cell units (1 cell = 32px, 1 quarter-unit = 8px) to pixel values.
 */
export const GRID_CELL_PX = 32 as const;
export const GRID_UNIT_PX = 8 as const;

export function cellsToPx(cells: number): string {
  return `${cells * GRID_CELL_PX}px`;
}

export function unitsToPx(units: number): string {
  return `${units * GRID_UNIT_PX}px`;
}
