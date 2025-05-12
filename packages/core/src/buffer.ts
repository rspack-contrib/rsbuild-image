import { scopedBuf } from './utils';

export function arrayBufferToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function inspectBuffer(buf: ArrayBuffer | Uint8Array, length = 16) {
  const arrBuf = buf instanceof ArrayBuffer ? buf : scopedBuf(buf.buffer);
  if (!arrBuf) return null;
  const hex = arrayBufferToHex(arrBuf.slice(0, length));
  return `${hex} +${buf.byteLength - length} bytes`;
}
