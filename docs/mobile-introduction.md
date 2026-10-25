# Mobile introduction and QR sharing

The public introduction is **https://optionalreality.site/intro**. The game remains at `/`, and the standalone looping player remains at `/showcase/`. All three existing domains use the same introduction, but the QR always points to the canonical `optionalreality.site/intro` URL.

The page is a complete presentation of the current fifteen-level game: branded hero illustration, real looping gameplay video, three-step explanation, five Motion / seven Collisions / three Devices levels, language-to-physics explanation, sharing, FAQ, GitHub and AI-usage links. It replaces the early nine-level / planned-sandbox copy and the obsolete GitHub-unavailable dialog.

English and Chinese are available. The page initially follows the browser language, remembers a manually chosen language when storage is available, and accepts `?lang=en` or `?lang=zh`. Its code and styles are self-hosted, with no framework or runtime API call needed. The existing ImageGen title sprites are reused byte-for-byte from `client/src/assets/title-scene`; their original prompts and provenance remain there. Chapter diagrams, layout, QR, and share-card artwork are implemented in code.

## Phone experience

The layout supports narrow screens, safe-area insets, readable body copy, and touch-sized primary controls. Phones see the introduction, video, chapters and sharing. Desktop game links are hidden below the mobile breakpoint, with a clear note that keyboard-and-mouse gameplay requires a computer. No physics world is mounted on this static page.

The muted video uses inline playback, loops, optional captions, a fullscreen button, and chapter jumps. It starts when sufficiently visible; moving away pauses it. Manually paused video stays paused when returning. Hidden pages pause playback. Reduced-motion preferences disable decorative animation and automatic video playback; the explicit Watch action still lets a visitor choose to play. The mobile bottom Watch button moves out of the way when the video is visible.

## Ready-to-use QR files

| File | Use |
| --- | --- |
| [intro-qr.png](../site/assets/intro-20261025/intro-qr.png) | 900 × 900 standalone code for screens and documents |
| [intro-qr.svg](../site/assets/intro-20261025/intro-qr.svg) | Vector code for crisp resizing and printing |
| [scan-card.png](../site/assets/intro-20261025/scan-card.png) | 1440 × 1920 branded card for sharing or printing |
| [scan-card.svg](../site/assets/intro-20261025/scan-card.svg) | Vector share-card layout |
| [social-card.png](../site/assets/intro-20261025/social-card.png) | 1200 × 630 link-preview artwork |

The same files are served publicly under `/assets/intro-20261025/`. The page includes downloads and a Copy introduction link button. No external QR-generation or link-shortening service is used.

The QR uses error correction **H**, a six-module quiet zone, square modules and dark green on white. Its encoded value is exactly `https://optionalreality.site/intro`. OpenCV decoded the standalone PNG, full share card and social image back to that exact URL. The standalone code also decoded at 180, 225 and 300 pixels; the complete share card decoded after shrinking to 320, 360 and 480 pixels wide. These are software checks, not a claim that every real-world camera or print condition was tested. Keep the quiet zone visible when printing.

Regenerate with the installed development tools:

```sh
# Requires Python, OpenCV and Pillow; the checked-in images need no Python runtime.
python3 scripts/build-intro-qr.py
```

The generator currently uses the macOS Arial fonts for the PNG card. Its SVG export names standard font fallbacks. [qr-manifest.json](../site/assets/intro-20261025/qr-manifest.json) records the target and decoded image sizes.

## Verification

Browser checks covered Chinese and English, desktop layout, 320 / 375 / 390 / 430 px phone widths with no horizontal overflow, hidden phone game links, inline playback, automatic dock avoidance, captions, chapter jumps, copy-link confirmation, and reduced-motion behavior. Browser error/warning logs were empty. The legacy diagram tests and production build passed. Temporary viewport and media overrides were reset afterward.

Publication updates static files atomically and preserves the existing game bundle, API, persistent configuration, and running services. The actual release and rollback are recorded in [Live Game Deployment](../deploy/live-game.md).
