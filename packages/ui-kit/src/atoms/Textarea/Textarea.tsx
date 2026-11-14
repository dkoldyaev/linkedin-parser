import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './Textarea.module.css';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly invalid?: boolean;
  readonly mono?: boolean;
}

/**
 * Atomic multiline Textarea component aligned to the 32px Blueprint grid.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid = false, mono = false, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || rest['aria-invalid'] || undefined}
        className={cn(
          styles.textarea,
          mono && styles.mono,
          invalid && styles.invalid,
          className
        )}
        {...rest}
      />
    );
  }
);
