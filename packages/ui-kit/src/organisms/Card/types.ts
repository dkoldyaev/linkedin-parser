export type CardAccentTone = 'success' | 'warning' | 'danger' | 'accent' | 'info' | 'none';

export function resolveCardToneClass(
  styles: Record<string, string>,
  accentTone?: CardAccentTone,
  matchScore?: number
): string | undefined {
  const resolvedTone: CardAccentTone | undefined =
    accentTone !== undefined
      ? accentTone
      : matchScore !== undefined
        ? matchScore >= 75
          ? 'success'
          : matchScore >= 50
            ? 'warning'
            : 'danger'
        : undefined;

  return resolvedTone === 'success'
    ? styles.accentSuccess
    : resolvedTone === 'warning'
      ? styles.accentWarning
      : resolvedTone === 'danger'
        ? styles.accentDanger
        : resolvedTone === 'accent'
          ? styles.accentPrimary
          : resolvedTone === 'info'
            ? styles.accentInfo
            : undefined;
}

