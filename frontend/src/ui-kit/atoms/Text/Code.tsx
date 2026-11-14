import React from 'react';
import { cn } from '../../utils';
import styles from './Text.module.css';

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Inline code atom (<code>) with Blueprint monospace styling.
 */
export const Code = React.forwardRef<HTMLElement, CodeProps>(function Code(
  { children, className, ...restProps },
  ref
): React.ReactElement {
  return (
    <code ref={ref} className={cn(styles.inlineCode, className)} {...restProps}>
      {children}
    </code>
  );
});

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Keyboard shortcut atom (<kbd>) with elevated keyframe styling.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { children, className, ...restProps },
  ref
): React.ReactElement {
  return (
    <kbd ref={ref} className={cn(styles.kbd, className)} {...restProps}>
      {children}
    </kbd>
  );
});
