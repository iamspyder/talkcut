# Contributing to TalkCut

TalkCut is owned and maintained solely by **Rajan Gupta**. Contributions are welcome under the MIT license; contributors retain copyright in their contributions. Third-party copyright notices must be preserved.

Read the [Code of Conduct](CODE_OF_CONDUCT.md). Search existing issues before opening a bug or proposing a feature. For substantial changes, discuss the intended behavior in an issue first.

## Development

Use Node.js 24 and npm. From `app/`:

```sh
npm ci
npm run native:setup
npm run lint
npm test
npm run build
npm run desktop
```

Native setup downloads open-source helpers. macOS/Linux require CMake and a C++ compiler. For UI checks, install Chrome or set `CHROME_PATH`; `npm run test:layout` launches an isolated Electron profile. See [app/README.md](app/README.md) for deeper runtime tests.

## Pull requests

- Keep changes focused. Explain the problem, final behavior, and how you verified it.
- Run lint, tests and the production build. Add meaningful regression coverage for behavior changes.
- For UI changes, include screenshots at 1280×720 and 1920×1080 in both themes.
- Keep offline editing usable with no API keys. Cloud services must remain opt-in.
- Never commit credentials, personal recordings, local profiles, downloaded models, native executables or generated export files.
- Add new dependencies to the license inventory with `npm run notices`. Do not copy code from incompatible or noncommercial-only projects.
- Use synthetic demo media for reports and remove personal information from screenshots/logs.

By submitting a contribution, you agree that it can be distributed under the project's MIT license. This does not transfer ownership of your contribution.
