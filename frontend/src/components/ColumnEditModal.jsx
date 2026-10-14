import React, { useState, useEffect } from 'react';
import { X, Edit3, Palette, Layers } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

const PRESET_COLORS = [
  '#6366f1', '#0284c7', '#d97706', '#9333ea', 
  '#059669', '#e11d48', '#ea580c', '#0891b2', '#4f46e5'
];

export default function ColumnEditModal({ isOpen, onClose, column, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [hasLanes, setHasLanes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (column && isOpen) {
      setName(column.id || '');
      setColor(column.color || '#6366f1');
      setHasLanes(Boolean(column.has_lanes));
      setError('');
    }
  }, [column, isOpen]);

  if (!isOpen || !column) return null;

  const isBase = column.id === 'Еще не написан' || column.id === 'Отказ';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSave(column.id, {
        new_name: isBase ? undefined : name.trim(),
        color,
        has_lanes: hasLanes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update column');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Edit3 size={18} color="#6366f1" />
            <span>{t('kanban.edit_column')}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.8125rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('kanban.column_name_placeholder')}</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isBase}
                title={isBase ? "Базовую колонку нельзя переименовать" : ""}
                required
              />
              {isBase && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {t('settingsModal.col_is_base_badge')}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={14} />
                <span>{t('kanban.column_color')}</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input
                  type="color"
                  className="column-color-picker"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: c,
                        border: color === c ? '2px solid #fff' : '1px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: color === c ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none',
                        transition: 'transform 0.1s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}>
              <input
                type="checkbox"
                id="edit-modal-has-lanes"
                checked={hasLanes}
                onChange={e => setHasLanes(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="edit-modal-has-lanes" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#6366f1" />
                  {t('kanban.enable_stages')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('kanban.enable_stages_hint')}
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('batchModal.cancel_btn')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {t('kanban.save_column')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
