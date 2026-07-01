import { CandlesDecoration } from './CandlesDecoration.jsx';
import { HomeCta } from './HomeCta.jsx';

// Sezione principale della Home: badge, decoro a candele, titolo grande, breve descrizione e CTA.
// Entrata morbida via `.home-fade-up`. Palette slate+ciano (token) sul wrapper scuro.
export function Hero() {
  return (
    <section className="home-fade-up mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-freedom-accent" />
        Trading Intelligence Workspace
      </span>

      <CandlesDecoration className="mb-6 h-14 w-24" />

      <h1 className="text-4xl font-semibold leading-tight text-content sm:text-5xl">
        Il tuo agente di analisi tecnica
      </h1>

      <p className="mt-5 max-w-xl text-base text-content sm:text-lg">
        Studia i mercati con{' '}
        <span className="text-freedom-accent">FREEDOM TRADING SYSTEM</span>.
      </p>

      <div className="mt-9 w-full">
        <HomeCta />
      </div>
    </section>
  );
}
