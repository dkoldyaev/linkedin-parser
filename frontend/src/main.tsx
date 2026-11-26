import '@blueprint/ui-kit/styles.css';
import './index.css';
import './design-system.css';
import AppRouter from './AppRouter';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n/I18nContext';
import { OverlayProvider } from '@blueprint/ui-kit';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Fatal: #root element is missing in index.html');
}

createRoot(rootElement).render(
  <OverlayProvider>
    <BrowserRouter>
      <I18nProvider>
        <AppRouter />
      </I18nProvider>
    </BrowserRouter>
  </OverlayProvider>,
);
