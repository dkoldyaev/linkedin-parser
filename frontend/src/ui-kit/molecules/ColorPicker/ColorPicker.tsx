import React from 'react';
import { StatusDot, type StatusDotPalette, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './ColorPicker.module.css';

export interface ColorOption {
  readonly id: StatusDotPalette;
  readonly label: string;
}

export const DEFAULT_PALETTE_OPTIONS: readonly ColorOption[] = [
  { id: 'slate', label: 'Slate' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'amber', label: 'Amber' },
  { id: 'rose', label: 'Rose' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'indigo', label: 'Indigo' },
] as const;

export interface ColorPickerProps {
  readonly value: StatusDotPalette;
  readonly onChange: (color: StatusDotPalette) => void;
  readonly options?: readonly ColorOption[];
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Accessible radio-group ColorPicker molecule for Kanban column palette selection.
 * Replaces the duplicated color swatch grid in ColumnCreateModal and ColumnEditModal.
 */
export function ColorPicker({
  value,
  onChange,
  options = DEFAULT_PALETTE_OPTIONS,
  disabled = false,
  ariaLabel = 'Column color palette',
  className,
}: ColorPickerProps): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(styles.grid, className)}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={cn(styles.swatch, isSelected && styles.selected)}
          >
            <StatusDot palette={option.id} />
            <Text variant="mono" tone={isSelected ? 'accent' : 'secondary'} truncate>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
