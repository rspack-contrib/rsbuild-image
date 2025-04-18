import type { ImageModule, ImageOptions, ImageResource } from '@/types/image';
import { ipxImageLoader } from '@rsbuild-image/core/shared';

function toFixedNumber(num: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

export function resolveImageOptions(options: ImageOptions) {
  let { unoptimized = false } = options;

  let src: string;
  let { width, height } = options;
  let thumbnail: ImageResource | undefined;
  let aspectRatio: number | undefined;

  let mod: ImageModule | undefined;
  if (typeof options.src === 'string') {
    src = options.src;
  } else {
    src = options.src.url;
    mod = options.src;
  }
  if (mod) {
    src = mod.url;
    aspectRatio = mod.width / mod.height;
    thumbnail = mod.thumbnail;
  }

  if (aspectRatio !== undefined) {
    if (width !== undefined && height === undefined) {
      height = toFixedNumber(width / aspectRatio, 3);
    } else if (height !== undefined && width === undefined) {
      width = toFixedNumber(height * aspectRatio, 3);
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

  if (
    typeof src !== 'string' ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.split('?', 1)[0].endsWith('.svg')
  ) {
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
  return resolved;
}

export interface ResolvedImageOptions
  extends ReturnType<typeof resolveImageOptions> {}
