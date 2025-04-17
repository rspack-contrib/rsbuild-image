import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export const SHARED_STORE = path.resolve(DIRNAME, './shared/store');

export const LOADER = path.resolve(DIRNAME, './loader');

export const IMAGE_LOADER = path.resolve(DIRNAME, './shared/image-loader');
