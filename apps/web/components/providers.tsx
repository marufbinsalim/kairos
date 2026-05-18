'use client';
import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { AppInitializer } from './AppInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer />
      {children}
    </Provider>
  );
}
