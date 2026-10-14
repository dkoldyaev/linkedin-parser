import React, { useState } from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function ColumnDeleteModal({
  isOpen,
  onClose,
  column,
  availableColumns = [],
  vacanciesCount = 0,
  onConfirm
}) {
  const { t } = useTranslation();
  const [targetColumn, setTargetColumn] = useState('Еще не написан');

  if (!isOpen || !column) return null;

  const validTargets = availableColumns.filter(c => c.id !== column.id);

  const handleConfirm = () => {
    onConfirm(column.id, targetColumn);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: '#ef4444' }}>
            <Trash2 size={18} />
            <span>{t('kanban.delete_column_confirm_title', { name: t(`kanban.columns.${column.id}`) })}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
          {vacanciesCount > 0 ? (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t('kanban.delete_column_has_vacancies', { count: vacanciesCount })}
              </p>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowRight size={14} color="#6366f1" />
                  <span>{t('kanban.migrate_to_label')}</span>
                </label>
                <select
                  className="form-input"
                  value={targetColumn}
                  onChange={e => setTargetColumn(e.target.value)}
                >
                  {validTargets.map(col => (
                    <option key={col.id} value={col.id}>
                      {t(`kanban.columns.${col.id}`)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t('kanban.delete_column_confirm_empty')}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('batchModal.cancel_btn')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
            onClick={handleConfirm}
          >
            {t('kanban.delete_column')}
          </button>
        </div>
      </div>
    </div>
  );
}
