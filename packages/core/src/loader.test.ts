import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Rspack, rspack } from '@rsbuild/core';
import { evalModule as baseEvalModule, hasESMSyntax } from 'mlly';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { images } from '../tests/fixtures/images';
import loader, { type LoaderOptions } from './loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loaderName = path.resolve(__dirname, '../tests/fixtures/loader.cjs');

type LoaderCallback = (
  err: Error | null | undefined,
  result: string | Buffer | undefined,
) => void;

let mockLoaderOptions: unknown = {};

const mockContext = {
  async: vi.fn(),
  importModule: vi.fn(),
  getOptions: vi.fn(() => mockLoaderOptions),
  resource: '/path/to/image.jpg',
  request: 'some-request',
} as unknown as Rspack.LoaderContext;

// Add loader runner helper
async function executeLoader(content: Buffer, options: LoaderOptions = {}) {
  mockLoaderOptions = options;
  let resolveCallback: (args: Parameters<LoaderCallback>) => void;
  const promise = new Promise<Parameters<LoaderCallback>>((resolve) => {
    resolveCallback = resolve;
  });

  const callback = vi.fn<LoaderCallback>((err, result) => {
    resolveCallback([err, result]);
  });
  vi.mocked(mockContext.async).mockReturnValue(callback);
  loader.call(mockContext, content);
  return promise;
}

async function evalModule(content: string, publicPath = '/') {
  assert(hasESMSyntax(content));
  vi.stubGlobal('__webpack_public_path__', publicPath);
  const mod = await baseEvalModule(content);
  assert(typeof mod.default === 'object');
  return mod.default;
}

describe('image loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock importModule to return asset path
    vi.mocked(mockContext.importModule).mockImplementation(
      async (request, opts = {}) => {
        const { publicPath = '' } = opts;
        return `${publicPath}assets/image.123456.jpg`;
      },
    );
  });

  it.each(images)(
    'should process $basename and generate thumbnail',
    async (data) => {
      const { buffer, width, height } = data;

      const [error, result] = await executeLoader(Buffer.from(buffer));
      expect(error).toBeNull();

      // Verify module output content
      const moduleContent = result as string;
      const content = await evalModule(moduleContent);
      expect(content).toMatchObject({
        url: '/assets/image.123456.jpg',
        width,
        height,
        thumbnail: {
          url: expect.stringMatching(/^data:image\/jpeg;base64,/),
          // TODO: use concrete value.
          width: expect.any(Number),
          height: expect.any(Number),
        },
      });
    },
  );

  it.each(images)(
    'should maintain aspect ratio of $basename in thumbnail',
    async (data) => {
      const { buffer, width, height } = data;

      const [error, result] = await executeLoader(Buffer.from(buffer));
      expect(error).toBeNull();
      assert(typeof result === 'string');
      const content = await evalModule(result);

      const aspectRatioOriginal = width / height;
      const aspectRatioThumbnail =
        content.thumbnail.width / content.thumbnail.height;

      expect(Math.abs(aspectRatioOriginal - aspectRatioThumbnail)).toBeLessThan(
        0.1,
      );
    },
  );

  it('should not generate thumbnail if disabled', async () => {
    const [error, result] = await executeLoader(Buffer.from(images[0].buffer), {
      thumbnail: false,
    });
    expect(error).toBeNull();

    const moduleContent = result as string;

    const mod = await evalModule(moduleContent);
    expect(mod.thumbnail).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(mockContext.importModule).mockRejectedValue(
      new Error('Import failed'),
    );

    const [error] = await executeLoader(Buffer.from('invalid image'));
    expect(error).toBeInstanceOf(Error);
  });

  it('should return static image data', async () => {
    const image = images.find((image) =>
      image.filename.endsWith('sunrise.jpg'),
    );
    assert(image);

    const compiler = rspack({
      entry: `data:javascript,export { default } from ${JSON.stringify(image.filename)};`,
      module: { rules: [{ test: /\.jpg$/, loader: loaderName }] },
      output: {
        chunkLoading: false,
        library: { type: 'commonjs' },
        publicPath: '/',
      },
      optimization: { minimize: false },
    });

    const result = new Promise<unknown>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) reject(err);
        assert(stats);
        const chunks = Object.values(stats.compilation.assets);
        const mainChunk = stats.compilation.assets['main.js'];
        assert(chunks.length === 2 && mainChunk);
        const fn = new Function('exports', mainChunk.source().toString());
        const exportsParam: unknown = {};
        fn(exportsParam);
        resolve(exportsParam);
      });
    });

    await expect(result).resolves.toEqual({
      default: {
        url: expect.stringMatching(/^\/.*\.jpg$/),
        width: 100,
        height: 75,
        thumbnail: {
          url: expect.stringMatching(/^data:image\/jpeg;base64,/),
          width: 8,
          height: 6,
        },
      },
    });
  });
});
