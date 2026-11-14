import React from 'react';
import { cn } from '../../utils';
import type { TextTone } from './Text';
import styles from './Text.module.css';

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  readonly icon?: React.ReactNode;
  readonly tone?: TextTone;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  function ListItem(
    {
      icon,
      tone = 'primary',
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    if (icon !== undefined) {
      return (
        <li
          ref={ref}
          className={cn(styles.listItem, styles.listItemCustom, styles[`tone-${tone}`], className)}
          {...restProps}
        >
          <span className={styles.listItemIcon} aria-hidden="true">
            {icon}
          </span>
          <span>{children}</span>
        </li>
      );
    }

    return (
      <li
        ref={ref}
        className={cn(styles.listItem, styles[`tone-${tone}`], className)}
        {...restProps}
      >
        {children}
      </li>
    );
  }
);

export type ListSpacing = 'compact' | 'normal' | 'relaxed';

export interface UnorderedListProps extends React.HTMLAttributes<HTMLUListElement> {
  readonly spacing?: ListSpacing;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const UnorderedList = React.forwardRef<HTMLUListElement, UnorderedListProps>(
  function UnorderedList(
    {
      spacing = 'normal',
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <ul
        ref={ref}
        className={cn(
          styles.list,
          styles.unorderedList,
          styles[`listSpacing${capitalize(spacing)}`],
          className
        )}
        {...restProps}
      >
        {children}
      </ul>
    );
  }
);

export interface OrderedListProps extends React.OlHTMLAttributes<HTMLOListElement> {
  readonly spacing?: ListSpacing;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const OrderedList = React.forwardRef<HTMLOListElement, OrderedListProps>(
  function OrderedList(
    {
      spacing = 'normal',
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    return (
      <ol
        ref={ref}
        className={cn(
          styles.list,
          styles.orderedList,
          styles[`listSpacing${capitalize(spacing)}`],
          className
        )}
        {...restProps}
      >
        {children}
      </ol>
    );
  }
);

export interface ListProps extends React.HTMLAttributes<HTMLOListElement | HTMLUListElement> {
  readonly ordered?: boolean;
  readonly spacing?: ListSpacing;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Universal List atom for ordered (<ol>) and unordered (<ul>) lists.
 */
export const List = React.forwardRef<HTMLOListElement | HTMLUListElement, ListProps>(
  function List(
    {
      ordered = false,
      spacing = 'normal',
      children,
      className,
      ...restProps
    },
    ref
  ): React.ReactElement {
    if (ordered) {
      return (
        <OrderedList
          ref={ref as React.Ref<HTMLOListElement>}
          spacing={spacing}
          className={className}
          {...restProps}
        >
          {children}
        </OrderedList>
      );
    }

    return (
      <UnorderedList
        ref={ref as React.Ref<HTMLUListElement>}
        spacing={spacing}
        className={className}
        {...restProps}
      >
        {children}
      </UnorderedList>
    );
  }
) as React.ForwardRefExoticComponent<
  ListProps & React.RefAttributes<HTMLOListElement | HTMLUListElement>
> & {
  Item: typeof ListItem;
  Ordered: typeof OrderedList;
  Unordered: typeof UnorderedList;
};

List.Item = ListItem;
List.Ordered = OrderedList;
List.Unordered = UnorderedList;

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
