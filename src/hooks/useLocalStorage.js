import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State that survives a page reload.
 *
 * Reads are lazy and defensive: a corrupted or unavailable storage entry
 * falls back to the initial value instead of crashing the app (private
 * browsing modes can throw on access).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue));
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked - state still works for this session */
    }
  }, [key, value]);

  /** Keep multiple tabs in sync. */
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== keyRef.current || event.newValue == null) return;
      try {
        setValue(JSON.parse(event.newValue));
      } catch {
        /* ignore malformed payloads from other tabs */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return [value, setValue, reset];
}

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export default useLocalStorage;
