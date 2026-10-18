# Third-party notices

TalkCut is owned solely by **Rajan Gupta**. Its original code and branding are MIT licensed, copyright 2026 Rajan Gupta. This does **not** replace third-party copyright or licenses, and does not make the complete installer MIT-only.

## Native helpers and runtimes

| Project | License | Use and source |
| --- | --- | --- |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp/tree/v1.8.3) / ggml | MIT | Local transcription, v1.8.3. `app/LICENSES/whisper.cpp.txt`; official binary on Windows, source-built on other targets. |
| [Whisper models](https://github.com/openai/whisper/blob/main/LICENSE) | MIT | Optional user-downloaded model weights, converted through the whisper.cpp model repository. Not stored in Git or shipped inside the installer. |
| [DeepFilterNet](https://github.com/Rikorose/DeepFilterNet/tree/v0.5.6) | MIT OR Apache-2.0 | Native v0.5.6 helper and DeepFilterNet3 ONNX model. Both upstream license alternatives are included. The MIT option is used for this distribution. |
| [FFmpeg](https://ffmpeg.org/legal.html) | LGPL-2.1-or-later by default; GPL-2.0-or-later / GPL-3.0-or-later with enabled components | Media processing. The current Windows ffmpeg 6.0 Gyan build enables GPL and version3: distribute it under GPLv3, not LGPL-only. See build/source notes below. |
| [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) | GPL-3.0-or-later | Node wrapper and platform binary downloads. Its own wrapper license is GPL, independently of the selected FFmpeg build. |
| [ffprobe-static](https://github.com/joshwnj/ffprobe-static) | MIT wrapper; separate FFmpeg binary terms | Media inspection. Windows ffprobe 4.0.2 enables GPL/version3. The wrapper's MIT license does not relicense the binary. |
| [Electron](https://github.com/electron/electron) | MIT, plus bundled third-party terms | Desktop runtime; includes Chromium, Node.js, V8, BoringSSL and other components. Electron's `LICENSE` and `LICENSES.chromium.html` are retained next to the application executable in packaged distributions. |
| [Node.js](https://github.com/nodejs/node/blob/main/LICENSE) | MIT and third-party notices | Main-process JavaScript runtime included by Electron. |
| [Chromium](https://chromium.googlesource.com/chromium/src/+/main/LICENSE) | BSD-3-Clause and third-party licenses | Sandboxed UI/media runtime; detailed component notices are in Electron's generated Chromium notice file. |
| [ONNX / inference dependencies](https://github.com/Rikorose/DeepFilterNet) | Component-specific, including Apache-2.0 and MIT | Used internally by the released DeepFilterNet helper. Preserve upstream Rust dependency notices/source when rebuilding. TalkCut does not bundle a separate proprietary inference SDK. |

## UI, services and build tooling

React and React DOM (MIT), Lucide React/icons (ISC), ws (MIT), electron-updater (MIT), electron-builder/app-builder-lib (MIT), Vite (MIT), Playwright Core (Apache-2.0), ESLint (MIT), and globals (MIT) are used directly. Transitive packages have separate terms.

The complete lockfile-derived list, exact versions, license expressions and package paths are in [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Full available npm license/notice texts are collected in `app/LICENSES/npm-notices.txt` by `npm run notices`; release builds regenerate this file on their target OS. Uninstalled optional platform packages remain listed in the inventory, and installed packages supply their notices. Development-only tooling is identified separately and is not intentionally shipped as runtime code.

NSIS (zlib/libpng for the installer engine; individual plugins retain their own notices), 7-Zip (LGPL-2.1-or-later plus its unRAR restriction where applicable), and WiX (MS-RL) may be used by electron-builder as platform-specific build tools. Retain notices supplied with those tools. They are not TalkCut-owned code. The application uses the operating system's Segoe UI/Arial sans-serif fonts rather than distributing font files.

## Projects studied; no source bundled

- [autoEdit_2](https://github.com/OpenNewsLabs/autoEdit_2): MIT; transcript-oriented editing workflow reference.
- [auto-editor](https://github.com/WyattBlue/auto-editor/blob/master/LICENSE): Unlicense/public-domain portions; automatic-editing workflow reference. No CLI, paid modules or source from that repository is included.

Source/dependency/import scans found **no included rescript (PolyForm Noncommercial) or audapolis (AGPL) code or package**. Neither is a dependency or bundled helper. This is a provenance statement about this repository and its declared artifacts, not a claim to ownership of third-party projects. No company affiliation or transfer of ownership is implied by these acknowledgments.

## FFmpeg/ffprobe source and redistribution notes

This software uses FFmpeg/ffprobe licensed under the applicable LGPL/GPL build terms. Source and build details are available at:

- FFmpeg Windows 6.0 source revision: [ea3d24bbe3](https://github.com/FFmpeg/FFmpeg/commit/ea3d24bbe3), from Gyan's build supplied by [ffmpeg-static b6.0](https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.0). `app/LICENSES/FFmpeg-build-source.txt` records the exact build configuration and enabled libraries.
- ffprobe 4.0.2 upstream source: [n4.0.2](https://github.com/FFmpeg/FFmpeg/tree/n4.0.2). The old wrapper uses historical Zeranoe/John Van Sickle/Evermeet binaries; its build configuration is captured into `app/LICENSES/ffprobe-build-source.txt` by native setup. Do not assume the FFmpeg and ffprobe versions match.
- Platform FFmpeg binary sources are identified in the [ffmpeg-static README](https://github.com/eugeneware/ffmpeg-static#sources-of-the-binaries). Builds differ by platform; native setup captures `-version` and `-L` output for both executables in each release package.
- Full GPLv3 license text is retained in `app/LICENSES/FFmpeg-GPLv3.txt`. Encoder/filter libraries (for example x264, x265, libass, FreeType, LAME, libvpx, Opus and others listed by the actual configuration) retain their own licenses. The actual build output, not a generic project label, determines which are present.

**Before redistributing installers:** verify that matching Corresponding Source, configuration, patches and build scripts for *all* GPL/LGPL native binaries and their linked libraries are available under the required terms. A bare upstream revision or this notice alone is not a complete Corresponding Source bundle. The historical ffprobe binary's full dependency/build source is not reconstructed by this repository. Archive verified source alongside the release or rebuild helpers from reproducible source with a complete source archive. See [docs/RELEASING.md](docs/RELEASING.md). Automated packaging does not certify license compliance.

## Original media and community text

TalkCut branding, procedural demo artwork and demonstration script were created for this project and are covered by the project license. The sample contains synthetic speech generated locally using an OS-provided voice; voice-engine assets are not shipped. No user recordings or stock-provider media are included. OS voice rights must be checked before replacing or redistributing generated samples commercially.

The [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) is distributed under [CC-BY-4.0](https://github.com/EthicalSource/contributor_covenant/blob/release/LICENSE.md) with attribution in `CODE_OF_CONDUCT.md`.
