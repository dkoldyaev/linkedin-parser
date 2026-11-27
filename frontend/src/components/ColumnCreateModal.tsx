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
import { Layers, Palette, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { resolveHexFromPalette, resolvePaletteFromHex } from './columnPalette';
import { SectionStack } from './SectionStack';
import { TitledSection } from './TitledSection';
import { useTranslation } from '../i18n/I18nContext';

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

const PLUS_ICON = <Icon icon={Plus} size="md" tone="accent" />;

function useColumnCreateForm(
  onCreate: (payload: ColumnCreatePayload) => Promise<void> | void,
  onClose: () => void,
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
    <Text variant="caption" tone="muted">
      {t('kanban.enable_stages_hint')}
    </Text>
  );

  return (
    <Modal isOpen={isOpen} onClose={form.handleClose} size="sm">
      <ModalHeader
        title={t('kanban.add_column_title')}
        icon={PLUS_ICON}
        onClose={form.handleClose}
      />

      <ModalBody>
        <form id="create-column-form" onSubmit={form.handleSubmit}>
          <SectionStack>
            {form.error && <AlertBanner tone="danger" title={form.error} />}
            <TitledSection title={t('kanban.column_name_placeholder')}>
              <Input
                placeholder={t('kanban.column_name_placeholder')}
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
                autoFocus
                required
              />
            </TitledSection>

            <TitledSection title={t('kanban.column_color')} icon={Palette}>
              <ColorPicker
                value={resolvePaletteFromHex(form.color)}
                onChange={(palette) => form.setColor(resolveHexFromPalette(palette))}
              />
            </TitledSection>

            <TitledSection title={t('kanban.enable_stages')} icon={Layers}>
              <Checkbox
                id="modal-has-lanes"
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
