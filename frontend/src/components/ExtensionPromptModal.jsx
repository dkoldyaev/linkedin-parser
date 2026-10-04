import React, { useState } from 'react';
import { 
  Puzzle, X, ShieldAlert, Layers, ExternalLink, 
  HelpCircle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { dismissExtensionPrompt } from '../utils/extension';

export default function ExtensionPromptModal({ isOpen, onClose, onProceed }) {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true);
    }
    onClose();
  };

  const handleProceed = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true);
    }
    onClose();
    if (onProceed) {
      onProceed();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Puzzle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {t('extensionModal.title')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {t('extensionModal.subtitle')}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={handleClose} title={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
            {t('extensionModal.desc_intro')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818cf8',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                marginTop: '2px'
              }}>
                <Layers size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('extensionModal.feature_tabs_title')}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('extensionModal.feature_tabs_desc')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(234, 179, 8, 0.12)',
                color: '#eab308',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                marginTop: '2px'
              }}>
                <ShieldAlert size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('extensionModal.feature_captcha_title')}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('extensionModal.feature_captcha_desc')}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '0.8125rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} color="#818cf8" />
              <span>{t('extensionModal.install_title')}</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.4 }}>
              <li>{t('extensionModal.install_step1')}</li>
              <li>{t('extensionModal.install_step2')}</li>
              <li>{t('extensionModal.install_step3')}</li>
            </ol>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="dontShowExtensionModal"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="dontShowExtensionModal" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {t('extensionModal.dont_show_again')}
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleClose}>
            {t('extensionModal.close')}
          </button>
          {onProceed && (
            <button className="btn btn-primary" onClick={handleProceed} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('extensionModal.proceed_anyway')}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
