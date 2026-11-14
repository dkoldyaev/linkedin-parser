import React from 'react';

export interface ModalContextValue {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly closeLabel?: string;
}

export const ModalContext = React.createContext<ModalContextValue | null>(null);

export function useModalContext(): ModalContextValue | null {
  return React.useContext(ModalContext);
}
