import { describe, it, expect } from 'vitest';
import { normalizeAttachment } from '../src/processors/attachment.js';
import { normalizeEmbed } from '../src/processors/embed.js';
import { normalizeMessage } from '../src/processors/message.js';
import { parseDiscordMarkdown, stripDiscordMarkdown } from '../src/processors/markdown.js';
import { AttachmentType, MessageType } from '../src/types.js';

// ─── normalizeAttachment ──────────────────────────────────────────────────────

describe('normalizeAttachment', () => {
  it('detects image type from content-type', () => {
    const att = normalizeAttachment({
      id: '1',
      url: 'https://cdn.discord.com/photo.png',
      name: 'photo.png',
      size: 1024,
      contentType: 'image/png',
      width: 800,
      height: 600,
    });
    expect(att.type).toBe(AttachmentType.Image);
    expect(att.spoiler).toBe(false);
  });

  it('detects video type from extension when no content-type', () => {
    const att = normalizeAttachment({
      id: '2',
      url: 'https://cdn.discord.com/clip.mp4',
      name: 'clip.mp4',
      size: 5_000_000,
      contentType: null,
    });
    expect(att.type).toBe(AttachmentType.Video);
  });

  it('detects audio type from content-type', () => {
    const att = normalizeAttachment({
      id: '3',
      url: 'https://cdn.discord.com/voice.ogg',
      name: 'voice.ogg',
      size: 512_000,
      contentType: 'audio/ogg',
    });
    expect(att.type).toBe(AttachmentType.Audio);
  });

  it('marks filename starting with SPOILER_ as spoiler', () => {
    const att = normalizeAttachment({
      id: '4',
      url: 'https://cdn.discord.com/SPOILER_secret.png',
      name: 'SPOILER_secret.png',
      size: 2048,
      contentType: 'image/png',
    });
    expect(att.spoiler).toBe(true);
    expect(att.type).toBe(AttachmentType.Image);
  });

  it('falls back to File type for unknown extensions', () => {
    const att = normalizeAttachment({
      id: '5',
      url: 'https://cdn.discord.com/archive.xyz',
      name: 'archive.xyz',
      size: 1024,
      contentType: null,
    });
    expect(att.type).toBe(AttachmentType.File);
  });

  it('sets resolvedUrl equal to url by default', () => {
    const url = 'https://cdn.discord.com/doc.pdf';
    const att = normalizeAttachment({ id: '6', url, name: 'doc.pdf', size: 0, contentType: null });
    expect(att.resolvedUrl).toBe(url);
  });
});

// ─── normalizeEmbed ───────────────────────────────────────────────────────────

describe('normalizeEmbed', () => {
  it('normalizes a rich embed with all fields', () => {
    const raw = {
      type: 'rich',
      title: 'Title',
      description: 'Description',
      url: 'https://example.com',
      color: 0x5865f2,
      timestamp: '2024-06-15T10:00:00.000Z',
      fields: [{ name: 'Field', value: 'Value', inline: true }],
      author: { name: 'Author', iconURL: null, url: null },
      footer: { text: 'Footer', iconURL: null },
      thumbnail: { url: 'https://example.com/thumb.png', width: 80, height: 80 },
      image: null,
      video: null,
    };
    const embed = normalizeEmbed(raw);
    expect(embed.title).toBe('Title');
    expect(embed.color).toBe(0x5865f2);
    expect(embed.timestamp).toBeInstanceOf(Date);
    expect(embed.fields).toHaveLength(1);
    expect(embed.thumbnail?.url).toBe('https://example.com/thumb.png');
  });

  it('returns null for missing optional fields', () => {
    const embed = normalizeEmbed({ type: 'rich' });
    expect(embed.title).toBeNull();
    expect(embed.author).toBeNull();
    expect(embed.footer).toBeNull();
    expect(embed.thumbnail).toBeNull();
  });
});

// ─── normalizeMessage ─────────────────────────────────────────────────────────

describe('normalizeMessage', () => {
  const rawUser = {
    id: '111',
    username: 'testuser',
    globalName: 'Test User',
    discriminator: '0',
    bot: false,
    avatarURL: () => 'https://cdn.discord.com/avatar.png',
  };

  it('normalizes a basic default message', () => {
    const raw = {
      id: '999',
      type: 0,
      author: rawUser,
      content: 'Hello!',
      createdTimestamp: Date.now(),
      editedTimestamp: null,
      attachments: new Map(),
      embeds: [],
      reactions: { cache: new Map() },
      stickers: new Map(),
      pinned: false,
      components: [],
    };
    const msg = normalizeMessage(raw);
    expect(msg.id).toBe('999');
    expect(msg.type).toBe(MessageType.Default);
    expect(msg.content).toBe('Hello!');
    expect(msg.author.username).toBe('testuser');
    expect(msg.author.displayName).toBe('Test User');
    expect(msg.contentHTML).toBeNull();
  });

  it('identifies reply message type', () => {
    const raw = {
      id: '1000',
      type: 19,
      author: rawUser,
      content: 'replying',
      createdTimestamp: Date.now(),
      editedTimestamp: null,
      attachments: new Map(),
      embeds: [],
      reactions: { cache: new Map() },
      stickers: new Map(),
      pinned: false,
      components: [],
    };
    const msg = normalizeMessage(raw);
    expect(msg.type).toBe(MessageType.Reply);
  });

  it('identifies system message type and builds systemContent', () => {
    const raw = {
      id: '1001',
      type: 7, // UserJoin
      author: rawUser,
      content: '',
      createdTimestamp: Date.now(),
      editedTimestamp: null,
      attachments: new Map(),
      embeds: [],
      reactions: { cache: new Map() },
      stickers: new Map(),
      pinned: false,
      components: [],
    };
    const msg = normalizeMessage(raw);
    expect(msg.type).toBe(MessageType.System);
    expect(msg.systemContent).toContain('joined');
  });

  it('resolves replyTo from provided reference', () => {
    const replyTarget = normalizeMessage({
      id: '888',
      type: 0,
      author: rawUser,
      content: 'Original',
      createdTimestamp: Date.now(),
      editedTimestamp: null,
      attachments: new Map(),
      embeds: [],
      reactions: { cache: new Map() },
      stickers: new Map(),
      pinned: false,
      components: [],
    });

    const raw = {
      id: '889',
      type: 19,
      author: rawUser,
      content: 'Reply',
      createdTimestamp: Date.now(),
      editedTimestamp: null,
      attachments: new Map(),
      embeds: [],
      reactions: { cache: new Map() },
      stickers: new Map(),
      pinned: false,
      components: [],
    };
    const msg = normalizeMessage(raw, replyTarget);
    expect(msg.replyTo?.id).toBe('888');
  });
});

// ─── Markdown parser ──────────────────────────────────────────────────────────

describe('parseDiscordMarkdown', () => {
  it('returns empty string for empty input', async () => {
    expect(await parseDiscordMarkdown('')).toBe('');
    expect(await parseDiscordMarkdown('   ')).toBe('');
  });

  it('does not throw on arbitrary input', async () => {
    await expect(parseDiscordMarkdown('**bold** _italic_ `code`')).resolves.toBeDefined();
  });

  it('escapes HTML special characters in plain text', async () => {
    const result = await parseDiscordMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });
});

describe('stripDiscordMarkdown', () => {
  it('returns plain text from markdown', async () => {
    const result = await stripDiscordMarkdown('Hello world');
    expect(result).toContain('Hello');
  });

  it('returns original content on empty input', async () => {
    expect(await stripDiscordMarkdown('')).toBe('');
  });
});
