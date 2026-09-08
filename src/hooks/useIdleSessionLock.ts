"use client";

import { useEffect, useRef } from "react";

import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session-config";

export { SESSION_IDLE_TIMEOUT_MS };

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

interface UseIdleSessionLockOptions {
  enabled: boolean;
  onIdle: () => void | Promise<void>;
  onActivity?: () => void | Promise<void>;
  timeoutMs?: number;
  heartbeatIntervalMs?: number;
}

export function useIdleSessionLock({
  enabled,
  onIdle,
  onActivity,
  timeoutMs = SESSION_IDLE_TIMEOUT_MS,
  heartbeatIntervalMs = 60 * 1000,
}: UseIdleSessionLockOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(0);
  const onIdleRef = useRef(onIdle);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const lockSession = () => {
      void onIdleRef.current();
    };

    const maybeHeartbeat = () => {
      if (!onActivityRef.current) {
        return;
      }

      const now = Date.now();

      if (now - lastHeartbeatRef.current < heartbeatIntervalMs) {
        return;
      }

      lastHeartbeatRef.current = now;
      void onActivityRef.current();
    };

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      maybeHeartbeat();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(lockSession, timeoutMs);
    };

    const handleActivity = () => {
      resetTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;

      if (idleMs >= timeoutMs) {
        lockSession();
        return;
      }

      resetTimer();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, timeoutMs, heartbeatIntervalMs]);
}
