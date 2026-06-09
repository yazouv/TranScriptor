/**
 * Showcase script — generates sample transcripts in all formats with rich content.
 *
 * Usage: bun run scripts/showcase.ts
 * Output: showcase/  (HTML, Markdown, TXT)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateFromMessages, ExportFormat, OutputType } from '../src/index.js';

// ─── Mock helpers ──────────────────────────────────────────────────────────────

type RawLike = Record<string, unknown>;

function makeUser(opts: {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  roleColor?: number;
  roleName?: string;
  bot?: boolean;
}): RawLike {
  return {
    id: opts.id,
    username: opts.username,
    globalName: opts.displayName,
    discriminator: '0',
    bot: opts.bot ?? false,
    avatarURL: (_o: unknown) => opts.avatarUrl ?? null,
    defaultAvatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
  };
}

function makeMember(displayName: string, roleColor: number, roleName: string): RawLike {
  return {
    displayName,
    avatar: null,
    avatarURL: (_o: unknown) => null,
    roles: {
      highest: {
        color: roleColor,
        name: roleName,
      },
    },
  };
}

let _id = 1_200_000_000_000_000_000n;
function nextId(): string {
  return String(_id++);
}

function ts(base: number, offsetMin: number): number {
  return base + offsetMin * 60_000;
}

const BASE = new Date('2024-11-20T14:00:00.000Z').getTime();

// ─── Users ────────────────────────────────────────────────────────────────────

const ALICE = makeUser({
  id: '100000000000000001',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: 'https://cdn.discordapp.com/avatars/100000000000000001/a_alice.gif',
  roleColor: 0x5865f2,
  roleName: 'Moderator',
});

const BOB = makeUser({
  id: '100000000000000002',
  username: 'bob_dev',
  displayName: 'Bob',
  avatarUrl: 'https://cdn.discordapp.com/avatars/100000000000000002/bob.png',
});

const CHARLIE = makeUser({
  id: '100000000000000003',
  username: 'charlie',
  displayName: 'Charlie',
  avatarUrl: 'https://cdn.discordapp.com/avatars/100000000000000003/charlie.png',
  roleColor: 0x57f287,
  roleName: 'Member',
});

const HELPER_BOT = makeUser({
  id: '999000000000000001',
  username: 'helper-bot',
  displayName: 'HelperBot',
  bot: true,
});

const ALICE_MEMBER = makeMember('Alice', 0x5865f2, 'Moderator');
const CHARLIE_MEMBER = makeMember('Charlie', 0x57f287, 'Member');

// ─── Message factory ──────────────────────────────────────────────────────────

function msg(opts: {
  author: RawLike;
  member?: RawLike | null;
  content?: string;
  type?: number;
  offsetMin: number;
  attachments?: RawLike[];
  embeds?: RawLike[];
  reactions?: RawLike[];
  components?: unknown[];
  reference?: { messageId: string } | null;
  systemContent?: string;
  threadId?: string;
  threadName?: string;
}): RawLike {
  const id = nextId();
  const raw: RawLike = {
    id,
    type: opts.type ?? 0,
    content: opts.content ?? '',
    createdTimestamp: ts(BASE, opts.offsetMin),
    editedTimestamp: null,
    author: opts.author,
    member: opts.member ?? null,
    attachments: { values: () => (opts.attachments ?? []).values() },
    embeds: opts.embeds ?? [],
    reactions: { cache: { values: () => (opts.reactions ?? []).values() } },
    stickers: { values: () => ([] as RawLike[]).values() },
    components: opts.components ?? [],
    pinned: false,
    thread: null,
    reference: opts.reference ?? null,
  };

  if (opts.threadId) {
    (raw as Record<string, unknown>)._threadId = opts.threadId;
    (raw as Record<string, unknown>)._threadName = opts.threadName ?? opts.threadId;
  }

  return raw;
}

function reaction(emoji: string, count: number, emojiId?: string): RawLike {
  return {
    emoji: { id: emojiId ?? null, name: emoji, animated: false },
    count,
  };
}

function imageAttachment(filename: string, url: string, w: number, h: number): RawLike {
  return {
    id: nextId(),
    filename,
    url,
    size: 204_800,
    contentType: 'image/png',
    width: w,
    height: h,
  };
}

function fileAttachment(filename: string, url: string, size: number, contentType: string): RawLike {
  return {
    id: nextId(),
    filename,
    url,
    size,
    contentType,
    width: null,
    height: null,
  };
}

// ─── Build messages ────────────────────────────────────────────────────────────

const welcomeMsg = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: '👋 Welcome to **#general**! This is our main chat. Feel free to introduce yourself and say hi.',
  offsetMin: 0,
});

const joinSystem = msg({
  author: BOB,
  type: 7, // UserJoin
  content: '',
  offsetMin: 1,
});

const bobHello = msg({
  author: BOB,
  content: "Hey everyone! I'm Bob, a TypeScript dev. Happy to be here 🚀",
  offsetMin: 2,
});

const aliceReplyToBob = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: "Great to have you, Bob! Make sure to check out <#987654321> for project updates.",
  offsetMin: 3,
  reference: { messageId: String(bobHello.id) },
  type: 19,
});

const botAnnouncement = msg({
  author: HELPER_BOT,
  content: '',
  offsetMin: 5,
  embeds: [
    {
      type: 'rich',
      title: '📢 New release: v1.4.0',
      description: 'TranScriptor **v1.4.0** is now available!\n\n• Thread transcription support\n• Improved HTML rendering\n• Bug fixes and performance improvements',
      url: 'https://github.com/yazouv/TranScriptor/releases/tag/v1.4.0',
      color: 0x5865f2,
      timestamp: new Date(ts(BASE, 5)),
      fields: [
        { name: 'Downloads', value: '1,234', inline: true },
        { name: 'Stars', value: '892', inline: true },
        { name: 'License', value: 'MIT', inline: false },
      ],
      author: { name: 'GitHub', iconURL: null, url: null },
      footer: { text: 'Released on Nov 20, 2024', iconURL: null },
      thumbnail: null,
      image: null,
      video: null,
    },
  ],
});

const charlieCode = msg({
  author: CHARLIE,
  member: CHARLIE_MEMBER,
  content: "Here's a quick example of using the new threads option:\n```ts\nconst result = await createTranscript(channel, {\n  format: 'html',\n  output: 'file',\n  include: { threads: true },\n});\n```",
  offsetMin: 10,
});

const aliceImage = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: 'Screenshot of the new transcript output 👀',
  offsetMin: 12,
  attachments: [
    imageAttachment(
      'screenshot.png',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
      1280,
      720,
    ),
  ],
  reactions: [
    reaction('👀', 4),
    reaction('🔥', 7),
    reaction('❤️', 2),
  ],
});

const bobFile = msg({
  author: BOB,
  content: 'Also attaching the spec doc for reference:',
  offsetMin: 15,
  attachments: [
    fileAttachment(
      'spec-v2.pdf',
      'https://example.com/spec-v2.pdf',
      2_097_152,
      'application/pdf',
    ),
  ],
});

const charlieReactions = msg({
  author: CHARLIE,
  member: CHARLIE_MEMBER,
  content: '**This looks amazing!** Really impressed with the thread support 🎉\n> Threads are grouped after the main channel messages — perfect for keeping context.',
  offsetMin: 20,
  reactions: [
    reaction('🎉', 8),
    reaction('💯', 5),
  ],
});

// Next-day message
const nextDayMsg = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: 'Good morning! Ready for another productive day ☀️',
  offsetMin: 60 * 16, // +16h = next day
});

// Thread: Project Discussion
const thread1Alice = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: "Let's use this thread to track progress on the v1.5.0 milestone. First up: better CSS theming support.",
  offsetMin: 25,
  threadId: 'thread-100',
  threadName: 'v1.5.0 Planning',
});

const thread1Bob = msg({
  author: BOB,
  content: "I can take the CSS theming PR. Should be done by end of week.",
  offsetMin: 26,
  threadId: 'thread-100',
  threadName: 'v1.5.0 Planning',
});

const thread1Charlie = msg({
  author: CHARLIE,
  member: CHARLIE_MEMBER,
  content: "I'll handle the markdown improvements. Anyone want to pair on the tests?",
  offsetMin: 27,
  threadId: 'thread-100',
  threadName: 'v1.5.0 Planning',
});

const thread1AliceReply = msg({
  author: ALICE,
  member: ALICE_MEMBER,
  content: "Count me in for the tests, @Charlie! Let's set up a call Thursday.",
  offsetMin: 28,
  threadId: 'thread-100',
  threadName: 'v1.5.0 Planning',
  reactions: [{ emoji: { id: null, name: '👍', animated: false }, count: 3 }],
});

// Thread: Off-topic
const thread2Bob = msg({
  author: BOB,
  content: "Anyone else watching the new season? Just binged all 8 episodes 😅",
  offsetMin: 35,
  threadId: 'thread-101',
  threadName: 'Off-topic',
});

const thread2Charlie = msg({
  author: CHARLIE,
  member: CHARLIE_MEMBER,
  content: "Yes!! The finale was insane. No spoilers but... wow.",
  offsetMin: 36,
  threadId: 'thread-101',
  threadName: 'Off-topic',
  reactions: [{ emoji: { id: null, name: '🤯', animated: false }, count: 4 }],
});

// ─── All messages in order ────────────────────────────────────────────────────

const ALL_RAW = [
  welcomeMsg,
  joinSystem,
  bobHello,
  aliceReplyToBob,
  botAnnouncement,
  charlieCode,
  aliceImage,
  bobFile,
  charlieReactions,
  nextDayMsg,
  // Threads appended after main messages
  thread1Alice,
  thread1Bob,
  thread1Charlie,
  thread1AliceReply,
  thread2Bob,
  thread2Charlie,
];

const CHANNEL = {
  id: '987654321',
  name: 'general',
  guild: {
    name: 'TranScriptor Dev',
    iconURL: (_o: unknown) => 'https://cdn.discordapp.com/icons/123456789/server_icon.png',
  },
};

// ─── Generate transcripts ─────────────────────────────────────────────────────

async function generate(): Promise<void> {
  const outDir = join(import.meta.dir, '..', 'showcase');
  mkdirSync(outDir, { recursive: true });

  console.log('Generating showcase transcripts...');

  // HTML — full featured
  const htmlResult = await generateFromMessages(ALL_RAW, CHANNEL, {
    format: ExportFormat.HTML,
    output: OutputType.String,
    media: { strategy: 'reference' },
    poweredBy: true,
  });
  const htmlPath = join(outDir, 'general-transcript.html');
  writeFileSync(htmlPath, htmlResult.data as string, 'utf8');
  console.log(`✓ HTML  → ${htmlPath} (${htmlResult.messageCount} messages, ${htmlResult.durationMs}ms)`);

  // Markdown
  const mdResult = await generateFromMessages(ALL_RAW, CHANNEL, {
    format: ExportFormat.Markdown,
    output: OutputType.String,
    media: { strategy: 'reference' },
    poweredBy: true,
  });
  const mdPath = join(outDir, 'general-transcript.md');
  writeFileSync(mdPath, mdResult.data as string, 'utf8');
  console.log(`✓ MD    → ${mdPath} (${mdResult.messageCount} messages, ${mdResult.durationMs}ms)`);

  // TXT
  const txtResult = await generateFromMessages(ALL_RAW, CHANNEL, {
    format: 'txt',
    output: OutputType.String,
    media: { strategy: 'reference' },
    poweredBy: true,
  });
  const txtPath = join(outDir, 'general-transcript.txt');
  writeFileSync(txtPath, txtResult.data as string, 'utf8');
  console.log(`✓ TXT   → ${txtPath} (${txtResult.messageCount} messages, ${txtResult.durationMs}ms)`);

  // HTML — no reactions / no embeds (to show include options)
  const htmlMinResult = await generateFromMessages(ALL_RAW, CHANNEL, {
    format: ExportFormat.HTML,
    output: OutputType.String,
    include: { reactions: false, embeds: false },
    media: { strategy: 'none' },
    poweredBy: false,
    footerText: 'Exported {count} messages — no reactions, no embeds',
  });
  const htmlMinPath = join(outDir, 'general-transcript-minimal.html');
  writeFileSync(htmlMinPath, htmlMinResult.data as string, 'utf8');
  console.log(`✓ HTML minimal → ${htmlMinPath}`);

  console.log('\nDone! Open showcase/general-transcript.html in your browser.');
}

generate().catch(console.error);
