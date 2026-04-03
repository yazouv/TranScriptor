# Changelog

## [0.5.0](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.4.1...transcriptor-v0.5.0) (2026-04-03)


### Features

* add all TypeScript types and enums (NormalizedMessage, TranscriptOptions, etc.) ([5152101](https://github.com/yazouv/TranScriptor/commit/5152101152edbdefdfcfd985f484bdb2547c381a))
* add HTML exporter with Discord dark theme, embeds, reactions, spoilers, and lightbox ([27b3ea2](https://github.com/yazouv/TranScriptor/commit/27b3ea23bff2cc9b96f3d86920ba8f1d8e7cd35e))
* add MediaManager with download, WebP compression, manifest, and ZIP support ([6c749c4](https://github.com/yazouv/TranScriptor/commit/6c749c457672fb7f46c25fbc600f6974b0b6351a))
* add message fetcher with Discord pagination and batch chunker ([231b007](https://github.com/yazouv/TranScriptor/commit/231b007fd2e5e462cb77ec4488dae1c686d043a4))
* add message processors (attachment, embed, markdown parser, message normalizer) ([319174e](https://github.com/yazouv/TranScriptor/commit/319174e1929294f2934b60a8ed11671ae7667fc0))
* add public API (createTranscript, generateFromMessages) with full pipeline integration ([1c93817](https://github.com/yazouv/TranScriptor/commit/1c93817011490d371a1f8aa4afc6f6a2b38ccdfb))
* add TXT and Markdown exporters with streaming and author grouping ([f6d3a62](https://github.com/yazouv/TranScriptor/commit/f6d3a626e8eaf2f66f38f5f43d9daf2ef74d5c64))
* améliorer la gestion des médias avec compression et mise à jour des chemins locaux ([8415af0](https://github.com/yazouv/TranScriptor/commit/8415af0698e42e1dfb3f273ec1d8faa2f8e3b0e4))
* Components v2 (TextDisplay, MediaGallery, Container…) and gifv/video embed rendering ([98b620b](https://github.com/yazouv/TranScriptor/commit/98b620b51973f1af1b2f83fe47f8ceff79739765))


### Bug Fixes

* add repository field to fix npm provenance E422 ([3af38d0](https://github.com/yazouv/TranScriptor/commit/3af38d09762fbd71f0464dd71193e89a00674406))
* correct message order by reversing batches instead of flat buffer ([14a4163](https://github.com/yazouv/TranScriptor/commit/14a41634bf71dc250a5380792bd40515e0442e10))
* corrige les erreurs de validation dans le formulaire d'inscription ([821eb2f](https://github.com/yazouv/TranScriptor/commit/821eb2f5661c4d869c7996ba8c371d28c59bd873))
* markdown parser — twemoji name field, heading, masked links [text](url) ([c994ad3](https://github.com/yazouv/TranScriptor/commit/c994ad31095467dd362d967e3f7b23209201b941))
* mettre à jour les dépendances pour améliorer la compatibilité et la sécurité ([e9437d1](https://github.com/yazouv/TranScriptor/commit/e9437d183c1fd1b4ca2ae0b8499b0e4680f229d1))
* resolve all ESLint errors (unused vars, type imports) ([152f769](https://github.com/yazouv/TranScriptor/commit/152f769e7f759494ca76493f863d1112cdea31d0))
* resolve downloaded asset paths relative to HTML output directory ([866a8d9](https://github.com/yazouv/TranScriptor/commit/866a8d98ab6931df3f6f248ee279c2c9e7727f09))
* test publish workflow ([f6020fb](https://github.com/yazouv/TranScriptor/commit/f6020fba9b12e479e57bbb35b751f15ab7885a36))
* undefined array access in renderNodes (strict noUncheckedIndexedAccess) ([a6b8f7c](https://github.com/yazouv/TranScriptor/commit/a6b8f7c22a021bd4788c5b7a519c3004746db840))


### Documentation

* add README (EN/FR), CLAUDE.md conventions, and PLAN.md ([bbbfe59](https://github.com/yazouv/TranScriptor/commit/bbbfe5965cb07ff9e975782d88d4b9c387176ef5))

## [0.4.1](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.4.0...transcriptor-v0.4.1) (2026-04-03)


### Bug Fixes

* corrige les erreurs de validation dans le formulaire d'inscription ([821eb2f](https://github.com/yazouv/TranScriptor/commit/821eb2f5661c4d869c7996ba8c371d28c59bd873))
* mettre à jour les dépendances pour améliorer la compatibilité et la sécurité ([e9437d1](https://github.com/yazouv/TranScriptor/commit/e9437d183c1fd1b4ca2ae0b8499b0e4680f229d1))

## [0.4.0](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.3.1...transcriptor-v0.4.0) (2026-04-03)


### Features

* améliorer la gestion des médias avec compression et mise à jour des chemins locaux ([8415af0](https://github.com/yazouv/TranScriptor/commit/8415af0698e42e1dfb3f273ec1d8faa2f8e3b0e4))

## [0.3.1](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.3.0...transcriptor-v0.3.1) (2026-03-26)


### Bug Fixes

* undefined array access in renderNodes (strict noUncheckedIndexedAccess) ([a6b8f7c](https://github.com/yazouv/TranScriptor/commit/a6b8f7c22a021bd4788c5b7a519c3004746db840))

## [0.3.0](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.2.2...transcriptor-v0.3.0) (2026-03-26)


### Features

* Components v2 (TextDisplay, MediaGallery, Container…) and gifv/video embed rendering ([98b620b](https://github.com/yazouv/TranScriptor/commit/98b620b51973f1af1b2f83fe47f8ceff79739765))


### Bug Fixes

* correct message order by reversing batches instead of flat buffer ([14a4163](https://github.com/yazouv/TranScriptor/commit/14a41634bf71dc250a5380792bd40515e0442e10))
* markdown parser — twemoji name field, heading, masked links [text](url) ([c994ad3](https://github.com/yazouv/TranScriptor/commit/c994ad31095467dd362d967e3f7b23209201b941))
* resolve downloaded asset paths relative to HTML output directory ([866a8d9](https://github.com/yazouv/TranScriptor/commit/866a8d98ab6931df3f6f248ee279c2c9e7727f09))

## [0.2.2](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.2.1...transcriptor-v0.2.2) (2026-03-26)


### Bug Fixes

* add repository field to fix npm provenance E422 ([3af38d0](https://github.com/yazouv/TranScriptor/commit/3af38d09762fbd71f0464dd71193e89a00674406))

## [0.2.1](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.2.0...transcriptor-v0.2.1) (2026-03-26)


### Bug Fixes

* test publish workflow ([f6020fb](https://github.com/yazouv/TranScriptor/commit/f6020fba9b12e479e57bbb35b751f15ab7885a36))

## [0.2.0](https://github.com/yazouv/TranScriptor/compare/transcriptor-v0.1.0...transcriptor-v0.2.0) (2026-03-26)


### Features

* add all TypeScript types and enums (NormalizedMessage, TranscriptOptions, etc.) ([5152101](https://github.com/yazouv/TranScriptor/commit/5152101152edbdefdfcfd985f484bdb2547c381a))
* add HTML exporter with Discord dark theme, embeds, reactions, spoilers, and lightbox ([27b3ea2](https://github.com/yazouv/TranScriptor/commit/27b3ea23bff2cc9b96f3d86920ba8f1d8e7cd35e))
* add MediaManager with download, WebP compression, manifest, and ZIP support ([6c749c4](https://github.com/yazouv/TranScriptor/commit/6c749c457672fb7f46c25fbc600f6974b0b6351a))
* add message fetcher with Discord pagination and batch chunker ([231b007](https://github.com/yazouv/TranScriptor/commit/231b007fd2e5e462cb77ec4488dae1c686d043a4))
* add message processors (attachment, embed, markdown parser, message normalizer) ([319174e](https://github.com/yazouv/TranScriptor/commit/319174e1929294f2934b60a8ed11671ae7667fc0))
* add public API (createTranscript, generateFromMessages) with full pipeline integration ([1c93817](https://github.com/yazouv/TranScriptor/commit/1c93817011490d371a1f8aa4afc6f6a2b38ccdfb))
* add TXT and Markdown exporters with streaming and author grouping ([f6d3a62](https://github.com/yazouv/TranScriptor/commit/f6d3a626e8eaf2f66f38f5f43d9daf2ef74d5c64))


### Bug Fixes

* resolve all ESLint errors (unused vars, type imports) ([152f769](https://github.com/yazouv/TranScriptor/commit/152f769e7f759494ca76493f863d1112cdea31d0))


### Documentation

* add README (EN/FR), CLAUDE.md conventions, and PLAN.md ([bbbfe59](https://github.com/yazouv/TranScriptor/commit/bbbfe5965cb07ff9e975782d88d4b9c387176ef5))
