import { AlertBanner, Overlay } from '@blueprint/ui-kit';
import React from 'react';
import type { ToastState } from './home.types';

export interface HomeToastNotificationProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const TOAST_WRAPPER_STYLE: React.CSSProperties = {
  maxWidth: '420px',
};

export default function HomeToastNotification({
  toast,
  onDismiss,
}: HomeToastNotificationProps): React.ReactElement | null {
  if (!toast) return null;

  return (
    <Overlay key={`${toast.type}:${toast.message}`} isOpen placement="bottom-end">
      <div style={TOAST_WRAPPER_STYLE}>
        <AlertBanner
          tone={toast.type === 'error' ? 'danger' : 'success'}
          title={toast.message}
          onDismiss={onDismiss}
        />
      </div>
    </Overlay>
  );
}
