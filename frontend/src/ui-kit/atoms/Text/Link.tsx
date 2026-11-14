import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../utils';
import styles from './Text.module.css';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly href: string;
  readonly external?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Text link atom (<a>) supporting external navigation indicators.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    external = false,
    children,
    className,
    ...restProps
  },
  ref
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
      <span>{children}</span>
      {external && (
        <span className={styles.linkExternalIcon} aria-hidden="true">
          <ExternalLink size={12} />
        </span>
      )}
    </a>
  );
});
