/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the satellite raster tile URL template. */
  readonly VITE_SATELLITE_TILE_URL?: string;
  /** Override the street raster tile URL template. */
  readonly VITE_STREET_TILE_URL?: string;
  /**
   * Absolute API base, e.g. "http://localhost:4000/api/v1". Only needed when
   * you are not using the dev proxy defined in `vite.config.ts`.
   */
  readonly VITE_API_BASE_URL?: string;
  /**
   * Email of the seeded admin, shown as a login hint in development.
   * Never put a password here — it would be bundled into the client build.
   */
  readonly VITE_DEV_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
