import { Button, StatusDot, type StatusDotTone } from '../../atoms';
import React, { useRef, useState } from 'react';
import { cn } from '../../utils';
import styles from './ColorPicker.module.css';
import { useKeyboardNavigation } from '../../hooks';

export interface ColorOption {
  readonly id: string;
  readonly label: string;
  readonly hex?: string;
  readonly tone?: StatusDotTone;
}

export const DEFAULT_PALETTE_OPTIONS: readonly ColorOption[] = [
  { id: 'blue', label: 'Blue', tone: 'primary', hex: '#2563eb' },
  { id: 'purple', label: 'Purple', tone: 'accent', hex: '#9333ea' },
  { id: 'emerald', label: 'Emerald', tone: 'success', hex: '#059669' },
  { id: 'amber', label: 'Amber', tone: 'warning', hex: '#d97706' },
  { id: 'rose', label: 'Rose', tone: 'danger', hex: '#e11d48' },
  { id: 'cyan', label: 'Cyan', tone: 'info', hex: '#0891b2' },
  { id: 'indigo', label: 'Indigo', tone: 'primary', hex: '#1d4ed8' },
] as const;

const PRESET_TO_TONE: Record<string, StatusDotTone> = {
  slate: 'neutral',
  blue: 'primary',
  purple: 'accent',
  emerald: 'success',
  amber: 'warning',
  rose: 'danger',
  cyan: 'info',
  indigo: 'primary',
};

export interface ColorPickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  readonly value: string;
  readonly onChange: (color: string) => void;
  readonly options?: readonly ColorOption[];
  readonly presets?: readonly string[];
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Accessible radio-group ColorPicker molecule supporting semantic tones and custom presets.
 */
export function ColorPicker({
  value,
  onChange,
  options,
  presets,
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
        const tone = PRESET_TO_TONE[preset];
        return {
          id: preset,
          label: preset,
          tone: tone ?? 'primary',
          hex: tone === undefined ? preset : undefined,
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
        (opt.hex !== undefined && opt.hex.toLowerCase() === value.toLowerCase()),
    ),
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

  // const nativeColorValue = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  //   ? value.length === 4
  //     ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  //     : value
  //   : '#2563eb';
  const [nativeColorValue, setNativeColorValue] = useState<string | undefined>(undefined);

  const previewRef = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    if (previewRef.current) {
      previewRef.current.style.setProperty('--bp-dot-color', value || 'transparent');
    }
  }, [value]);

  const customColorInputRef = useRef<HTMLInputElement>(null);
  const handleClickCustomColorInput = () => {
    const input = customColorInputRef.current;
    if (!input) return;
    input.click();
  };

  return (
    <>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className={cn(styles.container, className)}
        {...rest}
      >
        <div className={styles.grid}>
          <Button
            variant={value === nativeColorValue ? 'primary' : 'secondary'}
            aria-checked={value === nativeColorValue}
            disabled={disabled}
            onClick={handleClickCustomColorInput}
            startIcon={<StatusDot tone="neutral" size="sm" />}
          >
            {nativeColorValue || 'Custom'}
          </Button>
          {resolvedOptions.map((option) => {
            const isSelected =
              option.id.toLowerCase() === value.toLowerCase() ||
              (option.hex !== undefined && option.hex.toLowerCase() === value.toLowerCase());
            return (
              <Button
                key={option.id}
                variant={isSelected ? 'primary' : 'secondary'}
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onChange(option.hex ?? option.id)}
                startIcon={<StatusDot tone={option.tone ?? 'primary'} size="sm" />}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
      <input
        ref={customColorInputRef}
        type="color"
        value={nativeColorValue}
        aria-checked={value === nativeColorValue}
        disabled={disabled}
        onChange={(e) => setNativeColorValue(e.target.value)}
        className={styles.nativeColorInput}
        aria-label="Custom color picker"
      />
    </>
  );
}
