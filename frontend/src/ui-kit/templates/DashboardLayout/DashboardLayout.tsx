import React from 'react';
import { useBlueprintGrid, useGridScroll } from '../../hooks';
import { cn } from '../../utils';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly filterBar?: React.ReactNode;
  readonly toolbar?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly sidebarLabel?: string;
  readonly snapToGrid?: boolean;
  readonly gridDeps?: readonly unknown[];
  readonly workspaceClassName?: string;
}

/**
 * DashboardLayout template for data-dense workspaces (HomePage Kanban, AdminPage, UserManagementPage)
 * with built-in `useBlueprintGrid` quantization and `useGridScroll` 32px scroll snapping.
 */
export function DashboardLayout({
  header,
  filterBar,
  toolbar,
  footer,
  sidebar,
  sidebarLabel = 'Workspace navigation',
  snapToGrid = true,
  gridDeps,
  className,
  workspaceClassName,
  children,
  ...rest
}: DashboardLayoutProps): React.ReactElement {
  const dashboardRef = useBlueprintGrid<HTMLDivElement>({
    deps: gridDeps,
    enabled: snapToGrid,
  });
  const handleGridScroll = useGridScroll();

  return (
    <div
      ref={dashboardRef}
      className={cn(styles.dashboard, 'bp-page', className)}
      {...rest}
    >
      {header}
      {filterBar !== undefined && (
        <section aria-label="Filters" className={styles.filterBar}>
          {filterBar}
        </section>
      )}
      {toolbar !== undefined && (
        <section
          aria-label="Workspace toolbar"
          className={cn(styles.toolbar, 'bp-snap')}
          data-min-grids="1"
        >
          {toolbar}
        </section>
      )}
      <div className={styles.body}>
        {sidebar !== undefined && (
          <aside
            aria-label={sidebarLabel}
            onScroll={(event) => handleGridScroll(event, 'y')}
            className={styles.sidebar}
          >
            {sidebar}
          </aside>
        )}
        <main
          data-bp-scroller="true"
          onScroll={(event) => handleGridScroll(event, 'y')}
          className={cn(styles.workspace, workspaceClassName)}
        >
          {children}
        </main>
      </div>
      {footer !== undefined && (
        <footer className={styles.footer}>{footer}</footer>
      )}
    </div>
  );
}
