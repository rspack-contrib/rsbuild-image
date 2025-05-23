import { imageSize } from 'image-size';
// import type * as sharp from 'sharp';
import type {
  AvifOptions,
  FormatEnum,
  GifOptions,
  HeifOptions,
  Jp2Options,
  JpegOptions,
  JxlOptions,
  OutputOptions,
  PngOptions,
  ResizeOptions,
  Sharp,
  TiffOptions,
  WebpOptions,
} from 'sharp';
import { inspectBuffer } from './buffer';
import { isDebug, logger } from './logger';
import type { ImageSize } from './shared';

export type SharpModule = typeof import('sharp');

let _loadedSharp: typeof import('sharp') | undefined;
export const loadSharp = async () => {
  if (_loadedSharp) return _loadedSharp;
  logger.debug('Intend to load sharp package in first time');
  const mod = (await import('sharp')) as
    | typeof import('sharp')
    | { default: typeof import('sharp') };

  const ret = 'default' in mod ? mod.default : mod;

  if (isDebug()) {
    logger.debug(
      `Successfully loaded sharp(${typeof ret}) with keys: ${Object.keys(ret).join(', ')}`,
    );
  }
  _loadedSharp = ret;
  return ret;
};

/**
 * @param type - The type of the image.
 * @param orientation - The orientation of the image.
 *   1. Normal orientation
 *   2. Flipped horizontally
 *   3. Rotated 180 degrees
 *   4. Flipped vertically
 *   5. Rotated 90 degrees clockwise and flipped horizontally
 *   6. Rotated 90 degrees clockwise
 *   7. Rotated 90 degrees clockwise and flipped vertically
 *   8. Rotated 90 degrees counterclockwise
 * @returns Whether the image is rotated.
 */
export function isRotatedOrientation(type: string, orientation?: number) {
  if (!orientation) return false;
  if (!['jpeg', 'jpg'].includes(type))
    throw new Error('Unsupported image type');
  return [5, 6, 7, 8].includes(orientation);
}

export class Image {
  public _debugName?: string;

  private constructor(
    private buffer: Uint8Array,
    private sharp: Sharp,
  ) {}

  static async create(buf: Uint8Array) {
    if (isDebug()) {
      logger.debug(
        `Intend to create a new image instance with buffer: ${inspectBuffer(buf)}`,
      );
    }
    const sharp = await loadSharp();
    return new Image(buf, sharp(buf));
  }

  private _size?: ImageSize;

  size() {
    if (!this._size) {
      const { width, height } = imageSize(this.buffer);
      this._size = { width, height };
    }
    const { width, height } = this._size;
    return { width, height };
  }

  resize(options: ResizeOptions) {
    const { width, height } = options;
    this._size ||= { ...this.size() };
    if (width !== undefined) this._size.width = width;
    if (height !== undefined) this._size.height = height;
    return this.sharp.resize(options);
  }

  thumbnail(options: ResizeOptions) {
    // TODO: Implement the thumbnail method in the future
  }

  format(
    format: keyof FormatEnum,
    options?:
      | OutputOptions
      | JpegOptions
      | PngOptions
      | WebpOptions
      | AvifOptions
      | HeifOptions
      | JxlOptions
      | GifOptions
      | Jp2Options
      | TiffOptions,
  ) {
    this.sharp.toFormat(format, options);
    return this;
  }

  toBuffer() {
    return this.sharp.toBuffer();
  }

  clone() {
    return new Image(this.buffer, this.sharp.clone());
  }
}
