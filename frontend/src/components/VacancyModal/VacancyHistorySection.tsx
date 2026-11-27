import {
  Badge,
  Button,
  Icon,
  Skeleton,
  Stepper,
  type StepperItemData,
  Text,
  Textarea,
} from '@blueprint/ui-kit';
import { Check, Edit3, History, MessageSquare, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { type TranslateFn, useTranslation } from '../../i18n/I18nContext';
import { TitledSection } from '../TitledSection';
import type { VacancyHistoryItem as UiVacancyHistoryItem } from '@blueprint/ui-kit';

export interface VacancyHistorySectionProps {
  items: readonly UiVacancyHistoryItem[];
  loading?: boolean;
  onSaveComment?: (id: string, comment: string) => void | Promise<void>;
  onDeleteComment?: (id: string) => void | Promise<void>;
}

const SKELETON_STACK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-2)',
};

interface CommentRenderArgs {
  item: UiVacancyHistoryItem;
  isEditing: boolean;
  commentDraft: string;
  onDraftChange: (val: string) => void;
  onStartEdit: (id: string, currentComment: string) => void;
  onCancelEdit: () => void;
  onSave: (id: string) => void;
  onSaveComment?: (id: string, comment: string) => void | Promise<void>;
  onDeleteComment?: (id: string) => void | Promise<void>;
  t: TranslateFn;
}

function renderEditingControls(args: CommentRenderArgs): React.ReactElement {
  return (
    <div>
      <Textarea
        rows={2}
        placeholder={args.t('vacancyModal.history_comment_placeholder')}
        value={args.commentDraft}
        onChange={(e) => args.onDraftChange(e.target.value)}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button
          variant="primary"
          size="sm"
          startIcon={<Icon icon={Check} size="xs" />}
          onClick={() => args.onSave(args.item.id)}
        >
          {args.t('vacancyModal.history_save_comment')}
        </Button>
        <Button variant="secondary" size="sm" onClick={args.onCancelEdit}>
          {args.t('vacancyModal.history_cancel')}
        </Button>
      </div>
    </div>
  );
}

function renderExistingComment(args: CommentRenderArgs): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon icon={MessageSquare} size="xs" tone="secondary" />
        <Text variant="caption" tone="primary">
          {args.item.comment}
        </Text>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => args.onStartEdit(args.item.id, args.item.comment ? args.item.comment : '')}
        >
          <Icon icon={Edit3} size="xs" />
        </Button>
        {args.onDeleteComment && (
          <Button
            variant="ghost"
            size="icon-xs"
            tone="danger"
            onClick={() => args.onDeleteComment?.(args.item.id)}
          >
            <Icon icon={Trash2} size="xs" />
          </Button>
        )}
      </div>
    </div>
  );
}

function renderItemDescription(args: CommentRenderArgs): React.ReactNode {
  if (args.isEditing) {
    return renderEditingControls(args);
  }
  if (args.item.comment) {
    return renderExistingComment(args);
  }
  if (args.onSaveComment) {
    return (
      <Button
        variant="ghost"
        size="sm"
        startIcon={<Icon icon={Plus} size="xs" />}
        onClick={() => args.onStartEdit(args.item.id, '')}
      >
        {args.t('vacancyModal.history_add_comment')}
      </Button>
    );
  }
  return null;
}

export function VacancyHistorySection({
  items,
  loading = false,
  onSaveComment,
  onDeleteComment,
}: VacancyHistorySectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  const handleSave = async (id: string) => {
    if (onSaveComment) {
      await onSaveComment(id, commentDraft);
    }
    setEditingCommentId(null);
    setCommentDraft('');
  };

  if (loading) {
    return (
      <TitledSection title={t('vacancyModal.history_timeline_title')} icon={History}>
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-history-skeleton">
          <Skeleton variant="rect" width="100" height="sm" />
          <Skeleton variant="rect" width="75" height="sm" />
        </div>
      </TitledSection>
    );
  }

  const stepperItems: StepperItemData[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    fromLabel: item.fromLabel,
    timestamp: item.timestamp,
    tone: item.tone,
    description: (
      <div>
        {renderItemDescription({
          item,
          isEditing: editingCommentId === item.id,
          commentDraft,
          onDraftChange: setCommentDraft,
          onStartEdit: (id, curr) => {
            setEditingCommentId(id);
            setCommentDraft(curr);
          },
          onCancelEdit: () => {
            setEditingCommentId(null);
            setCommentDraft('');
          },
          onSave: handleSave,
          onSaveComment,
          onDeleteComment,
          t,
        })}
      </div>
    ),
  }));

  return (
    <TitledSection
      title={t('vacancyModal.history_timeline_title')}
      icon={History}
      badge={
        <Badge variant="counter" size="xs" tone="neutral">
          {items.length}
        </Badge>
      }
    >
      <Stepper
        items={stepperItems}
        emptyTitle={t('vacancyModal.history_empty_title')}
        emptyDescription={t('vacancyModal.history_empty_description')}
      />
    </TitledSection>
  );
}
