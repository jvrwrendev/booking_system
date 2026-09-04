import { useEffect, useState } from "react";

export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, unknown>();

export function useAsync<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncResource<T> {
  const cached = cache.get(key) as T | undefined;
  const [state, setState] = useState<AsyncResource<T>>({
    data: cached ?? null,
    loading: !cached,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (cache.has(key)) {
      setState({ data: cache.get(key) as T, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (cancelled) return;
        cache.set(key, data);
        setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function clearAsyncCache() {
  cache.clear();
}
