import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import HomePage from './views/HomePage';
import AboutPage from './views/AboutPage';
import ApiKeysPage from './views/ApiKeysPage';
import CVManagementPage from './views/CVManagementPage';
import LandingPage from './views/LandingPage';
import StatsPage from './views/StatsPage';
import UserManagementPage from './views/UserManagementPage';
import NotFoundPage from './views/NotFoundPage';
import type { User } from './types/models';

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
