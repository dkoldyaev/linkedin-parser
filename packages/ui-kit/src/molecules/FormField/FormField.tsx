import React from 'react';
import { Label, Text } from '../../atoms';
import { useId } from '../../hooks';
import { cn } from '../../utils';
import styles from './FormField.module.css';

export interface FormFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly label?: React.ReactNode;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly hint?: React.ReactNode;
  readonly error?: React.ReactNode;
  readonly labelAction?: React.ReactNode;
  readonly children:
    | React.ReactNode
    | ((fieldA11yProps: {
        readonly id: string;
        readonly 'aria-describedby'?: string;
        readonly 'aria-invalid'?: boolean;
        readonly disabled?: boolean;
      }) => React.ReactNode);
}

/**
 * FormField molecule combining Label, form control, helper hint, and validation error message
 * with automatic ARIA attribute linkage.
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  disabled = false,
  hint,
  error,
  labelAction,
  className,
  children,
  ...rest
}: FormFieldProps): React.ReactElement {
  const controlId = useId('field', htmlFor);
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const hasError = Boolean(error);
  const hasHint = Boolean(hint);

  const describedByParts: string[] = [];
  if (hasError) {
    describedByParts.push(errorId);
  }
  if (hasHint) {
    describedByParts.push(hintId);
  }
  const ariaDescribedBy =
    describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

  const renderedChildren =
    typeof children === 'function'
      ? children({
          id: controlId,
          'aria-describedby': ariaDescribedBy,
          'aria-invalid': hasError || undefined,
          disabled: disabled || undefined,
        })
      : children;

  return (
    <div className={cn(styles.field, className)} {...rest}>
      {(label !== undefined || labelAction !== undefined) && (
        <div className={styles.header}>
          {label !== undefined && (
            <Label htmlFor={controlId} required={required} disabled={disabled}>
              {label}
            </Label>
          )}
          {labelAction}
        </div>
      )}
      <div className={styles.controlWrapper}>{renderedChildren}</div>
      {hasError && (
        <Text
          id={errorId}
          as="div"
          variant="caption"
          tone="danger"
          role="alert"
          className={styles.error}
        >
          {error}
        </Text>
      )}
      {!hasError && hasHint && (
        <Text id={hintId} as="div" variant="caption" tone="muted" className={styles.hint}>
          {hint}
        </Text>
      )}
    </div>
  );
}
