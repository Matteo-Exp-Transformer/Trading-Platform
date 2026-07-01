import { useEffect, useState } from 'react';

// Rileva la preferenza di sistema «riduci il movimento». Difensivo: se `matchMedia` non è
// disponibile (es. jsdom nei test o SSR) ritorna `false` → versione animata. Usato dalla Home
// per servire uno sfondo STATICO quando l'utente ha attivato prefers-reduced-motion.
const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    // addEventListener è lo standard; addListener è il fallback per browser datati.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return reduced;
}
