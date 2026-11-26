import { Badge, TokenList } from '@blueprint/ui-kit';
import React from 'react';

export interface KanbanCardTagTokensProps {
  tags?: string[];
}

export default function KanbanCardTagTokens({
  tags,
}: KanbanCardTagTokensProps): React.ReactElement | null {
  if (!tags || tags.length === 0) return null;

  return (
    <TokenList>
      {tags.map((tag) => (
        <Badge key={tag} size="xs" variant="chip" tone="neutral">
          #{tag}
        </Badge>
      ))}
    </TokenList>
  );
}
