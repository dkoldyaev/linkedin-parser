import React, { forwardRef } from 'react';
import { ArrowRight, Edit3, History, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils';
import styles from './StageStepper.module.css';

export interface StageStepItem {
  readonly id: string;
  readonly stage: string;
  readonly fromStage?: string;
  readonly timestamp?: string;
  readonly isCurrent?: boolean;
  readonly comment?: string;
}

export interface StageStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly items: readonly StageStepItem[];
  readonly onAddComment?: (stepId: string) => void;
  readonly onEditComment?: (stepId: string) => void;
  readonly onDeleteComment?: (stepId: string) => void;
  readonly emptyLabel?: string;
}

/**
 * StageStepper molecule.
 * Renders a vertical timeline representing movement history across recruitment stages,
 * with status indicators, timestamp badges, and stage commentary bubbles.
 */
export const StageStepper = forwardRef<HTMLDivElement, StageStepperProps>(
  function StageStepper(
    {
      items,
      onAddComment,
      onEditComment,
      onDeleteComment,
      emptyLabel = 'История переходов пуста',
      className,
      ...rest
    },
    ref
  ) {
    if (!items || items.length === 0) {
      return (
        <div ref={ref} className={cn(styles.empty, className)} {...rest}>
          <History size={15} aria-hidden />
          <span>{emptyLabel}</span>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn(styles.stepper, className)} {...rest}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <div key={item.id} className={styles.stepItem}>
              {!isLast && <div className={styles.line} aria-hidden />}
              <div
                className={cn(styles.dot, item.isCurrent && styles.dotCurrent)}
                aria-hidden
              />

              <div className={styles.content}>
                <div className={styles.stepHeader}>
                  <div className={styles.badgesRow}>
                    {item.fromStage && (
                      <>
                        <span className={styles.stageBadge}>{item.fromStage}</span>
                        <ArrowRight size={12} className={styles.arrow} aria-hidden />
                      </>
                    )}
                    <span className={styles.stageBadge}>{item.stage}</span>
                  </div>

                  {item.timestamp && (
                    <span className={styles.time}>{item.timestamp}</span>
                  )}
                </div>

                {item.comment ? (
                  <div className={styles.commentBubble}>
                    <div className={styles.commentText}>
                      <MessageSquare size={13} className={styles.commentIcon} aria-hidden />
                      <span>{item.comment}</span>
                    </div>

                    {(onEditComment || onDeleteComment) && (
                      <div className={styles.commentTools}>
                        {onEditComment && (
                          <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={() => onEditComment(item.id)}
                            title="Редактировать комментарий"
                            aria-label="Редактировать комментарий"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        {onDeleteComment && (
                          <button
                            type="button"
                            className={cn(styles.toolBtn, styles.toolBtnDanger)}
                            onClick={() => onDeleteComment(item.id)}
                            title="Удалить комментарий"
                            aria-label="Удалить комментарий"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  onAddComment && (
                    <button
                      type="button"
                      className={styles.addCommentBtn}
                      onClick={() => onAddComment(item.id)}
                    >
                      <Plus size={11} aria-hidden />
                      <span>Добавить комментарий</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
