'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  return <>{children}</>;
}