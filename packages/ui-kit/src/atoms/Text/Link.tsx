import type { TextTone, TextVariant } from './Text';
import { cn } from '../../utils';
import { ExternalLink } from 'lucide-react';
import { Icon } from '../Icon';
import React from 'react';
import styles from './Text.module.css';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly href: string;
  readonly external?: boolean;
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly startIcon?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Text link atom (<a>) supporting optional start icon and external navigation indicator via `<Icon>`.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, external = false, startIcon, children, className, ...restProps },
  ref,
): React.ReactElement {
  const target = external ? '_blank' : restProps.target;
  const rel = external ? 'noopener noreferrer' : restProps.rel;

  return (
    <a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      className={cn(styles.link, className)}
      {...restProps}
    >
      {startIcon !== undefined && (
        <span className={styles.iconSlot} aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span>{children}</span>
      {external && <Icon icon={ExternalLink} size="2xs" className={styles.linkExternalIcon} />}
    </a>
  );
});
