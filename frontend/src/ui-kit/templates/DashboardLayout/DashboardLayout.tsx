import React from 'react';
import { cn } from '../../utils';
import styles from './DashboardLayout.module.css';

export interface DashboardLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly toolbar?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly sidebarLabel?: string;
  readonly workspaceClassName?: string;
}

/**
 * DashboardLayout template for data-dense workspaces (HomePage Kanban, AdminPage, UserManagementPage).
 */
export function DashboardLayout({
  header,
  toolbar,
  sidebar,
  sidebarLabel = 'Workspace navigation',
  className,
  workspaceClassName,
  children,
  ...rest
}: DashboardLayoutProps): React.ReactElement {
  return (
    <div className={cn(styles.dashboard, className)} {...rest}>
      {header}
      {toolbar !== undefined && (
        <section aria-label="Workspace toolbar" className={styles.toolbar}>
          {toolbar}
        </section>
      )}
      <div className={styles.body}>
        {sidebar !== undefined && (
          <aside aria-label={sidebarLabel} className={styles.sidebar}>
            {sidebar}
          </aside>
        )}
        <main className={cn(styles.workspace, workspaceClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}
