# PLAN.md — TranScriptor

Detailed development plan, phases and tasks.

## Global status

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Done | Docs (README, README-FR, CLAUDE.md, PLAN.md) |
| 1 | ✅ Done | Setup + Types + Fetcher + Processors |
| 2 | ✅ Done | Exporters TXT + Markdown |
| 3 | ✅ Done | HTML Exporter |
| 4 | ✅ Done | Advanced media handling (download, compress, zip) |
| 5 | ✅ Done | Tests (45/45 passing) |

---

## Phase 1 — Foundations

### 1.1 Project setup
- [x] `package.json` (name, version, exports, peer deps)
- [x] `tsconfig.json` (strict, ESM, target ES2022)
- [x] `eslint.config.js` + `.prettierrc`
- [x] `.gitignore`
- [x] `vitest.config.ts`

### 1.2 Types (`src/types.ts`)
- [x] `TranscriptOptions` — full public API options
- [x] `IncludeOptions` — content granularity
- [x] `MediaOptions` — media strategy and config
- [x] `NormalizedMessage` — internal message format
- [x] `NormalizedAttachment` — normalized attachment
- [x] `NormalizedEmbed` — normalized embed
- [x] `NormalizedReaction` — normalized reaction
- [x] `NormalizedUser` — normalized user
- [x] `ExportResult` — export result
- [x] `MediaManifest` — downloaded assets manifest
- [x] Enums: `ExportFormat`, `OutputType`, `MediaStrategy`, `AttachmentType`, `MessageType`

### 1.3 Fetcher (`src/fetcher/`)
- [x] `index.ts` — `fetchMessages(channel, options)` with Discord pagination
- [x] `chunker.ts` — splits an AsyncIterable into batches of N messages

### 1.4 Processors (`src/processors/`)
- [x] `attachment.ts` — `normalizeAttachment(att): NormalizedAttachment` (MIME type detection)
- [x] `embed.ts` — `normalizeEmbed(embed): NormalizedEmbed`
- [x] `markdown.ts` — `parseDiscordMarkdown(content: string): string` (discord-markdown-parser wrapper)
- [x] `message.ts` — `normalizeMessage(msg: Message): NormalizedMessage`

### 1.5 Public API (`src/index.ts`)
- [x] `createTranscript(channel, options)` — main entry point
- [x] `generateFromMessages(messages, channel, options)` — from pre-fetched messages

---

## Phase 2 — Exporters TXT + Markdown

### 2.1 Base (`src/exporters/base.ts`)
- [x] `BaseExporter` class with shared helpers (date formatting, byte formatting, streaming)

### 2.2 TXT (`src/exporters/txt/index.ts`)
- [x] Format: `[2024-01-15 14:32] Username: message content`
- [x] Attachments: `[IMAGE: filename.ext (2.3 MB)]` with URL
- [x] Reactions: `Reactions: 👍 5  ❤️ 3`
- [x] Embeds: `[Embed: Title — description]`
- [x] Line-by-line streaming

### 2.3 Markdown (`src/exporters/markdown/index.ts`)
- [x] Document header (channel name, export date)
- [x] Each message: `**Author** · timestamp` block
- [x] Images: `![filename](url)`
- [x] Files: `[filename.pdf](url)`
- [x] Reactions: `> 👍 5 · ❤️ 3`
- [x] Day separator: `### June 15, 2024`
- [x] Author grouping (consecutive messages, same author, <5 min)

---

## Phase 3 — HTML Exporter

### 3.1 Template (`src/exporters/html/template.ts`)
- [x] Base HTML structure with inlined CSS
- [x] Discord dark theme (colors, fonts, CSS variables)
- [x] CSS variables for dark/light theming (`prefers-color-scheme`)
- [x] CSS for: messages, avatars, embeds, attachments, reactions, timestamps, spoilers, lightbox

### 3.2 Renderer (`src/exporters/html/renderer.ts`)
- [x] `renderMessageHtml(msg, prev, options): Promise<string>`
- [x] `renderAttachment` — image/video/audio/file with `loading="lazy"`
- [x] `renderEmbed` — full embed with color bar, author, fields, image, footer
- [x] `renderReactions` — emoji + count badges
- [x] `renderReplyBar` — reply reference with author + preview
- [x] `renderSticker`
- [x] System message rendering
- [x] `isContinuation()` — author grouping logic
- [x] Emoji-only message detection (large emoji rendering)

