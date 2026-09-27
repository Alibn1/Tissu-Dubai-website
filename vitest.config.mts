import {defineConfig} from 'vitest/config';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Next exposes these as extensionless subpaths ("next/navigation"), which the
 * app bundler resolves but plain Node ESM does not. Libraries such as
 * next-intl import them that way, so a test that renders a real page fails to
 * resolve the module before it reaches any assertion.
 */
const nextSubpaths = ['navigation', 'link', 'image', 'script', 'head', 'headers', 'server'];

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        // Processed by Vite rather than left to Node, so the next/* aliases
        // above apply to the "next/navigation" import inside next-intl.
        inline: ['next-intl']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      ...Object.fromEntries(
        nextSubpaths.map((name) => [
          `next/${name}`,
          path.resolve(__dirname, 'node_modules', 'next', `${name}.js`)
        ])
      )
    }
  }
});
