import React, { useState } from 'react';
import { Plus, Layers, Palette } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Input,
  Checkbox,
  Text,
  AlertBanner,
  ColorPicker,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { resolveHexFromPalette, resolvePaletteFromHex } from './columnPalette';

export interface ColumnCreatePayload {
  name: string;
  color: string;
  has_lanes: boolean;
}

export interface ColumnCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: ColumnCreatePayload) => Promise<void> | void;
}

const LANES_BOX_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--ui-space-3)',
  padding: 'var(--ui-space-3)',
  background: 'var(--ui-bg-subtle)',
  border: '1px solid var(--ui-border-subtle)',
};

const FORM_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-4)',
};

const PLUS_ICON = <Icon icon={Plus} size="md" tone="accent" />;
const PALETTE_ICON = <Icon icon={Palette} size="xs" />;
const LAYERS_ICON = <Icon icon={Layers} size="xs" tone="accent" />;

function useColumnCreateForm(
  onCreate: (payload: ColumnCreatePayload) => Promise<void> | void,
  onClose: () => void
) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [hasLanes, setHasLanes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setColor('#2563eb');
    setHasLanes(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      await onCreate({ name: trimmed, color, has_lanes: hasLanes });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to create column');
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    color,
    setColor,
    hasLanes,
    setHasLanes,
    loading,
    error,
    handleClose,
    handleSubmit,
  };
}

export default function ColumnCreateModal({
  isOpen,
  onClose,
  onCreate,
}: ColumnCreateModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const form = useColumnCreateForm(onCreate, onClose);

  if (!isOpen) return null;

  const isSubmitDisabled = form.loading || !form.name.trim();
  const checkboxLabel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <Text variant="body" weight="medium" startIcon={LAYERS_ICON}>
        {t('kanban.enable_stages')}
      </Text>
      <Text variant="caption" tone="muted">
        {t('kanban.enable_stages_hint')}
      </Text>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={form.handleClose} size="sm">
      <ModalHeader
        title={t('kanban.add_column_title')}
        icon={PLUS_ICON}
        onClose={form.handleClose}
      />

      <ModalBody>
        <form id="create-column-form" onSubmit={form.handleSubmit} style={FORM_STYLE}>
          {form.error && <AlertBanner tone="danger" title={form.error} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
            <Text as="label" variant="caption" weight="medium">
              {t('kanban.column_name_placeholder')}
            </Text>
            <Input
              placeholder={t('kanban.column_name_placeholder')}
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
            <Text as="label" variant="caption" weight="medium" startIcon={PALETTE_ICON}>
              {t('kanban.column_color')}
            </Text>
            <ColorPicker
              value={resolvePaletteFromHex(form.color)}
              onChange={(palette) => form.setColor(resolveHexFromPalette(palette))}
            />
          </div>

          <div style={LANES_BOX_STYLE}>
            <Checkbox
              id="modal-has-lanes"
              checked={form.hasLanes}
              onChange={(e) => form.setHasLanes(e.target.checked)}
              label={checkboxLabel}
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={form.handleClose}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button
            type="submit"
            form="create-column-form"
            variant="primary"
            disabled={isSubmitDisabled}
            loading={form.loading}
          >
            {t('kanban.create_column_btn')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </Modal>
  );
}
