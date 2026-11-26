import React from 'react';

export interface SectionContextValue {
  readonly isInsideSection: boolean;
}

export const SectionContext = React.createContext<SectionContextValue | null>(null);

export function useSectionContext(): SectionContextValue | null {
  return React.useContext(SectionContext);
}
