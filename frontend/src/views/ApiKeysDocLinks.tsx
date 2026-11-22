import React from 'react';
import { ExternalLink, Code2 } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';

const EXTERNAL_LINK_ICON = <Icon icon={ExternalLink} size="xs" />;
const CODE2_ICON = <Icon icon={Code2} size="xs" />;

export default function ApiKeysDocLinks(): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
      <Button asChild variant="secondary" size="sm">
        <a
          href="/api/v1/docs"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {EXTERNAL_LINK_ICON}
          <span>Swagger UI</span>
        </a>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <a
          href="/api/v1/redoc"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {EXTERNAL_LINK_ICON}
          <span>ReDoc</span>
        </a>
      </Button>
      <Button asChild variant="secondary" size="sm">
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {CODE2_ICON}
          <span>openapi.json</span>
        </a>
      </Button>
    </div>
  );
}
