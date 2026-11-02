export interface PSGCRegion {
  code: string;
  name: string;
}

export interface PSGCProvince {
  code: string;
  name: string;
}

export interface PSGCCityOrMunicipality {
  code: string;
  name: string;
  type?: string;
}

export interface PSGCBarangay {
  code: string;
  name: string;
}

const BASE = "https://psgc.cloud/api";

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60;

async function fetchJson<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PSGC API error ${response.status} for ${url}`);
  }

  const data = (await response.json()) as T;
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export async function fetchRegions(): Promise<PSGCRegion[]> {
  return fetchJson<PSGCRegion[]>(`${BASE}/regions`);
}

export async function fetchProvinces(
  regionCode: string,
): Promise<PSGCProvince[]> {
  return fetchJson<PSGCProvince[]>(
    `${BASE}/regions/${regionCode}/provinces`,
  );
}

export async function fetchCitiesInRegion(
  regionCode: string,
): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(
    `${BASE}/regions/${regionCode}/cities`,
  );
}

export async function fetchCities(
  provinceCode: string,
): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(
    `${BASE}/provinces/${provinceCode}/cities`,
  );
}

export async function fetchMunicipalities(
  provinceCode: string,
): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(
    `${BASE}/provinces/${provinceCode}/municipalities`,
  );
}

export async function fetchBarangays(
  cityOrMunicipalityCode: string,
): Promise<PSGCBarangay[]> {
  try {
    return await fetchJson<PSGCBarangay[]>(
      `${BASE}/cities/${cityOrMunicipalityCode}/barangays`,
    );
  } catch {
    return await fetchJson<PSGCBarangay[]>(
      `${BASE}/municipalities/${cityOrMunicipalityCode}/barangays`,
    );
  }
}

export const MINDANAO_REGION_CODES = new Set([
  "0900000000",
  "1000000000",
  "1100000000",
  "1200000000",
  "1600000000",
  "1900000000",
]);

export function isMindanaoRegion(
  region: { code?: string; name?: string },
): boolean {
  const code = region.code?.trim();
  if (code) return MINDANAO_REGION_CODES.has(code);

  const name = region.name?.toLowerCase() ?? "";
  return [
    "mindanao",
    "zamboanga peninsula",
    "davao region",
    "soccsksargen",
    "caraga",
    "bangsamoro",
    "barrm",
  ].some((hint) => name.includes(hint));
}
