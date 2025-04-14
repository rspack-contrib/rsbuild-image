import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'tests/*/vitest.config.{e2e,unit}.ts',
]);
