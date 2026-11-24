import React, { useState } from 'react';
import {
  Badge,
  Button,
  Icon,
  Stepper,
  Text,
  Textarea,
  type StepperItemData,
} from '@blueprint/ui-kit';
import { Check, Edit3, History, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import type { VacancyHistoryItem as UiVacancyHistoryItem } from '@blueprint/ui-kit';
import { VacancySection } from './VacancySection';

export interface VacancyHistorySectionProps {
  items: readonly UiVacancyHistoryItem[];
  onSaveComment?: (id: string, comment: string) => void | Promise<void>;
  onDeleteComment?: (id: string) => void | Promise<void>;
}

export function VacancyHistorySection({
  items,
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

  const stepperItems: StepperItemData[] = items.map((item) => {
    const isEditing = editingCommentId === item.id;

    return {
      id: item.id,
      label: item.label,
      fromLabel: item.fromLabel,
      timestamp: item.timestamp,
      tone: item.tone,
      description: (
        <div>
          {isEditing ? (
            <div>
              <Textarea
                rows={2}
                placeholder={t('vacancyModal.history_comment_placeholder')}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  startIcon={<Icon icon={Check} size="xs" />}
                  onClick={() => handleSave(item.id)}
                >
                  {t('vacancyModal.history_save_comment')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingCommentId(null);
                    setCommentDraft('');
                  }}
                >
                  {t('vacancyModal.history_cancel')}
                </Button>
              </div>
            </div>
          ) : item.comment ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon icon={MessageSquare} size="xs" tone="secondary" />
                <Text variant="caption" tone="primary">
                  {item.comment}
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setEditingCommentId(item.id);
                    setCommentDraft(item.comment || '');
                  }}
                >
                  <Icon icon={Edit3} size="xs" />
                </Button>
                {onDeleteComment && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    tone="danger"
                    onClick={() => onDeleteComment(item.id)}
                  >
                    <Icon icon={Trash2} size="xs" />
                  </Button>
                )}
              </div>
            </div>
          ) : onSaveComment ? (
            <Button
              variant="ghost"
              size="sm"
              startIcon={<Icon icon={Plus} size="xs" />}
              onClick={() => {
                setEditingCommentId(item.id);
                setCommentDraft('');
              }}
            >
              {t('vacancyModal.history_add_comment')}
            </Button>
          ) : null}
        </div>
      ),
    };
  });

  return (
    <VacancySection
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
    </VacancySection>
  );
}
