import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

// Colore delle particelle/linee sul <canvas>. Rispecchia `freedom.accentHover` (cyan-400) di
// tailwind.config.js: su canvas non possiamo usare le classi Tailwind, quindi il valore è
// replicato qui con questa nota (unica eccezione motivata al «niente colori hardcoded»).
const ACCENT = '#22d3ee';

// Sfondo immersivo riutilizzabile: griglia finanziaria (CSS), bagliori sfocati ciano/slate in
// lento movimento (CSS), particelle ciano collegate da linee sottili (canvas) e vignettatura.
// Sta DIETRO ai contenuti (assoluto, z-0, pointer-events:none): non intercetta mai i click.
// Con prefers-reduced-motion diventa statico. Il contenitore genitore deve essere `relative`.
export function AnimatedTradingBackground() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ambiente senza canvas 2D (es. jsdom nei test): getContext può tornare null o lanciare;
    // in entrambi i casi ci si ferma qui e la griglia CSS resta comunque visibile.
    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let width = 0;
    let height = 0;
    let particles = [];

    function makeParticles() {
      // Meno particelle su schermi piccoli (mobile) per non appesantire.
      const count = width < 640 ? 26 : width < 1024 ? 44 : 70;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    }

    function paintParticles(move) {
      ctx.clearRect(0, 0, width, height);

      // Linee tra particelle vicine (alpha proporzionale alla vicinanza).
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 130) {
            ctx.globalAlpha = (1 - dist / 130) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // Particelle (ciano tenue).
      ctx.fillStyle = ACCENT;
      ctx.globalAlpha = 0.5;
      for (const p of particles) {
        if (move) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          else if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          else if (p.y > height) p.y = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      paintParticles(true);
      raf = requestAnimationFrame(loop);
    }

    resize();

    if (reduced) {
      // Movimento ridotto: un solo fotogramma statico, nessun requestAnimationFrame.
      paintParticles(false);
    } else {
      loop();
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return (
    <div
      aria-hidden="true"
      data-motion={reduced ? 'static' : 'animated'}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-app"
    >
      {/* Bagliori sfocati ciano/slate in lento movimento (fermi con reduced-motion via CSS). */}
      <div className="home-blob home-blob--cyan absolute -left-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-freedom-accent/20 blur-3xl" />
      <div className="home-blob home-blob--slate absolute -bottom-32 -right-16 h-[36rem] w-[36rem] rounded-full bg-surface-strong/40 blur-3xl" />
      {/* Griglia finanziaria leggera (CSS: visibile anche senza canvas). */}
      <div className="home-grid absolute inset-0" />
      {/* Particelle animate su canvas (sopra griglia e bagliori, sotto la vignettatura). */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Vignettatura scura per contrasto e leggibilità. */}
      <div className="home-vignette absolute inset-0" />
    </div>
  );
}
