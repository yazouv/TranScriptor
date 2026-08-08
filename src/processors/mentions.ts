import type { MentionResolver } from '../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawGuild = any;

/**
 * Builds a MentionResolver from a discord.js Guild's caches (members/roles/channels).
 * Returns null when no guild is available (e.g. DM channels) — callers fall back to raw IDs.
 */
export function createMentionResolver(guild: RawGuild | null | undefined): MentionResolver | null {
  if (!guild) return null;

  return {
    user(id: string): string | null {
      const member = guild.members?.cache?.get?.(id);
      if (member) return member.displayName ?? member.nickname ?? member.user?.username ?? null;
      const user = guild.client?.users?.cache?.get?.(id);
      return user?.username ?? null;
    },
    role(id: string): string | null {
      const role = guild.roles?.cache?.get?.(id);
      return role?.name ?? null;
    },
    channel(id: string): string | null {
      const channel = guild.channels?.cache?.get?.(id);
      return channel?.name ?? null;
    },
  };
}
