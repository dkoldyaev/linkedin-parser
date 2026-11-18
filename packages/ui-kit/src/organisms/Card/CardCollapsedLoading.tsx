import React, { forwardRef } from 'react';
import { Skeleton } from '../../atoms';
import { cn } from '../../utils';
import type { CardAccentTone } from './types';
import { resolveCardToneClass } from './types';
import styles from './Card.module.css';

export interface CardCollapsedLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
}

/**
 * CardCollapsedLoading renders the animated skeleton placeholder for CardCollapsed (32px / 1 cell).
 */
export const CardCollapsedLoading = forwardRef<HTMLDivElement, CardCollapsedLoadingProps>(
  function CardCollapsedLoading(
    { accentTone, matchScore, className, ...rest },
    ref
  ) {
    const toneClass = resolveCardToneClass(styles, accentTone, matchScore);
    return (
      <div
        ref={ref}
        aria-busy="true"
        className={cn(styles.card, styles.compact, toneClass, className)}
        {...rest}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardHeading}>
            <div className={styles.cardTitleContainer}>
              <div className={styles.cardHeaderMeta}>
                <Skeleton variant="text" width="75" height="xs" />
              </div>
            </div>
          </div>
          <Skeleton variant="chip" className={styles.skeletonHeaderChip} />
        </div>
      </div>
    );
  }
);

