import React, { useState, useEffect } from 'react';
import { 
  Settings, Check, Globe, Columns3, 
  Layers, Plus, Trash2, ArrowUp, ArrowDown, Edit2
} from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Tabs,
  Select,
  Text,
  Badge,
  AlertBanner,
  Checkbox,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import ColumnCreateModal from './ColumnCreateModal';
import ColumnEditModal from './ColumnEditModal';
import ColumnDeleteModal from './ColumnDeleteModal';
import { useGridScroll } from '../utils/useGridScroll';
import { BASE_STATUSES } from '../constants/columns';

export default function SettingsModal({ isOpen, onClose, vacancies = [], onColumnsUpdated, onUserUpdated }) {
  const { 
    t, 
    locale, 
    setLocale, 
    salaryDisplayFormat, 
    setSalaryDisplayFormat, 
    salaryTargetCurrency, 
    setSalaryTargetCurrency 
  } = useTranslation();
  const snapScroll = useGridScroll();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'columns'
  const [selectedLocale, setSelectedLocale] = useState(locale || 'ru');
  const [selectedSalaryFormat, setSelectedSalaryFormat] = useState(salaryDisplayFormat || 'month');
  const [selectedCurrency, setSelectedCurrency] = useState(salaryTargetCurrency || '');
  const [columnsList, setColumnsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals inside Settings for Column CRUD
  const [isCreateColOpen, setIsCreateColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState(null);
  const [deletingCol, setDeletingCol] = useState(null);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.locale) {
          setSelectedLocale(data.locale);
          setLocale(data.locale);
        }
        if (data.salary_display_format) {
          setSelectedSalaryFormat(data.salary_display_format);
          setSalaryDisplayFormat(data.salary_display_format);
        }
        if (data.salary_target_currency !== undefined) {
          const curr = data.salary_target_currency || '';
          setSelectedCurrency(curr);
          setSalaryTargetCurrency(curr);
        }
        if (data.columns && Array.isArray(data.columns)) {
          setColumnsList(data.columns);
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveGeneral = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: selectedLocale,
          salary_display_format: selectedSalaryFormat,
          salary_target_currency: selectedCurrency
        })
      });

      if (res.ok) {
        setLocale(selectedLocale);
        setSalaryDisplayFormat(selectedSalaryFormat);
        setSalaryTargetCurrency(selectedCurrency);
        trackEvent(EVENTS.LANGUAGE_CHANGE, { locale: selectedLocale });
        trackEvent(EVENTS.SALARY_FORMAT_CHANGE, { format: selectedSalaryFormat });
        trackEvent(EVENTS.SALARY_CURRENCY_CHANGE, { currency: selectedCurrency });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColumn = async (newColData) => {
    const res = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newColData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleSaveColumn = async (colId, updateData) => {
    const res = await fetch(`/api/columns/${encodeURIComponent(colId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleDeleteColumn = async (colId, migrateTo) => {
    const res = await fetch(`/api/columns/${encodeURIComponent(colId)}?migrate_to=${encodeURIComponent(migrateTo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleMoveColumn = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= columnsList.length) return;

    const newCols = [...columnsList];
    const [moved] = newCols.splice(index, 1);
    newCols.splice(targetIdx, 0, moved);

    setColumnsList(newCols);

    try {
      const res = await fetch('/api/columns/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newCols })
      });
      if (res.ok) {
        const updated = await res.json();
        setColumnsList(updated);
        if (onColumnsUpdated) onColumnsUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to reorder columns', err);
      fetchSettings();
    }
  };

  const handleToggleLanes = async (col) => {
    await handleSaveColumn(col.id, { has_lanes: !col.has_lanes });
  };

  const funnelColumns = columnsList.filter(c => c.id !== 'Отказ');

  const tabItems = [
    {
      value: 'general',
      label: t('settingsModal.tab_general'),
      icon: <Icon icon={Globe} size="xs" />,
    },
    {
      value: 'columns',
      label: t('settingsModal.tab_columns'),
      icon: <Icon icon={Columns3} size="xs" />,
    },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={activeTab === 'columns' ? 'lg' : 'md'}>
        <ModalHeader
          title={t('settingsModal.title')}
          icon={<Icon icon={Settings} size="md" tone="accent" />}
          onClose={onClose}
        />

        <div style={{ padding: '0 var(--ui-space-6)' }}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            items={tabItems}
          />
        </div>

        <ModalBody>
          {activeTab === 'general' && (
            <form id="settings-general-form" onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
              {savedSuccess && (
                <AlertBanner
                  tone="success"
                  title={t('settingsModal.saved_notification')}
                />
              )}

              {/* Language Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
                <Text variant="caption" weight="medium" startIcon={<Icon icon={Globe} size="xs" />}>
                  {t('settingsModal.language_section_title')}
                </Text>
                <div style={{ display: 'flex', gap: 'var(--ui-space-2)' }}>
                  <Button
                    type="button"
                    variant={selectedLocale === 'ru' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedLocale('ru')}
                    endIcon={selectedLocale === 'ru' ? <Icon icon={Check} size="xs" /> : undefined}
                  >
                    🇷🇺 {t('settingsModal.language_ru')}
                  </Button>
                  <Button
                    type="button"
                    variant={selectedLocale === 'en' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedLocale('en')}
                    endIcon={selectedLocale === 'en' ? <Icon icon={Check} size="xs" /> : undefined}
                  >
                    🇬🇧 {t('settingsModal.language_en')}
                  </Button>
                </div>
              </div>

              {/* Salary Format Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
                <Text variant="caption" weight="medium">
                  {t('settingsModal.salary_format_title')}
                </Text>
                <Select
                  value={selectedSalaryFormat}
                  onValueChange={setSelectedSalaryFormat}
                  options={[
                    { value: 'month', label: t('settingsModal.salary_format_month') },
                    { value: 'hour', label: t('settingsModal.salary_format_hour') },
                    { value: 'year', label: t('settingsModal.salary_format_year') },
                    { value: 'day', label: t('settingsModal.salary_format_day') },
                    { value: 'original', label: t('settingsModal.salary_format_original') },
                  ]}
                />
              </div>

              {/* Target Currency Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
                <Text variant="caption" weight="medium">
                  {t('settingsModal.salary_currency_title')}
                </Text>
                <Select
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                  options={[
                    { value: '', label: t('settingsModal.salary_currency_auto') },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'RUB', label: 'RUB (₽)' },
                  ]}
                />
                <Text variant="caption" tone="muted">
                  {t('settingsModal.salary_currency_hint')}
                </Text>
              </div>
            </form>
          )}

          {activeTab === 'columns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" weight="medium">
                  {t('settingsModal.columns_manager_desc')}
                </Text>
                <Button
                  variant="primary"
                  size="xs"
                  startIcon={<Icon icon={Plus} size="xs" />}
                  onClick={() => setIsCreateColOpen(true)}
                >
                  {t('kanban.add_column')}
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
                {funnelColumns.map((col, idx) => {
                  const isBase = Boolean(col.is_base || col.system_role || BASE_STATUSES.includes(col.id));
                  return (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--ui-space-2) var(--ui-space-3)',
                        background: 'var(--ui-bg-subtle)',
                        border: '1px solid var(--ui-border-subtle)',
                        borderLeft: `4px solid ${col.color || '#2563eb'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                        <Text variant="body" weight="medium">
                          {t(`kanban.columns.${col.id}`)}
                        </Text>
                        {isBase && (
                          <Badge variant="outline" size="xs" tone="neutral">
                            {t('settingsModal.col_is_base_badge')}
                          </Badge>
                        )}
                        {col.has_lanes && (
                          <Badge variant="solid" size="xs" tone="info" icon={<Icon icon={Layers} size="2xs" />}>
                            {t('kanban.stages_enabled')}
                          </Badge>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === 0}
                          onClick={() => handleMoveColumn(idx, -1)}
                          title={t('settingsModal.move_col_up')}
                        >
                          <Icon icon={ArrowUp} size="xs" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === funnelColumns.length - 1}
                          onClick={() => handleMoveColumn(idx, 1)}
                          title={t('settingsModal.move_col_down')}
                        >
                          <Icon icon={ArrowDown} size="xs" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditingCol(col)}
                          title={t('settingsModal.edit_col')}
                        >
                          <Icon icon={Edit2} size="xs" />
                        </Button>
                        {!isBase && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            tone="danger"
                            onClick={() => setDeletingCol(col)}
                            title={t('settingsModal.delete_col')}
                          >
                            <Icon icon={Trash2} size="xs" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter justify="end">
          <ModalFooter.Actions>
            {activeTab === 'general' ? (
              <>
                <Button variant="secondary" onClick={onClose}>
                  {t('batchModal.cancel_btn')}
                </Button>
                <Button
                  type="submit"
                  form="settings-general-form"
                  variant="primary"
                  loading={loading}
                >
                  {t('settingsModal.save_btn')}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={onClose}>
                {t('batchModal.done_btn')}
              </Button>
            )}
          </ModalFooter.Actions>
        </ModalFooter>
      </Modal>

      {isCreateColOpen && (
        <ColumnCreateModal
          isOpen={isCreateColOpen}
          onClose={() => setIsCreateColOpen(false)}
          onCreate={handleCreateColumn}
        />
      )}

      {editingCol && (
        <ColumnEditModal
          isOpen={Boolean(editingCol)}
          column={editingCol}
          onClose={() => setEditingCol(null)}
          onSave={handleSaveColumn}
        />
      )}

      {deletingCol && (
        <ColumnDeleteModal
          isOpen={Boolean(deletingCol)}
          column={deletingCol}
          availableColumns={columnsList}
          vacanciesCount={vacancies.filter(v => v.status === deletingCol.id).length}
          onClose={() => setDeletingCol(null)}
          onConfirm={handleDeleteColumn}
        />
      )}
    </>
  );
}
