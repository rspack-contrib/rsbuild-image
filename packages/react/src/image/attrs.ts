import { applyImageLoader } from '@rsbuild-image/core/shared';
import type { CSSProperties } from 'react';
import React from 'react';
import { getBlurImage } from './blur';
import type { ResolvedImageProps } from './props';
import { createDebug } from './utils';

const INVALID_BACKGROUND_SIZE_VALUES: CSSProperties['objectFit'][] = [
  '-moz-initial',
  'fill',
  'none',
  'scale-down',
  undefined,
];

const debug = createDebug('rsbuild:image:attrs');

/**
 * This implementation is based on code from [Next.js](https://github.com/vercel/next.js/blob/ed10f7ed0246fcc763194197eb9beebcbd063162/packages/next/src/shared/lib/get-img-props.ts#L649-L691)
 * which is licensed under the MIT License.
 *
 * @param props
 * @returns
 */
export function resolvePlaceholderStyle(
  props: ResolvedImageProps,
): CSSProperties {
  const { width, height, placeholder, thumbnail } = props;
  const style: CSSProperties = {};
  const objectFit = props.style?.objectFit;

  let backgroundImage: string | undefined;
  if (placeholder === 'blur') {
    if (!thumbnail) {
      throw new Error(
        `<Image placeholder="blur" /> expect "src" should be an image module but got: ${props.src}`,
      );
    }
    backgroundImage = `url("data:image/svg+xml;charset=utf-8,${getBlurImage({ thumbnail, width, height, objectFit })}")`;
  } else if (typeof placeholder === 'string') {
    if (!placeholder.startsWith('data:image/')) {
      throw new Error(
        `<Image /> with "placeholder" prop must be a data URL, but got ${JSON.stringify(placeholder)}: ${props.src}`,
      );
    }
    backgroundImage = `url("${placeholder}")`;
  }

  let backgroundSize: CSSProperties['backgroundSize'] = objectFit;
  if (INVALID_BACKGROUND_SIZE_VALUES.includes(objectFit)) {
    backgroundSize = objectFit === 'fill' ? '100% 100%' : 'cover';
  }

  if (backgroundImage) {
    Object.assign(style, {
      backgroundSize,
      backgroundPosition: props.style?.objectPosition || '50% 50%',
      backgroundRepeat: 'no-repeat',
      backgroundImage,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    // TODO: Replacing placeholder with devServer url to improve dev experience.
  }

  return style;
}

export function resolveImageStyle(props: ResolvedImageProps): CSSProperties {
  const style: CSSProperties = {};
  const { fill } = props;

  if (fill) {
    throw new Error('fill is unsupported yet');
    // Object.assign(style, {
    //   position: 'absolute',
    //   height: '100%',
    //   width: '100%',
    //   left: 0,
    //   top: 0,
    //   right: 0,
    //   bottom: 0,
    //   color: 'transparent', // Hide `alt` text while image is loading
    // });
  }

  return style;
}

// TODO: make `imageSizes` and `deviceSizes` configurable.
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const allSizes = [...imageSizes, ...deviceSizes];

export interface ConditionalSrc {
  url: string;
  condition?: string;
}

export function resolveSrcSet(options: ResolvedImageProps) {
  const { densities, width, sizes, unoptimized } = options;

  if (unoptimized) return null;
  if (typeof width !== 'number' && !sizes) return null;

  const srcSet: ConditionalSrc[] = [];
  if (typeof width === 'number' && !sizes) {
    for (const density of densities) {
      const url = applyImageLoader({ ...options, width: width * density });
      srcSet.push({ url, condition: `${density}x` });
    }
  } else {
    for (const width of allSizes) {
      const url = applyImageLoader({ ...options, width });
      srcSet.push({ url, condition: `${width}w` });
    }
  }
  return srcSet;
}

export function resolveSizes(options: ResolvedImageProps) {
  const { width, sizes, unoptimized } = options;

  if (unoptimized) return undefined;

  if (typeof width === 'number' && !sizes) {
    return undefined;
  }
  return sizes || '100vw';
}

export function resolveImageAttrs(
  props: ResolvedImageProps,
): React.ImgHTMLAttributes<HTMLImageElement> {
  let { src } = props;
  const { alt, width, height, overrideSrc, loading, priority, unoptimized } =
    props;

  const style = {
    ...props.style,
    ...resolveImageStyle(props),
    ...resolvePlaceholderStyle(props),
  };

  let srcSet: string | undefined;
  let sizes: string | undefined;
  if (!unoptimized) {
    const resolvedSet = resolveSrcSet(props);
    srcSet = resolvedSet
      ?.map(({ url, condition }) => `${url} ${condition}`)
      .join(',');
    if (resolvedSet && resolvedSet.length > 0) {
      src = overrideSrc ?? resolvedSet.at(-1)?.url ?? src;
    }
    sizes = resolveSizes(props);
  }

  const attrs: React.ImgHTMLAttributes<HTMLImageElement> = {
    src,
    alt,
    style,
    width,
    height,
    srcSet,
    sizes,
    loading,
    // TODO: Add data-* attributes to tag component states.
  };

  const fetchPriority = priority ? 'high' : undefined;
  if (typeof React.use === 'function') {
    attrs.fetchPriority = fetchPriority;
  } else {
    // @ts-expect-error Compatibility with React 18.
    attrs.fetchpriority = fetchPriority;
  }

  debug('resolveImageAttrs:', attrs);
  return attrs;
}
