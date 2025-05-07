import assert from 'node:assert';
import type { Rspack } from '@rsbuild/core';
import { genObjectFromRaw, genObjectFromValues, genString } from 'knitwork';
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
  const url = await this.importModule(assetRequest, { publicPath: '' });
  logger.debug(`Loaded asset resource module: ${url}`);
  assert(typeof url === 'string', 'Expected image source to be a string');

  const image = await Image.create(content);
  const { width, height } = image.size();
  let thumbnail: ImageResource | undefined;

  // Create the blurred thumbnail from the original image.
  if (opts.thumbnail !== false) {
    const scale = THUMBNAIL_SIZE / Math.max(width, height);
    thumbnail = {
      url: '',
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
    logger.debug(`Creating thumbnail: ${thumbnail.width}x${thumbnail.height}`);
    image.resize(thumbnail);

    const buf = await image.toBuffer();
    thumbnail.url = `data:image/jpeg;base64,${buf.toString('base64')}`;
    logger.debug(`Created thumbnail: ${thumbnail.url}`);
  }

  const imageModuleTempl = genObjectFromRaw({
    url: `__webpack_public_path__ + ${genString(url)}`,
    width: width,
    height: height,
    publicPath: '__webpack_public_path__',
    thumbnail: thumbnail && genObjectFromValues(thumbnail, '  '),
  });
  const exportStmtTempl = `export default ${imageModuleTempl};`;
  logger.debug('Output image module template:', exportStmtTempl);

  return exportStmtTempl;
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
