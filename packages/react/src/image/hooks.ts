import {
  type ImageOptions,
  applyImageLoader,
} from '@rsbuild-image/core/shared';
import { useContext } from 'react';
import { ImageOptionsContext } from './context';
import { resolveImageOptions } from './options';

export function UNSTABLE_useImage() {
  const resolveImage = (options: ImageOptions & { width: number }): string => {
    const { width } = options;
    const context = useContext(ImageOptionsContext);
    const resolvedOptions = resolveImageOptions({ ...context, ...options });
    const url = applyImageLoader({ ...resolvedOptions, width });
    return url;
  };
  return resolveImage;
}
