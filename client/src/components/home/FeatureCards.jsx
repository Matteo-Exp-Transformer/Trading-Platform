import { Link } from 'react-router-dom';

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

// Panoramica dell'app (FU-021): 4 card che riassumono cosa fa la piattaforma. Le card con `to`
// sono navigabili verso una pagina reale (Journal, FU-023); le altre restano descrittive. Nessun
// dato/licenza di terzi. Le azioni principali stanno nei CTA dell'hero.
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
    desc: 'Annota operazioni, esiti ed emozioni: costruisci il diario del tuo percorso.',
    Icon: IconJournal,
    to: '/journal',
  },
  {
    key: 'mercati',
    title: 'Monitoraggio mercati',
    desc: 'Tieni d’occhio le sessioni di Londra, New York e Tokyo direttamente dalla Home.',
    Icon: IconMercati,
  },
];

const cardClass =
  'home-fade-up group flex h-full flex-col rounded-2xl border border-line bg-surface/60 p-5 transition-all duration-200 hover:border-freedom-accent';

function FeatureBody({ title, desc, Icon, to }) {
  return (
    <>
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-app/40 text-freedom-accent">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-base font-semibold text-content">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
      {to && <span className="mt-3 text-sm font-medium text-freedom-accent">Apri →</span>}
    </>
  );
}

export function FeatureCards() {
  return (
    <section aria-labelledby="feature-cards-title" className="w-full">
      <h2
        id="feature-cards-title"
        className="mb-4 text-xl font-semibold text-content sm:text-2xl"
      >
        Cosa puoi fare
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, title, desc, Icon, to }) => (
          <li key={key}>
            {to ? (
              <Link to={to} className={cardClass}>
                <FeatureBody title={title} desc={desc} Icon={Icon} to={to} />
              </Link>
            ) : (
              <div className={cardClass}>
                <FeatureBody title={title} desc={desc} Icon={Icon} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
