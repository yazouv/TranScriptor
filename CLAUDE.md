# CLAUDE.md — TranScriptor

Contexte et conventions pour ce projet.

## Vue d'ensemble

TranScriptor est une bibliothèque TypeScript (pas une app) qui exporte des salons Discord en fichiers de transcript (HTML, Markdown, TXT). Elle est conçue pour remplacer `discord-html-transcripts` avec une meilleure gestion des médias et un pipeline en streaming pour les gros volumes.

## Contraintes clés

- **Pas de React** — les templates HTML sont générés via template strings ou un moteur léger. Trop lourd pour du SSR sur 50k messages.
- **Streaming natif** — l'export doit écrire par batches, jamais tout en RAM. Utiliser les Node.js Readable/Writable streams.
- **Zéro dépendance lourde obligatoire** — `sharp` et `archiver` sont des peer deps optionnelles. Le code doit fonctionner sans elles (avec fallback).
- **TypeScript strict** — `strict: true` dans tsconfig. Pas de `any` sauf cas justifié avec commentaire.
- **discord.js v14 et v15** — supporter les deux versions en peer dep.

## Structure du projet

```
src/
├── index.ts              # API publique uniquement (re-exports)
├── types.ts              # Tous les types et interfaces
├── fetcher/              # Récupération paginée des messages Discord
├── processors/           # Normalisation messages → format interne
├── exporters/            # HTML | Markdown | TXT
│   ├── base.ts           # Interface ExporterBase commune
│   ├── html/
│   ├── markdown/
│   └── txt/
├── media/                # Téléchargement, compression, manifeste
└── utils/                # Helpers purs (emoji, format, stream)
```

## Conventions de code

- Fichiers en `camelCase.ts`, classes en `PascalCase`
- Interfaces préfixées `I` uniquement pour les interfaces de base (`IExporter`)
- Types exportés depuis `types.ts`, pas éparpillés dans les modules
- Erreurs : classes custom étendant `Error` (ex: `TranscriptorError`, `MediaDownloadError`)
- Logs : aucun `console.log` en prod — utiliser un logger injectable via options (`onProgress`, `onError` callbacks)

## Format interne normalisé

Les messages Discord sont normalisés en `NormalizedMessage` avant d'arriver aux exporters. Les exporters ne touchent jamais directement les types discord.js. Cela découple les exporters de la version de discord.js utilisée.

## Gestion des médias

La stratégie est définie dans `media.strategy` :
- `reference` → URL Discord brute (défaut, léger)
- `download` → téléchargement local dans `media.downloadPath`
- `inline` → base64 data URI (lourd, éviter)
- `none` → placeholder texte

Le `MediaManager` déduplique les URLs avant téléchargement et respecte `media.concurrency`.

## Tests

- Framework : Vitest
- Pas de mocks Discord.js — utiliser des fixtures JSON de messages normalisés
- Tester chaque exporter indépendamment avec des `NormalizedMessage[]` en entrée
- Tester le MediaManager avec un serveur HTTP mock (msw ou nock)

## Commandes utiles

```bash
pnpm build        # Compile TypeScript → dist/
pnpm test         # Lance Vitest
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
```
