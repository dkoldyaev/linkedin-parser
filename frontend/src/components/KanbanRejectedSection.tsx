import {
  Badge,
  Button,
  EmptyState,
  Icon,
  StatusDot,
  Table,
  TableHeader,
  Text,
} from '@blueprint/ui-kit';
import { Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { EVENTS, trackEvent } from '../utils/analytics';
import type { BoardColumn } from '../types/models';
import KanbanCard from './KanbanCard';
import type { KanbanRejectedSectionProps } from './kanban.types';
import React from 'react';
import { STATUS_REJECTED } from '../constants/columns';
import { useTranslation } from '../i18n/I18nContext';

export type { KanbanRejectedSectionProps };

const TABLE_STYLE: React.CSSProperties = {
  flex: 'none',
  width: '100%',
  zIndex: 10,
  maxHeight: '30vh',
  display: 'flex',
  flexDirection: 'column',
};

const CARDS_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 'var(--ui-space-2)',
  padding: 'var(--ui-space-2)',
  overflowY: 'auto',
  maxHeight: 'calc(30vh - var(--ui-header-height, 48px))',
  width: '100%',
  boxSizing: 'border-box',
};

const UP_ICON = <Icon icon={ChevronUp} size="xs" />;
const DOWN_ICON = <Icon icon={ChevronDown} size="xs" />;
const BAN_ICON = <Icon icon={Ban} size="md" />;

function resolveRejectedHeaderTitle(
  rejectedColumn: BoardColumn | undefined,
  defaultTitle: string,
): string {
  if (rejectedColumn && rejectedColumn.id !== STATUS_REJECTED) {
    return rejectedColumn.id;
  }
  return defaultTitle;
}

const KanbanRejectedSection = React.forwardRef<HTMLDivElement, KanbanRejectedSectionProps>(
  function KanbanRejectedSection(props, ref): React.ReactElement {
    const { t } = useTranslation();
    const {
      isRejectedCollapsed,
      rejectedStatusId,
      rejectedVacancies,
      hiddenVacancyIds = new Set<number>(),
    } = props;

    const toggleLabel = isRejectedCollapsed
      ? t('kanban.rejected_expand')
      : t('kanban.rejected_collapse');
    const toggleIcon = isRejectedCollapsed ? UP_ICON : DOWN_ICON;

    const handleToggle = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      trackEvent(EVENTS.REJECTED_TOGGLE, { collapsed: !isRejectedCollapsed });
      props.onToggleCollapse();
    };

    const actionsButton = (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        title={toggleLabel}
        endIcon={toggleIcon}
      >
        {toggleLabel}
      </Button>
    );

    const visibleRejectedCount = rejectedVacancies.filter(
      (v) => !hiddenVacancyIds.has(v.id),
    ).length;
    const title = resolveRejectedHeaderTitle(props.rejectedColumn, t('kanban.rejected_title'));

    return (
      <Table
        bordered
        fullHeight={false}
        layout="rows"
        ref={ref}
        onDragOver={(e) => props.onDragOver(e, rejectedStatusId)}
        onDragLeave={(e) => props.onDragLeave(e, rejectedStatusId)}
        onDrop={(e) => props.onDrop(e, rejectedStatusId)}
        style={TABLE_STYLE}
      >
        <TableHeader
          size="sm"
          onClick={() => handleToggle()}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          actions={actionsButton}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <StatusDot tone="danger" size="sm" />
            <Text variant="mono" weight="bold">
              {title.toUpperCase()}
            </Text>
            <Badge variant="subtle" size="sm">
              {visibleRejectedCount}
            </Badge>
          </div>
        </TableHeader>

        {!isRejectedCollapsed && (
          <div style={CARDS_CONTAINER_STYLE}>
            {rejectedVacancies.length === 0 ? (
              <div style={{ padding: 'var(--ui-space-3)', width: '100%' }}>
                <EmptyState icon={BAN_ICON} title={t('kanban.rejected_empty')} />
              </div>
            ) : (
              rejectedVacancies.map((vacancy) => (
                <div
                  key={vacancy.id}
                  style={
                    hiddenVacancyIds.has(vacancy.id)
                      ? { display: 'none' }
                      : { maxWidth: 'calc(10 * var(--ui-grid-cell))' }
                  }
                >
                  <KanbanCard
                    compact
                    vacancy={vacancy}
                    onClick={props.onCardClick}
                    onStatusChange={props.onStatusChange}
                    isSelected={props.selectedIds.includes(vacancy.id)}
                    columns={props.boardColumns}
                    laneColumns={props.laneColumnIds}
                    isHidden={hiddenVacancyIds.has(vacancy.id)}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </Table>
    );
  },
);

KanbanRejectedSection.displayName = 'KanbanRejectedSection';

export default KanbanRejectedSection;
