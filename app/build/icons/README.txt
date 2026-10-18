TalkCut brand assets

Master vector: public/brand/talkcut-mark.svg
Web: public/favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png
Desktop: build/icons/talkcut.png (1024px), talkcut.ico (16–256px), talkcut.icns (16–1024px)

The purple speech bubble and play symbol represent editing spoken stories. The mark uses a transparent outer background and a self-contained purple tile, so it works on both app themes.

To regenerate raster/native formats from the master: node scripts/build-brand.mjs
To verify the integrated logo and favicon assets: node scripts/brand-check.mjs
These scripts use the locally installed Chrome/Electron runtimes; they do not call external services.
