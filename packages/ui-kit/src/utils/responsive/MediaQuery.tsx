import React from 'react';
import { cn } from '../cn';
import styles from './MediaQuery.module.css';

export interface MediaQueryProps {
  /** Component rendered on mobile viewports (< 768px) */
  readonly mobile?: React.ReactNode;
  /** Component rendered on tablet viewports (768px - 1023px) */
  readonly tablet?: React.ReactNode;
  /** Baseline component rendered on desktop viewports (>= 1024px) */
  readonly desktop: React.ReactNode;
  /** Component rendered on wide viewports (>= 1440px) */
  readonly wide?: React.ReactNode;
  readonly className?: string;
}

interface SlotProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

function MobileSlot({ children, className }: SlotProps): React.ReactElement {
  return <div className={cn(styles.slotMobile, className)}>{children}</div>;
}

function TabletSlot({ children, className }: SlotProps): React.ReactElement {
  return <div className={cn(styles.slotTablet, className)}>{children}</div>;
}

function DesktopSlot({ children, className }: SlotProps): React.ReactElement {
  return <div className={cn(styles.slotDesktop, className)}>{children}</div>;
}

function WideSlot({ children, className }: SlotProps): React.ReactElement {
  return <div className={cn(styles.slotWide, className)}>{children}</div>;
}

/**
 * Declarative CSS-only responsive switcher.
 * Uses `@media` queries and `display: contents` to render different components
 * without triggering React re-renders or hydration mismatches.
 */
export function MediaQuery({
  mobile,
  tablet,
  desktop,
  wide,
  className,
}: MediaQueryProps): React.ReactElement {
  const hasTablet = tablet !== undefined;

  return (
    <div className={cn(styles.mediaQuery, !hasTablet && styles.noTablet, className)}>
      {mobile !== undefined && <MobileSlot>{mobile}</MobileSlot>}
      {hasTablet && <TabletSlot>{tablet}</TabletSlot>}
      <DesktopSlot>{desktop}</DesktopSlot>
      {wide !== undefined && <WideSlot>{wide}</WideSlot>}
    </div>
  );
}

MediaQuery.Mobile = MobileSlot;
MediaQuery.Tablet = TabletSlot;
MediaQuery.Desktop = DesktopSlot;
MediaQuery.Wide = WideSlot;

