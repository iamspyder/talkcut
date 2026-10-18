# Releasing TalkCut

Owner and release maintainer: **Rajan Gupta**. Repository: `iamspyder/talkcut`.

## First public launch

Local preparation creates `main`, a `TalkCut v1.0.0` commit and tag `v1.0.0`; it does not push, create a remote repository, upload assets or publish a release. Run from the repository root after reviewing the audit and license notes:

```sh
gh repo create talkcut --public --source=. --push
git push origin v1.0.0
```

The authenticated GitHub CLI account must be `iamspyder`. Creating/pushing triggers CI; pushing the version tag triggers release builds. Version in `app/package.json`, lockfile and tag must match.

Before announcing: review the recorded demo (docs/DEMO.md); enable private vulnerability reporting, GitHub secret scanning/push protection and branch protection; verify every installer and its checksums on its target OS. Review Corresponding Source and bundled sample voice rights in `THIRD_PARTY_NOTICES.md` before redistributing installers. The release workflow deliberately opens a **draft** release so this final review occurs before public distribution. Publish the draft only after completing these checks.

## Automation

`ci.yml` runs lint/tests/build on pushes and pull requests using read-only permissions. It also checks committed files for secrets and accidental binaries/personal paths. `release.yml` builds Windows NSIS, macOS DMG+ZIP and Linux AppImage, computes SHA-256 checksums and uploads all assets plus updater metadata into one draft GitHub Release. A failed platform build prevents publishing a partial release.

The macOS job runs Node/Electron x64 (Rosetta on Apple Silicon hosts), because the current ffprobe helper is x64. Native Apple Silicon distribution is a roadmap item. Build on the target OS; copying Windows `node_modules` to another OS is unsupported.

`npm run dist` and platform scripts always use `--publish never`. In GitHub Actions, upload uses the workflow's short-lived `GITHUB_TOKEN` with `contents: write`; no personal access token is embedded in the app. Release assets include stable download aliases and original versioned installer/update files. Keep `.yml`, `.blockmap` and macOS ZIP assets for electron-updater. Versioned originals referenced in update metadata must never be renamed or overwritten by aliases.

## Signing and updates

Updates point to `iamspyder/talkcut` through `app/release-config.json`. Settings provides explicit check/download/install actions; editing stays offline. Only published releases are offered; drafts are not updates.

Optional Actions secrets:

- `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`: Windows signing certificate/password.
- `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`: Apple Developer ID certificate/password.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: notarization credentials.

The workflow never logs or commits these values. Without them, Windows/macOS packages are unsigned; Windows SmartScreen/macOS Gatekeeper may warn or block. Reliable macOS automatic updates require signed packages. Do not claim notarization or a trusted publisher without verifying the built artifacts.

## Future releases

Update package/lock versions, changelog and notices; run lint/tests/build and offline smoke tests; commit; tag `vX.Y.Z`; push branch and tag. Review the generated draft, platform smoke tests, source availability, SHA256SUMS files and signing status before publishing.
