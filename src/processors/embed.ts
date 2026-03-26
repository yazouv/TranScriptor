import type { NormalizedEmbed, NormalizedEmbedField, NormalizedEmbedMedia, RawMessage } from '../types.js';

function normalizeMedia(raw: RawMessage | null | undefined): NormalizedEmbedMedia | null {
  if (!raw?.url) return null;
  return {
    url: String(raw.url),
    resolvedUrl: String(raw.url), // updated later by MediaManager
    width: raw.width ?? null,
    height: raw.height ?? null,
  };
}

export function normalizeEmbed(raw: RawMessage): NormalizedEmbed {
  const fields: NormalizedEmbedField[] = (raw.fields ?? []).map((f: RawMessage) => ({
    name: String(f.name ?? ''),
    value: String(f.value ?? ''),
    inline: Boolean(f.inline),
  }));

  return {
    type: String(raw.type ?? 'rich'),
    title: raw.title ?? null,
    description: raw.description ?? null,
    url: raw.url ?? null,
    color: raw.color ?? null,
    timestamp: raw.timestamp ? new Date(raw.timestamp) : null,
    fields,
    author: raw.author
      ? {
          name: String(raw.author.name ?? ''),
          iconURL: raw.author.iconURL ?? raw.author.icon_url ?? null,
          url: raw.author.url ?? null,
        }
      : null,
    footer: raw.footer
      ? {
          text: String(raw.footer.text ?? ''),
          iconURL: raw.footer.iconURL ?? raw.footer.icon_url ?? null,
        }
      : null,
    thumbnail: normalizeMedia(raw.thumbnail),
    image: normalizeMedia(raw.image),
    video: normalizeMedia(raw.video),
  };
}
