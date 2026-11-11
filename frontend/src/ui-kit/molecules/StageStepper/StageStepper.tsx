import React, { forwardRef } from 'react';
import { History } from 'lucide-react';
import { cn } from '../../utils';
import { StageStep, type StageStepProps } from './StageStep';
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
  readonly items?: readonly StageStepItem[];
  readonly onAddComment?: (stepId: string) => void;
  readonly onEditComment?: (stepId: string) => void;
  readonly onDeleteComment?: (stepId: string) => void;
  readonly emptyLabel?: string;
  readonly children?: React.ReactNode;
}

/**
 * StageStepper molecule.
 * Renders a vertical timeline container representing movement history across recruitment stages,
 * supporting both declarative `items` or composable `<StageStep />` children.
 */
export const StageStepper = forwardRef<HTMLDivElement, StageStepperProps>(
  function StageStepper(
    {
      items,
      onAddComment,
      onEditComment,
      onDeleteComment,
      emptyLabel = 'История переходов пуста',
      children,
      className,
      ...rest
    },
    ref
  ) {
    if (children) {
      const childArray = React.Children.toArray(children);
      if (childArray.length === 0) {
        return (
          <div ref={ref} className={cn(styles.empty, className)} {...rest}>
            <History size={15} aria-hidden />
            <span>{emptyLabel}</span>
          </div>
        );
      }

      return (
        <div ref={ref} className={cn(styles.stepper, className)} {...rest}>
          {childArray.map((child, idx) => {
            if (React.isValidElement<StageStepProps>(child)) {
              const isLast = idx === childArray.length - 1;
              return React.cloneElement(child, {
                isLast: child.props.isLast !== undefined ? child.props.isLast : isLast,
              });
            }
            return child;
          })}
        </div>
      );
    }

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
            <StageStep
              key={item.id}
              id={item.id}
              stage={item.stage}
              fromStage={item.fromStage}
              timestamp={item.timestamp}
              isCurrent={item.isCurrent}
              isLast={isLast}
              comment={item.comment}
              onAddComment={onAddComment ? () => onAddComment(item.id) : undefined}
              onEditComment={onEditComment ? () => onEditComment(item.id) : undefined}
              onDeleteComment={onDeleteComment ? () => onDeleteComment(item.id) : undefined}
            />
          );
        })}
      </div>
    );
  }
);
