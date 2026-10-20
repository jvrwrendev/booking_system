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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`PSGC API error ${res.status} for ${url}`);
  }
  const data = (await res.json()) as T;
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export async function fetchRegions(): Promise<PSGCRegion[]> {
  return fetchJson<PSGCRegion[]>(`${BASE}/regions`);
}

export async function fetchProvinces(regionCode: string): Promise<PSGCProvince[]> {
  return fetchJson<PSGCProvince[]>(`${BASE}/regions/${regionCode}/provinces`);
}

export async function fetchCitiesInRegion(regionCode: string): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(`${BASE}/regions/${regionCode}/cities`);
}

export async function fetchCities(provinceCode: string): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(`${BASE}/provinces/${provinceCode}/cities`);
}

export async function fetchMunicipalities(provinceCode: string): Promise<PSGCCityOrMunicipality[]> {
  return fetchJson<PSGCCityOrMunicipality[]>(`${BASE}/provinces/${provinceCode}/municipalities`);
}

export async function fetchBarangays(cityOrMunCode: string): Promise<PSGCBarangay[]> {
  try {
    return await fetchJson<PSGCBarangay[]>(`${BASE}/cities/${cityOrMunCode}/barangays`);
  } catch {
    return await fetchJson<PSGCBarangay[]>(`${BASE}/municipalities/${cityOrMunCode}/barangays`);
  }
}

export const psgcCache = {
  clear: () => cache.clear(),
  size: () => cache.size,
};
