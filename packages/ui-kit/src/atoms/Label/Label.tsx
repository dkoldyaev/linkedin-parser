import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import { Text } from '../Text';
import styles from './Label.module.css';

export type LabelTone = 'secondary' | 'accent' | 'primary';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly tone?: LabelTone;
}

/**
 * Atomic monospace Label component in Blueprint technical style.
 * Composes the `<Text>` atom for its label text and required marker.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  {
    required = false,
    disabled = false,
    tone = 'secondary',
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        styles.label,
        styles[`tone-${tone}`],
        disabled && styles.disabled,
        className
      )}
      {...rest}
    >
      <Text as="span" variant="mono-label" tone={tone}>
        {children}
      </Text>
      {required && (
        <Text
          as="span"
          variant="mono-label"
          tone="danger"
          weight="bold"
          aria-hidden="true"
        >
          *
        </Text>
      )}
    </label>
  );
});
