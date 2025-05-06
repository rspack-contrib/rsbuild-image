import type { ImageModule, ImageOptions, ImageResource } from '@/types/image';
import { ipxImageLoader } from '@rsbuild-image/core/shared';
import { createDebug } from './utils';

const debug = createDebug('rsbuild:image:options');

function toFixedNumber(num: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

export function resolveImageOptions(options: ImageOptions) {
  let { unoptimized = false } = options;

  let src: string;
  let { width, height } = options;
  let thumbnail: ImageResource | undefined;

  let mod: ImageModule | undefined;
  if (typeof options.src === 'string') {
    src = options.src;
  } else {
    src = options.src.url;
    mod = options.src;
  }
  if (mod) {
    const aspectRatio = mod.width / mod.height;
    src = mod.url;
    thumbnail = mod.thumbnail;
    if (width !== undefined && height !== undefined) {
      // do nothing
    } else if (width !== undefined) {
      height = toFixedNumber(width / aspectRatio, 3);
    } else if (height !== undefined) {
      width = toFixedNumber(height * aspectRatio, 3);
    } else {
      ({ height, width } = mod);
    }
  }

  for (const [key, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (value === undefined) continue;
    if (typeof value !== 'number') {
      throw new Error(
        `<Image src="${src}" /> must have "${key}" prop as a number, but got: ${value}`,
      );
    }
    if (!Number.isFinite(value)) {
      throw new Error(
        `<Image src="${src}" /> must have ${key} prop as a number, but got: ${value}`,
      );
    }
    if (value < 0) {
      throw new Error(
        `<Image src="${src}" /> must have ${key} prop as a positive number, but got: ${value}`,
      );
    }
  }

  if (typeof src !== 'string') {
    unoptimized = true;
  } else if (src.startsWith('data:') || src.startsWith('blob:')) {
    unoptimized = true;
  } else if (src.split('?', 1)[0].endsWith('.svg')) {
    unoptimized = true;
  }

  const resolved = {
    densities: [1, 2],
    loader: ipxImageLoader,
    placeholder: false,
    quality: 75,
    ...options,
    src,
    height,
    width,
    unoptimized,
    thumbnail,
  } satisfies ImageOptions & Record<string, unknown>;
  debug('resolveImageOptions:', resolved);
  return resolved;
}

export interface ResolvedImageOptions
  extends ReturnType<typeof resolveImageOptions> {}
