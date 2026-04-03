import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  // sharp and archiver are optional peer deps — never bundle them.
  // Dynamic import('sharp') / import('archiver') will resolve from the consumer's node_modules.
  external: ['sharp', 'archiver'],
});
