# Changelog

## [1.0.2] — 2026-10-18

- Retry interrupted native-helper downloads, discard partial responses and validate checksums before atomically installing files. This fixes the closed GitHub download connection observed after compiling whisper.cpp in hosted Linux builds.
- Add regression coverage for connection resets, interrupted streams, cache verification and checksum failures.

## [1.0.1] — 2026-10-18

- Pin ffmpeg-static to 5.2.0 (FFmpeg b6.0 binaries): the newer Linux binary lacks the `drawtext` filter required for text layers and titles. Keep the real export tests enabled on all three release platforms.
- Display the package version in the workspace so patch releases cannot leave an outdated UI version label.
- Preserve the original public v1.0.0 tag; release verification fixes are shipped under this new patch tag.

## [1.0.0] — 2026-10-18

First public open-source release, owned and maintained by Rajan Gupta. Earlier local development builds were numbered separately; this is the public version baseline.

### Added

- Offline Windows, macOS and Linux Electron application with native media processing.
- whisper.cpp transcription with base/small/medium models and word timestamps.
- Transcript editing, non-destructive cuts, captions, Undo/Redo and local project storage.
- Combined cleanup preview for filler words, long gaps and adjacent repeated takes.
- DeepFilterNet Studio Sound, loudness normalization, and Before/After playback.
- MP4 export through 4K, MP3 and subtitle/text exports without a watermark.
- Optional, disabled-by-default OpenAI, fal, ElevenLabs and Pexels integrations.
- Bundled sample, first-run tour, light/dark themes, accessible resize dividers and saved workspace sizes.
- TalkCut branding, favicon, native icons, GitHub update integration and release automation.

### Known limitations

- Cleanup and transcription need human review; retake detection is conservative.
- Model downloads and optional update checks require connectivity. Studio Sound needs a local preparation pass.
- Windows installers are unsigned unless a signing certificate is configured. macOS notarization and reliable automatic updates require Apple signing/notarization credentials.
- Public three-platform release builds have not yet run on GitHub. Local verification is on Windows; see [launch verification](docs/LAUNCH_VERIFICATION.md).
