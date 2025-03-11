import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  minify: true,
  target: 'node18',
  noExternal: ['commander', 'ink', 'react', '@inkjs/ui', 'ink-spinner', 'ink-select-input'],
  external: ['react-devtools-core'],
  banner: {
    js: 'import { createRequire } from "module";const require = createRequire(import.meta.url);',
  },
}); 