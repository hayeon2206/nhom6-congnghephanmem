import { useEffect, useState } from 'react';

/** Mirrors the OS/browser reduced-motion setting so JS-timer-driven effects
 * (typewriter reveal, flip word) can skip straight to their end state —
 * the global CSS rule in index.css only shortens CSS animations/transitions,
 * it can't stop a setTimeout sequence. */
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
