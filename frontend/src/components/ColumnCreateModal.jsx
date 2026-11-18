import React, { useState, useEffect } from 'react';
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

const PALETTE_TO_HEX = {
  blue: '#2563eb',
  cyan: '#0891b2',
  amber: '#d97706',
  purple: '#9333ea',
  emerald: '#059669',
  rose: '#e11d48',
  indigo: '#1d4ed8',
  slate: '#475569',
};

const HEX_TO_PALETTE = {
  '#2563eb': 'blue',
  '#0284c7': 'cyan',
  '#0891b2': 'cyan',
  '#d97706': 'amber',
  '#9333ea': 'purple',
  '#059669': 'emerald',
  '#e11d48': 'rose',
  '#ea580c': 'amber',
  '#1d4ed8': 'indigo',
  '#475569': 'slate',
};

export default function ColumnCreateModal({ isOpen, onClose, onCreate }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [hasLanes, setHasLanes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor('#2563eb');
      setHasLanes(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onCreate({
        name: name.trim(),
        color,
        has_lanes: hasLanes
      });
      setName('');
      setColor('#2563eb');
      setHasLanes(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create column');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={t('kanban.add_column_title')}
        icon={<Icon icon={Plus} size="md" tone="accent" />}
        onClose={onClose}
      />

      <ModalBody>
        <form id="create-column-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          {error && (
            <AlertBanner
              tone="danger"
              title={error}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
            <Text as="label" variant="caption" weight="medium">
              {t('kanban.column_name_placeholder')}
            </Text>
            <Input
              placeholder={t('kanban.column_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Color selection: Note - UI-Kit ColorPicker is currently limited to StatusDotPalette;
              retaining hex presets until issue #8 is resolved */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
            <Text
              as="label"
              variant="caption"
              weight="medium"
              startIcon={<Icon icon={Palette} size="xs" />}
            >
              {t('kanban.column_color')}
            </Text>
            <ColorPicker
              value={HEX_TO_PALETTE[color] || 'blue'}
              onChange={(palette) => setColor(PALETTE_TO_HEX[palette] || '#2563eb')}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--ui-space-3)',
            padding: 'var(--ui-space-3)',
            background: 'var(--ui-bg-subtle)',
            border: '1px solid var(--ui-border-subtle)',
          }}>
            <Checkbox
              id="modal-has-lanes"
              checked={hasLanes}
              onChange={(e) => setHasLanes(e.target.checked)}
            />
            <label htmlFor="modal-has-lanes" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Text variant="body" weight="medium" startIcon={<Icon icon={Layers} size="xs" tone="accent" />}>
                {t('kanban.enable_stages')}
              </Text>
              <Text variant="caption" tone="muted">
                {t('kanban.enable_stages_hint')}
              </Text>
            </label>
          </div>
        </form>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onClose}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button
            type="submit"
            form="create-column-form"
            variant="primary"
            disabled={loading || !name.trim()}
            loading={loading}
          >
            {t('kanban.create_column_btn')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </Modal>
  );
}
