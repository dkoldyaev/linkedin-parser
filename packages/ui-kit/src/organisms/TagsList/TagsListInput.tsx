import React, { useState } from 'react';
import { Input, type InputProps } from '../../atoms/Input';
import { cn } from '../../utils';
import styles from './TagsList.module.css';

export interface TagsListInputProps extends Omit<InputProps, 'onCommit' | 'placeholder'> {
  readonly separator?: string;
  readonly placeholder?: string;
  readonly onCommit: (tags: readonly string[]) => void;
  readonly onCancel?: () => void;
  readonly className?: string;
}

export function TagsListInput({
  separator = ',',
  placeholder = 'Добавить...',
  onCommit,
  onCancel,
  className,
  ...rest
}: TagsListInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState('');

  const commitTags = (raw: string) => {
    if (!raw.trim()) {
      return;
    }
    const parts = separator
      ? raw
          .split(separator)
          .map((item) => item.trim())
          .filter(Boolean)
      : [raw.trim()];

    if (parts.length > 0) {
      onCommit(parts);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (separator && val.includes(separator)) {
      const parts = val.split(separator);
      const remaining = parts.pop() ?? '';
      commitTags(parts.join(separator));
      setInputValue(remaining);
    } else {
      setInputValue(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTags(inputValue);
      setInputValue('');
    } else if (e.key === 'Escape') {
      setInputValue('');
      onCancel?.();
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      commitTags(inputValue);
      setInputValue('');
    }
    onCancel?.();
  };

  return (
    <Input
      autoFocus
      className={cn(styles.addInput, className)}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      aria-label={placeholder}
      {...rest}
    />
  );
}
