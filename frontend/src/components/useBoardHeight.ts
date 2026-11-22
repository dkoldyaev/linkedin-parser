import { useState, useLayoutEffect } from 'react';
import type React from 'react';

export function useBoardHeight(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  rejectedRef: React.RefObject<HTMLDivElement | null>
): number | null {
  const [boardHeight, setBoardHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const rejected = rejectedRef.current;
    if (!wrapper || !rejected) return undefined;

    const update = () => {
      const available = wrapper.clientHeight - rejected.offsetHeight;
      const height = Math.max(32, Math.floor(available / 32) * 32);
      setBoardHeight((previous) => (previous === height ? previous : height));
    };

    const observer = new ResizeObserver(update);
    observer.observe(wrapper);
    observer.observe(rejected);
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [wrapperRef, rejectedRef]);

  return boardHeight;
}
