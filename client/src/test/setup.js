// Setup Vitest per il client: aggiunge i matcher di @testing-library/jest-dom
// (es. toBeInTheDocument) e pulisce il DOM dopo ogni test.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
