import KanbanCardTagTokens from './KanbanCardTagTokens';
import KanbanCardTechTokens from './KanbanCardTechTokens';
import React from 'react';

export interface KanbanCardTokensProps {
  techStack?: string[];
  tags?: string[];
}

export default function KanbanCardTokens({
  techStack,
  tags,
}: KanbanCardTokensProps): React.ReactElement {
  return (
    <>
      <KanbanCardTechTokens techStack={techStack} />
      <KanbanCardTagTokens tags={tags} />
    </>
  );
}
