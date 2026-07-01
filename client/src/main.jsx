import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { applyTheme, DEFAULT_THEME } from './lib/theme.js';
import './index.css';

// Applica subito il tema di default (dark) prima del primo render: evita il "flash" chiaro
// finché il profilo utente non è caricato (AuthProvider poi applica il tema salvato dell'utente).
applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
