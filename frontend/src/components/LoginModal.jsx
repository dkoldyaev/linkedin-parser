import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, ArrowRight, User, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function LoginModal({ onLoginSuccess }) {
  const { t } = useTranslation();
  const [authConfig, setAuthConfig] = useState({ google_configured: false, dev_mode: true });
  const [devName, setDevName] = useState('Alexander');
  const [devEmail, setDevEmail] = useState('alex@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => setAuthConfig(data))
      .catch(err => console.error('Failed to load auth config', err));
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
  };

  const handleDevLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: devName, email: devEmail })
      });
      if (!res.ok) {
        throw new Error('Dev login failed');
      }
      const data = await res.json();
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-glow">
            <Briefcase size={28} color="#818cf8" />
          </div>
          <h1 className="login-title">LinkedIn Vacancies</h1>
          <p className="login-subtitle">{t('auth.subtitle')}</p>
        </div>

        {error && (
          <div className="login-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="login-actions">
          {authConfig.google_configured ? (
            <button className="btn-google-login" onClick={handleGoogleLogin}>
              <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon">
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
            </button>
          ) : (
            <div className="login-warning-box">
              <AlertCircle size={16} color="#f59e0b" />
              <span>{t('auth.google_not_configured')}</span>
            </div>
          )}
        </div>

        {/* Dev Mode Section */}
        {authConfig.dev_mode && (
          <div className="login-dev-section">
            <div className="login-divider">
              <span>{authConfig.google_configured ? 'или тестовый вход' : 'тестовый режим'}</span>
            </div>

            <form onSubmit={handleDevLogin} className="login-dev-form">
              <div className="dev-inputs">
                <div className="input-with-icon">
                  <User size={15} className="input-icon" />
                  <input
                    type="text"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    placeholder="Имя пользователя"
                    required
                  />
                </div>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-dev-login"
                disabled={loading}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Вход...' : t('auth.dev_login')}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
