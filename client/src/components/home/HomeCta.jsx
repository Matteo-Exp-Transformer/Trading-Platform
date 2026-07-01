import { useNavigate } from 'react-router-dom';

// I due CTA della Home puntano SOLO a rotte esistenti:
//  - «Nuova analisi» → la Chat (rotta /nuova-analisi), form pulito;
//  - «Le mie analisi» → sempre la Chat, ma passando lo stato `openStorico` così la Chat apre il
//    drawer dello storico all'arrivo (lo storico vive come drawer dentro la Chat, non come rotta).
// Niente Journal/Trading Live: sono follow-up (FU-023/FU-024), non esistono ancora.
export function HomeCta() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-3 sm:auto-cols-max sm:grid-flow-col sm:justify-center">
      <button
        type="button"
        onClick={() => navigate('/nuova-analisi')}
        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-freedom-accent px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-freedom-accent/20 transition-all duration-200 hover:bg-freedom-accentHover hover:shadow-freedom-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
      >
        Nuova analisi
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </button>
      <button
        type="button"
        onClick={() => navigate('/nuova-analisi', { state: { openStorico: true } })}
        className="inline-flex items-center justify-center rounded-2xl border border-line bg-surface/60 px-6 py-3 font-semibold text-content transition-all duration-200 hover:border-freedom-accent hover:text-freedom-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent"
      >
        Le mie analisi
      </button>
    </div>
  );
}
