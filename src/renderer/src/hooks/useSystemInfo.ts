// ──────────────────────────────────────────────────────────
// useSystemInfo — polls system data at regular intervals
// ──────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app.store';

/** Clock interval (1 second) */
const CLOCK_INTERVAL_MS = 1_000;

/** Region/timezone poll interval (30 seconds) */
const SYSTEM_POLL_INTERVAL_MS = 30_000;

/**
 * Starts polling system info:
 *  - DateTime every 1 second (live clock)
 *  - Region/TZ/Admin every 30 seconds
 *
 * Runs one full refresh on mount.
 */
export function useSystemInfo(): void {
  const refreshSystemInfo = useAppStore((s) => s.refreshSystemInfo);
  const refreshDateTime = useAppStore((s) => s.refreshDateTime);
  const setInitialLoadDone = useAppStore((s) => s.setInitialLoadDone);
  const initialLoadDone = useAppStore((s) => s.initialLoadDone);

  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const systemTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initial full load
    if (!initialLoadDone) {
      refreshSystemInfo().then(() => {
        setInitialLoadDone();
      });
    }

    // Clock poll — every 1 second
    clockTimerRef.current = setInterval(() => {
      refreshDateTime();
    }, CLOCK_INTERVAL_MS);

    // System poll — every 30 seconds
    systemTimerRef.current = setInterval(() => {
      refreshSystemInfo();
    }, SYSTEM_POLL_INTERVAL_MS);

    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
      if (systemTimerRef.current) clearInterval(systemTimerRef.current);
    };
  }, [refreshSystemInfo, refreshDateTime, setInitialLoadDone, initialLoadDone]);
}
