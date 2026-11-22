import React from 'react';
import { TokenList, Badge } from '@blueprint/ui-kit';
import styles from './KanbanCard.module.css';

export interface KanbanCardTechTokensProps {
  techStack?: string[];
}

export default function KanbanCardTechTokens({
  techStack,
}: KanbanCardTechTokensProps): React.ReactElement | null {
  if (!techStack || techStack.length === 0) return null;
  const visible = techStack.slice(0, 4);
  const remaining = techStack.length - 4;

  return (
    <TokenList>
      {visible.map((tech) => (
        <Badge key={tech} size="xs" variant="chip">
          {tech}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge size="xs" variant="chip" tone="neutral" className={styles.techStackMore}>
          +{remaining}
        </Badge>
      )}
    </TokenList>
  );
}
