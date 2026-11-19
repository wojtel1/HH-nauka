"use client";

import { useEffect, useRef } from "react";

type UseAutoLockOptions = {
  enabled: boolean;
  idleTimeoutMs: number;
  lockOnHidden?: boolean;
  onLock: () => void;
};

export function useAutoLock({
  enabled,
  idleTimeoutMs,
  lockOnHidden = true,
  onLock,
}: UseAutoLockOptions) {
  const onLockRef = useRef(onLock);

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    if (!enabled || idleTimeoutMs <= 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const armTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => onLockRef.current(), idleTimeoutMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && lockOnHidden) {
        onLockRef.current();
        return;
      }
      armTimeout();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "keydown",
      "pointerdown",
      "touchstart",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, armTimeout, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibility);
    armTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, armTimeout),
      );
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, idleTimeoutMs, lockOnHidden]);
}
