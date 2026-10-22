/// <reference types="vite/client" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.jfif' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_NEON_DATABASE_URL?: string;
  readonly VITE_NEON_PROJECT_ID?: string;
  readonly VITE_NEON_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
