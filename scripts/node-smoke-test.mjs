// Guards against a real bug: Bun and Node resolve `import('discord-markdown-parser')`
// differently. Under real Node's CJS→ESM interop, `mod.default` for a CJS module is
// the whole `module.exports` object, not whatever the module itself assigned to
// `exports.default` — so a naive `mod.default ?? mod` silently breaks parsing for
// every message, on every consumer, since our real users (Discord bots) run on Node.
// The vitest suite runs under Bun and never catches this, so this script runs the
// built dist/index.cjs under plain `node` as part of CI.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { generateFromMessages } = require('../dist/index.cjs');

const fakeMessage = {
  id: '1',
  content: '## Heading\n**bold** <@391597830932004864> <@&899971181170544640>',
  createdTimestamp: Date.now(),
  author: { id: '999', username: 'Bot', bot: true, avatarURL: () => null, defaultAvatarURL: null },
  attachments: [],
  embeds: [],
  stickers: [],
  reactions: [],
  components: [],
};

const channel = {
  id: 'c1',
  name: 'smoke-test',
  guild: { name: 'Test Guild', iconURL: () => null },
  messages: { fetch: async () => new Map() },
};

const { data } = await generateFromMessages([fakeMessage], channel, {
  format: 'html',
  output: 'string',
});

assert.match(data, /<h2 class="discord-heading">Heading<\/h2>/, 'heading was not parsed to HTML under Node');
assert.match(data, /<strong>bold<\/strong>/, 'bold was not parsed to HTML under Node');
assert.match(data, /<span class="mention">@391597830932004864<\/span>/, 'user mention was not parsed to HTML under Node');
assert.match(data, /<span class="mention role-mention">@899971181170544640<\/span>/, 'role mention was not parsed to HTML under Node');
assert.doesNotMatch(data, /&lt;@391597830932004864&gt;/, 'raw mention leaked into output — parser silently failed under Node');

console.log('✓ Node smoke test passed — markdown parsing works under real Node, not just Bun');
