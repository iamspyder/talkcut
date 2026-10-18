# TalkCut v1 scope

Core: offline desktop packaging, local model management, word-based editing, non-destructive cuts and Undo, filler/gap/repeated-take cleanup, DeepFilterNet ONNX voice cleanup, A/B preview, 1080p export, local projects and captions.

Optional: cloud adapters are disabled by default; layered media, scenes, recording, style presets and local-session revision safeguards remain available. No online account is required.

Boundaries: model download requires a one-time connection. Speech recognition and word timing are estimates; fillers may be omitted by recognition. Retake removal detects adjacent exact repeated phrases of at least three words and is not a semantic detector of different phrasings. Studio Sound needs a preparation pass before instant cached A/B playback. There are no hosted workspaces, guest rooms, direct publishing or billing features. macOS and Linux artifacts require their own native builds/testing; local Windows verification does not validate them.

Windows packaging and offline-flow verification results are in `qa/offline-desktop-results.json` after running the check. Installer output is in `release/`. Update delivery requires a published GitHub release and platform signing configuration.
