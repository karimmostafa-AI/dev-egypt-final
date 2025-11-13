import { useEffect, useRef } from 'react';

export function useVisibleInventoryRecalc(ref: React.RefObject<HTMLElement>, productId?: string) {
  const lastRunRef = useRef<number>(0);
  const hoverListenerRef = useRef<() => void>();

  useEffect(() => {
    if (!ref?.current || !productId) return;

    const cooldownMs = 30000;

    const maybeRun = async () => {
      const now = Date.now();
      if (now - lastRunRef.current < cooldownMs) return;
      lastRunRef.current = now;
      try {
        await fetch('/api/admin/inventory/recalculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
      } catch {}
    };

    // Intersection observer triggers recalculation when card is visible
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          void maybeRun();
        }
      }
    }, { threshold: 0.1 });

    observer.observe(ref.current);

    // Hover triggers recalculation
    const onEnter = () => { void maybeRun(); };
    ref.current.addEventListener('mouseenter', onEnter);
    hoverListenerRef.current = () => ref.current?.removeEventListener('mouseenter', onEnter);

    return () => {
      observer.disconnect();
      hoverListenerRef.current?.();
    };
  }, [ref, productId]);
}
