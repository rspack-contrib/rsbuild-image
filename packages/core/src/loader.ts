import assert from 'node:assert';
import type { Rspack } from '@rsbuild/core';
import { Image } from './image';
import { logger } from './logger';
import type { ImageModule, ImageResource } from './shared';
import { PACKAGE_NAME } from './shared/constants';

const THUMBNAIL_SIZE = 8;

export interface LoaderOptions {
  /**
   * Whether to generate the thumbnail image from the original image.
   *
   * Will be exported as a optional field of an {@link ImageModule}
   * for rendering placeholder at runtime.
   */
  thumbnail?: boolean;
}

async function process(
  this: Rspack.LoaderContext<LoaderOptions>,
  content: Buffer,
) {
  const opts = this.getOptions();

  const assetRequest = `${this.resource}.webpack[asset/resource]!=!${this.resource}`;
  const src = await this.importModule(assetRequest);
  logger.debug(`Loaded asset resource module: ${src}`);
  assert(typeof src === 'string', 'Expected image source to be a string');

  const image = await Image.create(content);
  const { width, height } = image.size();
  const data: ImageModule = { url: src, width, height };

  // Create the blurred thumbnail from the original image.
  if (opts.thumbnail !== false) {
    const scale = THUMBNAIL_SIZE / Math.max(width, height);
    const thumbnail: ImageResource = {
      url: '',
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
    logger.debug(`Creating thumbnail: ${thumbnail.width}x${thumbnail.height}`);
    image.resize(thumbnail);

    const buf = await image.toBuffer();
    thumbnail.url = `data:image/jpeg;base64,${buf.toString('base64')}`;
    data.thumbnail = thumbnail;
    logger.debug(`Created thumbnail: ${thumbnail.url}`);
  }

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
