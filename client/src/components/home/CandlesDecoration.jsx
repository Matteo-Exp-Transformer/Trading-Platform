// Decoro astratto a candele giapponesi per l'hero. Puramente decorativo (aria-hidden): usa i
// token del tema via `currentColor` (ciano = accento per le candele «rialziste», muted per le
// altre). L'oscillazione lentissima è nella classe `.home-candle` (spenta con reduced-motion).
const CANDLES = [
  { x: 4, wickTop: 6, wickBottom: 46, bodyY: 16, bodyH: 20, up: true },
  { x: 22, wickTop: 12, wickBottom: 52, bodyY: 22, bodyH: 22, up: false },
  { x: 40, wickTop: 4, wickBottom: 40, bodyY: 10, bodyH: 24, up: true },
  { x: 58, wickTop: 18, wickBottom: 58, bodyY: 26, bodyH: 20, up: false },
  { x: 76, wickTop: 2, wickBottom: 36, bodyY: 8, bodyH: 18, up: true },
];

export function CandlesDecoration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 88 64"
      role="presentation"
      aria-hidden="true"
      className={`home-candle ${className}`.trim()}
    >
      {CANDLES.map((c, i) => (
        <g key={i} className={c.up ? 'text-freedom-accent' : 'text-muted'}>
          <line
            x1={c.x + 4}
            y1={c.wickTop}
            x2={c.x + 4}
            y2={c.wickBottom}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.7"
          />
          <rect
            x={c.x}
            y={c.bodyY}
            width="8"
            height={c.bodyH}
            rx="1.5"
            fill="currentColor"
            opacity={c.up ? 0.6 : 0.4}
          />
        </g>
      ))}
    </svg>
  );
}
