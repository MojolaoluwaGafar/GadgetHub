import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../../utils/apiError";

interface UseApiQueryOptions {
  /** Set false to hold the request back (e.g. until an id is known). */
  enabled?: boolean;
}

// Loads data when the component mounts and again whenever a value in `deps`
// changes. `request` can be an inline arrow: only `deps` trigger a refetch.
// If a newer request starts before an older one finishes, the older result is
// ignored, so fast filter changes can't show stale data.
export function useApiQuery<TRes>(
  request: () => Promise<TRes>,
  deps: readonly unknown[],
  defaultErrorMessage = "Request failed",
  options?: UseApiQueryOptions
) {
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<TRes | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(request);
  requestRef.current = request;
  const latestRun = useRef(0);

  const refetch = useCallback(async (): Promise<TRes | null> => {
    const run = ++latestRun.current;
    setLoading(true);
    setError(null);
    try {
      const result = await requestRef.current();
      if (run === latestRun.current) setData(result);
      return result;
    } catch (err) {
      if (run === latestRun.current) setError(apiErrorMessage(err, defaultErrorMessage));
      return null;
    } finally {
      if (run === latestRun.current) setLoading(false);
    }
  }, [defaultErrorMessage]);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
    // Leaving the page (or changing deps) makes any in-flight result stale.
    return () => {
      latestRun.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetch, ...deps]);

  return { data, loading, error, refetch, setData };
}
