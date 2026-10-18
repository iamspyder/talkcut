# TalkCut demo

[Watch/download the full 1080p MP4](demo.mp4) · [Direct download](https://raw.githubusercontent.com/iamspyder/talkcut/main/docs/demo.mp4)

[![TalkCut workflow preview](demo.gif)](demo.mp4)

Created for **Rajan Gupta**, TalkCut's sole owner and maintainer. Duration: **92.8 seconds**. Format: **1920×1080, 30 fps, H.264 + AAC in MP4**. The GIF is a short, silent README preview; the MP4 contains the audible comparison.

## What it shows

| Time | Demonstration |
| --- | --- |
| 0:00 | TalkCut introduction |
| 0:03 | Open the bundled sample with its included transcript |
| 0:12 | Preview cleanup, apply it and restore the words with Undo |
| 0:24 | Studio Sound Before: original noisy sample |
| 0:37 | Studio Sound After: the same passage, enhanced and normalized |
| 0:48 | Dark mode and the Script/Preview resize divider |
| 0:58 | Real 1080p export, followed by its completed download |
| 1:29 | Project link and closing card |

This is an edited recording of actual UI interactions in an isolated, offline test profile. No personal projects, accounts or provider keys appear. The sample includes a ready transcript and preprocessed Studio Sound audio; the video does not present that as a fresh transcription or live inference pass. The A/B audio is taken from the same original/processed sample files shown in the preview, at normal playback speed. There is no added music or narration.

The export wait is sped up about 14.6× and labeled on screen. A second real export of the same sample project supplied a clear completion shot. Title cards and step captions were added for presentation; cleanup counts and export results were not fabricated. The original demonstration speech is synthetic; no user recording or third-party stock footage is included.

## Re-create or update

From `app/`, after the normal source/native setup and UI build:

```sh
node scripts/record-demo.mjs
node scripts/render-demo.mjs
```

Chrome must be installed (or set `CHROME_PATH`). An installed sans-serif font is used locally; set `DEMO_FONT` to a licensed local font if the platform default is unavailable. Font files, raw captures, temporary profiles, intermediate media and verification reports stay under ignored `app/qa/demo/`; they are not published. The scripts write the final `docs/demo.mp4` and `docs/demo.gif`.

The recording checks sample loading, cleanup/Undo, A/B playback, theme/resize controls and successful export. Rendering verifies the video dimensions/audio stream, fully decodes the MP4, produces a visual review sheet and checks both published files against the repository's 5 MiB file-size limit. v1.0.3 is published; installers remain unsigned.
