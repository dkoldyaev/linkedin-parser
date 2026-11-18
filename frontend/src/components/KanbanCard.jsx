import React, { useLayoutEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  ExternalLink, Banknote, Laptop, Layers, Building, Ban,
  RotateCcw, History, Award, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  Text,
  Paragraph,
  Skeleton,
} from '@blueprint/ui-kit';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import {
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
  STATUS_REJECTED,
} from '../constants/columns';

const DEFAULT_COLUMNS = [
  STATUS_NOT_CONTACTED,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_ASSESSMENT,
  STATUS_OFFER,
];

export default function KanbanCard({
  vacancy,
  onClick,
  onStatusChange,
  isSelected,
  onToggleSelect,
  columns = DEFAULT_COLUMNS,
  laneColumns = new Set([STATUS_INTERVIEW, STATUS_ASSESSMENT])
}) {
  const { t, formatDate, salaryDisplayFormat, salaryTargetCurrency, exchangeRates } = useTranslation();
  const contentRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const updateHeight = () => {
      const height = Math.ceil(content.offsetHeight / 32) * 32;
      setGridHeight((previous) => (previous === height ? previous : height));
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    updateHeight();
    return () => observer.disconnect();
  }, []);

  const rejectedColumn = Array.isArray(columns)
    ? columns.find(c => c.system_role === 'rejected' || (c.is_base && (c.id === STATUS_REJECTED || c.role === 'rejected'))) || columns.find(c => c.id === STATUS_REJECTED)
    : null;
  const rejectedStatusId = rejectedColumn ? (typeof rejectedColumn === 'string' ? rejectedColumn : rejectedColumn.id) : STATUS_REJECTED;

  const initialColumn = Array.isArray(columns)
    ? columns.find(c => c.system_role === 'not_contacted' || (c.is_base && (c.id === STATUS_NOT_CONTACTED || c.role === 'not_contacted'))) || columns.find(c => c.id === STATUS_NOT_CONTACTED)
    : null;
  const initialStatusId = initialColumn ? (typeof initialColumn === 'string' ? initialColumn : initialColumn.id) : STATUS_NOT_CONTACTED;

  const isRejected = vacancy.status === rejectedStatusId;
  const linearColumns = (Array.isArray(columns) && columns.length > 0)
    ? columns.map(c => typeof c === 'string' ? c : c.id).filter(id => id !== rejectedStatusId)
    : DEFAULT_COLUMNS;
  const currentIndex = linearColumns.indexOf(vacancy.status);
  const salaryInfo = getSalaryDisplay(vacancy, t, salaryDisplayFormat, salaryTargetCurrency, exchangeRates);
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);

  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : null;
  const matchTone =
    matchScore === null
      ? 'neutral'
      : matchScore >= 75
        ? 'success'
        : matchScore >= 50
          ? 'warning'
          : 'danger';

  const workplaceIcon =
    workplaceInfo?.key === 'remote'
      ? Laptop
      : workplaceInfo?.key === 'hybrid'
        ? Layers
        : Building;

  const workplaceTone =
    workplaceInfo?.key === 'remote'
      ? 'accent'
      : workplaceInfo?.key === 'hybrid'
        ? 'warning'
        : 'secondary';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', vacancy.id.toString());
    e.currentTarget.classList.add('is-dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('is-dragging');
  };

  const handleMoveLeft = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      const targetStatus = linearColumns[currentIndex - 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (currentIndex < linearColumns.length - 1) {
      const targetStatus = linearColumns[currentIndex + 1];
      trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
        vacancy_id: vacancy.id,
        company: vacancy.company,
        from_status: vacancy.status,
        to_status: targetStatus,
        method: 'quick_arrow'
      });
      onStatusChange(vacancy.id, targetStatus);
    }
  };

  const handleCardClick = () => {
    trackEvent(EVENTS.VACANCY_CARD_CLICK, {
      vacancy_id: vacancy.id,
      company: vacancy.company,
      status: vacancy.status,
      is_closed: Boolean(vacancy.is_closed),
      has_salary: salaryInfo.hasSalary
    });
    onClick(vacancy);
  };

  const handleCompanyLinkClick = (e) => {
    e.stopPropagation();
    trackEvent(EVENTS.COMPANY_LINK_CLICK, {
      vacancy_id: vacancy.id,
      company: vacancy.company
    });
  };

  const hasHistory = vacancy.history && vacancy.history.length > 0;
  const hasHistoryComments = hasHistory && vacancy.history.some(h => h.comment);

  return (
    <Card
      matchScore={matchScore ?? undefined}
      selected={isSelected}
      status={isRejected ? 'danger' : vacancy.is_closed ? 'warning' : 'neutral'}
      interactive
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={isRejected ? 'is-rejected' : vacancy.is_closed ? 'is-closed' : ''}
    >
      <CardBody style={gridHeight ? { minHeight: gridHeight } : undefined}>
        <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
          <CardHeader
            overline={vacancy.company}
            overlineHref={vacancy.url}
            title={vacancy.title}
            selectable
            checked={isSelected || false}
            onCheckedChange={() => onToggleSelect && onToggleSelect(vacancy.id)}
            checkboxAriaLabel="Выделить карточку"
            statusIndicators={
              <>
                {laneColumns.has(vacancy.status) && vacancy.lane != null && (
                  <Badge variant="outline" size="xs" tone="info">
                    {t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 })}
                  </Badge>
                )}
                {vacancy.is_closed && (
                  <Badge
                    variant="solid"
                    size="xs"
                    tone="danger"
                    icon={<Icon icon={Ban} size="2xs" />}
                    title={t('kanban.closed_hint')}
                  >
                    {t('kanban.closed')}
                  </Badge>
                )}
              </>
            }
          />

          {/* Meta row: match score, workplace format, location, salary */}
          {(vacancy.location || salaryInfo.hasSalary || workplaceInfo || matchScore !== null) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ui-space-1-5)' }}>
              {matchScore !== null && (
                <Badge
                  variant="solid"
                  size="xs"
                  tone={matchTone}
                  icon={<Icon icon={Award} size="2xs" />}
                  title={t('kanban.match_badge', { score: matchScore })}
                >
                  {matchScore}%
                </Badge>
              )}
              {workplaceInfo && (
                <Badge
                  variant="outline"
                  size="xs"
                  tone={workplaceTone}
                  icon={<Icon icon={workplaceIcon} size="2xs" />}
                  title={t('workplace.badge_title', { format: workplaceInfo.fullLabel || workplaceInfo.label })}
                >
                  {workplaceInfo.label}
                </Badge>
              )}
              {vacancy.location && (
                <Text
                  variant="caption"
                  tone="secondary"
                  startIcon={<Icon icon={MapPin} size="xs" />}
                  style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  {vacancy.location}
                </Text>
              )}
              {salaryInfo.hasSalary && (
                <Badge
                  variant="outline"
                  size="xs"
                  tone="accent"
                  icon={<Icon icon={Banknote} size="2xs" />}
                  title={salaryInfo.original || salaryInfo.formatted}
                >
                  {salaryInfo.formatted}
                </Badge>
              )}
            </div>
          )}

          {/* AI Summary or Skeleton */}
          {vacancy.ai_summary ? (
            <Paragraph
              variant="caption"
              tone="secondary"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {vacancy.ai_summary}
            </Paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} aria-hidden="true">
              <Skeleton width="full" height="xs" />
              <Skeleton width="lg" height="xs" />
              <Skeleton width="md" height="xs" />
            </div>
          )}

          {/* Tech stack pills */}
          {vacancy.tech_stack && vacancy.tech_stack.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {vacancy.tech_stack.slice(0, 4).map((tech, i) => (
                <Badge key={i} variant="outline" size="xs" tone="neutral">
                  {tech}
                </Badge>
              ))}
              {vacancy.tech_stack.length > 4 && (
                <Badge variant="outline" size="xs" tone="neutral" style={{ opacity: 0.6 }}>
                  +{vacancy.tech_stack.length - 4}
                </Badge>
              )}
            </div>
          ) : !vacancy.ai_summary && (
            <div style={{ display: 'flex', gap: '4px' }} aria-hidden="true">
              <Skeleton width="sm" height="xs" />
              <Skeleton width="sm" height="xs" />
              <Skeleton width="sm" height="xs" />
            </div>
          )}

          {/* Custom tags */}
          {vacancy.tags && vacancy.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {vacancy.tags.map((tag, i) => (
                <Badge key={i} variant="outline" size="xs" tone="primary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter justify="between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <Text variant="mono" tone="muted" style={{ fontSize: 'var(--ui-font-size-2xs)' }}>
            {formatDate(vacancy.created_at)}
          </Text>
          {hasHistory && (
            <Badge
              variant="outline"
              size="xs"
              tone={hasHistoryComments ? 'accent' : 'neutral'}
              icon={<Icon icon={History} size="2xs" />}
              title={
                hasHistoryComments
                  ? t('vacancyModal.history_badge_with_comments', { count: vacancy.history.length })
                  : t('vacancyModal.history_badge_hint', { count: vacancy.history.length })
              }
            >
              {vacancy.history.length}
            </Badge>
          )}
        </div>

        {isRejected ? (
          <Button
            variant="ghost"
            size="xs"
            tone="accent"
            title={t('kanban.rejected_restore_hint')}
            onClick={(e) => {
              e.stopPropagation();
              trackEvent(EVENTS.VACANCY_RESTORE_REJECTED, {
                vacancy_id: vacancy.id,
                company: vacancy.company,
                to_status: initialStatusId,
                method: 'quick_restore_btn'
              });
              onStatusChange(vacancy.id, initialStatusId);
            }}
            startIcon={<Icon icon={RotateCcw} size="xs" />}
          >
            {t('kanban.rejected_restore')}
          </Button>
        ) : (
          <ButtonGroup size="xs" attached>
            <Button
              variant="ghost"
              size="icon-xs"
              title={t('kanban.move_left')}
              aria-label={t('kanban.move_left')}
              disabled={currentIndex <= 0}
              onClick={handleMoveLeft}
            >
              <Icon icon={ChevronLeft} size="xs" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              tone="danger"
              title={t('kanban.move_to_rejected')}
              aria-label={t('kanban.move_to_rejected')}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(EVENTS.VACANCY_MOVE_REJECTED, {
                  vacancy_id: vacancy.id,
                  company: vacancy.company,
                  from_status: vacancy.status,
                  method: 'quick_reject_btn'
                });
                onStatusChange(vacancy.id, rejectedStatusId);
              }}
            >
              <Icon icon={X} size="xs" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title={t('kanban.move_right')}
              aria-label={t('kanban.move_right')}
              disabled={currentIndex >= linearColumns.length - 1}
              onClick={handleMoveRight}
            >
              <Icon icon={ChevronRight} size="xs" />
            </Button>
          </ButtonGroup>
        )}
      </CardFooter>
    </Card>
  );
}
