import React, { useEffect } from 'react';

export type ContainerType = 'normal' | 'size' | 'inline-size';

export interface ContainerQueryProps {
  /**
   * Ref to the container DOM element whose size determines the layout.
   */
  readonly containerRef: React.RefObject<HTMLElement | null>;
  /**
   * CSS container-type applied to the container element.
   * @default 'inline-size'
   */
  readonly containerType?: ContainerType;
  /**
   * Optional container name for named CSS container queries.
   */
  readonly containerName?: string;
  readonly children: React.ReactNode;
}

export interface ContainerQuerySlotProps {
  /** Minimum container width (in px) for this slot */
  readonly min?: number;
  /** Maximum container width (in px) for this slot */
  readonly max?: number;
  /** Optional container name */
  readonly containerName?: string;
  readonly children: React.ReactNode;
}

let slotIdCounter = 0;

/**
 * Slot component within `ContainerQuery`.
 * Conditionally renders children purely via injected CSS `@container` rules and `display: contents / none`.
 */
export function ContainerQuerySlot({
  min,
  max,
  containerName,
  children,
}: ContainerQuerySlotProps): React.ReactElement {
  const [slotClass] = React.useState(() => `cqs-${++slotIdCounter}`);

  const conditions: string[] = [];
  if (min !== undefined) {
    conditions.push(`(min-width: ${min}px)`);
  }
  if (max !== undefined) {
    conditions.push(`(max-width: ${max}px)`);
  }

  const queryCondition = conditions.length > 0 ? conditions.join(' and ') : 'all';
  const queryPrefix = containerName ? `@container ${containerName}` : '@container';
  const css = `
    .${slotClass} { display: none; }
    ${queryPrefix} ${queryCondition} {
      .${slotClass} { display: contents; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={slotClass}>{children}</div>
    </>
  );
}

/**
 * Pure CSS Container Query component.
 * Applies `container-type` (defaults to `inline-size`) to the passed `containerRef`
 * and coordinates declarative `<ContainerQuery.Slot min={...} max={...}>` slots.
 */
export function ContainerQuery({
  containerRef,
  containerType = 'inline-size',
  containerName,
  children,
}: ContainerQueryProps): React.ReactElement {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return undefined;
    }

    const previousType = el.style.containerType;
    const previousName = el.style.containerName;

    el.style.containerType = containerType;
    if (containerName) {
      el.style.containerName = containerName;
    }

    return () => {
      el.style.containerType = previousType;
      el.style.containerName = previousName;
    };
  }, [containerRef, containerType, containerName]);

  return <>{children}</>;
}

ContainerQuery.Slot = ContainerQuerySlot;
