export function isModuleNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')
  );
}

export function invariant(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'Assertion error');
  }
}

const textEncoder = new TextEncoder();

export function str2u8(str: string): Uint8Array {
  return textEncoder.encode(str);
}

export function str2buf(str: string) {
  const u8arr = str2u8(str);
  return u8arr.buffer;
}

export function anyBuf(buf: string | Buffer | ArrayBufferLike) {
  if (typeof buf === 'string') return str2buf(buf);
  if (Buffer.isBuffer(buf)) return buf.buffer;

  return buf;
}

export function scopedBuf(buf: string | Buffer | ArrayBufferLike) {
  const ret = anyBuf(buf);
  if (ret instanceof ArrayBuffer) {
    return ret;
  }
}
