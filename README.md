# TranScriptor

> TypeScript library to export Discord channels as transcripts (HTML, Markdown, TXT) — built for large volumes.

## Why TranScriptor?

Existing solutions (like discord-html-transcripts) embed images as base64 directly inside the HTML, producing files hundreds of megabytes in size that are impossible to open. TranScriptor solves this with configurable media strategies and a streaming pipeline that never loads the entire channel into memory.

## Features

- **3 output formats** — HTML, Markdown, TXT
- **4 media strategies** — `reference` | `download` | `inline` | `none`
- **Fine-grained control** — toggle images, videos, files, reactions, embeds, stickers, and threads independently
- **Native streaming** — batch processing, constant memory usage regardless of channel size
- **Optional compression** — WebP via `sharp` (optional peer dep)
- **ZIP export** — automatically archive the `/assets/` folder
- **JSON manifest** — lists every exported asset with metadata

## Installation

```bash
npm install transcriptor
# or
pnpm add transcriptor
```

Peer dependencies:
```bash
npm install discord.js

# Optional — image compression
npm install sharp
```

## Quick start

```typescript
import { createTranscript } from 'transcriptor';

// Minimal export — original Discord URLs, no downloading
const buffer = await createTranscript(channel, {
  format: 'html',
  output: 'buffer',
});

// Full export with downloaded assets
await createTranscript(channel, {
  format: 'html',
  output: 'file',
  outputPath: './exports',

  include: {
    images: true,
    videos: false,
    files: true,
    reactions: true,
    embeds: true,
    stickers: false,
    threads: false,
  },

  media: {
    strategy: 'download',  // download to /assets/
    downloadPath: './assets',
    maxSizeMB: 5,
    compress: true,
    compressQuality: 80,
    concurrency: 5,
  },
});

// From already-fetched messages
import { generateFromMessages } from 'transcriptor';

const transcript = await generateFromMessages(messages, channel, {
  format: 'markdown',
  output: 'string',
});
```

## Media strategies

| Strategy | Description | File size | Self-contained |
|----------|-------------|-----------|----------------|
| `reference` | Original Discord URLs *(default)* | Minimal | No (expire ~14d) |
| `download` | Downloads assets to `/assets/` | Medium | Yes |
| `inline` | Base64 embedded | Very large | Yes |
| `none` | Text placeholder `[Image: ...]` | Minimal | Yes |

## Full options

```typescript
interface TranscriptOptions {
  format: 'html' | 'markdown' | 'txt';
  output: 'buffer' | 'string' | 'stream' | 'file';
  outputPath?: string;        // required when output === 'file'

  include?: {
    images?: boolean;         // default: true
    videos?: boolean;         // default: true
    files?: boolean;          // default: true
    reactions?: boolean;      // default: true
    embeds?: boolean;         // default: true
    stickers?: boolean;       // default: true
    threads?: boolean;        // default: false
  };

  media?: {
    strategy?: 'reference' | 'download' | 'inline' | 'none';
    downloadPath?: string;
    maxSizeMB?: number;       // default: 8
    compress?: boolean;       // default: false (requires sharp)
    compressQuality?: number; // default: 80
    concurrency?: number;     // default: 3
    zip?: boolean;            // default: false — zip the assets folder
  };

  limit?: number;             // default: -1 (all messages)
  chunkSize?: number;         // default: 1000
  filter?: (msg: Message) => boolean;

  poweredBy?: boolean;        // default: true
  footerText?: string;        // e.g. 'Exported {count} messages'
  filename?: string;
}
```

## License

MIT
