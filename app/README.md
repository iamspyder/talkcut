# TalkCut desktop development

See the workspace README for setup, core tools and project credits.

## Storage

Packaged installations store the catalog, imported media, models, projects and jobs in Electron's userData/media-library directory. On Windows this is normally `%APPDATA%/TalkCut/media-library`. Development web mode uses `app/data`. Existing web projects remain there and are not deleted or silently migrated; import project backups and original media as needed. A project JSON contains edit decisions, not embedded source media.

## Runtime

Electron creates a loopback backend on an automatically allocated port with a per-launch random session token. The renderer has no Node integration, uses context isolation/sandboxing, cannot navigate to external websites and uses a small preload bridge for update status. FFmpeg, probing, transcription, cleanup planning and DeepFilterNet inference execute in the main process or native helpers. Browser media elements display the preview; device capture uses Chromium's media APIs.

Transcription downloads only the model selected by the user. Downloads use the official model repository, fixed expected lengths and SHA-256 digests. A `.part` file is never treated as an installed model. Network access is required for this one-time setup; core editing thereafter works offline. Large models use significantly more RAM/time.

Studio Sound prepares a cached derivative of each selected source. The original is retained. Before/After switches media sources at the current playhead position. Exports use cleaned PCM audio when Studio Sound is enabled. The cache is independent of transcript cuts, so the same source can be reused. This is not zero-latency neural processing while recording.

Cloud routes reject requests until Optional AI is enabled in local settings, even if environment variables contain provider keys. Keys typed into the UI remain in memory. Updates require an explicit user check/download; unavailable network or unpublished releases do not prevent editing.

## Commands

- `npm run desktop`: desktop development shell using the existing production UI build.
- `npm run build`: compile the UI.
- `npm run dev`: optional local web development server.
- `npm test`: unit, provider-mock and real FFmpeg compositor checks.
- `npm run test:offline`: installed desktop import/transcription/cleanup/preview/export check, with application external network requests blocked after model setup.
- `npm run dist`: current-platform installer with publishing disabled.

The Windows launcher uses an available packaged build before falling back to the development Electron binary. Closing the desktop app stops its backend. The old manually launched web servers are separate processes.

## Release configuration

The target is GitHub Releases at iamspyder/talkcut. The repository must exist and published releases must include installer/update metadata. Configure signing secrets before public release; macOS updating requires signed builds. CI creates drafts for version tags and never embeds GitHub credentials in the application.

## Verification artifacts

Test reports, screenshots and sample export metadata are written to `app/qa`. Offline desktop tests use isolated data and do not replace personal projects. The offline test uses process-level outbound network denial, without disconnecting the user's other applications or changing system network adapters.

## First-run UI checks

The polished first-run UI has a collapsed inspector, one Import action, combined Clean up with preview counts and one Undo, preview Studio Sound A/B, persistent dark mode, a once-only three-step tour, and approximate export time remaining. The bundled 20-second sample includes a transcript and preprocessed audio, so it works without downloading a transcription model.

To rerun the UI check against the packaged Windows app from the app folder:

```powershell
$env:TALKCUT_TEST_EXE = (Resolve-Path 'release/win-unpacked/TalkCut.exe').Path
node scripts/polish-check.mjs
```

It uses isolated data, blocks external requests, verifies real sample import/playback/cleanup/export and drag-and-drop, and captures light/dark images at 1280×720 and 1920×1080. Reports and screenshots are under `qa/polish/`.
