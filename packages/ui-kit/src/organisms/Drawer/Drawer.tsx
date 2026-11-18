import React, { useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import { useFocusTrap } from '../../hooks';
import { cn } from '../../utils';
import styles from './Drawer.module.css';

export interface DrawerNavLinkItem {
  readonly id: string;
  readonly label: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly index?: string | number;
  readonly active?: boolean;
  readonly badge?: React.ReactNode;
  readonly href?: string;
  readonly onClick?: (e: React.MouseEvent) => void;
  readonly as?: React.ElementType;
}

export interface DrawerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: React.ReactNode;
  readonly tag?: React.ReactNode;
  readonly placement?: 'left' | 'right';
  readonly closeLabel?: string;
  readonly hideCloseButton?: boolean;
  readonly links?: readonly DrawerNavLinkItem[];
  readonly headerSlot?: React.ReactNode;
  readonly footerSlot?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly overlayClassName?: string;
}

/**
 * Accessible Drawer / Navigation Drawer organism aligned to the 32px Blueprint grid.
 * Powered by `@radix-ui/react-dialog` with focus trapping, ESC closing, backdrop handling,
 * and navigation links slot.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  tag = 'Navigation',
  placement = 'left',
  closeLabel = 'Close navigation',
  hideCloseButton = false,
  links,
  headerSlot,
  footerSlot,
  children,
  className,
  overlayClassName,
  ...rest
}: DrawerProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(containerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(styles.overlay, overlayClassName)}
        />
        <DialogPrimitive.Content
          ref={containerRef}
          aria-modal="true"
          className={cn(
            styles.drawer,
            placement === 'right' ? styles['placement-right'] : styles['placement-left'],
            className
          )}
          {...rest}
        >
          <DialogPrimitive.Description className={styles.srOnly}>
            Navigation drawer
          </DialogPrimitive.Description>

          <header className={styles.header}>
            <div className={styles.headerTitleGroup}>
              {headerSlot !== undefined ? (
                headerSlot
              ) : (
                <>
                  {tag !== undefined && (
                    <Text variant="mono" tone="accent" weight="semibold">
                      {tag}
                    </Text>
                  )}
                  {title !== undefined && (
                    <DialogPrimitive.Title asChild>
                      <Text variant="body" weight="semibold" tone="primary">
                        {title}
                      </Text>
                    </DialogPrimitive.Title>
                  )}
                </>
              )}
            </div>

            {!hideCloseButton && (
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={closeLabel}
                  onClick={onClose}
                >
                  <Icon icon={X} size="md" />
                </Button>
              </DialogPrimitive.Close>
            )}
          </header>

          <div className={styles.body}>
            {links !== undefined && links.length > 0 && (
              <nav className={styles.linksNav} aria-label="Drawer navigation links">
                {links.map((link, idx) => {
                  const Comp = link.as ?? (link.href ? 'a' : 'button');
                  const itemIndex =
                    link.index !== undefined
                      ? link.index
                      : String(idx + 1).padStart(2, '0');

                  return (
                    <Comp
                      key={link.id}
                      href={link.href}
                      onClick={link.onClick}
                      className={cn(
                        styles.navItem,
                        link.active && styles.navItemActive
                      )}
                    >
                      <span className={styles.navIndex}>{itemIndex}</span>
                      {link.icon !== undefined && (
                        <span className={styles.navIcon} aria-hidden="true">
                          {link.icon}
                        </span>
                      )}
                      <span className={styles.navLabel}>{link.label}</span>
                      {link.badge !== undefined && link.badge}
                      <span className={styles.navArrow} aria-hidden="true">
                        →
                      </span>
                    </Comp>
                  );
                })}
              </nav>
            )}
            {children}
          </div>

          {footerSlot !== undefined && (
            <footer className={styles.footer}>{footerSlot}</footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
