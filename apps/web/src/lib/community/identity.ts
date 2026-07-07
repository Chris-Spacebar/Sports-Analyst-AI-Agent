"use client";

import { useEffect, useState } from "react";

const ID_KEY = "saa:community:id";
const HANDLE_KEY = "saa:community:handle";

/**
 * Pseudonymous identity: a random device id plus a claimed handle, both in
 * localStorage. No passwords. Writes carry the device id as authorId.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getHandle(): string | null {
  return localStorage.getItem(HANDLE_KEY);
}

export function setHandle(h: string): void {
  localStorage.setItem(HANDLE_KEY, h);
}

export function useIdentity(): {
  deviceId: string;
  handle: string | null;
  ready: boolean;
  claim: (h: string) => void;
} {
  // ready stays false until mounted: localStorage is unavailable during SSR, so
  // reading it in render would desync server and client markup on hydration.
  const [deviceId, setDeviceId] = useState("");
  const [handle, setHandleState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setHandleState(getHandle());
    setReady(true);
  }, []);

  const claim = (h: string) => {
    setHandle(h);
    setHandleState(h);
  };

  return { deviceId, handle, ready, claim };
}
