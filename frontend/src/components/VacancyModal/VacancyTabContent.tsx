import { CSSProperties, PropsWithChildren } from 'react';

const style: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-grid-cell)',
};
export function VacancyTabContent({ children }: PropsWithChildren<{ isCompact?: boolean }>) {
  return <div style={style}>{children}</div>;
}
