import path from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { createDefines } from './define.config';

const __INTERNAL_RSBUILD_IMAGE_LOADER__ = path.resolve(
  import.meta.dirname,
  './src/runtime/image/loader',
);

export default defineConfig({
  source: {
    entry: { index: ['./src/**', '!**/*.stories.*', '!**/*.test.*'] },
    tsconfigPath: './tsconfig.build.json',
    define: { ...createDefines() },
  },
  resolve: {
    alias: { __INTERNAL_RSBUILD_IMAGE_LOADER__ },
  },
  output: {
    target: 'web',
    distPath: { root: 'dist' },
  },
  lib: [
    { format: 'esm', bundle: false, dts: true },
    { format: 'cjs', bundle: false },
  ],
  plugins: [pluginReact()],
  tools: {
    rspack(config) {
      config.module ||= {};
      config.module.rules ||= [];
      config.module.rules.push({
        resourceQuery: /\?image$/,
        use: [{ loader: require.resolve('./tests/fixtures/loader.cjs') }],
        type: 'javascript/auto',
      });
    },
  },
});
