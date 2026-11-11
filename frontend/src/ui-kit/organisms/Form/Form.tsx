import React, { forwardRef } from 'react';
import { Button, type ButtonVariant } from '../../atoms';
import { AlertBanner } from '../../molecules';
import { cn } from '../../utils';
import styles from './Form.module.css';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  readonly errorMessage?: React.ReactNode;
  readonly successMessage?: React.ReactNode;
  readonly submitLabel?: React.ReactNode;
  readonly cancelLabel?: React.ReactNode;
  readonly onCancel?: () => void;
  readonly isSubmitting?: boolean;
  readonly submitDisabled?: boolean;
  readonly submitVariant?: ButtonVariant;
  readonly footer?: React.ReactNode;
}

/**
 * Structured Form organism combining validation/status AlertBanners, field stack, and submit/cancel action bar.
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  {
    errorMessage,
    successMessage,
    submitLabel,
    cancelLabel = 'Cancel',
    onCancel,
    isSubmitting = false,
    submitDisabled = false,
    submitVariant = 'primary',
    footer,
    className,
    children,
    ...rest
  },
  ref
) {
  const showDefaultFooter =
    footer === undefined &&
    (submitLabel !== undefined || onCancel !== undefined);

  return (
    <form
      ref={ref}
      noValidate
      className={cn(styles.form, className)}
      {...rest}
    >
      {errorMessage !== undefined && Boolean(errorMessage) && (
        <AlertBanner tone="danger">{errorMessage}</AlertBanner>
      )}
      {successMessage !== undefined && Boolean(successMessage) && (
        <AlertBanner tone="success">{successMessage}</AlertBanner>
      )}

      <div className={styles.fields}>{children}</div>

      {footer !== undefined && <div className={styles.footer}>{footer}</div>}

      {showDefaultFooter && (
        <div className={styles.footer}>
          {onCancel !== undefined && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          {submitLabel !== undefined && (
            <Button
              type="submit"
              variant={submitVariant}
              loading={isSubmitting}
              disabled={submitDisabled}
            >
              {submitLabel}
            </Button>
          )}
        </div>
      )}
    </form>
  );
});
