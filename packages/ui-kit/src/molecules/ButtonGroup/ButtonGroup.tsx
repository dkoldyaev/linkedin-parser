import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import styles from './ButtonGroup.module.css';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual connection mode:
   * - 'attached': buttons touch each other with collapsed 1px border overlap
   * - 'detached': buttons separated by standard token spacing
   * @default 'attached'
   */
  readonly variant?: 'attached' | 'detached';
  /**
   * Whether the button group expands to 100% width and stretches buttons equally.
   * @default false
   */
  readonly fullWidth?: boolean;
  /**
   * Accessible role for button collection.
   * @default 'group'
   */
  readonly role?: string;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

/**
 * Molecule grouping multiple Buttons or action triggers together on the Blueprint grid.
 * Supports attached (seamless joined controls with overlapping borders) and detached layouts.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { variant = 'attached', fullWidth = false, role = 'group', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      className={cn(styles.buttonGroup, styles[variant], fullWidth && styles.fullWidth, className)}
      {...rest}
    >
      {children}
    </div>
  );
});
