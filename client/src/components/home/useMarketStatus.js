import { useEffect, useState } from 'react';

// Stato «aperto/chiuso» delle tre piazze finanziarie mostrate in Home (FU-018).
// Orari in ora LOCALE di ciascuna piazza: si usa `Intl.DateTimeFormat` con il fuso IANA,
// così il DST (ora legale) è gestito dal runtime senza tabelle né librerie. Solo lun–ven.
export const MARKETS = [
  // Londra (LSE): 08:00–16:30 locali.
  { id: 'london', label: 'Londra', timeZone: 'Europe/London', open: 8 * 60, close: 16 * 60 + 30 },
  // New York (NYSE): 09:30–16:00 locali.
  { id: 'newyork', label: 'New York', timeZone: 'America/New_York', open: 9 * 60 + 30, close: 16 * 60 },
  // Tokyo (TSE): 09:00–15:00 locali.
  { id: 'tokyo', label: 'Tokyo', timeZone: 'Asia/Tokyo', open: 9 * 60, close: 15 * 60 },
];

const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

// Giorno della settimana + minuti dalla mezzanotte, nel fuso della piazza.
function localMoment(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);

  const map = {};
  for (const p of parts) map[p.type] = p.value;

  // Alcuni runtime rendono la mezzanotte come "24": normalizza a 0.
  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);
  return { weekday: map.weekday, minutesOfDay: hour * 60 + minute };
}

export function isMarketOpen(market, date = new Date()) {
  const { weekday, minutesOfDay } = localMoment(date, market.timeZone);
  if (!WEEKDAYS.has(weekday)) return false;
  return minutesOfDay >= market.open && minutesOfDay < market.close;
}

export function getMarketStatuses(date = new Date()) {
  return MARKETS.map((m) => ({ id: m.id, label: m.label, open: isMarketOpen(m, date) }));
}

// Hook: ricalcola lo stato subito e poi a intervalli (default 60s), pulendo il timer allo smontaggio.
export function useMarketStatus(intervalMs = 60000) {
  const [statuses, setStatuses] = useState(() => getMarketStatuses());

  useEffect(() => {
    const tick = () => setStatuses(getMarketStatuses());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return statuses;
}
