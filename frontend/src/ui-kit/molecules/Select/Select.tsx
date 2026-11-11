import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { Icon, Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Select.module.css';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps {
  readonly id?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly name?: string;
  readonly ariaLabel?: string;
  readonly 'aria-describedby'?: string;
  readonly className?: string;
}

/**
 * Accessible Select molecule powered by `@radix-ui/react-select` and styled for the 32px Blueprint grid.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    value,
    defaultValue,
    onValueChange,
    options,
    placeholder = 'Select option...',
    disabled = false,
    invalid = false,
    name,
    ariaLabel,
    'aria-describedby': ariaDescribedBy,
    className,
  },
  ref
) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(styles.trigger, invalid && styles.invalid, className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <Icon icon={ChevronDown} size="sm" tone="secondary" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={styles.content}
        >
          <SelectPrimitive.Viewport className={styles.viewport}>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={styles.item}
              >
                <SelectPrimitive.ItemText>
                  <Text variant="mono">{option.label}</Text>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Icon icon={Check} size="sm" tone="accent" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});
