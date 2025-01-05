import { useState, useEffect } from 'react';

export function useUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
): [T, (value: T) => void] {
  // Initialize state from URL or default value
  const [state, setState] = useState<T>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(key);
    if (urlValue) {
      try {
        return deserialize(urlValue);
      } catch (e) {
        console.error(`Failed to parse URL state for ${key}:`, e);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (state === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, serialize(state));
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [state, key, defaultValue, serialize]);

  return [state, setState];
}
