import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn, useOverlayContainer } from '../../utils';
import React from 'react';
import styles from './Tooltip.module.css';
import { Text } from '../../atoms';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  readonly content: React.ReactNode;
  readonly children: React.ReactElement;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly align?: 'start' | 'center' | 'end';
  readonly delayDuration?: number;
  readonly className?: string;
}

/**
 * Accessible Tooltip molecule powered by `@radix-ui/react-tooltip`.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
  ...rest
}: TooltipProps): React.ReactElement {
  const overlayContainer = useOverlayContainer();

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={overlayContainer}>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(styles.content, className)}
            {...rest}
          >
            <Text variant="mono" as="span">
              {content}
            </Text>
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
