import assert from 'node:assert';
import type { Rspack } from '@rsbuild/core';
import { Image } from './image';
import { logger } from './logger';
import type { ImageModule, ImageResource } from './shared';
import { PACKAGE_NAME } from './shared/constants';

const BLUR_IMG_SIZE = 8;

async function process(this: Rspack.LoaderContext, content: Buffer) {
  const assetRequest = `${this.resource}.webpack[asset/resource]!=!${this.resource}`;
  const src = await this.importModule(assetRequest);
  logger.debug(`Loaded asset resource module: ${src}`);
  assert(typeof src === 'string', 'Expected image source to be a string');

  const image = await Image.create(content);
  const { width, height } = image.size();

  // Create the blurred thumbnail from the original image.
  const scale = BLUR_IMG_SIZE / Math.max(width, height);
  const thumbnail: ImageResource = {
    url: '',
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
  logger.debug(`Creating thumbnail: ${thumbnail.width}x${thumbnail.height}`);
  image.resize(thumbnail);

  const buf = await image.toBuffer();
  thumbnail.url = `data:image/jpeg;base64,${buf.toString('base64')}`;
  logger.debug(`Created thumbnail: ${thumbnail.url}`);

  const data: ImageModule = { url: src, width, height, thumbnail };
  return `export default ${JSON.stringify(data)}`;
}

export default function loader(this: Rspack.LoaderContext, content: Buffer) {
  const callback = this.async();
  logger.debug(`${PACKAGE_NAME} loader is processing: ${this.request}`);

  process
    .call(this, content)
    .then((content) => callback(null, content))
    .catch((err) => callback(err));
}

export const raw = true;
