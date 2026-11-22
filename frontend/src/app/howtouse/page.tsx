'use client';

import { Suspense } from 'react';
import LandingPage from '../../views/LandingPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}
