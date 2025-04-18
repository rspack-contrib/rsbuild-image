import { assert } from '@sindresorhus/is';
import type { ImageModule } from './types/image';

const _imgModStore = new Map<string, ImageModule>();

export function UNSAFE_setStoredImageModule(image: ImageModule) {
  assert.plainObject(image);
  assert.string(image.url);
  assert.number(image.width);
  assert.number(image.height);
  _imgModStore.set(image.url, image);
}

export function UNSAFE_getStoredImageModule(url: string) {
  assert.string(url);
  return _imgModStore.get(url) ?? null;
}
