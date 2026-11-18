import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import { CardHeader } from './CardHeader';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { CardFullLoading } from './CardFullLoading';
import type { CardAccentTone } from './types';
import { resolveCardToneClass } from './types';
import styles from './Card.module.css';

export interface CardFullProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly overline?: React.ReactNode;
  readonly overlineHref?: string;
  readonly headerActions?: React.ReactNode;
  readonly statusIndicators?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
  readonly selected?: boolean;
  readonly horizontal?: boolean;
  readonly interactive?: boolean;
  readonly snapToGrid?: boolean;
  readonly bodyClassName?: string;
  readonly isLoading?: boolean;
}

/**
 * CardFull renders the complete multi-row version of Card with body, tech stack, summary and footer.
 */
export const CardFull = forwardRef<HTMLDivElement, CardFullProps>(
  function CardFull(
    {
      title,
      subtitle,
      overline,
      overlineHref,
      headerActions,
      statusIndicators,
      footer,
      accentTone,
      matchScore,
      selected = false,
      horizontal = false,
      interactive = false,
      snapToGrid = true,
      isLoading = false,
      className,
      bodyClassName,
      children,
      ...rest
    },
    ref
  ) {
    if (isLoading) {
      return (
        <CardFullLoading
          ref={ref}
          accentTone={accentTone}
          matchScore={matchScore}
          horizontal={horizontal}
          snapToGrid={snapToGrid}
          bodyClassName={bodyClassName}
          className={className}
          {...rest}
        />
      );
    }

    const toneClass = resolveCardToneClass(styles, accentTone, matchScore);

    const hasShorthandSlots =
      title !== undefined ||
      subtitle !== undefined ||
      overline !== undefined ||
      headerActions !== undefined ||
      statusIndicators !== undefined ||
      footer !== undefined;

    return (
      <div
        ref={ref}
        tabIndex={interactive ? 0 : undefined}
        className={cn(
          styles.card,
          toneClass,
          selected && styles.selected,
          horizontal && styles.horizontal,
          interactive && styles.interactive,
          className
        )}
        {...rest}
      >
        {hasShorthandSlots ? (
          <>
            <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
              {(title !== undefined ||
                subtitle !== undefined ||
                overline !== undefined ||
                headerActions !== undefined ||
                statusIndicators !== undefined) && (
                <CardHeader
                  title={title}
                  subtitle={subtitle}
                  overline={overline}
                  overlineHref={overlineHref}
                  headerActions={headerActions}
                  statusIndicators={statusIndicators}
                />
              )}
              {children}
            </CardBody>
            {footer !== undefined && <CardFooter>{footer}</CardFooter>}
          </>
        ) : (
          children
        )}
      </div>
    );
  }
);

