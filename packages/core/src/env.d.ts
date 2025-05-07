declare module '*?image' {
  const imageModule: import('./shared').ImageModule;
  export default imageModule;
}

declare module '@rsbuild-image/core/types' {
  declare global {
    declare var __INTERNAL_RSBUILD_IMAGE_OPTIONS__:
      | import('./shared').ImageSerializableContext
      | undefined;
    declare var __RSBUILD_IMAGE_IPX_ASSET_PREFIX__: string | undefined;
    declare var IS_TEST: boolean;
  }
}
