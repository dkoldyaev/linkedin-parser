import { forwardRef, useMemo } from 'react';
import { Select, type SelectOption } from '../Select';
import { cn } from '../../utils';
import styles from './FilterItem.module.css';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
  readonly disabled?: boolean;
}

export interface FilterItemProps {
  readonly id?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly onValueChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly options: readonly FilterOption[];
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly title?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * FilterItem (Filter) molecule.
 * Represents a single filter dropdown using the Select molecule.
 * Snaps to the 32px Blueprint drafting grid.
 */
export const FilterItem = forwardRef<HTMLButtonElement, FilterItemProps>(
  function FilterItem(
    {
      id,
      value,
      defaultValue,
      onChange,
      onValueChange,
      placeholder,
      options,
      disabled = false,
      invalid = false,
      title,
      ariaLabel,
      className,
    },
    ref
  ) {
    const handleChange = onChange ?? onValueChange;

    const selectOptions: readonly SelectOption[] = useMemo(
      () =>
        options.map((opt) => ({
          value: opt.value,
          label: opt.count !== undefined ? `${opt.label} [${opt.count}]` : opt.label,
          disabled: opt.disabled,
        })),
      [options]
    );

    return (
      <div className={cn(styles.filterItem, className)} title={title}>
        <Select
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleChange}
          options={selectOptions}
          placeholder={placeholder}
          disabled={disabled}
          invalid={invalid}
          ariaLabel={ariaLabel ?? title ?? placeholder ?? id}
          variant="filter"
        />
      </div>
    );
  }
);

/**
 * Filter alias for FilterItem.
 */
export const Filter = FilterItem;
