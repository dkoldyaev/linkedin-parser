import React from 'react';
import KanbanCardTechTokens from './KanbanCardTechTokens';
import KanbanCardTagTokens from './KanbanCardTagTokens';

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
