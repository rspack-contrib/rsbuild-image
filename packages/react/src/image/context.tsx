import type { ImageContext } from '@rsbuild-image/core/shared';
import { assert } from '@sindresorhus/is';
import { type PropsWithChildren, createContext, useContext } from 'react';

export function createImageOptionsContext() {
  const ret: ImageContext = {};
  if (typeof __INTERNAL_RSBUILD_IMAGE_OPTIONS__ !== 'undefined') {
    Object.assign(ret, __INTERNAL_RSBUILD_IMAGE_OPTIONS__);
    if (typeof __INTERNAL_RSBUILD_IMAGE_OPTIONS__.loader === 'string') {
      const mod = require(/* webpackIgnore: true */ '__INTERNAL_RSBUILD_IMAGE_LOADER__');
      ret.loader = mod.default || mod;
      assert.function(
        ret.loader,
        `Image loader must be a function but got ${typeof ret.loader}`,
      );
    }
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
