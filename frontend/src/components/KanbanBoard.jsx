import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import KanbanCard from './KanbanCard';
import { useGridScroll } from '../utils/useGridScroll';
import { useTranslation } from '../i18n/I18nContext';
import { ChevronDown, ChevronUp, Ban, MoreVertical, Plus, Edit2, Trash2, Inbox } from 'lucide-react';
import {
  Table,
  TableCol,
  TableHeader,
  TableBody,
  Button,
  Icon,
  EmptyState,
  Text,
  StatusDot,
  Badge,
} from '@blueprint/ui-kit';
import { trackEvent, EVENTS } from '../utils/analytics';
import ColumnCreateModal from './ColumnCreateModal';
import ColumnEditModal from './ColumnEditModal';
import ColumnDeleteModal from './ColumnDeleteModal';
import {
  STATUS_NOT_CONTACTED,
  STATUS_REJECTED,
  BASE_STATUSES,
  DEFAULT_COLUMNS as DEFAULT_BOARD_COLUMNS,
} from '../constants/columns';

const REJECTED_STATUS = STATUS_REJECTED;

const sortByManualOrder = (list) => {
  const unordered = list.filter(v => v.sort_order == null);
  const ordered = list
    .filter(v => v.sort_order != null)
    .sort((a, b) => a.sort_order - b.sort_order);
  return [...unordered, ...ordered];
};

