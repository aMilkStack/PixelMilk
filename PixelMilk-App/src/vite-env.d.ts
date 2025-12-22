/// <reference types="vite/client" />

// Type definitions for Vite's import.meta extensions
interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob: <T = unknown>(
    pattern: string,
    options?: {
      query?: string;
      import?: string;
      eager?: boolean;
    }
  ) => Record<string, T>;
}
