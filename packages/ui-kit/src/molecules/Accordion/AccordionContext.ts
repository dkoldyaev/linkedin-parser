import { createContext, useContext } from 'react';

export interface AccordionContextValue {
  readonly activeExpandedIds: readonly string[];
  readonly toggleItem: (id: string) => void;
  readonly defaultActionLabel?: string;
  readonly bullet?: boolean;
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);

export function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error('Accordion subcomponents must be used within an <Accordion>');
  }
  return ctx;
}