### 3.3 Orchestrator (`src/exporters/html/index.ts`)
- [x] Streaming write (header → batched messages → footer)
- [x] Day separators
- [x] Inline patch script to update message count after streaming
- [x] Image lightbox (click to zoom)
- [x] Spoiler reveal (click to show)
- [x] Scroll-to-message (`data-goto`)

---

## Phase 4 — Advanced media handling

### 4.1 Downloader (`src/media/downloader.ts`)
- [x] `AssetDownloader.download(url)` with result caching
- [x] Size limit enforcement (`maxSizeMB`) — checked via `Content-Length` and during stream
- [x] Concurrency queue (`Semaphore` — no extra dep)
- [x] 2x retry with exponential backoff on network error
- [x] Unique filename generation with dedup suffix

### 4.2 Optimizer (`src/media/optimizer.ts`)
- [x] Runtime detection of `sharp` (cached dynamic import)
- [x] WebP conversion with configurable quality
- [x] Only replaces file if WebP is smaller
- [x] Graceful fallback when `sharp` is not installed

### 4.3 Manifest (`src/media/manifest.ts`)
- [x] `ManifestBuilder` — accumulates entries, builds final manifest
- [x] Writes `manifest.json` to output folder

### 4.4 MediaManager (`src/media/index.ts`)
- [x] Wraps the normalized message stream — resolves all `resolvedUrl` fields in-place
- [x] Handles all strategies: `reference` / `download` / `inline` / `none`
- [x] Processes attachments, embed media, and stickers
- [x] `zip: true` option — archives assets folder with `archiver` (optional peer dep)
- [x] Integrated into main pipeline in `src/index.ts`

---

## Phase 5 — Tests

### 5.1 Fixtures (`tests/fixtures/messages.ts`)
- [x] 13 representative `NormalizedMessage` fixtures
- [x] Covers: plain text, replies, images, spoilers, files, embeds, reactions, markdown, system msgs, edited msgs, multi-day

### 5.2 Processor tests (`tests/processors.test.ts`) — 17 tests
- [x] `normalizeAttachment`: type detection (MIME + extension fallback), spoiler flag, resolvedUrl default
- [x] `normalizeEmbed`: full embed, missing optional fields
- [x] `normalizeMessage`: default/reply/system types, replyTo resolution
- [x] `parseDiscordMarkdown` / `stripDiscordMarkdown`: empty input, XSS escaping

### 5.3 Exporter tests (`tests/exporters.test.ts`) — 28 tests
- [x] TXT: header, message format, system msgs, attachment strategies, reactions toggle, footer, day separators
- [x] Markdown: header, image/file rendering, reactions, embed, author grouping, day separators
- [x] HTML: DOCTYPE structure, channel name, lazy images, spoiler class, reactions toggle, system msgs, XSS safety, CSS/JS presence, message count patch

---

## Architecture decisions

| Decision | Reason |
|----------|--------|
| No React | Too heavy for SSR at large volumes; template strings are sufficient |
| Native streaming | Constant memory regardless of channel size |
| Normalized internal format | Decouples exporters from discord.js |
| `sharp` as optional peer dep | Avoids forcing a native C++ dep on all users |
| `strategy: 'reference'` as default | Lightest and fastest; base64 inline is opt-in |
| No React/JSX dependency | Smaller attack surface, simpler build |
| Custom semaphore for concurrency | No extra dep (`p-limit` etc.) needed |
| Lazy exporter loading | Only the requested format is imported |

## Open questions

- **Threads**: treat as nested channels or indented messages?
- **Stickers**: Lottie URLs (animated JSON) — convert to GIF or raw link?
- **Voice messages**: render as `<audio>` element or placeholder?
- **Forum channels**: support post-Phase 1?

## Known gaps (future work)

- MediaManager tests with mock HTTP server (msw/nock) — skipped in Phase 5
- Benchmark suite (1k / 10k / 50k messages)
- Typed error classes (`TranscriptorError`, `MediaDownloadError`, `ExportError`)
- Input validation on `TranscriptOptions`
- `tsup` build script validation
