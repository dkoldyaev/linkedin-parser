import React from 'react';
import { cn } from '../../utils';
import styles from './PageLayout.module.css';

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly banner?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly fullBleed?: boolean;
  readonly mainClassName?: string;
}

/**
 * PageLayout template providing the 32px Blueprint drafting grid background and semantic page landmarks.
 */
export function PageLayout({
  header,
  banner,
  footer,
  fullBleed = false,
  className,
  mainClassName,
  children,
  ...rest
}: PageLayoutProps): React.ReactElement {
  return (
    <div className={cn(styles.page, className)} {...rest}>
      {header}
      {banner !== undefined && <div className={styles.bannerSlot}>{banner}</div>}
      <main
        className={cn(
          styles.main,
          fullBleed && styles.fullBleed,
          mainClassName
        )}
      >
        {children}
      </main>
      {footer !== undefined && (
        <footer className={styles.footer}>{footer}</footer>
      )}
    </div>
  );
}
