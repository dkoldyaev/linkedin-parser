import { Button, Icon } from '@blueprint/ui-kit';
import React from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface CVUploadButtonProps {
  hasSource: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UPLOAD_ICON = <Icon icon={Upload} size="xs" />;

export default function CVUploadButton({
  hasSource,
  onFileUpload,
}: CVUploadButtonProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <label style={{ margin: 0, cursor: 'pointer' }}>
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={onFileUpload}
        style={{ display: 'none' }}
      />
      <Button asChild variant="primary" size="sm">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {UPLOAD_ICON}
          <span>{hasSource ? t('pages.cv.replace_btn') : t('pages.cv.upload_btn')}</span>
        </span>
      </Button>
    </label>
  );
}
