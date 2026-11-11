import React from 'react';
import { useBlueprintGrid, useGridScroll } from '../../hooks';
import { cn } from '../../utils';
import styles from './PageLayout.module.css';

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly banner?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly fullBleed?: boolean;
  readonly snapToGrid?: boolean;
  readonly gridDeps?: readonly unknown[];
  readonly mainClassName?: string;
}

/**
 * PageLayout template providing the 32px Blueprint drafting grid background,
 * automatic `useBlueprintGrid` cell/column snapping, `useGridScroll` scroll snapping,
 * and semantic page landmarks.
 */
export function PageLayout({
  header,
  banner,
  footer,
  fullBleed = false,
  snapToGrid = true,
  gridDeps,
  className,
  mainClassName,
  children,
  ...rest
}: PageLayoutProps): React.ReactElement {
  const pageRef = useBlueprintGrid<HTMLDivElement>({
    deps: gridDeps,
    enabled: snapToGrid,
  });
  const handleGridScroll = useGridScroll();

  return (
    <div
      ref={pageRef}
      data-bp-scroller="true"
      onScroll={(event) => handleGridScroll(event, 'y')}
      className={cn(styles.page, 'bp-page', className)}
      {...rest}
    >
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
        <footer className={cn(styles.footer, 'bp-snap')} data-min-grids="2">
          {footer}
        </footer>
      )}
    </div>
  );
}
