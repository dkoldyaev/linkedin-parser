import React from 'react';
import { Button, StatusDot, type StatusDotPalette, Text, Input, Icon } from '../../atoms';
import { Pipette } from 'lucide-react';
import { useKeyboardNavigation } from '../../hooks';
import { cn } from '../../utils';
import styles from './ColorPicker.module.css';

export interface ColorOption {
  readonly id: string;
  readonly label: string;
  readonly hex?: string;
  readonly palette?: StatusDotPalette;
}

export const DEFAULT_PALETTE_OPTIONS: readonly ColorOption[] = [
  { id: 'slate', label: 'Slate', palette: 'slate', hex: '#475569' },
  { id: 'blue', label: 'Blue', palette: 'blue', hex: '#2563eb' },
  { id: 'purple', label: 'Purple', palette: 'purple', hex: '#9333ea' },
  { id: 'emerald', label: 'Emerald', palette: 'emerald', hex: '#059669' },
  { id: 'amber', label: 'Amber', palette: 'amber', hex: '#d97706' },
  { id: 'rose', label: 'Rose', palette: 'rose', hex: '#e11d48' },
  { id: 'cyan', label: 'Cyan', palette: 'cyan', hex: '#0891b2' },
  { id: 'indigo', label: 'Indigo', palette: 'indigo', hex: '#1d4ed8' },
] as const;

const PALETTE_SET = new Set(['slate', 'blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'indigo']);

export interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  readonly value: string;
  readonly onChange: (color: string) => void;
  readonly options?: readonly ColorOption[];
  readonly presets?: readonly string[];
  readonly allowCustom?: boolean;
  readonly customInputSlot?: React.ReactNode;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Accessible radio-group ColorPicker molecule supporting semantic palettes, custom presets,
 * and arbitrary hex/RGB/HSL colors.
 */
export function ColorPicker({
  value,
  onChange,
  options,
  presets,
  allowCustom = true,
  customInputSlot,
  disabled = false,
  ariaLabel = 'Color palette',
  className,
  ...rest
}: ColorPickerProps): React.ReactElement {
  const resolvedOptions: readonly ColorOption[] = React.useMemo(() => {
    if (options !== undefined) {
      return options;
    }
    if (presets !== undefined) {
      return presets.map((preset) => {
        const isPalette = PALETTE_SET.has(preset);
        return {
          id: preset,
          label: preset,
          palette: isPalette ? (preset as StatusDotPalette) : undefined,
          hex: !isPalette ? preset : undefined,
        };
      });
    }
    return DEFAULT_PALETTE_OPTIONS;
  }, [options, presets]);

  const selectedIdx = Math.max(
    0,
    resolvedOptions.findIndex(
      (opt) =>
        opt.id.toLowerCase() === value.toLowerCase() ||
        (opt.hex !== undefined && opt.hex.toLowerCase() === value.toLowerCase())
    )
  );

  const { handleKeyDown } = useKeyboardNavigation<ColorOption>({
    items: resolvedOptions,
    initialIndex: selectedIdx,
    orientation: 'both',
    onSelect: (option) => {
      if (!disabled) {
        onChange(option.hex ?? option.id);
      }
    },
  });

  const isMatchedPreset = resolvedOptions.some(
    (opt) =>
      opt.id.toLowerCase() === value.toLowerCase() ||
      (opt.hex !== undefined && opt.hex.toLowerCase() === value.toLowerCase())
  );

  const nativeColorValue = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
    ? value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value
    : '#2563eb';

  const previewRef = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    if (previewRef.current) {
      previewRef.current.style.setProperty('--bp-dot-color', value || 'transparent');
    }
  }, [value]);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(styles.container, className)}
      {...rest}
    >
      <div className={styles.grid}>
        {resolvedOptions.map((option) => {
          const isSelected =
            option.id.toLowerCase() === value.toLowerCase() ||
            (option.hex !== undefined && option.hex.toLowerCase() === value.toLowerCase());
          return (
            <Button
              key={option.id}
              variant="secondary"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.hex ?? option.id)}
              startIcon={
                <StatusDot
                  palette={option.palette}
                  color={option.hex}
                  size="sm"
                />
              }
              className={cn(styles.swatch, isSelected && styles.selected)}
            >
              <Text variant="mono" tone={isSelected ? 'accent' : 'secondary'} truncate>
                {option.label}
              </Text>
            </Button>
          );
        })}
      </div>

      {allowCustom && (
        customInputSlot !== undefined ? (
          <div className={styles.customRow}>{customInputSlot}</div>
        ) : (
          <div className={styles.customRow}>
            <label className={styles.colorInputLabel} title="Choose custom color">
              <span
                ref={previewRef}
                className={styles.colorPreview}
              >
                <Icon icon={Pipette} size="2xs" />
              </span>
              <input
                type="color"
                value={nativeColorValue}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={styles.nativeColorInput}
                aria-label="Custom color picker"
              />
            </label>
            <Input
              size="sm"
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              aria-label="Hex color value"
              className={styles.hexInput}
            />
            {!isMatchedPreset && value && (
              <Text variant="mono" tone="accent" className={styles.customBadge}>
                CUSTOM
              </Text>
            )}
          </div>
        )
      )}
    </div>
  );
}
