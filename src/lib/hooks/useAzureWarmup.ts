// src/hooks/useAzureWarmup.ts
import { useEffect } from 'react';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Periodically pings a lightweight endpoint (e.g. /api/settings) to keep
 * an Azure Functions Consumption plan instance warm.
 *
 * Enabled/configured via VITE_AZURE_WARMUP (minutes between pings).
 * If the env var is unset, empty, or <= 0, this is a no-op.
 */
export function useAzureWarmup(endpoint: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  useEffect(() => {
    const raw = import.meta.env.VITE_AZURE_WARMUP;
    const minutes = Number(raw);

    if (!raw || Number.isNaN(minutes) || minutes <= 0) {
      return; // Warmup disabled
    }

    const intervalMs = minutes * 60 * 1000;
    let cancelled = false;

    const ping = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        await fetch(endpoint, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (import.meta.env.DEV && !cancelled) {
          console.debug(`[warmup] Pinged ${endpoint} at ${new Date().toLocaleTimeString()}`);
        }
      } catch (err) {
        // Swallow errors — this is a background keep-alive, not user-facing
        if (import.meta.env.DEV && !cancelled) {
          console.warn('[warmup] Ping failed', err);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    ping(); // warm immediately on app load
    const intervalId = setInterval(ping, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [endpoint, timeoutMs]);
}