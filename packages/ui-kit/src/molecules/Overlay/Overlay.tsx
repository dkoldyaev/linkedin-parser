import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from '@floating-ui/react-dom';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import { cn, useOverlayContainer } from '../../utils';
import styles from './Overlay.module.css';

export type OverlayViewportPlacement =
  | 'center'
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end'
  | 'stretch-left'
  | 'stretch-right';

export type OverlayAnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type OverlayPlacement = OverlayViewportPlacement | OverlayAnchorPlacement;

export interface OverlayProps {
  readonly isOpen: boolean;
  readonly children: React.ReactNode;
  readonly anchorRef?: React.RefObject<HTMLElement | null>;
  readonly placement?: OverlayPlacement;
  readonly offsetPx?: number;
  readonly backdrop?: boolean;
  readonly onClose?: () => void;
  readonly className?: string;
}

const VIEWPORT_CLASS_MAP: Record<OverlayPlacement, string> = {
  center: styles['placement-center'],
  top: styles['placement-top-center'],
  'top-start': styles['placement-top-start'],
  'top-center': styles['placement-top-center'],
  'top-end': styles['placement-top-end'],
  bottom: styles['placement-bottom-center'],
  'bottom-start': styles['placement-bottom-start'],
  'bottom-center': styles['placement-bottom-center'],
  'bottom-end': styles['placement-bottom-end'],
  left: styles['placement-stretch-left'],
  'left-start': styles['placement-top-start'],
  'left-end': styles['placement-bottom-start'],
  'stretch-left': styles['placement-stretch-left'],
  right: styles['placement-stretch-right'],
  'right-start': styles['placement-top-end'],
  'right-end': styles['placement-bottom-end'],
  'stretch-right': styles['placement-stretch-right'],
};

const ANCHOR_PLACEMENT_MAP: Record<OverlayPlacement, Placement> = {
  center: 'bottom',
  top: 'top',
  'top-start': 'top-start',
  'top-center': 'top',
  'top-end': 'top-end',
  bottom: 'bottom',
  'bottom-start': 'bottom-start',
  'bottom-center': 'bottom',
  'bottom-end': 'bottom-end',
  left: 'left',
  'left-start': 'left-start',
  'left-end': 'left-end',
  'stretch-left': 'left',
  right: 'right',
  'right-start': 'right-start',
  'right-end': 'right-end',
  'stretch-right': 'right',
};

function isTargetInsideAnchor(
  eventTarget: EventTarget | null,
  anchorRef: React.RefObject<HTMLElement | null> | undefined
): boolean {
  if (!anchorRef?.current || !(eventTarget instanceof Node)) {
    return false;
  }
  return anchorRef.current.contains(eventTarget);
}

interface DismissableWrapperProps {
  readonly onClose?: () => void;
  readonly anchorRef?: React.RefObject<HTMLElement | null>;
  readonly children: React.ReactElement;
}

function DismissableWrapper({
  onClose,
  anchorRef,
  children,
}: DismissableWrapperProps): React.ReactElement {
  if (!onClose) {
    return children;
  }

  return (
    <DismissableLayer
      asChild
      onEscapeKeyDown={() => {
        onClose();
      }}
      onPointerDownOutside={(event) => {
        if (isTargetInsideAnchor(event.detail.originalEvent.target, anchorRef)) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onFocusOutside={(event) => {
        if (isTargetInsideAnchor(event.detail.originalEvent.target, anchorRef)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </DismissableLayer>
  );
}

interface AnchoredOverlayContentProps {
  readonly anchorRef: React.RefObject<HTMLElement | null>;
  readonly placement: OverlayPlacement;
  readonly offsetPx: number;
  readonly onClose?: () => void;
  readonly className?: string;
  readonly children: React.ReactNode;
}

function AnchoredOverlayContent({
  anchorRef,
  placement,
  offsetPx,
  onClose,
  className,
  children,
}: AnchoredOverlayContentProps): React.ReactElement {
  const floatingNodeRef = useRef<HTMLDivElement | null>(null);
  const { refs, floatingStyles } = useFloating({
    strategy: 'fixed',
    placement: ANCHOR_PLACEMENT_MAP[placement],
    middleware: [offset(offsetPx), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    refs.setReference(anchorRef.current);
  }, [anchorRef, refs]);

  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      floatingNodeRef.current = node;
      refs.setFloating(node);
      if (node) {
        Object.assign(node.style, floatingStyles);
      }
    },
    [refs, floatingStyles]
  );

  useLayoutEffect(() => {
    if (floatingNodeRef.current) {
      Object.assign(floatingNodeRef.current.style, floatingStyles);
    }
  }, [floatingStyles]);

  return (
    <DismissableWrapper onClose={onClose} anchorRef={anchorRef}>
      <div
        ref={setFloatingRef}
        data-ui-overlay="anchored"
        className={cn(styles.anchoredSurface, className)}
      >
        {children}
      </div>
    </DismissableWrapper>
  );
}

/**
 * Universal portal overlay wrapper powered by `<OverlayProvider>`.
 * Supports viewport-fixed placement (`center`, corners, edges) and element-tethered
 * positioning (`anchorRef` via Floating UI) without z-index juggling — stacking is
 * determined strictly by chronological DOM order inside `[data-ui-overlay-root]`.
 */
export function Overlay({
  isOpen,
  children,
  anchorRef,
  placement,
  offsetPx = 4,
  backdrop = false,
  onClose,
  className,
}: OverlayProps): React.ReactElement | null {
  const container = useOverlayContainer();

  if (!isOpen) {
    return null;
  }

  if (anchorRef !== undefined) {
    const resolvedAnchorPlacement: OverlayPlacement = placement ?? 'bottom-start';
    return createPortal(
      <AnchoredOverlayContent
        anchorRef={anchorRef}
        placement={resolvedAnchorPlacement}
        offsetPx={offsetPx}
        onClose={onClose}
        className={className}
      >
        {children}
      </AnchoredOverlayContent>,
      container
    );
  }

  const resolvedViewportPlacement: OverlayPlacement = placement ?? 'center';
  const placementClass = VIEWPORT_CLASS_MAP[resolvedViewportPlacement];

  return createPortal(
    <div
      data-ui-overlay="viewport"
      className={cn(styles.viewportFrame, placementClass)}
    >
      {backdrop && (
        <div
          data-ui-overlay-backdrop=""
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <DismissableWrapper onClose={onClose}>
        <div className={cn(styles.surface, className)}>{children}</div>
      </DismissableWrapper>
    </div>,
    container
  );
}
