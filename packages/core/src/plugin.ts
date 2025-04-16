import path from 'node:path';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { assert } from '@sindresorhus/is';
import type { IPXOptions, IPXStorage } from 'ipx';
import { withoutBase } from 'ufo';
import type { LoaderOptions } from './loader';
import { logger } from './logger';
import type { ImageSerializableContext } from './shared';
import { DEFAULT_IPX_BASENAME } from './shared/constants';
import { isModuleNotFoundError } from './utils';

export interface ExtendedIPXOptions extends Partial<IPXOptions> {
  basename?: string;
}

export interface PluginImageOptions
  extends ImageSerializableContext,
    LoaderOptions {
  /**
   * Enable the builtin IPX middleware.
   * It will mount a new route `/_rsbuild/ipx` to the development server.
   * The IPX middleware will be used to process images on the fly.
   *
   * Only take effects to the **development server**,
   * you need to setup a image according to your CDN in production.
   */
  ipx?: ExtendedIPXOptions;
}

class IPXNotFoundError extends Error {
  constructor() {
    super(
      'Failed to load ipx module, try to install it by `pnpm add -D ipx` or leave the `ipx` option empty and setup any other image loader.',
    );
    this.name = 'IPXNotFoundError';
  }
}

class LoaderOrIPXRequiredError extends Error {
  constructor() {
    super(
      'You must enable the builtin `ipx` middleware or configure a custom `loader` file to use the image plugin.',
    );
  }
}

async function loadIPXModule() {
  try {
    return await import('ipx');
  } catch (err) {
    if (isModuleNotFoundError(err)) throw new IPXNotFoundError();
    throw err;
  }
}

function createBundlerStorage(compiler: Rspack.Compiler): IPXStorage {
  const useOutputFileSystem = () => {
    if (!compiler.outputFileSystem) {
      throw new Error(
        'Unable to access compiler.outputFileSystem from IPX middleware',
      );
    }
    return compiler.outputFileSystem;
  };
  const resolveId = (id: string) => path.join(compiler.outputPath, id);
  return {
    name: 'rsbuild-image:bundler-ofs',
    getMeta(id) {
      const ofs = useOutputFileSystem();
      return new Promise((resolve, reject) => {
        ofs.stat(resolveId(id), (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    },
    getData(id) {
      const ofs = useOutputFileSystem();
      return new Promise((resolve, reject) => {
        ofs.readFile(resolveId(id), (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(typeof res === 'string' ? Buffer.from(res) : res);
          }
        });
      });
    },
  };
}

export const pluginImage = (options?: PluginImageOptions): RsbuildPlugin => {
  return {
    name: '@rsbuild-image/core',
    async setup(api) {
      const { thumbnail } = options ?? {};
      // Forced to be `undefined` in non-development mode.
      // The IPX middleware is only available for development server
      const ipx = api.context.action === 'dev' ? options?.ipx : undefined;
      const loaderOptions: LoaderOptions = { thumbnail };

      // Panic while leave both `ipx` & `loader` empty,
      if (!options?.ipx && !options?.loader)
        throw new LoaderOrIPXRequiredError();

      // Serialize and inject the options to the runtime context.
      api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
        let serializable: ImageSerializableContext | undefined;

        if (options) {
          const { densities, loader, loading, placeholder, quality } = options;
          serializable = { densities, loader, loading, placeholder, quality };
        }

        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_RSBUILD_IMAGE_OPTIONS__: JSON.stringify(serializable),
            },
          },
          resolve: {
            alias: (aliases) => {
              if (options?.loader) {
                aliases.__INTERNAL_RSBUILD_IMAGE_LOADER__ = options.loader;
              } else {
                aliases.__INTERNAL_RSBUILD_IMAGE_LOADER__ = require.resolve(
                  './shared/image-loader',
                );
              }
              return aliases;
            },
          },
        });
      });

      let compiler: Rspack.Compiler | undefined;

      api.onAfterCreateCompiler((params) => {
        if (compiler) return;
        compiler =
          'compilers' in params.compiler
            ? params.compiler.compilers[0]
            : params.compiler;
      });

      // Setup the IPX middleware.
      api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
        if (!ipx) return;
        const { createIPX, createIPXNodeServer } = await loadIPXModule();
        const { basename = DEFAULT_IPX_BASENAME, ...ipxOptions } = ipx;

        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_RSBUILD_IMAGE_BASENAME__: JSON.stringify(basename),
            },
          },
          dev: {
            setupMiddlewares: [
              (middlewares) => {
                assert.truthy(
                  compiler,
                  'Compiler is not initialized while setup the IPX middleware',
                );
                const { distPath } = api.context;
                assert.string(distPath);

                const { storage = createBundlerStorage(compiler), ...rest } =
                  ipxOptions;
                const ipx = createIPX({ storage, ...rest });
                logger.debug(`Created IPX with local storage from ${distPath}`);
                logger.debug(`Created IPX with basename ${basename}`);

                const originalMiddleware = createIPXNodeServer(ipx);
                middlewares.unshift((req, res, _next) => {
                  const next = () => {
                    logger.debug(`IPX middleware incoming request: ${req.url}`);
                    _next();
                  };
                  if (!req.url) return next();
                  const newUrl = withoutBase(req.url, basename);
                  if (newUrl === req.url) return next();
                  req.url = newUrl;

                  logger.debug(
                    `IPX middleware incoming request (accepted): ${req.url}`,
                  );
                  return originalMiddleware(req, res);
                });
              },
            ],
          },
        });
      });

      // Modify the bundler chain to add the image loader.
      api.modifyBundlerChain((chain) => {
        chain.module
          .rule('image-component-module')
          .type('javascript/auto')
          .resourceQuery(/\?image$/)
          .use('image-component-loader')
          .loader(require.resolve('./loader.js'))
          .options(loaderOptions);
      });
    },
  };
};

export default pluginImage;
