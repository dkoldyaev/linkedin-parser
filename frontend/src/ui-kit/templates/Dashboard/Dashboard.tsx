import React, { useState } from 'react';
import { ChevronDown, Inbox, Plus } from 'lucide-react';
import { useBlueprintGrid, useGridScroll } from '../../hooks';
import { Table, TableCol, TableHeader, TableBody, TableCell } from '../../organisms/Table';
import { VacancyCard } from '../../organisms/Card';
import { Badge, type WorkplaceType } from '../../atoms';
import { cn } from '../../utils';
import styles from './Dashboard.module.css';

export interface DashboardVacancyItem {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly matchScore?: number;
  readonly workplace?: WorkplaceType;
  readonly location?: string;
  readonly salary?: string;
  readonly summary?: string;
  readonly techStack?: readonly string[];
  readonly tags?: readonly string[];
  readonly date?: string;
  readonly historyCount?: number;
  readonly hasHistoryComment?: boolean;
  readonly sourceUrl?: string;
}

export interface DashboardColumn {
  readonly id: string;
  readonly name: string;
  readonly index?: string | number;
  readonly color?: string;
  readonly vacancies: readonly DashboardVacancyItem[];
  readonly gridUnits?: number;
  readonly actions?: React.ReactNode;
  readonly emptyTitle?: string;
  readonly emptyHint?: string;
}

export interface DashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly header?: React.ReactNode;
  readonly filterBar?: React.ReactNode;
  readonly toolbar?: React.ReactNode;
  readonly columns?: readonly DashboardColumn[];
  readonly rejectedColumn?: DashboardColumn;
  readonly onCardClick?: (vacancy: DashboardVacancyItem) => void;
  readonly onAddColumn?: () => void;
  readonly addColumnLabel?: string;
  readonly children?: React.ReactNode;
  readonly snapToGrid?: boolean;
  readonly gridDeps?: readonly unknown[];
  readonly className?: string;
}

/**
 * High-density Dashboard template for job search tracking (Kanban board, filters, header).
 * Workspace columns are fully realized via the flex Table organism (Table, TableCol, TableHeader, TableBody, TableCell).
 */
export function Dashboard({
  header,
  filterBar,
  toolbar,
  columns,
  rejectedColumn,
  onCardClick,
  onAddColumn,
  addColumnLabel = 'ДОБАВИТЬ КОЛОНКУ',
  children,
  snapToGrid = true,
  gridDeps,
  className,
  ...restProps
}: DashboardProps): React.ReactElement {
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(true);
  const dashboardRef = useBlueprintGrid<HTMLDivElement>({
    deps: gridDeps,
    enabled: snapToGrid,
  });
  const handleGridScroll = useGridScroll();

  const rejectedCount = rejectedColumn?.vacancies.length ?? 0;

  return (
    <div
      ref={dashboardRef}
      className={cn(styles.dashboard, 'bp-page', className)}
      {...restProps}
    >
      {header}

      {filterBar !== undefined && (
        <section aria-label="Фильтры" className={styles.filterBar}>
          {filterBar}
        </section>
      )}

      {toolbar !== undefined && (
        <section aria-label="Панель действий" className={styles.toolbar}>
          {toolbar}
        </section>
      )}

      <main className={styles.workspace}>
        {children !== undefined ? (
          children
        ) : columns !== undefined ? (
          <Table layout="columns" snapScroll>
            {columns.map((col, idx) => {
              const colIndex = col.index ?? `[ ${String(idx + 1).padStart(2, '0')} ]`;
              const emptyTitle = col.emptyTitle ?? 'Нет вакансий на этом этапе';
              const emptyHint = col.emptyHint ?? 'Перетащите карточки сюда для обновления статуса';

              return (
                <TableCol key={col.id} gridUnits={col.gridUnits ?? 10}>
                  <TableHeader
                    index={colIndex}
                    indicatorColor={col.color}
                    title={col.name}
                    badge={`[${col.vacancies.length}]`}
                    actions={col.actions}
                  />

                  <TableBody
                    scrollable
                    snapScroll
                    padding="none"
                    emptyState={
                      <div className={styles.emptyColContainer}>
                        <Inbox size={20} className={styles.emptyColIcon} aria-hidden="true" />
                        <span className={styles.emptyColTitle}>{emptyTitle}</span>
                        <span className={styles.emptyColHint}>{emptyHint}</span>
                      </div>
                    }
                  >
                    {col.vacancies.map((vacancy) => (
                      <TableCell key={vacancy.id} padding="none">
                        <VacancyCard
                          {...vacancy}
                          onClick={onCardClick !== undefined ? () => onCardClick(vacancy) : undefined}
                        />
                      </TableCell>
                    ))}
                  </TableBody>
                </TableCol>
              );
            })}

            {onAddColumn !== undefined && (
              <div className={styles.addColumnCol}>
                <button
                  type="button"
                  className={styles.addColumnBtn}
                  onClick={onAddColumn}
                >
                  <Plus size={14} />
                  <span>{addColumnLabel}</span>
                </button>
              </div>
            )}
          </Table>
        ) : null}
      </main>

      {rejectedColumn !== undefined && (
        <footer className={styles.footer}>
          <div className={styles.rejectedBlock}>
            <div
              className={styles.rejectedHeader}
              role="button"
              tabIndex={0}
              onClick={() => setIsRejectedCollapsed((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsRejectedCollapsed((prev) => !prev);
                }
              }}
            >
              <div className={styles.rejectedHeaderInner}>
                <ChevronDown
                  size={14}
                  className={cn(
                    styles.rejectedChevron,
                    isRejectedCollapsed
                      ? styles.rejectedChevronRotated
                      : styles.rejectedChevronExpanded
                  )}
                />
                <span className={styles.rejectedLabel}>
                  {rejectedColumn.name.toUpperCase()}
                </span>
                <Badge size="sm" tone="danger">
                  {rejectedCount}
                </Badge>
              </div>
              <span className={styles.rejectedToggleHint}>
                {isRejectedCollapsed ? 'РАСКРЫТЬ' : 'СВЕРНУТЬ'}
              </span>
            </div>

            {!isRejectedCollapsed && (
              <div
                className={styles.rejectedContent}
                onScroll={(event) => handleGridScroll(event, 'x')}
              >
                {rejectedColumn.vacancies.map((v) => (
                  <VacancyCard
                    key={v.id}
                    {...v}
                    onClick={onCardClick !== undefined ? () => onCardClick(v) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
