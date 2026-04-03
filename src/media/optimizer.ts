import { readFile, writeFile, unlink } from 'node:fs/promises';
import { extname } from 'node:path';

export interface OptimizeOptions {
  quality: number; // 1–100
}

export interface CompressResult {
  size: number;
  newPath: string;
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
 * Compresses an image file to WebP.
 * Returns the new size and final path, or null if compression was skipped.
 *
 * When compression reduces file size, the original file is replaced by a
 * `.webp` file at `newPath` (extension changed). When WebP would be larger,
 * the original file is left untouched and `newPath` equals `filePath`.
 *
 * Skips silently if:
 * - The file extension is not compressible
 * - sharp is not installed
 */
export async function tryCompress(
  filePath: string,
  opts: OptimizeOptions,
): Promise<CompressResult | null> {
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
      const newPath = filePath.replace(/\.[^.]+$/, '.webp');
      await writeFile(newPath, output);
      // Remove the original file if the path changed (e.g. .png → .webp)
      if (newPath !== filePath) await unlink(filePath);
      return { size: output.length, newPath };
    }

    // WebP would be larger — leave original untouched
    return { size: input.length, newPath: filePath };
  } catch {
    // Non-fatal — return null to indicate no compression happened
    return null;
  }
}
