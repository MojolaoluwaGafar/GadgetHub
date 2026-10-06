import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../../utils/apiError";

type MutationFn<TReq, TRes> = (payload: TReq) => Promise<TRes>;

// Wraps a create/update/delete call with loading and error state. `mutate`
// rethrows, so callers can catch to read field errors (utils/apiError.ts).
export function useApiMutation<TReq, TRes>(mutation: MutationFn<TReq, TRes>, defaultErrorMessage = "Request failed") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (payload: TReq): Promise<TRes> => {
      setLoading(true);
      setError(null);
      try {
        return await mutationRef.current(payload);
      } catch (err) {
        if (mountedRef.current) setError(apiErrorMessage(err, defaultErrorMessage));
        throw err;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [defaultErrorMessage]
  );

  return { mutate, loading, error };
}
