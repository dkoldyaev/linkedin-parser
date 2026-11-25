import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import styles from './OverlayProvider.module.css';

export interface OverlayProviderProps {
  readonly children: React.ReactNode;
}

const OverlayContainerContext = createContext<HTMLDivElement | null>(null);

function createOverlayContainerElement(): HTMLDivElement {
  if (typeof document === 'undefined') {
    throw new Error('OverlayProvider requires a DOM document environment.');
  }
  const container = document.createElement('div');
  container.setAttribute('data-ui-overlay-root', '');
  document.body.appendChild(container);
  return container;
}

/**
 * Isolates the application's stacking context (`isolation: isolate`) and provides
 * a single shared DOM container at the end of `document.body` so all overlays
 * (`Overlay`, `Modal`, `Drawer`, `Select`, `Tooltip`) stack naturally by DOM order
 * without z-index juggling.
 */
export function OverlayProvider({ children }: OverlayProviderProps): React.ReactElement {
  const [container] = useState<HTMLDivElement>(createOverlayContainerElement);

  useLayoutEffect(() => {
    if (!container.isConnected) {
      document.body.appendChild(container);
    }
    return () => {
      container.remove();
    };
  }, [container]);

  return (
    <OverlayContainerContext.Provider value={container}>
      <div className={styles.appRoot} data-ui-app-root="">
        {children}
      </div>
    </OverlayContainerContext.Provider>
  );
}

/**
 * Returns the active `<OverlayProvider>` portal container.
 * Fails fast if called outside `<OverlayProvider>`.
 */
export function useOverlayContainer(): HTMLDivElement {
  const container = useContext(OverlayContainerContext);
  if (container === null) {
    throw new Error('useOverlayContainer must be used within an <OverlayProvider>.');
  }
  return container;
}
