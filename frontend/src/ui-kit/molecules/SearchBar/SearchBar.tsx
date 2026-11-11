import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Icon, Input, type InputProps } from '../../atoms';
import { cn } from '../../utils';
import styles from './SearchBar.module.css';

export interface SearchBarProps extends Omit<InputProps, 'type' | 'startAdornment'> {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onClear?: () => void;
  readonly clearLabel?: string;
}

/**
 * SearchBar molecule composed of Input, Icon (Search), and clear Button.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      value,
      onValueChange,
      onClear,
      clearLabel = 'Clear search',
      className,
      wrapperClassName,
      disabled,
      ...rest
    },
    ref
  ) {
    const showClear = value.length > 0 && !disabled;

    const handleClear = () => {
      onValueChange('');
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={cn(styles.searchBar, wrapperClassName)}>
        <Input
          ref={ref}
          type="search"
          role="searchbox"
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          startAdornment={<Icon icon={Search} size="sm" tone="muted" />}
          className={cn(showClear && styles.hasClear, className)}
          {...rest}
        />
        {showClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label={clearLabel}
            className={styles.clearButton}
          >
            <Icon icon={X} size="xs" />
          </Button>
        )}
      </div>
    );
  }
);
