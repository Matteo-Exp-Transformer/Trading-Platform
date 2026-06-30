// Store globale (Zustand). Seme minimo per M0: tema chiaro/scuro.
// Le funzionalità reali (chat, sessione utente) arrivano dai milestone successivi.
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  theme: 'dark',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
