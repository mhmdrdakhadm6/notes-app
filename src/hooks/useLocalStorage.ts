import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((prev: T) => T);

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item != null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: SetValue<T>) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readValue(key, initialValue),
  );

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        setStoredValue((prev) => {
          const next = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
            window.dispatchEvent(
              new CustomEvent('local-storage', { detail: { key } }),
            );
          }
          return next;
        });
      } catch (error) {
        console.warn(`useLocalStorage setItem failed for key "${key}"`, error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.dispatchEvent(
          new CustomEvent('local-storage', { detail: { key } }),
        );
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`useLocalStorage removeItem failed for key "${key}"`, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(readValue(key, initialValue));
  }, [key]); // initialValue عمداً در deps نیست — مثل useState

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        setStoredValue(readValue(key, initialValue));
      }
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key === key) {
        setStoredValue(readValue(key, initialValue));
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('local-storage', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('local-storage', onCustom);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
