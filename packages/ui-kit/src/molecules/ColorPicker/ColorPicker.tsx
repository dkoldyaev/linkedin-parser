import React from 'react';
import { Button, StatusDot, type StatusDotPalette, Text } from '../../atoms';
import { useKeyboardNavigation } from '../../hooks';
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
 * Accessible radio-group ColorPicker molecule for palette selection.
 * Composes `<Button>`, `<StatusDot>`, `<Text>`, and `useKeyboardNavigation`.
 */
export function ColorPicker({
  value,
  onChange,
  options = DEFAULT_PALETTE_OPTIONS,
  disabled = false,
  ariaLabel = 'Color palette',
  className,
}: ColorPickerProps): React.ReactElement {
  const selectedIdx = Math.max(
    0,
    options.findIndex((opt) => opt.id === value)
  );

  const { handleKeyDown } = useKeyboardNavigation<ColorOption>({
    items: options,
    initialIndex: selectedIdx,
    orientation: 'both',
    onSelect: (option) => {
      if (!disabled) {
        onChange(option.id);
      }
    },
  });

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(styles.grid, className)}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <Button
            key={option.id}
            variant="secondary"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            startIcon={<StatusDot palette={option.id} />}
            className={cn(styles.swatch, isSelected && styles.selected)}
          >
            <Text variant="mono" tone={isSelected ? 'accent' : 'secondary'} truncate>
              {option.label}
            </Text>
          </Button>
        );
      })}
    </div>
  );
}
