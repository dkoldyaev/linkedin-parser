import {
  AlertBanner,
  Button,
  Checkbox,
  ColorPicker,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
} from '@blueprint/ui-kit';
import { Edit3, Layers, Palette } from 'lucide-react';
import React, { useState } from 'react';
import { resolveHexFromPalette, resolvePaletteFromHex } from './columnPalette';
import { BASE_STATUSES } from '../constants/columns';
import type { BoardColumn } from '../types/models';
import { SectionStack } from './SectionStack';
import { TitledSection } from './TitledSection';
import { useTranslation } from '../i18n/I18nContext';

export interface ColumnUpdatePayload {
  new_name?: string;
  color?: string;
  has_lanes?: boolean;
}

export interface ColumnEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: BoardColumn | null;
  onSave: (colId: string, payload: ColumnUpdatePayload) => Promise<void> | void;
}

const EDIT_ICON = <Icon icon={Edit3} size="md" tone="accent" />;

function isBaseColumn(column: BoardColumn): boolean {
  if (column.is_base || column.system_role) return true;
  return BASE_STATUSES.includes(column.id);
}

interface ColumnDraft {
  id: string | null;
  name: string;
  color: string;
  hasLanes: boolean;
}

function buildColumnDraft(column: BoardColumn | null): ColumnDraft {
  if (!column) {
    return { id: null, name: '', color: '#2563eb', hasLanes: false };
  }
  return {
    id: column.id,
    name: column.id,
    color: column.color || '#2563eb',
    hasLanes: Boolean(column.has_lanes),
  };
}

function resolveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Failed to update column';
}

function useColumnEditForm(
  column: BoardColumn | null,
  onSave: (colId: string, payload: ColumnUpdatePayload) => Promise<void> | void,
  onClose: () => void,
) {
  const [draft, setDraft] = useState<ColumnDraft>(() => buildColumnDraft(column));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const curId = column ? column.id : null;
  if (curId !== draft.id) {
    setDraft(buildColumnDraft(column));
    setError('');
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = draft.name.trim();
    if (!column || !trimmed) return;
    setLoading(true);
    setError('');
    try {
      await onSave(column.id, {
        new_name: trimmed,
        color: draft.color,
        has_lanes: draft.hasLanes,
      });
      onClose();
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    name: draft.name,
    setName: (name: string) => setDraft((prev) => ({ ...prev, name })),
    color: draft.color,
    setColor: (color: string) => setDraft((prev) => ({ ...prev, color })),
    hasLanes: draft.hasLanes,
    setHasLanes: (hasLanes: boolean) => setDraft((prev) => ({ ...prev, hasLanes })),
    loading,
    error,
    handleSubmit,
  };
}

export default function ColumnEditModal({
  isOpen,
  onClose,
  column,
  onSave,
}: ColumnEditModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const form = useColumnEditForm(column, onSave, onClose);

  if (!isOpen || !column) return null;

  const isBase = isBaseColumn(column);
  const isSubmitDisabled = form.loading || !form.name.trim();
  const checkboxLabel = (
    <Text variant="caption" tone="muted">
      {t('kanban.enable_stages_hint')}
    </Text>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title={t('kanban.edit_column')} icon={EDIT_ICON} onClose={onClose} />

      <ModalBody>
        <form id="edit-column-form" onSubmit={form.handleSubmit}>
          <SectionStack>
            {form.error && <AlertBanner tone="danger" title={form.error} />}
            <TitledSection title={t('kanban.column_name_placeholder')}>
              <Input value={form.name} onChange={(e) => form.setName(e.target.value)} required />
              {isBase && (
                <Text variant="caption" tone="muted" style={{ marginTop: 'var(--ui-space-1)' }}>
                  {t('settingsModal.col_is_base_badge')} — {t('settingsModal.base_column_hint')}
                </Text>
              )}
            </TitledSection>

            <TitledSection title={t('kanban.column_color')} icon={Palette}>
              <ColorPicker
                value={resolvePaletteFromHex(form.color)}
                onChange={(palette) => form.setColor(resolveHexFromPalette(palette))}
              />
            </TitledSection>

            <TitledSection title={t('kanban.enable_stages')} icon={Layers}>
              <Checkbox
                id="edit-modal-has-lanes"
                checked={form.hasLanes}
                onChange={(e) => form.setHasLanes(e.target.checked)}
                label={checkboxLabel}
              />
            </TitledSection>
          </SectionStack>
        </form>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onClose}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button
            type="submit"
            form="edit-column-form"
            variant="primary"
            disabled={isSubmitDisabled}
            loading={form.loading}
          >
            {t('kanban.save_column')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </Modal>
  );
}
