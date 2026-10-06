import { useEffect, useState } from "react";

// Nigeria's 36 states, the FCT, and each one's local government areas, from
// the same open dataset the first version used. Loaded once per visit; if it
// can't load, checkout falls back to typing the city.
const SOURCE = "https://temikeezy.github.io/nigeria-geojson-data/data/full.json";

export type StateLgas = Record<string, string[]>;

let cache: Promise<StateLgas> | null = null;

function load(): Promise<StateLgas> {
  cache ??= fetch(SOURCE)
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<{ state: string; lgas: { name: string }[] }[]>;
    })
    .then((rows) =>
      Object.fromEntries(
        rows
          .map((row) => [row.state, row.lgas.map((lga) => lga.name).sort((a, b) => a.localeCompare(b))] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    )
    .catch((error) => {
      cache = null;
      throw error;
    });
  return cache;
}

export function useNigeria() {
  const [data, setData] = useState<StateLgas | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    load()
      .then((result) => live && setData(result))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  return { data, failed };
}
