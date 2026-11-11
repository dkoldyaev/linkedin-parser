import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Text } from '../../atoms';
import { cn } from '../../utils';
import styles from './Tooltip.module.css';

export interface TooltipProps {
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
}: TooltipProps): React.ReactElement {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(styles.content, className)}
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
