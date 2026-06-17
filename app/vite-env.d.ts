/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** DEV-only: selects which identity the local Sites SDK mock returns. */
  readonly VITE_DEV_IDENTITY?: "authenticated" | "guest" | "sdk-unavailable";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
