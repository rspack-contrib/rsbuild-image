import { pluginImage } from '@rsbuild-image/core';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact(), pluginImage({ ipx: {} })],
});
