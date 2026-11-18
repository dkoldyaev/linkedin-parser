import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import { CardHeader } from './CardHeader';
import { CardCollapsedLoading } from './CardCollapsedLoading';
import type { CardAccentTone } from './types';
import { resolveCardToneClass } from './types';
import styles from './Card.module.css';

export interface CardCollapsedProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly overline?: React.ReactNode;
  readonly overlineHref?: string;
  readonly headerActions?: React.ReactNode;
  readonly statusIndicators?: React.ReactNode;
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
  readonly selected?: boolean;
  readonly interactive?: boolean;
  readonly isLoading?: boolean;
}

/**
 * CardCollapsed renders the compact 32px (1 grid cell) version of Card.
 * Displays overline / title in a single line with ellipsis and statusIndicators on the right.
 */
export const CardCollapsed = forwardRef<HTMLDivElement, CardCollapsedProps>(
  function CardCollapsed(
    {
      title,
      subtitle,
      overline,
      overlineHref,
      headerActions,
      statusIndicators,
      accentTone,
      matchScore,
      selected = false,
      interactive = false,
      isLoading = false,
      className,
      children,
      ...rest
    },
    ref
  ) {
    if (isLoading) {
      return (
        <CardCollapsedLoading
          ref={ref}
          accentTone={accentTone}
          matchScore={matchScore}
          className={className}
          {...rest}
        />
      );
    }

    const toneClass = resolveCardToneClass(styles, accentTone, matchScore);

    return (
      <div
        ref={ref}
        tabIndex={interactive ? 0 : undefined}
        className={cn(
          styles.card,
          styles.compact,
          toneClass,
          selected && styles.selected,
          interactive && styles.interactive,
          className
        )}
        {...rest}
      >
        <CardHeader
          compact
          title={title}
          subtitle={subtitle}
          overline={overline}
          overlineHref={overlineHref}
          headerActions={headerActions}
          statusIndicators={statusIndicators}
        >
          {children}
        </CardHeader>
      </div>
    );
  }
);

