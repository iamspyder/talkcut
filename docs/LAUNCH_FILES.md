# Launch file inventory

The initial commit contains the existing TalkCut application plus the launch preparation below. All files are new to Git because no prior repository existed.

## Launch additions

- Root hygiene: .gitignore, .gitattributes.
- Ownership/license/community: LICENSE, THIRD_PARTY_NOTICES.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md.
- GitHub: ci.yml, release.yml, bug_report.yml, feature_request.yml, ISSUE_TEMPLATE/config.yml, PULL_REQUEST_TEMPLATE.md.
- Documentation/assets: docs/logo.svg, docs/demo.gif (real recorded preview), docs/screenshots/workspace-light.png and workspace-dark.png, docs/DEPENDENCIES.md, docs/RELEASING.md, docs/LAUNCH_VERIFICATION.md and this manifest.
- App tooling: eslint.config.mjs; scripts/audit-repo.mjs, notices.mjs, release-assets.mjs, runtime-paths.mjs; tests/release-assets.test.mjs.
- Packaged notices: app/LICENSE, app/THIRD_PARTY_NOTICES.md, DeepFilterNet-Apache-2.0.txt, FFmpeg-runtime-build.txt, ffprobe-build-source.txt, ffprobe-runtime-build.txt and npm-notices.txt under app/LICENSES.

## Updated existing files

README.md; app/package.json and package-lock.json; app/release-config.json; app/electron-builder.cjs; app/README.md; app/src/App.jsx and server.mjs (public version), src/OfflineSettings.jsx (canonical repository); app/scripts/setup-native.mjs; and browser/desktop/branding/layout verification scripts (portable runtime paths). The old duplicate desktop workflow and five obsolete migration/one-off verification scripts were removed to prevent rewriting release configuration. Existing source, curated demo samples, native license texts and branding are retained.

## Complete initial-commit inventory

- .gitattributes
- .github/ISSUE_TEMPLATE/bug_report.yml
- .github/ISSUE_TEMPLATE/config.yml
- .github/ISSUE_TEMPLATE/feature_request.yml
- .github/PULL_REQUEST_TEMPLATE.md
- .github/workflows/ci.yml
- .github/workflows/release.yml
- .gitignore
- CHANGELOG.md
- CODE_OF_CONDUCT.md
- CONTRIBUTING.md
- LICENSE
- README.md
- SECURITY.md
- app/scripts/start-windows.cmd
- THIRD_PARTY_NOTICES.md
- app/.gitignore
- app/FEATURES.md
- app/LICENSE
- app/LICENSES/DeepFilterNet-Apache-2.0.txt
- app/LICENSES/DeepFilterNet-MIT.txt
- app/LICENSES/FFmpeg-GPLv3.txt
- app/LICENSES/FFmpeg-build-source.txt
- app/LICENSES/FFmpeg-license.txt
- app/LICENSES/FFmpeg-runtime-build.txt
- app/LICENSES/ffprobe-build-source.txt
- app/LICENSES/ffprobe-runtime-build.txt
- app/LICENSES/npm-notices.txt
- app/LICENSES/whisper.cpp.txt
- app/README.md
- app/THIRD_PARTY_NOTICES.md
- app/ai-services.mjs
- app/build/icons/README.txt
- app/build/icons/talkcut.icns
- app/build/icons/talkcut.ico
- app/build/icons/talkcut.png
- app/cleanup.mjs
- app/desktop/main.cjs
- app/desktop/preload.cjs
- app/electron-builder.cjs
- app/eslint.config.mjs
- app/fal-video.mjs
- app/index.html
- app/offline-services.mjs
- app/package-lock.json
- app/package.json
- app/project-store.mjs
- app/public/apple-touch-icon.png
- app/public/brand/talkcut-mark.svg
- app/public/favicon-32.png
- app/public/favicon.ico
- app/public/favicon.svg
- app/realtime.mjs
- app/release-config.json
- app/render.mjs
- app/safe-download.mjs
- app/samples/sample-after.mp4
- app/samples/sample-after.wav
- app/samples/sample.jpg
- app/samples/sample.json
- app/samples/sample.mp4
- app/scripts/audit-repo.mjs
- app/scripts/brand-check.mjs
- app/scripts/browser-check.mjs
- app/scripts/build-brand.mjs
- app/scripts/export-check.mjs
- app/scripts/layers-browser-check.mjs
- app/scripts/layout-check.mjs
- app/scripts/make-bundled-sample.mjs
- app/scripts/notices.mjs
- app/scripts/offline-desktop-check.mjs
- app/scripts/polish-check.mjs
- app/scripts/realtime-browser-check.mjs
- app/scripts/release-assets.mjs
- app/scripts/runtime-paths.mjs
- app/scripts/seed-speech.ps1
- app/scripts/seed.mjs
- app/scripts/setup-native.mjs
- app/scripts/start.ps1
- app/server.mjs
- app/src/AIStudio.jsx
- app/src/App.jsx
- app/src/CloudVideoPanel.jsx
- app/src/FirstRunUI.jsx
- app/src/OfflineSettings.jsx
- app/src/ProjectExtras.jsx
- app/src/StockLibrary.jsx
- app/src/VoiceStudio.jsx
- app/src/WorkspaceLayout.jsx
- app/src/ai-studio.css
- app/src/cloud-video.css
- app/src/main.jsx
- app/src/model.js
- app/src/polish.css
- app/src/project-extras.css
- app/src/stock-library.css
- app/src/style.css
- app/src/ui-format.js
- app/src/voice-studio.css
- app/stock-services.mjs
- app/tests/ai-services.test.mjs
- app/tests/cleanup-preview.test.mjs
- app/tests/fal-video.test.mjs
- app/tests/model-translation.test.mjs
- app/tests/model.test.mjs
- app/tests/offline.test.mjs
- app/tests/project-store.test.mjs
- app/tests/release-assets.test.mjs
- app/tests/render-model.test.mjs
- app/tests/safe-download.test.mjs
- app/tests/stock-services.test.mjs
- app/tests/voice-services.test.mjs
- app/voice-services.mjs
- docs/DEPENDENCIES.md
- docs/LAUNCH_VERIFICATION.md
- docs/RELEASING.md
- docs/demo.gif
- docs/logo.svg
- docs/screenshots/workspace-dark.png
- docs/screenshots/workspace-light.png
- docs/LAUNCH_FILES.md

## Post-preparation additions

- app/scripts/native-download.mjs — retry and integrity handling for native downloads.
- app/tests/native-download.test.mjs — interrupted download/cache/checksum regression tests.
- app/tests/packaging-config.test.mjs — unsigned/configured signing regression tests.
- docs/GITHUB_VERIFICATION.md — hosted build, asset and security verification results.

## Demo production follow-up

- docs/demo.mp4 — real 1080p workflow video with audible Before/After comparison.
- docs/demo.gif — real recorded silent workflow preview.
- docs/DEMO.md — chapters, recording/editing disclosures and production commands.
- app/scripts/record-demo.mjs and render-demo.mjs — isolated UI recording and local video/GIF rendering.

## Published release follow-up

v1.0.3 is published with working public Windows, macOS and Linux downloads. The Windows source launcher is `app/scripts/start-windows.cmd`; run it from a source checkout after installing dependencies. It invokes the adjacent `start.ps1` script.
