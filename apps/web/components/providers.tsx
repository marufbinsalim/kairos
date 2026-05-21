'use client';
import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { AppInitializer } from './AppInitializer';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppInitializer />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
