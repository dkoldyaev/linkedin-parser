import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  Button,
  ButtonGroup,
  CardFooter,
  Icon,
  StatusDot,
  Text,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { Vacancy } from '../types/models';
import styles from './KanbanCard.module.css';

export interface KanbanCardFooterContentProps {
  vacancy: Vacancy;
  isRejected: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: (e: React.MouseEvent) => void;
  onMoveRight: (e: React.MouseEvent) => void;
  onMoveRejected: (e: React.MouseEvent) => void;
  onRestoreRejected: (e: React.MouseEvent) => void;
}

const HISTORY_ICON = <Icon icon={History} size="2xs" />;
const COMMENT_DOT = <StatusDot tone="info" size="xs" />;
const RESTORE_ICON = <Icon icon={RotateCcw} size="xs" />;
const LEFT_ICON = <Icon icon={ChevronLeft} size="sm" />;
const RIGHT_ICON = <Icon icon={ChevronRight} size="sm" />;
const REJECT_ICON = <Icon icon={X} size="sm" />;

export default function KanbanCardFooterContent({
  vacancy,
  isRejected,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onMoveRejected,
  onRestoreRejected,
}: KanbanCardFooterContentProps): React.ReactElement {
  const { t, formatDate } = useTranslation();

  const history = vacancy.history || [];
  const hasHistory = history.length > 0;
  const hasHistoryComments = hasHistory && history.some((h) => Boolean(h.comment));

  const metaSlot = (
    <div className={styles.footerRow}>
      {vacancy.created_at !== undefined && (
        <Text variant="caption" tone="muted">
          {formatDate(vacancy.created_at)}
        </Text>
      )}
      {hasHistory && (
        <Text
          variant="caption"
          tone="muted"
          startIcon={HISTORY_ICON}
          endIcon={hasHistoryComments ? COMMENT_DOT : undefined}
        >
          {history.length}
        </Text>
      )}
    </div>
  );

  const actionsSlot = isRejected ? (
    <Button
      variant="ghost"
      size="sm"
      tone="accent"
      onClick={onRestoreRejected}
      startIcon={RESTORE_ICON}
    >
      {t('kanban.rejected_restore')}
    </Button>
  ) : (
    <ButtonGroup>
      <Button
        variant="ghost"
        size="icon"
        disabled={!canMoveLeft}
        onClick={onMoveLeft}
        aria-label={t('kanban.move_left')}
        title={t('kanban.move_left')}
      >
        {LEFT_ICON}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        tone="danger"
        onClick={onMoveRejected}
        aria-label={t('kanban.move_to_rejected')}
        title={t('kanban.move_to_rejected')}
      >
        {REJECT_ICON}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!canMoveRight}
        onClick={onMoveRight}
        aria-label={t('kanban.move_right')}
        title={t('kanban.move_right')}
      >
        {RIGHT_ICON}
      </Button>
    </ButtonGroup>
  );

  return <CardFooter metaSlot={metaSlot} actionsSlot={actionsSlot} />;
}
