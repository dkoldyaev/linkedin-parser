
import { useState, useEffect } from 'react';

export interface TypewriterTextProps {
  text: string;
  active: boolean;
  completed: boolean;
  speed?: number;
  className?: string;
}

function resolveShownLength(
  textLength: number,
  charCount: number,
  active: boolean,
  completed: boolean
): number {
  if (completed) return textLength;
  if (active) return charCount;
  return 0;
}

export default function TypewriterText({
  text,
  active,
  completed,
  speed = 12,
  className = '',
}: TypewriterTextProps) {
  const [charCount, setCharCount] = useState(completed ? text.length : 0);

  useEffect(() => {
    if (completed) {
      const doneTimer = setTimeout(() => setCharCount(text.length), 0);
      return () => clearTimeout(doneTimer);
    }
    if (!active) {
      const resetTimer = setTimeout(() => setCharCount(0), 0);
      return () => clearTimeout(resetTimer);
    }

    const startTimer = setTimeout(() => {
      setCharCount(Math.min(text.length, 6));
    }, 0);

    const timer = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= text.length) {
          clearInterval(timer);
          return text.length;
        }
        return Math.min(text.length, prev + 2);
      });
    }, speed);

    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
    };
  }, [active, completed, text, speed]);

  const shown = resolveShownLength(text.length, charCount, active, completed);
  const isTyping = active && shown < text.length;

  return (
    <span className={`tw-root ${className}`}>
      <span className="tw-visible">{text.slice(0, shown)}</span>
      {isTyping && <span className="tw-cursor" aria-hidden="true">▋</span>}
      <span className="tw-ghost" aria-hidden="true">{text.slice(shown)}</span>
    </span>
  );
}
