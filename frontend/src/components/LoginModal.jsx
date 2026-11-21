import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, ArrowRight, User, Sparkles } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Icon,
  Input,
  Text,
  AlertBanner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import ThemeToggle from './ThemeToggle';

export default function LoginModal({ onLoginSuccess, onClose, isGuestPromotion = false }) {
  const { t } = useTranslation();
  const [authConfig, setAuthConfig] = useState({ google_configured: false, dev_mode: true });
  const [devName, setDevName] = useState('Alexander');
  const [devEmail, setDevEmail] = useState('alex@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v2/auth/config')
      .then(res => (res && res.ok ? res.json() : null))
      .then(data => { if (data) setAuthConfig(data); })
      .catch(err => console.error('Failed to load auth config', err));
  }, []);

  const handleGoogleLogin = () => {
    trackEvent(EVENTS.LOGIN_GOOGLE_CLICK);
    window.location.href = '/api/v2/auth/google/login';
  };

  const handleDevLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: devName, email: devEmail })
      });
      if (!res.ok) {
        throw new Error('Dev login failed');
      }
      const data = await res.json();
      trackEvent(EVENTS.LOGIN_DEV_SUCCESS, {
        userName: devName,
        userEmail: devEmail
      });
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      trackEvent(EVENTS.LOGIN_DEV_ERROR, {
        error: err.message || 'Login error'
      });
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose || (() => {})} size="sm">
      <ModalHeader
        title={isGuestPromotion ? t('auth.save_progress_title') : 'LinkedIn Vacancies'}
        description={
          isGuestPromotion 
            ? t('auth.save_progress_subtitle')
            : t('auth.subtitle')
        }
        icon={<Icon icon={Briefcase} size="md" tone="accent" />}
        actions={<ThemeToggle />}
        onClose={onClose}
        hideCloseButton={!onClose}
      />

      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          {error && <AlertBanner tone="danger" title={error} />}

          {/* Google OAuth Button */}
          {authConfig.google_configured ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleGoogleLogin}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('auth.google_login')}</span>
            </Button>
          ) : (
            <AlertBanner
              tone="warning"
              title={t('auth.google_not_configured')}
            />
          )}

          {/* Dev Mode Section */}
          {authConfig.dev_mode && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ui-space-3)',
              paddingTop: 'var(--ui-space-3)',
              borderTop: '1px solid var(--ui-border-subtle)',
            }}>
              <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                {authConfig.google_configured ? t('auth.or_dev_login') : t('auth.dev_mode_label')}
              </Text>

              <form onSubmit={handleDevLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
                <Input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder={t('auth.dev_name_placeholder')}
                  required
                />
                <Input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  loading={loading}
                  startIcon={<Icon icon={Sparkles} size="xs" />}
                  endIcon={<Icon icon={ArrowRight} size="xs" />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? t('auth.logging_in') : t('auth.dev_login')}
                </Button>
              </form>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
