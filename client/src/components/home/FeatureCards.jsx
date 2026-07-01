// Icone inline (stroke = currentColor → prendono l'accento ciano via il testo del contenitore).
// Puramente decorative (aria-hidden). Niente librerie: SVG semplici a 24×24.
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

function IconAnalisi(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 4v16h16" />
      <rect x="7.5" y="11" width="2.5" height="6" rx="0.5" />
      <rect x="13" y="7" width="2.5" height="10" rx="0.5" />
    </svg>
  );
}

function IconMemoria(props) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function IconJournal(props) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M12.5 8H16" />
      <path d="M12.5 12H16" />
    </svg>
  );
}

function IconMercati(props) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

// Panoramica dell'app (FU-021): 4 card statiche e DESCRITTIVE (non link) — riassumono cosa fa la
// piattaforma. Nessun dato/licenza di terzi. Le azioni reali stanno nei CTA dell'hero; qui niente
// navigazione (Journal è ancora un follow-up → "in arrivo", niente finta pagina).
const FEATURES = [
  {
    key: 'analisi',
    title: 'Analisi assistita',
    desc: 'Carica i grafici e ricevi una lettura tecnica ragionata, timeframe per timeframe.',
    Icon: IconAnalisi,
  },
  {
    key: 'memoria',
    title: 'Memoria sessioni',
    desc: 'Ogni analisi resta salvata: riapri una sessione e ritrovi contesto e conclusioni.',
    Icon: IconMemoria,
  },
  {
    key: 'journal',
    title: 'Journal',
    desc: 'Uno spazio per annotare operazioni e riflessioni sul tuo percorso. In arrivo.',
    Icon: IconJournal,
  },
  {
    key: 'mercati',
    title: 'Monitoraggio mercati',
    desc: 'Tieni d’occhio le sessioni di Londra, New York e Tokyo direttamente dalla Home.',
    Icon: IconMercati,
  },
];

export function FeatureCards() {
  return (
    <section aria-label="Panoramica dell'app" className="w-full">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, title, desc, Icon }) => (
          <li
            key={key}
            className="home-fade-up group flex flex-col rounded-2xl border border-line bg-surface/60 p-5 transition-all duration-200 hover:border-freedom-accent"
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-app/40 text-freedom-accent">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold text-content">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
