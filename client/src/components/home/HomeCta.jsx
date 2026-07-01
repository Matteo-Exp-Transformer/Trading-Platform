import { useNavigate } from 'react-router-dom';

// Il CTA della Home punta alla Chat (rotta /nuova-analisi) con il form pulito.
// Lo storico resta accessibile dal drawer condiviso aperto tramite hamburger.
// Niente Journal/Trading Live: sono follow-up (FU-023/FU-024), non esistono ancora.
export function HomeCta() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => navigate('/nuova-analisi')}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-freedom-accent px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-freedom-accent/20 transition-all duration-200 hover:bg-freedom-accentHover hover:shadow-freedom-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-freedom-accent sm:w-auto"
      >
        Nuova analisi
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </button>
    </div>
  );
}
