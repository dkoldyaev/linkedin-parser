import React from 'react';
import { AlertBanner } from '@blueprint/ui-kit';
import type { ToastState } from './home.types';

export interface HomeToastNotificationProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const TOAST_CONTAINER_STYLE: React.CSSProperties = {
  position: 'fixed',
  bottom: 'var(--ui-space-6)',
  right: 'var(--ui-space-6)',
  zIndex: 9999,
  maxWidth: '420px',
};

export default function HomeToastNotification({
  toast,
  onDismiss,
}: HomeToastNotificationProps): React.ReactElement | null {
  if (!toast) return null;

  return (
    <div style={TOAST_CONTAINER_STYLE}>
      <AlertBanner
        tone={toast.type === 'error' ? 'danger' : 'success'}
        title={toast.message}
        onDismiss={onDismiss}
      />
    </div>
  );
}
