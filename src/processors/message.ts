import { AttachmentType, MessageType } from '../types.js';
import type {
  NormalizedMessage,
  NormalizedReaction,
  NormalizedSticker,
  NormalizedUser,
  RawMessage,
} from '../types.js';
import { normalizeAttachment } from './attachment.js';
import { normalizeEmbed } from './embed.js';

// ─── User ─────────────────────────────────────────────────────────────────────

function normalizeUser(raw: RawMessage, member?: RawMessage): NormalizedUser {
  const user = raw.user ?? raw;

  // Resolve avatar URL — guild avatar takes priority over global avatar
  let avatarURL: string | null = null;
  if (member?.avatar) {
    avatarURL = member.avatarURL?.({ size: 64 }) ?? null;
  } else {
    avatarURL = user.avatarURL?.({ size: 64 }) ?? user.defaultAvatarURL ?? null;
  }

  // Resolve highest role color and name
  let roleColor: string | null = null;
  let topRole: string | null = null;
  if (member?.roles?.highest) {
    const role = member.roles.highest;
    if (role.color !== 0) {
      roleColor = `#${role.color.toString(16).padStart(6, '0')}`;
    }
    topRole = role.name !== '@everyone' ? role.name : null;
  }

  return {
    id: String(user.id),
    username: String(user.username ?? 'Unknown'),
    displayName: String(member?.displayName ?? user.globalName ?? user.username ?? 'Unknown'),
    discriminator: String(user.discriminator ?? '0'),
    avatarURL,
    bot: Boolean(user.bot),
    roleColor,
    topRole,
  };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

function normalizeReactions(raw: RawMessage[]): NormalizedReaction[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((r: RawMessage) => {
    const emoji = r.emoji;
    const isCustom = Boolean(emoji?.id);

    return {
      emoji: isCustom ? `:${emoji.name}:` : String(emoji?.name ?? '?'),
      emojiURL: isCustom
        ? `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}?size=32`
        : null,
      count: Number(r.count ?? 0),
      animated: Boolean(emoji?.animated),
    };
  });
}

// ─── Stickers ─────────────────────────────────────────────────────────────────

function normalizeStickers(raw: RawMessage[]): NormalizedSticker[] {
  if (!raw?.length) return [];

  return raw.map((s: RawMessage) => {
    // Sticker formats: PNG=1, APNG=2, LOTTIE=3, GIF=4
    const format = s.format ?? 1;
    const ext = format === 3 ? 'json' : format === 4 ? 'gif' : 'png';
    const url = `https://media.discordapp.net/stickers/${s.id}.${ext}`;

    return {
      id: String(s.id),
      name: String(s.name ?? 'sticker'),
      url,
      resolvedUrl: url, // updated later by MediaManager
    };
  });
}

// ─── Message type ─────────────────────────────────────────────────────────────

// discord.js MessageType enum values
const SYSTEM_TYPES = new Set([
  1,  // RecipientAdd
  2,  // RecipientRemove
  3,  // Call
  4,  // ChannelNameChange
  5,  // ChannelIconChange
  6,  // ChannelPinnedMessage
  7,  // UserJoin
  8,  // GuildBoost
  9,  // GuildBoostTier1
  10, // GuildBoostTier2
  11, // GuildBoostTier3
  12, // ChannelFollowAdd
  14, // GuildDiscoveryDisqualified
  15, // GuildDiscoveryRequalified
  25, // GuildBoostTier1 (alt)
]);

function resolveMessageType(raw: RawMessage): MessageType {
  const type = raw.type ?? 0;
  if (type === 19) return MessageType.Reply;
  if (type === 18) return MessageType.ApplicationCommand;
  if (type === 22 || type === 23) return MessageType.ThreadCreated;
  if (SYSTEM_TYPES.has(type)) return MessageType.System;
  return MessageType.Default;
}

// ─── System message text ──────────────────────────────────────────────────────

function buildSystemContent(raw: RawMessage, author: NormalizedUser): string | null {
  const type = raw.type ?? 0;
  const name = author.displayName;

  switch (type) {
    case 7:  return `${name} joined the server.`;
    case 6:  return `${name} pinned a message to this channel.`;
    case 8:  return `${name} just boosted the server!`;
    case 9:  return `${name} just boosted the server! The server has achieved **Level 1**!`;
    case 10: return `${name} just boosted the server! The server has achieved **Level 2**!`;
    case 11: return `${name} just boosted the server! The server has achieved **Level 3**!`;
    case 22: return `${name} started a thread.`;
    default: return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Normalizes a raw discord.js Message into our internal NormalizedMessage format.
 * The replyTo field is populated separately to avoid recursive API calls.
 */
export function normalizeMessage(
  raw: RawMessage,
  replyTo: NormalizedMessage | null = null,
): NormalizedMessage {
  const member = raw.member ?? null;
  const author = normalizeUser(raw.author ?? raw, member);
  const type = resolveMessageType(raw);

  // Collect attachments as a plain array (discord.js uses a Collection)
  const rawAttachments: RawMessage[] = raw.attachments
    ? [...(raw.attachments.values?.() ?? raw.attachments)]
    : [];

  // Filter out voice messages from regular attachments (they have flags)
  const attachments = rawAttachments.map(normalizeAttachment);

  // Collect embeds — skip "auto" image embeds when the attachment is already included
  const attachmentUrls = new Set(attachments.map((a) => a.url));
  const rawEmbeds: RawMessage[] = (raw.embeds ?? []).filter(
    (e: RawMessage) =>
      !(e.type === 'image' && e.url && attachmentUrls.has(e.url)) &&
      !(e.type === 'video' && e.url && attachmentUrls.has(e.url)),
  );
  const embeds = rawEmbeds.map(normalizeEmbed);

  // Stickers
  const rawStickers: RawMessage[] = raw.stickers
    ? [...(raw.stickers.values?.() ?? raw.stickers)]
    : [];
  const stickers = normalizeStickers(rawStickers);

  // Reactions
  const rawReactions: RawMessage[] = raw.reactions
    ? [...(raw.reactions.cache?.values?.() ?? raw.reactions)]
    : [];
  const reactions = normalizeReactions(rawReactions);

  const systemContent = type === MessageType.System ? buildSystemContent(raw, author) : null;

  return {
    id: String(raw.id),
    type,
    author,
    content: String(raw.content ?? ''),
    contentHTML: null, // populated by the exporter during rendering
    timestamp: new Date(raw.createdTimestamp ?? Date.now()),
    editedTimestamp: raw.editedTimestamp ? new Date(raw.editedTimestamp) : null,
    attachments,
    embeds,
    reactions,
    stickers,
    replyTo,
    pinned: Boolean(raw.pinned),
    threadId: raw.thread?.id ?? null,
    components: raw.components ?? [],
    systemContent,
  };
}

/**
 * Checks whether an attachment should be included based on IncludeOptions.
 */
export function shouldIncludeAttachment(
  type: AttachmentType,
  include: { images?: boolean; videos?: boolean; files?: boolean },
): boolean {
  if (type === AttachmentType.Image) return include.images !== false;
  if (type === AttachmentType.Video) return include.videos !== false;
  if (type === AttachmentType.Audio) return include.files !== false;
  return include.files !== false;
}
