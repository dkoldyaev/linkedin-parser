import React, { forwardRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Icon, Input, type InputProps } from '../../atoms';
import { cn } from '../../utils';
import styles from './SearchBar.module.css';

export interface SearchBarProps extends Omit<InputProps, 'type' | 'startAdornment'> {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onClear?: () => void;
  readonly clearLabel?: string;
  /**
   * When true, renders in compact width and smoothly expands to full grid-aligned width on focus
   * (matching the adaptive search behavior in the application header).
   */
  readonly expandOnFocus?: boolean;
}

/**
 * SearchBar molecule composed of Input, Icon (Search), and clear button.
 * Supports both full-width and adaptive expand-on-focus modes on the 32px Blueprint grid.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      value,
      onValueChange,
      onClear,
      clearLabel = 'Clear search',
      expandOnFocus = false,
      className,
      wrapperClassName,
      disabled,
      onFocus,
      onBlur,
      onKeyDown,
      ...rest
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const showClear = value.length > 0 && !disabled;

    const handleClear = () => {
      onValueChange('');
      if (onClear) {
        onClear();
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) {
        onFocus(event);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) {
        onBlur(event);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.currentTarget.blur();
      }
      if (onKeyDown) {
        onKeyDown(event);
      }
    };

    return (
      <div
        data-focused={isFocused ? 'true' : 'false'}
        className={cn(
          styles.searchBar,
          expandOnFocus && styles.expandOnFocus,
          isFocused && styles.isFocused,
          wrapperClassName
        )}
      >
        <Input
          ref={ref}
          type="text"
          role="searchbox"
          mono
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          startAdornment={<Icon icon={Search} size="sm" tone="muted" />}
          wrapperClassName={styles.inputWrapper}
          className={cn(
            styles.searchInput,
            showClear && styles.hasClear,
            className
          )}
          {...rest}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            onMouseDown={(event) => event.preventDefault()}
            onTouchStart={(event) => event.preventDefault()}
            aria-label={clearLabel}
            className={styles.clearButton}
          >
            <Icon icon={X} size="xs" />
          </button>
        )}
      </div>
    );
  }
);
