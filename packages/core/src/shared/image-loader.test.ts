import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IPX_BASENAME } from './constants';
import { applyImageLoader, ipxImageLoader } from './image-loader';

describe('applyImageLoader', () => {
  it('should apply loader function to the image source', () => {
    const mockLoader = vi.fn(() => 'transformed-url');
    const options = {
      loader: mockLoader,
      src: 'image.jpg',
      quality: 75,
      width: 800,
    };

    const result = applyImageLoader(options);

    expect(mockLoader).toHaveBeenCalledWith({
      src: 'image.jpg',
      quality: 75,
      width: 800,
    });
    expect(result).toBe('transformed-url');
  });
});

describe('ipxImageLoader', () => {
  it('should transform URL with width and quality parameters', () => {
    const options = {
      src: 'https://example.com/image.jpg',
      quality: 75,
      width: 800,
    };

    const result = ipxImageLoader(options);

    expect(result).toBe(
      `https://example.com${DEFAULT_IPX_BASENAME}/f_auto,w_800,q_75/image.jpg`,
    );
  });

  it('should handle relative paths correctly', () => {
    const options = {
      src: '/images/photo.png',
      quality: 90,
      width: 400,
    };

    const result = ipxImageLoader(options);

    expect(result).toBe(
      `${DEFAULT_IPX_BASENAME}/f_auto,w_400,q_90/images/photo.png`,
    );
  });

  it('should handle paths with only pathname, query and fragment', () => {
    const options = {
      src: '/images/photo.png?version=3#section1',
      quality: 85,
      width: 500,
    };

    const result = ipxImageLoader(options);

    expect(result).toBe(
      `${DEFAULT_IPX_BASENAME}/f_auto,w_500,q_85/images/photo.png?version=3#section1`,
    );
  });

  it('should preserve query parameters in the original URL', () => {
    const options = {
      src: 'https://example.com/image.jpg?version=2',
      quality: 80,
      width: 600,
    };

    const result = ipxImageLoader(options);

    expect(result).toBe(
      `https://example.com${DEFAULT_IPX_BASENAME}/f_auto,w_600,q_80/image.jpg?version=2`,
    );
  });

  it('should handle complex paths correctly', () => {
    const options = {
      src: 'https://example.com/path/to/nested/image.webp',
      quality: 85,
      width: 1200,
    };

    const result = ipxImageLoader(options);

    expect(result).toBe(
      `https://example.com${DEFAULT_IPX_BASENAME}/f_auto,w_1200,q_85/path/to/nested/image.webp`,
    );
  });
});
