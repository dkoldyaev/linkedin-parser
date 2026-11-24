import { CSSProperties, PropsWithChildren } from "react";

const style: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'calc(var(--ui-grid-cell) / 2)' };
export function VacancyTabContent({children}: PropsWithChildren<{isCompact?: boolean}>) {
  return (
    <div style={style}>
      {children}
    </div>
  )
}