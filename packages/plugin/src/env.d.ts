declare module '*?image' {
  const imageModule: ImageModule;
  export default imageModule;
}

declare global {
  import type { ImageModule, ImageSerializableContext } from './types/image';

  declare var __INTERNAL_RSBUILD_IMAGE_OPTIONS__:
    | ImageSerializableContext
    | undefined;
  declare var __INTERNAL_RSBUILD_IMAGE_BASENAME__: string | undefined;
  declare var IS_TEST: boolean;
}
