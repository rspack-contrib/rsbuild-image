import { Image } from '@/image/image';
import type { ImageModule } from '@/types/image';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import imgCrabUrl from './crab.png';

const allWidths = [
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
  3840,
] as const;

type AllWidths = (typeof allWidths)[number];

function getSrc(width: AllWidths | (number & {})) {
  return `/_rsbuild/ipx/f_auto,w_${width},q_90/tests/crab.png`;
}

function getSrcSet(
  widths: readonly (AllWidths | (number & {}))[],
  condition?: 'density' | 'width',
) {
  const ret: string[] = [];
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    let line = getSrc(w);
    if (condition === 'density') {
      line += ` ${i}x`;
    } else if (condition === 'width') {
      line += ` ${w}w`;
    }
    ret.push(line);
  }
  return ret;
}

const maxWidthSrc = getSrc(3840);
const fullSrcSet = getSrcSet(allWidths, 'width').join(',');

describe('Integrations', () => {
  describe('With url string', () => {
    it('should be same to vanilla <img />', async () => {
      const { container } = render(<Image src={imgCrabUrl} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            loading="lazy"
            src="${imgCrabUrl}"
          />
        </div>
      `);
    });

    it('should render user input width/height', async () => {
      {
        const { container } = render(<Image src={imgCrabUrl} width={300} />);
        expect(container).toMatchInlineSnapshot(`
          <div>
            <img
              loading="lazy"
              src="${getSrc(600)}"
              srcset="${getSrc(300)} 1x,${getSrc(600)} 2x"
              width="300"
            />
          </div>
        `);
      }
      {
        const { container } = render(<Image src={imgCrabUrl} height={200} />);
        expect(container).toMatchInlineSnapshot(`
          <div>
            <img
              height="200"
              loading="lazy"
              src="${imgCrabUrl}"
            />
          </div>
        `);
      }
      {
        const { container } = render(
          <Image src={imgCrabUrl} width={300} height={200} />,
        );
        expect(container).toMatchInlineSnapshot(`
          <div>
            <img
              height="200"
              loading="lazy"
              src="${getSrc(600)}"
              srcset="${getSrc(300)} 1x,${getSrc(600)} 2x"
              width="300"
            />
          </div>
        `);
      }
    });

    it('should render all sizes slots while taking simple sizes', async () => {
      const { container } = render(<Image src={imgCrabUrl} sizes="100vw" />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            loading="lazy"
            sizes="100vw"
            src="${getSrc(3840)}"
            srcset="${fullSrcSet}"
          />
        </div>
      `);
    });

    it('should render all sizes slots while taking sizes with relative units', async () => {
      const { container } = render(
        <Image src={imgCrabUrl} sizes="(max-width: 600px) 100vw, 50vw" />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            loading="lazy"
            sizes="(max-width: 600px) 100vw, 50vw"
            src="${getSrc(3840)}"
            srcset="${fullSrcSet}"
          />
        </div>
      `);
    });

    it('should render all sizes slots while taking sizes with absolute units', async () => {
      const { container } = render(
        <Image src={imgCrabUrl} sizes="(max-width: 600px) 300px, 500px" />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            loading="lazy"
            sizes="(max-width: 600px) 300px, 500px"
            src="${maxWidthSrc}"
            srcset="${fullSrcSet}"
          />
        </div>
      `);
    });
  });

  describe('With image module', () => {
    const imgCrab: ImageModule = {
      url: imgCrabUrl,
      width: 1920,
      height: 1280,
      thumbnail: {
        url: 'data:image/x-icon;base64,AA',
        width: 1,
        height: 1,
      },
    };

    it('should have width and height attrs while receive an image module as src', async () => {
      const { container } = render(<Image src={imgCrab} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="1280"
            loading="lazy"
            src="${maxWidthSrc}"
            width="1920"
          />
        </div>
      `);
    });

    it('should render attrs according to the image module and user input width', async () => {
      const { container } = render(<Image src={imgCrab} width={300} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="200"
            loading="lazy"
            src="${getSrc(600)}"
            srcset="${getSrc(300)} 1x,${getSrc(600)} 2x"
            width="300"
          />
        </div>
      `);
    });

    it('should render user input width and height attrs', async () => {
      const { container } = render(
        <Image src={imgCrab} width={200} height={400} />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="400"
            loading="lazy"
            src="${getSrc(400)}"
            srcset="${getSrc(200)} 1x,${getSrc(400)} 2x"
            width="200"
          />
        </div>
      `);
    });

    it('should set src according to overrideSrc property', async () => {
      const { container } = render(
        <Image src={imgCrab} width={300} overrideSrc="/foo/bar.png" />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="200"
            loading="lazy"
            src="/foo/bar.png"
            srcset="${getSrc(300)} 1x,${getSrc(600)} 2x"
            width="300"
          />
        </div>
      `);
    });

    it('should render slots while taking sizes with relative units', async () => {
      const { container } = render(
        <Image src={imgCrab} sizes="(max-width: 600px) 100vw, 50vw" />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="1280"
            loading="lazy"
            sizes="(max-width: 600px) 100vw, 50vw"
            src="${getSrc(3840)}"
            srcset="${fullSrcSet}"
            width="1920"
          />
        </div>
      `);
    });

    it('should render slots while taking sizes with absolute units', async () => {
      const { container } = render(
        <Image src={imgCrab} sizes="(max-width: 600px) 300px, 500px" />,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <img
            height="1280"
            loading="lazy"
            sizes="(max-width: 600px) 300px, 500px"
            src="${maxWidthSrc}"
            srcset="${fullSrcSet}"
            width="1920"
          />
        </div>
      `);
    });
  });
});
