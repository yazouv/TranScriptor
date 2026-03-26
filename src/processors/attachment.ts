import { AttachmentType } from '../types.js';
import type { NormalizedAttachment, RawMessage } from '../types.js';

const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]);

const VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
]);

const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
]);

function detectType(contentType: string | null, filename: string): AttachmentType {
  if (contentType) {
    const base = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
    if (IMAGE_TYPES.has(base)) return AttachmentType.Image;
    if (VIDEO_TYPES.has(base)) return AttachmentType.Video;
    if (AUDIO_TYPES.has(base)) return AttachmentType.Audio;
    return AttachmentType.File;
  }

  // Fallback to file extension when no content-type is available
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext))
    return AttachmentType.Image;
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return AttachmentType.Video;
  if (['mp3', 'ogg', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) return AttachmentType.Audio;
  return AttachmentType.File;
}

export function normalizeAttachment(raw: RawMessage): NormalizedAttachment {
  const contentType: string | null = raw.contentType ?? null;
  const filename: string = raw.name ?? raw.filename ?? 'unknown';

  return {
    id: String(raw.id),
    type: detectType(contentType, filename),
    url: String(raw.url),
    resolvedUrl: String(raw.url), // updated later by MediaManager
    filename,
    size: raw.size ?? 0,
    contentType,
    width: raw.width ?? null,
    height: raw.height ?? null,
    spoiler: filename.startsWith('SPOILER_'),
  };
}
