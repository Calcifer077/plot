"use client";

import { useEffect, useState } from "react";

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : initialValue;
  } catch (err) {
    console.error(`Error reading localStorage key "${key}":`, err);
    return initialValue;
  }
}

function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer runs once, synchronously, before first paint.
  const [value, setValue] = useState<T>(() => readValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error writing localStorage key "${key}":`, err);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export default useLocalStorage;
