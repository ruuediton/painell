/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_ADMIN_PASSWORD?: string
    readonly VITE_2FA_SECRET?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
