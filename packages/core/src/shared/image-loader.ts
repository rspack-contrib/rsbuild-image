import { joinURL, parseURL, stringifyParsedURL } from 'ufo';
import { DEFAULT_IPX_BASENAME } from './constants';
import type { ImageLoader, ImageLoaderArgs } from './types/image';

export interface ApplyLoaderOptions extends ImageLoaderArgs {
  loader: ImageLoader;
}

export function applyImageLoader(options: ApplyLoaderOptions): string {
  const { loader, src, quality, width } = options;
  const url = loader({ src, quality, width });
  return url;
}

let ipxImageLoaderBasename = DEFAULT_IPX_BASENAME;
if (typeof __INTERNAL_RSBUILD_IMAGE_BASENAME__ === 'string') {
  ipxImageLoaderBasename = __INTERNAL_RSBUILD_IMAGE_BASENAME__;
}

export const ipxImageLoader: ImageLoader = ({ src, width, quality }) => {
  const params: Record<string, string> = {
    f: 'auto',
    w: width.toString(),
    q: quality.toString(),
  };
  const paramsStr = Object.entries(params)
    .map(([k, v]) => `${k}_${v}`)
    .join(',');
  const parsedSrc = parseURL(src);
  parsedSrc.pathname = joinURL(
    ipxImageLoaderBasename,
    paramsStr,
    parsedSrc.pathname,
  );
  return stringifyParsedURL(parsedSrc);
};

export default ipxImageLoader;
