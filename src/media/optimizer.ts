import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

export interface OptimizeOptions {
  quality: number; // 1–100
}

// Image types that can be compressed to WebP
const COMPRESSIBLE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']);

// Cached availability check — undefined = not yet checked
let sharpAvailable: boolean | undefined = undefined;

async function tryLoadSharp(): Promise<boolean> {
  if (sharpAvailable !== undefined) return sharpAvailable;
  try {
    await import('sharp');
    sharpAvailable = true;
  } catch {
    sharpAvailable = false;
  }
  return sharpAvailable;
}

/**
 * Returns true if sharp is available on this system.
 */
export async function isSharpAvailable(): Promise<boolean> {
  return tryLoadSharp();
}

/**
 * Compresses an image file to WebP in-place.
 * Returns the new file size in bytes, or null if compression was skipped.
 *
 * Skips silently if:
 * - The file extension is not compressible
 * - sharp is not installed
 */
export async function tryCompress(
  filePath: string,
  opts: OptimizeOptions,
): Promise<number | null> {
  const ext = extname(filePath).toLowerCase();
  if (!COMPRESSIBLE_EXTS.has(ext)) return null;

  const available = await tryLoadSharp();
  if (!available) return null;

  try {
    // Dynamic import after availability check
    const sharpMod = await import('sharp');
    // Handle both ESM default and CJS default export shapes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharpFn: (input: Buffer) => any = (sharpMod as any).default ?? sharpMod;

    const input = await readFile(filePath);
    const output: Buffer = await sharpFn(input)
      .webp({ quality: opts.quality })
      .toBuffer();

    // Only replace if WebP is actually smaller
    if (output.length < input.length) {
      await writeFile(filePath, output);
      return output.length;
    }

    return input.length;
  } catch {
    // Non-fatal — return null to indicate no compression happened
    return null;
  }
}
