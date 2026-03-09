// Removed reference to vite/client to resolve type definition file not found error. 
// Manual declarations below handle essential Vite environmental types.

// Fix: Manual declarations to satisfy TS when vite/client is not found
interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}