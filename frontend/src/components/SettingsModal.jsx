import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

export default function SettingsModal({ isOpen, onClose }) {
  const { t, locale, setLocale, salaryDisplayFormat, setSalaryDisplayFormat } = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState(locale || 'ru');
  const [selectedSalaryFormat, setSelectedSalaryFormat] = useState(salaryDisplayFormat || 'month');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
        })
        .catch(err => console.error('Failed to load settings', err));
    }
  }, [isOpen, setLocale]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        locale: selectedLocale,
        salary_display_format: selectedSalaryFormat,
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        trackEvent(EVENTS.LANGUAGE_CHANGE, {
          locale: selectedLocale
        });
        setLocale(selectedLocale);
        setSalaryDisplayFormat(selectedSalaryFormat);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} color="#6366f1" />
            <span>{t('settingsModal.title')}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="modal-body">
            {/* Locale / Language Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={15} />
                <span>{t('settingsModal.language_section_title')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div
                  onClick={() => setSelectedLocale('ru')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedLocale === 'ru' ? 'var(--primary)' : 'var(--border-subtle)',
                    background: selectedLocale === 'ru' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <strong style={{ color: selectedLocale === 'ru' ? '#a5b4fc' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                    🇷🇺 {t('settingsModal.language_ru')}
                  </strong>
                  {selectedLocale === 'ru' && <Check size={16} color="#6366f1" />}
                </div>

                <div
                  onClick={() => setSelectedLocale('en')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedLocale === 'en' ? 'var(--primary)' : 'var(--border-subtle)',
                    background: selectedLocale === 'en' ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <strong style={{ color: selectedLocale === 'en' ? '#a5b4fc' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                    🇬🇧 {t('settingsModal.language_en')}
                  </strong>
                  {selectedLocale === 'en' && <Check size={16} color="#6366f1" />}
                </div>
              </div>
            </div>

            {/* Salary Format Selector */}
            <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={15} />
                <span>{t('settingsModal.salary_format_title')}</span>
              </label>
              <select
                className="form-input"
                value={selectedSalaryFormat}
                onChange={e => setSelectedSalaryFormat(e.target.value)}
                style={{ marginTop: '8px' }}
              >
                <option value="month">{t('settingsModal.salary_format_month')}</option>
                <option value="hour">{t('settingsModal.salary_format_hour')}</option>
                <option value="year">{t('settingsModal.salary_format_year')}</option>
                <option value="day">{t('settingsModal.salary_format_day')}</option>
                <option value="original">{t('settingsModal.salary_format_original')}</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            {savedSuccess && (
              <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> {t('settingsModal.settings_saved')}
              </span>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('settingsModal.cancel_btn')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {t('settingsModal.save_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
