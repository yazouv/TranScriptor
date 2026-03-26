import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AttachmentType, MediaManifest, MediaManifestEntry } from '../types.js';

export class ManifestBuilder {
  private entries: MediaManifestEntry[] = [];
  private startedAt = new Date();

  add(entry: MediaManifestEntry): void {
    this.entries.push(entry);
  }

  build(): MediaManifest {
    const totalSizeBytes = this.entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    return {
      exportedAt: this.startedAt.toISOString(),
      totalAssets: this.entries.length,
      totalSizeBytes,
      entries: this.entries,
    };
  }

  async writeToDir(outputPath: string): Promise<string> {
    const manifest = this.build();
    const filePath = join(outputPath, 'manifest.json');
    await writeFile(filePath, JSON.stringify(manifest, null, 2), 'utf8');
    return filePath;
  }
}

export function makeManifestEntry(
  originalUrl: string,
  localPath: string,
  filename: string,
  type: AttachmentType,
  sizeBytes: number,
  compressed: boolean,
): MediaManifestEntry {
  return { originalUrl, localPath, filename, type, sizeBytes, compressed };
}
