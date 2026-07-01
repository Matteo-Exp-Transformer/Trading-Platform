// Etichetta relativa e breve per l'ultimo aggiornamento di una sessione: "oggi", "ieri",
// "N giorni fa" (entro la settimana), altrimenti una data breve (gg mese). Pura e testabile;
// `now` è iniettabile per rendere i test deterministici. Confronto a livello di GIORNO locale
// (non di ora), così "ieri" resta "ieri" per tutta la giornata.
export function relativeDayLabel(input, now = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (days <= 0) return 'oggi';
  if (days === 1) return 'ieri';
  if (days < 7) return `${days} giorni fa`;
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}
