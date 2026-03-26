# TranScriptor

> Bibliothèque TypeScript pour exporter des salons Discord en transcripts (HTML, Markdown, TXT) — optimisée pour les gros volumes.

## Pourquoi TranScriptor ?

Les solutions existantes (discord-html-transcripts) intègrent les images en base64 directement dans le HTML, ce qui génère des fichiers de plusieurs centaines de Mo impossibles à ouvrir. TranScriptor résout ce problème avec des stratégies d'export configurables et un pipeline en streaming qui ne charge jamais tout en RAM.

## Fonctionnalités

- **3 formats de sortie** : HTML, Markdown, TXT
- **4 stratégies média** : `reference` | `download` | `inline` | `none`
- **Granularité complète** : activer/désactiver images, vidéos, fichiers, réactions, embeds, stickers, threads
- **Streaming natif** : traitement par batches, mémoire constante quelle que soit la taille du salon
- **Compression optionnelle** : WebP via `sharp` (peer dep optionnelle)
- **Export zip** : dossier `/assets/` zippable automatiquement
- **Manifeste JSON** : liste tous les assets exportés avec métadonnées

## Installation

```bash
npm install transcriptor
# ou
pnpm add transcriptor
```

Peer dependencies :
```bash
npm install discord.js
# Optionnel — compression images
npm install sharp
```

## Usage rapide

```typescript
import { createTranscript } from 'transcriptor';

// Export minimal — URLs Discord originales, pas de téléchargement
const buffer = await createTranscript(channel, {
  format: 'html',
  output: 'buffer',
});

// Export complet avec assets téléchargés
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
    strategy: 'download',    // télécharge dans /assets/
    downloadPath: './assets',
    maxSizeMB: 5,
    compress: true,
    compressQuality: 80,
    concurrency: 5,
  },
});

// À partir de messages déjà récupérés
import { generateFromMessages } from 'transcriptor';

const transcript = await generateFromMessages(messages, channel, {
  format: 'markdown',
  output: 'string',
});
```

## Stratégies média

| Stratégie | Description | Taille fichier | Autonome |
|-----------|-------------|----------------|---------|
| `reference` | URLs Discord originales *(défaut)* | Minimal | Non (expire ~14j) |
| `download` | Téléchargement dans `/assets/` | Moyen | Oui |
| `inline` | Base64 embarqué | Très lourd | Oui |
| `none` | Placeholder texte `[Image: ...]` | Minimal | Oui |

## Options complètes

```typescript
interface TranscriptOptions {
  format: 'html' | 'markdown' | 'txt';
  output: 'buffer' | 'string' | 'stream' | 'file';
  outputPath?: string;       // requis si output === 'file'

  include?: {
    images?: boolean;        // défaut: true
    videos?: boolean;        // défaut: true
    files?: boolean;         // défaut: true
    reactions?: boolean;     // défaut: true
    embeds?: boolean;        // défaut: true
    stickers?: boolean;      // défaut: true
    threads?: boolean;       // défaut: false
  };

  media?: {
    strategy?: 'reference' | 'download' | 'inline' | 'none';
    downloadPath?: string;
    maxSizeMB?: number;      // défaut: 8
    compress?: boolean;      // défaut: false (nécessite sharp)
    compressQuality?: number; // défaut: 80
    concurrency?: number;    // défaut: 3
    zip?: boolean;           // défaut: false — zipper le dossier assets
  };

  limit?: number;            // défaut: -1 (tous)
  chunkSize?: number;        // défaut: 1000
  filter?: (msg: Message) => boolean;

  poweredBy?: boolean;       // défaut: true
  footerText?: string;       // ex: 'Exported {count} messages'
  filename?: string;
}
```

## Licence

MIT
