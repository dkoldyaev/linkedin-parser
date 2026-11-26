import { Route, Routes } from 'react-router-dom';
import AboutPage from './views/AboutPage';
import ApiKeysPage from './views/ApiKeysPage';
import { AppShell } from './components/AppShell';
import CVManagementPage from './views/CVManagementPage';
import HomePage from './views/HomePage';
import LandingPage from './views/LandingPage';
import NotFoundPage from './views/NotFoundPage';
import React from 'react';
import StatsPage from './views/StatsPage';
import type { User } from './types/models';
import UserManagementPage from './views/UserManagementPage';

export interface AppRouterProps {
  initialUser?: User | null;
}

export default function AppRouter({ initialUser }: AppRouterProps): React.ReactElement {
  return (
    <AppShell initialUser={initialUser}>
      <Routes>
        <Route element={<HomePage />}>
          <Route index element={null} />
          <Route path="vacancies/:id" element={null} />
        </Route>
        <Route path="cv" element={<CVManagementPage />} />
        <Route path="stat" element={<StatsPage />} />
        <Route path="apikeys" element={<ApiKeysPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="howtouse" element={<LandingPage />} />
        <Route path="landing" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
