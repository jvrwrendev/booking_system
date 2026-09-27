/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the satellite raster tile URL template. */
  readonly VITE_SATELLITE_TILE_URL?: string;
  /** Override the street raster tile URL template. */
  readonly VITE_STREET_TILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
