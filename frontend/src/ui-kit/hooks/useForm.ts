import { type FormEvent, useCallback, useState } from 'react';

export type ValidationErrors<TValues> = Partial<Record<keyof TValues, string>>;

export interface UseFormOptions<TValues extends Record<string, unknown>> {
  readonly initialValues: TValues;
  readonly validate?: (values: TValues) => ValidationErrors<TValues>;
  readonly onSubmit: (values: TValues) => void | Promise<void>;
}

export interface UseFormReturn<TValues extends Record<string, unknown>> {
  readonly values: TValues;
  readonly errors: ValidationErrors<TValues>;
  readonly touched: Partial<Record<keyof TValues, boolean>>;
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly setFieldValue: <K extends keyof TValues>(
    field: K,
    value: TValues[K]
  ) => void;
  readonly setFieldTouched: <K extends keyof TValues>(
    field: K,
    isTouched: boolean
  ) => void;
  readonly setSubmitError: (message: string | null) => void;
  readonly resetForm: () => void;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<boolean>;
}

/**
 * Lightweight, dependency-free form state hook replacing repetitive `useState` triples
 * (`values`, `error`, `loading`) across AuthModal, ColumnCreateModal, ColumnEditModal, and UserFormModal.
 */
export function useForm<TValues extends Record<string, unknown>>(
  options: UseFormOptions<TValues>
): UseFormReturn<TValues> {
  const { initialValues, validate, onSubmit } = options;
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<TValues>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof TValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setFieldValue = useCallback(
    <K extends keyof TValues>(field: K, value: TValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (prev[field] === undefined) {
          return prev;
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const setFieldTouched = useCallback(
    <K extends keyof TValues>(field: K, isTouched: boolean) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<boolean> => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }

      setSubmitError(null);

      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
        const hasErrors = Object.keys(validationErrors).some(
          (key) => Boolean(validationErrors[key as keyof TValues])
        );
        if (hasErrors) {
          return false;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Submission failed';
        setSubmitError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values, onSubmit]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setFieldValue,
    setFieldTouched,
    setSubmitError,
    resetForm,
    handleSubmit,
  };
}
