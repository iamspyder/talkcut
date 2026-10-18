# Security policy

Rajan Gupta maintains TalkCut. The latest public 1.x release receives security fixes; development snapshots and older releases may not.

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/iamspyder/talkcut/security/advisories/new). The maintainer must enable this repository feature before the public launch. If the private form is unavailable, open an issue requesting a private reporting channel **without exploit details, recordings, keys or other sensitive data**. Do not publish a vulnerability until coordinated disclosure is agreed.

Include the affected version/OS, impact, minimal reproduction with synthetic files, and suggested mitigation. Expect an initial response within seven days where possible; this is a maintenance target, not a service guarantee.

## Security model

Core processing runs locally. Electron's renderer is sandboxed with context isolation and no Node integration; a private loopback API uses a per-launch random token. Imported media is parsed by native helpers: keep TalkCut updated and avoid untrusted files when possible. Optional cloud integrations transmit selected content to the chosen provider only after being enabled. User-entered API keys stay in memory; environment-provided keys remain the user's responsibility.

GitHub Actions release tokens and signing credentials belong in repository Actions secrets. Never put them in source or `.env` files for publication. Download models through Settings so size/hash verification runs. CI checks the committed tree for accidental secrets; no automated scan guarantees the absence of every secret or vulnerability.
