# GitHub verification — v1.0.3

Verified on 2026-10-19. Owner and maintainer: **Rajan Gupta**. Public repository: https://github.com/iamspyder/talkcut.

- Release source commit: `12589e5d4aa0745942532c8a516b2440b182741e`; tag `v1.0.3`.
- [CI](https://github.com/iamspyder/talkcut/actions/runs/39153788803): successful.
- [Three-platform release workflow](https://github.com/iamspyder/talkcut/actions/runs/39153794143): successful. All 52 tests passed on Windows, macOS and Linux. Windows NSIS, macOS DMG/update ZIP and Linux AppImage were built; the combined release job downloaded the artifacts and verified their SHA-256 manifests.
- Published release ID: `416625143`, version `v1.0.3`, containing 16 assets. All 13 manifest-listed file hashes match GitHub's uploaded-asset SHA-256 digests. Three updater manifests reference existing assets with matching sizes, version 1.0.3 and correctly formed SHA-512 values. All three stable download aliases exist.
- GitHub secret alerts: zero. Gitleaks scans of all pushed commits/tags: zero findings. Prohibited name references: zero. No included rescript/audapolis source or dependency was found in the preparation audit.
- Repository visibility: public; default branch: main; detected license: MIT. Secret scanning, push protection and private vulnerability reporting are enabled.

## Fixes found through hosted verification

The original v1.0.0 tag remains intact. v1.0.1 pins ffmpeg-static 5.2.0 because the newer Linux FFmpeg build lacks drawtext. v1.0.2 retries interrupted native downloads, checks hashes before installing files and discards partial responses. v1.0.3 removes empty signing-certificate settings and explicitly supports unsigned macOS builds. Regression tests cover the download and signing failures.

New post-preparation files: `app/scripts/native-download.mjs`, `app/tests/native-download.test.mjs`, `app/tests/packaging-config.test.mjs`, and this report. The initial-commit inventory in LAUNCH_FILES.md remains a historical record of the initial 123 files.

## Release state and limits

The repository audit reads optional comma-separated prohibited names from `TALKCUT_FORBIDDEN_NAMES`. Name checking is skipped when unset; configured names are matched without regard to case, whitespace or punctuation.

v1.0.3 is published at https://github.com/iamspyder/talkcut/releases/tag/v1.0.3. All three public latest-download installer links returned HTTP 200 after publication. Windows/macOS builds are unsigned without configured certificates. macOS automatic updates require properly signed distribution.

Remaining review includes the native GPL/LGPL Corresponding Source review described in THIRD_PARTY_NOTICES.md and target-device desktop smoke testing. Hosted FFmpeg tests and successful packaging do not establish full GUI behavior on every supported OS/hardware combination. The previous full offline desktop flow was verified on Windows during development. The bulk Windows artifact download to this workstation was stopped because of slow transfer; uploaded payload hashes were instead checked against GitHub's asset digests and the workflow's complete checksum verification.

`docs/demo.gif` is the real recorded preview of the [workflow video](DEMO.md). The production npm audit passed; the eight development-tool findings described in LAUNCH_VERIFICATION.md remain separate from secret scanning and native-binary vulnerability review.
