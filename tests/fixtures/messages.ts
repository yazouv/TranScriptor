import type { NormalizedMessage, NormalizedUser } from '../../src/types.js';
import { AttachmentType, MessageType } from '../../src/types.js';

// ─── Reusable users ───────────────────────────────────────────────────────────

export const USER_ALICE: NormalizedUser = {
  id: '100000000000000001',
  username: 'alice',
  displayName: 'Alice',
  discriminator: '0',
  avatarURL: 'https://cdn.discordapp.com/avatars/100000000000000001/abc.png',
  bot: false,
  roleColor: '#5865f2',
  topRole: 'Moderator',
};

export const USER_BOB: NormalizedUser = {
  id: '100000000000000002',
  username: 'bob',
  displayName: 'Bob',
  discriminator: '0',
  avatarURL: null,
  bot: false,
  roleColor: null,
  topRole: null,
};

export const USER_BOT: NormalizedUser = {
  id: '100000000000000003',
  username: 'helper-bot',
  displayName: 'HelperBot',
  discriminator: '0',
  avatarURL: null,
  bot: true,
  roleColor: null,
  topRole: null,
};

// ─── Timestamp helpers ────────────────────────────────────────────────────────

const BASE_TIME = new Date('2024-06-15T10:00:00.000Z').getTime();
const MIN = 60_000;

export function ts(offsetMinutes: number): Date {
  return new Date(BASE_TIME + offsetMinutes * MIN);
}

// ─── Message factory ──────────────────────────────────────────────────────────

let idCounter = 900000000000000000n;
function nextId(): string {
  return String(idCounter++);
}

function base(overrides: Partial<NormalizedMessage>): NormalizedMessage {
  return {
    id: nextId(),
    type: MessageType.Default,
    author: USER_ALICE,
    content: '',
    contentHTML: null,
    timestamp: ts(0),
    editedTimestamp: null,
    attachments: [],
    embeds: [],
    reactions: [],
    stickers: [],
    replyTo: null,
    pinned: false,
    threadId: null,
    components: [],
    systemContent: null,
    ...overrides,
  };
}

// ─── Fixture dataset ──────────────────────────────────────────────────────────

export const MSG_PLAIN = base({
  author: USER_ALICE,
  content: 'Hello, world!',
  timestamp: ts(0),
});

export const MSG_BOB_PLAIN = base({
  author: USER_BOB,
  content: 'Hey Alice!',
  timestamp: ts(1),
});

export const MSG_CONTINUATION = base({
  author: USER_ALICE,
  content: 'Continued message from Alice.',
  timestamp: ts(2), // same author, within 5 min
});

export const MSG_WITH_REPLY = base({
  author: USER_BOB,
  content: 'That is great!',
  timestamp: ts(10),
  replyTo: MSG_PLAIN,
});

export const MSG_WITH_IMAGE = base({
  author: USER_ALICE,
  content: 'Check this out:',
  timestamp: ts(20),
  attachments: [
    {
      id: 'att-001',
      type: AttachmentType.Image,
      url: 'https://cdn.discordapp.com/attachments/123/456/photo.png',
      resolvedUrl: 'https://cdn.discordapp.com/attachments/123/456/photo.png',
      filename: 'photo.png',
      size: 204_800,
      contentType: 'image/png',
      width: 800,
      height: 600,
      spoiler: false,
    },
  ],
});

export const MSG_WITH_SPOILER_IMAGE = base({
  author: USER_BOB,
  content: '',
  timestamp: ts(21),
  attachments: [
    {
      id: 'att-002',
      type: AttachmentType.Image,
      url: 'https://cdn.discordapp.com/attachments/123/456/SPOILER_secret.png',
      resolvedUrl: 'https://cdn.discordapp.com/attachments/123/456/SPOILER_secret.png',
      filename: 'SPOILER_secret.png',
      size: 51_200,
      contentType: 'image/png',
      width: 400,
      height: 300,
      spoiler: true,
    },
  ],
});

export const MSG_WITH_FILE = base({
  author: USER_ALICE,
  content: 'Attached document:',
  timestamp: ts(30),
  attachments: [
    {
      id: 'att-003',
      type: AttachmentType.File,
      url: 'https://cdn.discordapp.com/attachments/123/789/report.pdf',
      resolvedUrl: 'https://cdn.discordapp.com/attachments/123/789/report.pdf',
      filename: 'report.pdf',
      size: 1_048_576,
      contentType: 'application/pdf',
      width: null,
      height: null,
      spoiler: false,
    },
  ],
});

export const MSG_WITH_EMBED = base({
  author: USER_BOT,
  content: '',
  timestamp: ts(40),
  embeds: [
    {
      type: 'rich',
      title: 'Example Embed',
      description: 'This is an embed description.',
      url: 'https://example.com',
      color: 0x5865f2,
      timestamp: ts(40),
      fields: [
        { name: 'Field 1', value: 'Value 1', inline: true },
        { name: 'Field 2', value: 'Value 2', inline: true },
      ],
      author: { name: 'Embed Author', iconURL: null, url: null },
      footer: { text: 'Footer text', iconURL: null },
      thumbnail: null,
      image: {
        url: 'https://example.com/image.png',
        resolvedUrl: 'https://example.com/image.png',
        width: 400,
        height: 200,
      },
      video: null,
    },
  ],
});

export const MSG_WITH_REACTIONS = base({
  author: USER_ALICE,
  content: 'React to this!',
  timestamp: ts(50),
  reactions: [
    { emoji: '👍', emojiURL: null, count: 5, animated: false },
    { emoji: '❤️', emojiURL: null, count: 3, animated: false },
    {
      emoji: ':hype:',
      emojiURL: 'https://cdn.discordapp.com/emojis/999888777.png',
      count: 12,
      animated: false,
    },
  ],
});

export const MSG_WITH_MARKDOWN = base({
  author: USER_BOB,
  content: '**bold** _italic_ `code` ~~strike~~',
  timestamp: ts(60),
});

export const MSG_SYSTEM_JOIN = base({
  type: MessageType.System,
  author: USER_ALICE,
  content: '',
  timestamp: ts(70),
  systemContent: 'Alice joined the server.',
});

export const MSG_EDITED = base({
  author: USER_ALICE,
  content: 'This message was edited.',
  timestamp: ts(80),
  editedTimestamp: ts(81),
});

// Next-day message to test day separator
export const MSG_NEXT_DAY = base({
  author: USER_BOB,
  content: 'Good morning!',
  timestamp: new Date('2024-06-16T08:00:00.000Z'),
});

/** Full fixture set in chronological order */
export const ALL_MESSAGES: NormalizedMessage[] = [
  MSG_PLAIN,
  MSG_BOB_PLAIN,
  MSG_CONTINUATION,
  MSG_WITH_REPLY,
  MSG_WITH_IMAGE,
  MSG_WITH_SPOILER_IMAGE,
  MSG_WITH_FILE,
  MSG_WITH_EMBED,
  MSG_WITH_REACTIONS,
  MSG_WITH_MARKDOWN,
  MSG_SYSTEM_JOIN,
  MSG_EDITED,
  MSG_NEXT_DAY,
];

/** Minimal channel info for tests */
export const TEST_CHANNEL = {
  id: '987654321',
  name: 'general',
  guild: { name: 'Test Server', iconURL: () => null },
};
