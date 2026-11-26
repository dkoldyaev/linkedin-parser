import { AlertBanner, PageLayout } from '@blueprint/ui-kit';
import CVEditorSection from './CVEditorSection';
import CVPageHeader from './CVPageHeader';
import type { CVPageProps } from './cv.types';
import React from 'react';
import { useAuth } from '../components/AppShell';
import { useCVManagement } from './useCVManagement';
import { useTranslation } from '../i18n/I18nContext';

export default function CVManagementPage({ user }: CVPageProps): React.ReactElement {
  const auth = useAuth();
  const resolvedUser = user !== undefined ? user : auth.user;
  const { locale } = useTranslation();
  const {
    sourceText,
    sourceRevision,
    approvedRevision,
    filename,
    syncStatus,
    serverCV,
    message,
    error,
    isSubmitting,
    handleTextChange,
    handleFileUpload,
    handleSaveToServer,
    handleDeleteServerCV,
    handleClearLocal,
  } = useCVManagement(resolvedUser);

  return (
    <PageLayout
      gridDeps={[locale]}
      className="cv-page"
      header={<CVPageHeader syncStatus={syncStatus} approvedRevision={approvedRevision} />}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ui-space-4)',
          padding: 'var(--ui-space-4)',
        }}
      >
        {error && <AlertBanner tone="danger" title={error} />}
        {message && <AlertBanner tone="success" title={message} />}

        <CVEditorSection
          sourceText={sourceText}
          sourceRevision={sourceRevision}
          filename={filename}
          syncStatus={syncStatus}
          serverCV={serverCV}
          isSubmitting={isSubmitting}
          onTextChange={handleTextChange}
          onFileUpload={handleFileUpload}
          onSaveToServer={handleSaveToServer}
          onDeleteServerCV={handleDeleteServerCV}
          onClearLocal={handleClearLocal}
        />
      </div>
    </PageLayout>
  );
}
