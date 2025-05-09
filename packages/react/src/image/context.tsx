import type { ImageContext } from '@rsbuild-image/core/shared';
import { type PropsWithChildren, createContext, useContext } from 'react';

export function createImageOptionsContext() {
  const ret: ImageContext = {};
  if (typeof __INTERNAL_RSBUILD_IMAGE_OPTIONS__ !== 'undefined') {
    Object.assign(ret, __INTERNAL_RSBUILD_IMAGE_OPTIONS__);
    try {
      const mod = require('@rsbuild-image/core/image-loader');
      ret.loader = mod.default || mod;
    } catch {}
  }
  return ret;
}

export const ImageOptionsContext = createContext<ImageContext>(
  createImageOptionsContext(),
);

export interface ImageOptionsProviderProps extends PropsWithChildren {
  value: ImageContext;
}

export function ImageOptionsProvider(props: ImageOptionsProviderProps) {
  const { value, children } = props;
  const inherited = useContext(ImageOptionsContext);
  return (
    <ImageOptionsContext.Provider value={{ ...inherited, ...value }}>
      {children}
    </ImageOptionsContext.Provider>
  );
}
