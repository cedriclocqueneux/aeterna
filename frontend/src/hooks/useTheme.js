import { useState, useEffect } from 'react';

export const THEME_MODES = ['light', 'auto', 'dark'];
const STORAGE_KEY = 'udm-theme';

/**
 * Détermine le thème automatique :
 * - Suit la préférence système si disponible
 * - Sinon, clair entre 7h et 20h, sombre la nuit
 */
function getAutoTheme() {
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.media !== 'not all') {
      return mq.matches ? 'dark' : 'light';
    }
  }
  const hour = new Date().getHours();
  return hour >= 7 && hour < 20 ? 'light' : 'dark';
}

function applyTheme(resolved) {
  const html = document.documentElement;
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function useTheme() {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'auto';
    return saved === 'auto' ? getAutoTheme() : saved;
  });

  // Applique le thème dès le montage et à chaque changement
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // En mode auto : réévalue toutes les minutes + écoute le système
  useEffect(() => {
    if (mode !== 'auto') return;

    const update = () => {
      const next = getAutoTheme();
      setResolvedTheme(next);
    };

    const interval = setInterval(update, 60 * 1000);
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener('change', update);

    return () => {
      clearInterval(interval);
      mq?.removeEventListener('change', update);
    };
  }, [mode]);

  const changeMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    const resolved = newMode === 'auto' ? getAutoTheme() : newMode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  };

  return { mode, resolvedTheme, changeMode };
}
