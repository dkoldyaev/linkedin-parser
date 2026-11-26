import { EVENTS, trackEvent } from '../utils/analytics';
import { useEffect, useState } from 'react';
import type { AuthConfig } from '../services/auth.types';
import { authService } from '../services/authService';
import type React from 'react';
import type { User } from '../types/models';

export type { AuthConfig };

export function useLoginController(onLoginSuccess?: (user: User) => void) {
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    google_configured: false,
    dev_mode: true,
  });
  const [devName, setDevName] = useState('Alexander');
  const [devEmail, setDevEmail] = useState('alex@example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .getConfig()
      .then((data) => {
        if (data) setAuthConfig(data);
      })
      .catch((err) => console.error('Failed to load auth config', err));
  }, []);

  const handleGoogleLogin = () => {
    trackEvent(EVENTS.LOGIN_GOOGLE_CLICK);
    window.location.href = '/api/v2/auth/google/login';
  };

  const handleDevLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authService.devLogin({ name: devName, email: devEmail });
      trackEvent(EVENTS.LOGIN_DEV_SUCCESS, { userName: devName, userEmail: devEmail });
      onLoginSuccess?.(data.user);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : 'Login error';
      trackEvent(EVENTS.LOGIN_DEV_ERROR, { error: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    authConfig,
    devName,
    setDevName,
    devEmail,
    setDevEmail,
    loading,
    error,
    handleGoogleLogin,
    handleDevLogin,
  };
}
