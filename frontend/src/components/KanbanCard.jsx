import React from 'react';
import { 
  MapPin, 
  ExternalLink, Banknote, Globe, Layers, Building, Ban,
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
  TokenList,
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
      ? Globe
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

  const hasHistory = vacancy.history && vacancy.history.length > 0;
  const hasHistoryComments = hasHistory && vacancy.history.some(h => h.comment);

  const isInterview =
    vacancy.status === 'interview' ||
    vacancy.status === STATUS_INTERVIEW ||
    (typeof vacancy.status === 'string' && vacancy.status.toLowerCase().includes('собесед'));

  return (
    <Card
      matchScore={matchScore ?? undefined}
      selected={isSelected}
      interactive
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={isRejected ? 'is-rejected' : vacancy.is_closed ? 'is-closed' : ''}
    >
      <CardBody>
        <CardHeader
          overline={vacancy.company}
          overlineHref={vacancy.url}
          title={vacancy.title}
          selectable={isSelected}
          checked={isSelected || false}
          onCheckedChange={() => onToggleSelect && onToggleSelect(vacancy.id)}
          checkboxAriaLabel="Выделить карточку"
          statusIndicators={
            <>
              {laneColumns.has(vacancy.status) && vacancy.lane != null ? (
                <Badge variant="outline" size="xs" tone="info">
                  {t('kanban.stage_badge', { n: (vacancy.lane || 0) + 1 })}
                </Badge>
              ) : isInterview ? (
                <Badge variant="outline" size="xs" tone="info">
                  Interview
                </Badge>
              ) : (
                (() => {
                  const col = Array.isArray(columns) && columns.find(c => (typeof c === 'string' ? c : c.id) === vacancy.status);
                  const colId = col ? (typeof col === 'string' ? col : col.id) : vacancy.status;
                  if (colId === STATUS_ASSESSMENT || colId === STATUS_OFFER) {
                    const label = t(`kanban.columns.${colId}`) || (typeof col === 'object' ? col.name : colId);
                    return (
                      <Badge variant="outline" size="xs" tone="info">
                        {label.toUpperCase()}
                      </Badge>
                    );
                  }
                  return null;
                })()
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
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ui-space-1-5) var(--ui-space-3)' }}>
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
              <Text
                variant="caption"
                tone={workplaceTone}
                startIcon={<Icon icon={workplaceIcon} size="xs" />}
                title={t('workplace.badge_title', { format: workplaceInfo.fullLabel || workplaceInfo.label })}
              >
                {workplaceInfo.key === 'remote' ? 'Remote' : workplaceInfo.label}
              </Text>
            )}
            {vacancy.location && (
              <Text
                variant="caption"
                tone="secondary"
                startIcon={<Icon icon={MapPin} size="xs" />}
              >
                {vacancy.location}
              </Text>
            )}
            {salaryInfo.hasSalary && (
              <Text
                variant="mono"
                tone="success"
                startIcon={<Icon icon={Banknote} size="xs" />}
                title={salaryInfo.original || salaryInfo.formatted}
              >
                {salaryInfo.formatted}
              </Text>
            )}
          </div>
        )}

        {/* AI Summary or Skeleton */}
        {vacancy.ai_summary ? (
          <Paragraph
            size="sm"
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
        {vacancy.tech_stack && vacancy.tech_stack.length > 0 && (
          <TokenList>
            {vacancy.tech_stack.slice(0, 4).map((tech, i) => (
              <Badge key={i} size="xs" variant="chip">
                {tech}
              </Badge>
            ))}
            {vacancy.tech_stack.length > 4 && (
              <Badge size="xs" variant="chip" tone="neutral" style={{ opacity: 0.6 }}>
                +{vacancy.tech_stack.length - 4}
              </Badge>
            )}
          </TokenList>
        )}

        {/* Custom tags */}
        {vacancy.tags && vacancy.tags.length > 0 && (
          <TokenList>
            {vacancy.tags.map((tag, i) => (
              <Badge key={i} size="xs" variant="chip" tone="neutral">
                #{tag}
              </Badge>
            ))}
          </TokenList>
        )}
      </CardBody>

      <CardFooter
        metaSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <Text variant="caption" tone="muted">
              {formatDate(vacancy.created_at)}
            </Text>
            {hasHistory && (
              <Text
                variant="caption"
                tone="muted"
                startIcon={<Icon icon={History} size="2xs" />}
                title={
                  hasHistoryComments
                    ? t('vacancyModal.history_badge_with_comments', { count: vacancy.history.length })
                    : t('vacancyModal.history_badge_hint', { count: vacancy.history.length })
                }
              >
                {vacancy.history.length}
              </Text>
            )}
          </div>
        }
        actionsSlot={
          isRejected ? (
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
            <ButtonGroup>
              <Button
                variant="ghost"
                size="icon"
                title={t('kanban.move_left')}
                aria-label={t('kanban.move_left')}
                disabled={currentIndex <= 0}
                onClick={handleMoveLeft}
              >
                <Icon icon={ChevronLeft} size="sm" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
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
                <Icon icon={X} size="sm" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={t('kanban.move_right')}
                aria-label={t('kanban.move_right')}
                disabled={currentIndex >= linearColumns.length - 1}
                onClick={handleMoveRight}
              >
                <Icon icon={ChevronRight} size="sm" />
              </Button>
            </ButtonGroup>
          )
        }
      />
    </Card>
  );
}
