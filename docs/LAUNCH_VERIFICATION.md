# Local launch verification

Prepared on 2026-10-18 for **Rajan Gupta**, sole project owner, targeting `iamspyder/talkcut`.

## Repository and privacy

- There was no pre-existing Git repository or commit history. A new `main` branch, clean initial `TalkCut v1.0.0` commit and `v1.0.0` tag are prepared locally. No push or remote repository creation is performed.
- Gitleaks 8.30.1 was downloaded from its official release and checked against its published SHA-256 checksum. A whole-workspace directory scan inspected eligible files, including ignored test data. Large executable/model/archive files were skipped by the configured 50 MB limit; they are excluded from Git. No absence-of-secrets guarantee is implied for opaque binaries.
- Initial findings were examples in the scanner's own README and encryption material in disposable Electron test profiles. Those disposable files/profiles were removed. The subsequent directory scan found **zero secrets**. No provider credentials were found in the source.
- The final publishable tree and full new Git history are scanned again with redaction. Reports stay under ignored `.audit/`; reports never print discovered secret values.
- Source hygiene checks reject common credential formats, personal home paths, prohibited prior-ownership references, generated artifacts and files over 5 MiB. Downloaded helpers/models, node_modules, releases, local projects, QA profiles, exports and `.env*` remain ignored. Small curated sample media, icon files and documentation screenshots are intentionally versioned.
- Ownership search is clean. The author, owner, license copyright and installer metadata use **Rajan Gupta**. Third-party authorship/copyright is retained in dependency notices.
- No rescript or audapolis imports, packages, source files or bundled helpers were found. Their names occur only in the provenance exclusion statement in the third-party notices.

## Verified locally

- ESLint, all **47 tests** (including real FFmpeg rendering and release aliases/checksums), production UI build, native setup and repository hygiene check.
- Production dependency audit: **zero known vulnerabilities** at preparation time.
- Full dependency audit: **eight moderate development-tool-chain findings**, all stemming from the transitive `sprintf-js` advisory through electron-builder's download/proxy logging tooling. They are not production app dependencies. No blanket `npm audit fix --force` downgrade was applied; review upstream fixes before future builds.
- The complete npm lock inventory lists **431 packages**; installed license/notice texts and native runtime/license output are included under `app/LICENSES/`.
- UI resize checks, light/dark screenshots and the previous Windows offline import → transcription → cleanup → Studio Sound → 1080p export checks are available as local ignored QA artifacts. The original offline flow was verified during development, not on macOS/Linux.
- 4K canvas dimensions are covered by rendering tests; the launch preparation does not claim a new end-to-end 4K benchmark.
- A real local NSIS v1.0.0 installer was built in the ignored `app/release/launch-v1/` directory. Windows executable metadata identifies Rajan Gupta, version 1.0.0, and the 2026 copyright. The packaged application launched with external requests blocked, found FFmpeg/whisper.cpp/DeepFilterNet, kept Optional AI disabled and contained the project/native/npm license notices. This is a packaging smoke test, not a hosted three-platform release certification.

## Still requires release review

- The GitHub Actions workflows are prepared and statically checked locally; hosted three-platform execution is not claimed until the repository/tag is pushed.
- A draft release is intentional. Verify macOS/Linux behavior on target hardware, signing/notarization, updater assets and SHA-256 manifests before publishing. Unsigned Windows/macOS builds are disclosed in the README.
- Confirm/archive complete matching Corresponding Source and build inputs for all native GPL/LGPL binaries before distributing installers. In particular, the historical ffprobe package's complete build/dependency sources are not reconstructed here. See THIRD_PARTY_NOTICES.md and upstream [FFmpeg distribution guidance](https://ffmpeg.org/legal.html).
- Replace `docs/demo.gif` (an explicitly labeled placeholder), configure funding if desired, enable private vulnerability reporting and review synthetic OS-voice redistribution rights.

See [LAUNCH_FILES.md](LAUNCH_FILES.md) for the complete initial-commit file inventory and added/updated launch-file summary, and [RELEASING.md](RELEASING.md) for exact push commands.

## Hosted verification follow-up

The repository has now been pushed. See [GITHUB_VERIFICATION.md](GITHUB_VERIFICATION.md) for the successful v1.0.3 three-platform builds, uploaded draft assets, checksums, security settings and remaining release-review limits. The sections above record the earlier local preparation snapshot.
