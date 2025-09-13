/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { UUIDv4 } from './src/utils/helperFunctions.ts';
import fs from 'fs';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesiumStatic';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDevHTTPSEnabled =
    typeof env.HTTPS_CERT === 'string' && typeof env.HTTPS_KEY === 'string';
  return {
    server: isDevHTTPSEnabled
      ? {
          https: {
            key: fs.readFileSync(env.HTTPS_KEY),
            cert: fs.readFileSync(env.HTTPS_CERT),
          },
        }
      : undefined,
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{js,ts}'],
      setupFiles: './src/testing/setup.ts',
      coverage: {
        reporter: ['text', 'html'],
        exclude: [
          ...configDefaults.exclude,
          'bin',
          'dist',
          'src/shared/styles',
          'src/types',
          '/**/*.d.ts',
        ],
        clean: true,
        cleanOnRerun: false,
        thresholds: {
          lines: 80,
          functions: 75,
          branches: 70,
          statements: 80,
        },
      },
    },
    plugins: [
      viteStaticCopy({
        targets: [
          { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
        ],
      }),
      {
        name: 'csp',
        transformIndexHtml(html) {
          const NONCE = UUIDv4();
          const csp = `object-src 'none'; media-src 'none'; base-uri 'none';`;
          html = html.replace(/<style>/g, `<style nonce="${NONCE}">`);
          html = html.replace(
            /<script\s+/g,
            `<script nonce="${NONCE}" type="module"`
          );
          html = html.replace(
            /<link\s+rel="stylesheet"/g,
            `<link rel="stylesheet" nonce="${NONCE}"`
          );
          html = html.replace(
            /<head>/,
            `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`
          );
          return html;
        },
      },
    ],
    define: {
      CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
    },
    build: {
      outDir: 'dist/browser',
      rollupOptions: {
        output: {
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(png|jpe?g|gif|svg)$/.test(name ?? '')) {
              return 'assets/[name].[hash].[ext]';
            }
            if (/\.css$/.test(name ?? '')) {
              return '[name].[hash].[ext]';
            }
            return '[name].[hash].[ext]';
          },
        },
      },
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        format: {
          comments: false,
        },
        parse: {
          html5_comments: false,
        },
        sourceMap: false,
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  };
});
