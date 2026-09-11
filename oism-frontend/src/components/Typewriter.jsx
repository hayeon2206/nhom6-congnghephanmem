import { useEffect, useRef, useState } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

/**
 * Reveals `text` one character at a time, like it's being typed. Character
 * width varies too much across a proportional serif face (and Vietnamese
 * combining diacritics) for a CSS steps()-on-width trick to look right, so
 * this drives the reveal from state instead. `startDelay` lets a parent
 * sequence several of these one after another; `onDone` fires once so the
 * next line can start typing only after this one finishes.
 *
 * The global reduced-motion CSS rule only shortens CSS animations, so a
 * JS-timer effect like this one checks the preference itself and renders
 * the finished text immediately instead of stepping through it.
 */
export default function Typewriter({ text, speed = 32, startDelay = 0, onDone, showCaret = true, as: Tag = 'span', style, className }) {
  const reducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(reducedMotion ? text.length : 0);
  const [started, setStarted] = useState(reducedMotion);
  const firedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || started) return undefined;
    const startTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(startTimer);
  }, [startDelay, reducedMotion, started]);

  useEffect(() => {
    if (reducedMotion || !started || count >= text.length) return undefined;
    const stepTimer = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(stepTimer);
  }, [started, count, text.length, speed, reducedMotion]);

  const done = count >= text.length;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <Tag className={className} style={style}>
      {text.slice(0, count)}
      {showCaret && !done && <span className="typewriter-caret" aria-hidden="true" />}
    </Tag>
  );
}
