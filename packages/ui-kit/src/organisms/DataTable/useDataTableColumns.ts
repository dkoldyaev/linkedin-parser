import { useLayoutEffect, useState } from 'react';
import { GRID_CELL_PX } from '../../utils';
import type { DataTableColumn } from './types';

export function useDataTableColumns<T>(
  columns: readonly DataTableColumn<T>[],
  rootRef: React.RefObject<HTMLElement | null>
): readonly number[] {
  const [colWidths, setColWidths] = useState<readonly number[]>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || columns.length === 0) {
      return undefined;
    }

    const computeWidths = () => {
      const grid = GRID_CELL_PX;
      const totalWidth = root.clientWidth;
      const totalUnits = Math.max(columns.length * 3, Math.floor(totalWidth / grid));

      let allocatedUnits = 0;
      const unassignedIndices: number[] = [];
      const unitsPerCol = new Array<number>(columns.length).fill(0);

      columns.forEach((col, idx) => {
        if (col.gridUnits !== undefined && col.gridUnits > 0) {
          unitsPerCol[idx] = col.gridUnits;
          allocatedUnits += col.gridUnits;
        } else if (col.width !== undefined && col.width > 0) {
          const snapped = Math.max(3, Math.round(col.width / grid));
          unitsPerCol[idx] = snapped;
          allocatedUnits += snapped;
        } else {
          unassignedIndices.push(idx);
        }
      });

      if (unassignedIndices.length > 0) {
        const remainingUnits = Math.max(
          unassignedIndices.length * 3,
          totalUnits - allocatedUnits
        );
        const baseUnits = Math.floor(remainingUnits / unassignedIndices.length);
        const extraUnits = remainingUnits % unassignedIndices.length;

        unassignedIndices.forEach((colIdx, listIdx) => {
          const units = Math.max(3, baseUnits + (listIdx < extraUnits ? 1 : 0));
          unitsPerCol[colIdx] = units;
        });
      }

      const pixelWidths = unitsPerCol.map((u) => u * grid);
      setColWidths(pixelWidths);
    };

    computeWidths();
    window.addEventListener('resize', computeWidths);
    return () => window.removeEventListener('resize', computeWidths);
  }, [columns, rootRef]);

  return colWidths;
}

