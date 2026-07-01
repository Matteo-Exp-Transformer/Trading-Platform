import { useMarketStatus } from './useMarketStatus.js';

// Stato mercati in alto a destra nella Home (FU-018): Londra · New York · Tokyo con un pallino
// per piazza. Aperto = verde (scelta esplicita dell'utente per lo stato "mercato aperto"),
// chiuso = grigio (token `faint`). Il verde è confinato a questo micro-indicatore di stato.
// Lo stato «aperto/chiuso» è dato anche a parole (sr-only) per l'accessibilità.
export function MarketStatus({ className = '' }) {
  const markets = useMarketStatus();

  return (
    <div
      role="group"
      aria-label="Stato mercati"
      className={`flex w-full items-center justify-between gap-2 text-xs font-medium sm:w-auto sm:justify-normal sm:gap-4 ${className}`}
    >
      {markets.map((m) => (
        <span key={m.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${m.open ? 'bg-green-500' : 'bg-faint'}`}
          />
          <span className="text-muted">{m.label}</span>
          <span className="sr-only">{m.open ? 'aperto' : 'chiuso'}</span>
        </span>
      ))}
    </div>
  );
}
