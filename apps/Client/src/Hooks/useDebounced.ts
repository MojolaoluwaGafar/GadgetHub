import { useEffect, useState } from "react";

// The value, once it has stopped changing for `ms`. Search boxes use it so
// each keystroke doesn't send a request.
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
