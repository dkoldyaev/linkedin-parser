import React, { useState } from 'react';
import { History, MessageSquare, Edit3, Trash2, Check, X, ArrowRight } from 'lucide-react';
import {
  CollapsibleSection,
  Button,
  Icon,
  Text,
  Badge,
  Textarea,
  EmptyState,
} from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';

export default function VacancyTimelineSection({
  history = [],
  onSaveComment,
  onDeleteComment,
  getStageLabel,
  isOpen = true,
  onOpenChange,
}) {
  const { t, formatDate } = useTranslation();
  const [editingId, setEditingId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingId, setSavingId] = useState(null);

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setCommentText(item.comment || '');
  };

  const handleSave = async (id) => {
    setSavingId(id);
    try {
      await onSaveComment(id, commentText);
      setEditingId(null);
      setCommentText('');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <CollapsibleSection
      title={t('vacancyModal.history_timeline_title')}
      icon={<Icon icon={History} size="sm" tone="accent" />}
      badge={history.length > 0 ? String(history.length) : undefined}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      {history.length === 0 ? (
        <EmptyState
          title={t('vacancyModal.no_history')}
          description="Перемещайте карточку по колонкам воронки для записи истории этапов."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
          {history.map((item, idx) => {
            const isEditing = editingId === item.id;
            const isSaving = savingId === item.id;
            return (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--ui-space-1-5)',
                  padding: 'var(--ui-space-2-5) var(--ui-space-3)',
                  background: 'var(--ui-bg-subtle)',
                  border: '1px solid var(--ui-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-1-5)' }}>
                    {item.from_status && (
                      <>
                        <Badge variant="outline" size="xs" tone="neutral">
                          {getStageLabel(item.from_status, item.from_lane)}
                        </Badge>
                        <Icon icon={ArrowRight} size="xs" tone="muted" />
                      </>
                    )}
                    <Badge variant="solid" size="xs" tone="accent">
                      {getStageLabel(item.to_status, item.to_lane)}
                    </Badge>
                  </div>
                  <Text variant="mono" tone="muted" style={{ fontSize: 'var(--ui-font-size-2xs)' }}>
                    {formatDate(item.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>

                {/* Comment Area */}
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)', marginTop: 'var(--ui-space-1)' }}>
                    <Textarea
                      rows={2}
                      placeholder={t('vacancyModal.history_comment_placeholder')}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 'var(--ui-space-1)' }}>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleSave(item.id)}
                        loading={isSaving}
                        startIcon={<Icon icon={Check} size="xs" />}
                      >
                        {t('vacancyModal.history_save_comment')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setEditingId(null);
                          setCommentText('');
                        }}
                      >
                        {t('vacancyModal.history_cancel')}
                      </Button>
                    </div>
                  </div>
                ) : item.comment ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--ui-space-1-5) var(--ui-space-2)',
                    background: 'var(--ui-bg-surface)',
                    border: '1px solid var(--ui-border-subtle)',
                    marginTop: '4px',
                  }}>
                    <Text
                      variant="caption"
                      tone="secondary"
                      startIcon={<Icon icon={MessageSquare} size="xs" tone="accent" />}
                    >
                      {item.comment}
                    </Text>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleStartEdit(item)}
                        title={t('vacancyModal.history_edit_comment')}
                      >
                        <Icon icon={Edit3} size="xs" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        tone="danger"
                        onClick={() => onDeleteComment(item.id)}
                        title={t('vacancyModal.history_delete_comment')}
                      >
                        <Icon icon={Trash2} size="xs" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleStartEdit(item)}
                    startIcon={<Icon icon={MessageSquare} size="xs" />}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {t('vacancyModal.history_add_comment')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
