import React, { forwardRef } from 'react';
import { Skeleton } from '../../atoms';
import { cn } from '../../utils';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import type { CardAccentTone } from './types';
import { resolveCardToneClass } from './types';
import styles from './Card.module.css';

export interface CardFullLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly accentTone?: CardAccentTone;
  readonly matchScore?: number;
  readonly horizontal?: boolean;
  readonly snapToGrid?: boolean;
  readonly bodyClassName?: string;
}

/**
 * CardFullLoading renders the animated skeleton placeholder for CardFull.
 */
export const CardFullLoading = forwardRef<HTMLDivElement, CardFullLoadingProps>(
  function CardFullLoading(
    {
      accentTone,
      matchScore,
      horizontal = false,
      snapToGrid = true,
      bodyClassName,
      className,
      ...rest
    },
    ref
  ) {
    const toneClass = resolveCardToneClass(styles, accentTone, matchScore);
    return (
      <div
        ref={ref}
        aria-busy="true"
        className={cn(
          styles.card,
          toneClass,
          horizontal && styles.horizontal,
          className
        )}
        {...rest}
      >
        <CardBody snapToGrid={snapToGrid} contentClassName={bodyClassName}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <div className={styles.cardTitleContainer}>
                <div className={styles.cardHeaderMeta}>
                  <Skeleton variant="text" className={styles.skeletonHeaderOverline} />
                </div>
                <Skeleton variant="text" width="85" height="md" />
              </div>
            </div>
            <Skeleton variant="chip" className={styles.skeletonHeaderChip} />
          </div>

          <div className={styles.skeletonChips}>
            <Skeleton variant="chip" className={styles.skeletonTechChipSm} />
            <Skeleton variant="chip" className={styles.skeletonTechChipMd} />
            <Skeleton variant="chip" className={styles.skeletonTechChipLg} />
          </div>

          <div className={styles.skeletonLines}>
            <Skeleton variant="text" width="100" height="xs" />
            <Skeleton variant="text" width="85" height="xs" />
            <Skeleton variant="text" width="60" height="xs" />
          </div>
        </CardBody>
        <CardFooter
          metaSlot={<Skeleton variant="text" className={styles.skeletonFooterMeta} />}
          actionsSlot={<Skeleton variant="rect" className={styles.skeletonFooterActions} />}
        />
      </div>
    );
  }
);

