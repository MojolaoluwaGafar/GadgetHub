/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The API's address, e.g. https://gadgethub-server.onrender.com. Empty in development. */
  readonly VITE_BASE_URL?: string;
  /** The first version's setting: the auth routes' address (…/api/user/auth). */
  readonly VITE_AUTH_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
