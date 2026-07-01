import { vi, describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedTradingBackground } from './AnimatedTradingBackground.jsx';

afterEach(() => {
  delete window.matchMedia;
});

describe('AnimatedTradingBackground', () => {
  it('sta dietro ai contenuti e non intercetta i click (pointer-events:none)', () => {
    const { container } = render(<AnimatedTradingBackground />);
    const root = container.querySelector('[data-motion]');
    expect(root).not.toBeNull();
    expect(root).toHaveClass('pointer-events-none');
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('rende la griglia CSS e un canvas per le particelle', () => {
    const { container } = render(<AnimatedTradingBackground />);
    expect(container.querySelector('.home-grid')).not.toBeNull();
    expect(container.querySelector('.home-vignette')).not.toBeNull();
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('senza preferenza di sistema è animato (default)', () => {
    const { container } = render(<AnimatedTradingBackground />);
    expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'animated');
  });

  it('con prefers-reduced-motion diventa statico', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    const { container } = render(<AnimatedTradingBackground />);
    expect(container.querySelector('[data-motion]')).toHaveAttribute('data-motion', 'static');
  });
});
