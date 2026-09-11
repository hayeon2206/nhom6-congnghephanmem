import { useEffect, useState } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

/**
 * Shows `from`, then — once, after `delay` — flips like a split-flap sign
 * into `to`, which stays lit with a slow gold shimmer. The text swap
 * happens at the flip's midpoint (rotated edge-on to the viewer) so the
 * change itself is hidden inside the motion. Under reduced motion, skips
 * straight to the settled `to` state with no rotation.
 */
export default function FlipWord({ from, to, delay = 0, className }) {
  const reducedMotion = usePrefersReducedMotion();
  const [word, setWord] = useState(reducedMotion ? to : from);
  const [flipping, setFlipping] = useState(false);
  const [settled, setSettled] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const startFlip = setTimeout(() => setFlipping(true), delay);
    return () => clearTimeout(startFlip);
  }, [delay, reducedMotion]);

  useEffect(() => {
    if (!flipping) return undefined;
    const swapText = setTimeout(() => setWord(to), 260);
    const finish = setTimeout(() => setSettled(true), 520);
    return () => {
      clearTimeout(swapText);
      clearTimeout(finish);
    };
  }, [flipping, to]);

  return (
    <span className={`flip-word-stage ${className ?? ''}`}>
      <span className={`flip-word ${flipping ? 'flip-word-flipping' : ''} ${settled ? 'flip-word-shine' : ''}`}>{word}</span>
    </span>
  );
}
