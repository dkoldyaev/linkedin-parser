import { Button, Icon } from '../../atoms';
import React from 'react';
import { RotateCcw } from 'lucide-react';

export interface FilterBarResetProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly onReset: () => void;
  readonly label?: string;
  readonly className?: string;
}

export function FilterBarReset({
  onReset,
  label = 'Reset',
  className,
  ...rest
}: FilterBarResetProps): React.ReactElement {
  return (
    <Button
      variant="ghost"
      size="sm"
      tone="danger"
      onClick={onReset}
      className={className}
      startIcon={<Icon icon={RotateCcw} size="xs" />}
      {...rest}
    >
      {label}
    </Button>
  );
}