export default function KanbanBoard({
  vacancies,
  columns = DEFAULT_BOARD_COLUMNS,
  onColumnsChange,
  onCardClick,
  onStatusChange,
  selectedIds = [],
  onToggleSelect,
  onStatusChangeMulti,
  onReorder
}) {
  const { t } = useTranslation();
  const snapScroll = useGridScroll();
  const wrapperRef = useRef(null);
  const boardRef = useRef(null);
  const rejectedRef = useRef(null);
  const [boardHeight, setBoardHeight] = useState(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const rejected = rejectedRef.current;
    if (!wrapper || !rejected) return;
    const update = () => {
      const available = wrapper.clientHeight - rejected.offsetHeight;
      const minimum = window.innerHeight * 0.7;
      const height = Math.max(32, Math.floor(Math.max(available, minimum) / 32) * 32);
      setBoardHeight(previous => previous === height ? previous : height);
    };
    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    observer.observe(rejected);
    window.addEventListener('resize', update);
    update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const [isRejectedCollapsed, setIsRejectedCollapsed] = useState(false);

  // Column management modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null);
  const [activeMenuColId, setActiveMenuColId] = useState(null);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuColId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const boardColumns = Array.isArray(columns) && columns.length > 0 ? columns : DEFAULT_BOARD_COLUMNS;
  const rejectedColumn = boardColumns.find(c => c.system_role === 'rejected' || (c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'))) || boardColumns.find(c => c.id === STATUS_REJECTED) || boardColumns.find(c => c.is_base && c.system_role !== 'not_contacted');
  const rejectedStatusId = rejectedColumn ? rejectedColumn.id : REJECTED_STATUS;
  const funnelColumns = boardColumns.filter(c => c.id !== rejectedStatusId);
  const laneColumnIds = new Set(boardColumns.filter(c => c.has_lanes).map(c => c.id));

  const rejectedVacancies = sortByManualOrder(vacancies.filter(v => v.status === rejectedStatusId));

  const mapColorToPalette = (color) => {
    if (!color) return 'brand';
    const c = color.toLowerCase();
    if (c.includes('red') || c.includes('ef4444')) return 'danger';
    if (c.includes('green') || c.includes('10b981') || c.includes('22c55e')) return 'success';
    if (c.includes('yellow') || c.includes('amber') || c.includes('f59e0b')) return 'warning';
    if (c.includes('purple') || c.includes('8b5cf6') || c.includes('a855f7')) return 'purple';
    if (c.includes('cyan') || c.includes('06b6d4')) return 'cyan';
    if (c.includes('blue') || c.includes('3b82f6')) return 'info';
    return 'brand';
  };

  const computeDropIndex = (e) => {
    const cards = Array.from(e.currentTarget.querySelectorAll('.kanban-card:not(.is-dragging), article:not(.is-dragging)'));
    let index = 0;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) index += 1;
    }
    return index;
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    if (columnId !== rejectedStatusId && !laneColumnIds.has(columnId)) {
      const idx = computeDropIndex(e);
      setDropIndex(prev => (prev === idx ? prev : idx));
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
      setDropIndex(null);
      setDragOverLane(0);
    }
  };

  const handleLaneDragOver = (e, columnId, lane) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(columnId);
    setDragOverLane(lane);
  };

  const handleDrop = (e, columnId, forcedLane = null) => {
    e.preventDefault();
    const lane = forcedLane !== null ? forcedLane : (laneColumnIds.has(columnId) ? dragOverLane : 0);
    const targetIndex = (columnId !== rejectedStatusId && !laneColumnIds.has(columnId)) ? computeDropIndex(e) : null;
    setDragOverColumn(null);
    setDropIndex(null);
    setDragOverLane(0);
    const vacancyId = e.dataTransfer.getData('text/plain');
    if (vacancyId) {
      const vid = parseInt(vacancyId, 10);
      const dragged = vacancies.find(v => v.id === vid);
      if (!dragged) return;
      if (selectedIds.includes(vid) && selectedIds.length > 1 && onStatusChangeMulti) {
        selectedIds.forEach(id => {
          trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
            vacancy_id: id,
            to_status: columnId,
            method: 'drag_and_drop_multi'
          });
        });
        onStatusChangeMulti(selectedIds, columnId, lane);
      } else if (onReorder && !laneColumnIds.has(columnId)) {
        const ids = sortByManualOrder(vacancies.filter(v => v.status === columnId))
            .map(v => v.id)
            .filter(id => id !== vid);
        if (targetIndex !== null) {
          ids.splice(Math.min(targetIndex, ids.length), 0, vid);
        } else {
          ids.push(vid);
        }

        trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
          vacancy_id: vid,
          to_status: columnId,
          method: dragged.status === columnId ? 'drag_reorder' : 'drag_and_drop'
        });
        onReorder(columnId, ids, lane, vid);
      } else {
        trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
          vacancy_id: vid,
          to_status: columnId,
          method: 'drag_and_drop'
        });
        onStatusChange(vid, columnId, lane);
      }
    }
  };

  const handleCreateColumn = async (newColData) => {
    const res = await fetch('/api/v2/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newColData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create column');
    }
    const updated = await res.json();
    if (onColumnsChange) onColumnsChange(updated);
  };

  const handleSaveColumn = async (colId, updateData) => {
    const res = await fetch(`/api/v2/columns/${encodeURIComponent(colId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update column');
    }
    const updated = await res.json();
    if (onColumnsChange) onColumnsChange(updated);
  };

  const handleDeleteColumn = async (colId, migrateTo) => {
    const res = await fetch(`/api/v2/columns/${encodeURIComponent(colId)}?migrate_to=${encodeURIComponent(migrateTo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete column');
    }
    const updated = await res.json();
    if (onColumnsChange) onColumnsChange(updated);
  };

  return (
    <div className="kanban-wrapper" ref={wrapperRef} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Funnel Columns */}
      <Table
        ref={boardRef}
        layout="columns"
        snapScroll
        fullHeight
        className="kanban-board-table"
        onScroll={event => snapScroll(event, 'x')}
        style={boardHeight ? { height: boardHeight, flex: 1 } : { flex: 1 }}
        onDragStart={(e) => {
          const id = parseInt(e.dataTransfer.getData('text/plain'), 10);
          setDraggingId(Number.isNaN(id) ? null : id);
        }}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOverColumn(null);
          setDropIndex(null);
          setDragOverLane(0);
        }}
      >
        {funnelColumns.map((col, colIndex) => {
          const isLaneColumn = laneColumnIds.has(col.id);
          const columnVacancies = sortByManualOrder(vacancies.filter(v => v.status === col.id));
          if (isLaneColumn) columnVacancies.sort((a, b) => (b.lane ?? 0) - (a.lane ?? 0));
          const columnName = t(`kanban.columns.${col.id}`);
          const isDragging = draggingId !== null;
          const isBase = BASE_STATUSES.includes(col.id);

          const maxLaneInCol = columnVacancies.reduce((m, v) => Math.max(m, (v.lane || 0)), 0);
          const laneCount = Math.max(1, maxLaneInCol + 1);
          const laneOptions = Array.from({ length: laneCount }, (_, i) => i);
          laneOptions.push(laneCount); // "+" extra lane

          const showIndicator = !isLaneColumn && dragOverColumn === col.id && dropIndex !== null;
          const cardsWithIndicator = [];
          let visibleIndex = 0;
          const pushIndicator = () => cardsWithIndicator.push(<div key="drop-indicator" className="drop-indicator" />);

          columnVacancies.forEach((vacancy) => {
            const isDragged = vacancy.id === draggingId;
            if (showIndicator && !isDragged && dropIndex === visibleIndex) pushIndicator();
            cardsWithIndicator.push(
              <KanbanCard
                key={vacancy.id}
                vacancy={vacancy}
                onClick={onCardClick}
                onStatusChange={onStatusChange}
                isSelected={selectedIds.includes(vacancy.id)}
                onToggleSelect={onToggleSelect}
                columns={boardColumns}
                laneColumns={laneColumnIds}
              />
            );
            if (!isDragged) visibleIndex += 1;
          });
          if (showIndicator && dropIndex >= visibleIndex) pushIndicator();

          const isMenuOpen = activeMenuColId === col.id;

          return (
            <TableCol
              key={col.id}
              gridUnits={10}
              isDragOver={dragOverColumn === col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{ position: 'relative' }}
            >
              <TableHeader
                size="sm"
                actions={
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuColId(prev => prev === col.id ? null : col.id);
                      }}
                      title={t('kanban.edit_column')}
                      aria-label={t('kanban.edit_column')}
                    >
                      <Icon icon={MoreVertical} size="xs" />
                    </Button>

                    {/* Column Action Menu */}
                    {isMenuOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          zIndex: 100,
                          minWidth: '180px',
                          padding: 'var(--ui-space-1)',
                          backgroundColor: 'var(--ui-bg-surface)',
                          border: '1px solid var(--ui-border-strong)',
                          boxShadow: 'var(--ui-shadow-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--ui-space-1)',
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          justify="start"
                          startIcon={<Icon icon={Edit2} size="xs" tone="accent" />}
                          onClick={() => {
                            setActiveMenuColId(null);
                            setEditingColumn(col);
                          }}
                          style={{ width: '100%' }}
                        >
                          {t('kanban.edit_column')}
                        </Button>

                        {!isBase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            tone="danger"
                            justify="start"
                            startIcon={<Icon icon={Trash2} size="xs" />}
                            onClick={() => {
                              setActiveMenuColId(null);
                              setDeletingColumn(col);
                            }}
                            style={{ width: '100%' }}
                          >
                            {t('kanban.delete_column')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                }
              >
                <Text as="span" variant="mono" weight="semibold" tone="accent">
                  {`[ ${String(colIndex + 1).padStart(2, '0')} ]`}
                </Text>
                <StatusDot color={col.color || '#2563eb'} size="md" />
                <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                  {columnName}
                </Text>
                <Badge variant="counter" size="xs" tone="neutral">
                  {columnVacancies.length}
                </Badge>
              </TableHeader>

              <TableBody
                scrollable
                snapScroll
                padding="none"
                gap="none"
                className="column-cards"
                onScroll={snapScroll}
                emptyState={
                  <EmptyState
                    icon={<Icon icon={Inbox} size="md" />}
                    title={t('kanban.empty_column')}
                    description={t('kanban.empty_column_hint')}
                  />
                }
              >
                {cardsWithIndicator}
              </TableBody>

              {/* Jira-style vertical drop overlay when dragging over a segmented column */}
              {isLaneColumn && isDragging && dragOverColumn === col.id && (
                <div className="lanes-overlay">
                  {laneOptions.map(l => {
                    const isPlus = l === laneCount;
                    const isActive = dragOverLane === l;
                    return (
                      <div
                        key={l}
                        className={`lane-dropzone ${isPlus ? 'is-new-lane' : ''} ${isActive ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleLaneDragOver(e, col.id, l)}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, col.id, l);
                        }}
                      >
                        <span className="lane-dropzone-badge">{isPlus ? '+' : l + 1}</span>
                        <span className="lane-dropzone-text">
                          {isPlus ? t('kanban.new_stage') : t('kanban.stage_n', { n: l + 1 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TableCol>
          );
        })}

        {/* Add column quick button at the end of board */}
        <TableCol gridUnits={6} className="kanban-add-column-col" style={{ display: 'flex', flexDirection: 'column', minWidth: 'calc(6 * var(--ui-grid-cell))', maxWidth: 'calc(6 * var(--ui-grid-cell))' }}>
          <div style={{ height: 'var(--ui-grid-cell)', display: 'flex', alignItems: 'center', padding: '0 var(--ui-space-2)', borderBottom: '1px solid var(--ui-pixel-line)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              startIcon={<Icon icon={Plus} size="xs" />}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              {t('kanban.add_column')}
            </Button>
          </div>
        </TableCol>
      </Table>

      {/* Bottom Rejection Row */}
      <div
        ref={rejectedRef}
        onDragOver={(e) => handleDragOver(e, rejectedStatusId)}
        onDragLeave={(e) => handleDragLeave(e, rejectedStatusId)}
        onDrop={(e) => handleDrop(e, rejectedStatusId)}
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--ui-pixel-line)',
          backgroundColor: dragOverColumn === rejectedStatusId ? 'var(--ui-danger-subtle)' : 'var(--ui-bg-surface)',
          transition: 'background-color var(--ui-transition-fast)',
        }}
      >
        <TableHeader
          size="sm"
          onClick={() => {
            trackEvent(EVENTS.REJECTED_TOGGLE, { collapsed: !isRejectedCollapsed });
            setIsRejectedCollapsed(prev => !prev);
          }}
          style={{ cursor: 'pointer' }}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(EVENTS.REJECTED_TOGGLE, { collapsed: !isRejectedCollapsed });
                setIsRejectedCollapsed(prev => !prev);
              }}
              title={isRejectedCollapsed ? t('kanban.rejected_expand') : t('kanban.rejected_collapse')}
              endIcon={<Icon icon={isRejectedCollapsed ? ChevronUp : ChevronDown} size="xs" />}
            >
              {isRejectedCollapsed ? t('kanban.rejected_expand') : t('kanban.rejected_collapse')}
            </Button>
          }
        >
          <StatusDot tone="danger" size="md" />
          <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
            {rejectedColumn && rejectedColumn.id !== STATUS_REJECTED ? rejectedColumn.id : t('kanban.rejected_title')}
          </Text>
          <Badge variant="counter" size="xs" tone="neutral">
            {rejectedVacancies.length}
          </Badge>
        </TableHeader>

        {!isRejectedCollapsed && (
          <div style={{ maxHeight: 'calc(10 * var(--ui-grid-cell))', overflowX: 'auto', overflowY: 'hidden' }}>
            {rejectedVacancies.length === 0 ? (
              <div style={{ padding: 'var(--ui-space-4)' }}>
                <EmptyState
                  icon={<Icon icon={Ban} size="md" />}
                  title={t('kanban.rejected_empty')}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: 'var(--ui-space-2)', padding: 'var(--ui-space-2) var(--ui-space-3)' }}>
                {rejectedVacancies.map(vacancy => (
                  <div key={vacancy.id} style={{ width: 'calc(10 * var(--ui-grid-cell))', minWidth: 'calc(10 * var(--ui-grid-cell))', flexShrink: 0 }}>
                    <KanbanCard
                      vacancy={vacancy}
                      onClick={onCardClick}
                      onStatusChange={onStatusChange}
                      isSelected={selectedIds.includes(vacancy.id)}
                      onToggleSelect={onToggleSelect}
                      columns={boardColumns}
                      laneColumns={laneColumnIds}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column Modals */}
      <ColumnCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateColumn}
      />

      <ColumnEditModal
        isOpen={Boolean(editingColumn)}
        column={editingColumn}
        onClose={() => setEditingColumn(null)}
        onSave={handleSaveColumn}
      />

      <ColumnDeleteModal
        isOpen={Boolean(deletingColumn)}
        column={deletingColumn}
        availableColumns={funnelColumns}
        vacanciesCount={deletingColumn ? vacancies.filter(v => v.status === deletingColumn.id).length : 0}
        onClose={() => setDeletingColumn(null)}
        onDelete={handleDeleteColumn}
      />
    </div>
  );
}
