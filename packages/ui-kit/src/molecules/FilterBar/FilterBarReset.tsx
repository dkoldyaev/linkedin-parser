import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Icon } from '../../atoms';

export interface FilterBarResetProps {
  readonly onReset: () => void;
  readonly label?: string;
  readonly className?: string;
}

export function FilterBarReset({
  onReset,
  label = 'Reset',
  className,
}: FilterBarResetProps): React.ReactElement {
  return (
    <Button
      variant="ghost"
      size="sm"
      tone="danger"
      onClick={onReset}
      className={className}
      startIcon={<Icon icon={RotateCcw} size="xs" />}
    >
      {label}
    </Button>
  );
}

