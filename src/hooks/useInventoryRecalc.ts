import { useEffect, useRef } from 'react';

export function useInventoryRecalc(productId?: string) {
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const res = await fetch('/api/settings/inventory-recalc', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        const intervalMs = typeof json?.intervalMs === 'number' ? json.intervalMs : 30000;

        if (!productId) return;

        const tick = async () => {
          try {
            await fetch('/api/admin/inventory/recalculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId })
            });
          } catch {}
        };

        // Fire immediately once, then on interval
        await tick();
        if (!cancelled) {
          timerRef.current = setInterval(tick, intervalMs);
        }
      } catch {
        // fallback to 30s if settings route fails
        if (!productId) return;
        const tick = async () => {
          try {
            await fetch('/api/admin/inventory/recalculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId })
            });
          } catch {}
        };
        await tick();
        if (!cancelled) timerRef.current = setInterval(tick, 30000);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [productId]);
}
