import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';
import { createDefines } from './define.config';

export default defineConfig({
  source: {
    entry: { index: ['./src/**', '!**/*.stories.*', '!**/*.test.*'] },
    tsconfigPath: './tsconfig.build.json',
    define: { ...createDefines() },
  },
  output: {
    target: 'web',
    distPath: { root: 'dist' },
    copy: [{ context: 'src', from: 'env.d.ts' }],
  },
  lib: [
    { format: 'esm', bundle: false, dts: true },
    { format: 'cjs', bundle: false },
  ],
  plugins: [pluginReact(), pluginPublint()],
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
