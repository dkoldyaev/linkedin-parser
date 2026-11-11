import React, { forwardRef } from 'react';
import { ArrowRight, Edit3, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Icon } from '../../atoms';
import { cn } from '../../utils';
import styles from './StageStepper.module.css';

export interface StageStepProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly id?: string;
  readonly stage: string;
  readonly fromStage?: string;
  readonly timestamp?: string;
  readonly isCurrent?: boolean;
  readonly isLast?: boolean;
  readonly comment?: string;
  readonly onAddComment?: () => void;
  readonly onEditComment?: () => void;
  readonly onDeleteComment?: () => void;
  readonly children?: React.ReactNode;
}

/**
 * StageStep molecule.
 * Represents an individual milestone/step within the recruitment StageStepper timeline,
 * displaying stage transition badges, timestamp, dot indicator, connecting line,
 * and optional commentary bubble with management actions.
 */
export const StageStep = forwardRef<HTMLDivElement, StageStepProps>(
  function StageStep(
    {
      id,
      stage,
      fromStage,
      timestamp,
      isCurrent = false,
      isLast = false,
      comment,
      onAddComment,
      onEditComment,
      onDeleteComment,
      children,
      className,
      ...rest
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        id={id}
        className={cn(styles.stepItem, isLast && styles.stepItemLast, className)}
        {...rest}
      >
        {!isLast && <div className={styles.line} aria-hidden />}
        <div
          className={cn(styles.dot, isCurrent && styles.dotCurrent)}
          aria-hidden
        />

        <div className={styles.content}>
          <div className={styles.stepHeader}>
            <div className={styles.badgesRow}>
              {fromStage && (
                <>
                  <Badge size="sm" tone="neutral" className={styles.stageBadge}>
                    {fromStage}
                  </Badge>
                  <ArrowRight size={12} className={styles.arrow} aria-hidden />
                </>
              )}
              <Badge
                size="sm"
                tone={isCurrent ? 'primary' : 'neutral'}
                className={cn(styles.stageBadge, isCurrent && styles.stageBadgeCurrent)}
              >
                {stage}
              </Badge>
            </div>

            {timestamp && <span className={styles.time}>{timestamp}</span>}
          </div>

          {children}

          {comment ? (
            <div className={styles.commentBubble}>
              <div className={styles.commentText}>
                <Icon icon={MessageSquare} size="xs" className={styles.commentIcon} aria-hidden />
                <span>{comment}</span>
              </div>

              {(onEditComment || onDeleteComment) && (
                <div className={styles.commentTools}>
                  {onEditComment && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={styles.toolBtn}
                      onClick={onEditComment}
                      title="Редактировать комментарий"
                      aria-label="Редактировать комментарий"
                    >
                      <Icon icon={Edit3} size="xs" />
                    </Button>
                  )}
                  {onDeleteComment && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      tone="danger"
                      className={styles.toolBtn}
                      onClick={onDeleteComment}
                      title="Удалить комментарий"
                      aria-label="Удалить комментарий"
                    >
                      <Icon icon={Trash2} size="xs" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            onAddComment && (
              <Button
                variant="ghost"
                size="sm"
                className={styles.addCommentBtn}
                onClick={onAddComment}
                startIcon={<Icon icon={Plus} size="xs" />}
              >
                Добавить комментарий
              </Button>
            )
          )}
        </div>
      </div>
    );
  }
);
