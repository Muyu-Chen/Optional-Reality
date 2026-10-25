# Demo music, effects and English narration

The introduction at https://optionalreality.site/intro and standalone player at https://optionalreality.site/showcase/ use `gameplay-sound.mp4`: a 46.833-second loop with an original instrumental score and gameplay cues. Automatic playback starts muted; **Watch the demo**, **Enable sound**, a chapter jump, or **Restart** enables sound on an explicit user action. Once muted by the visitor, chapter jumps preserve that preference. Native volume controls and the custom sound button stay synchronized. Hidden pages pause playback. Reduced-motion preferences still disable automatic playback.

The separate [narrated player](https://optionalreality.site/showcase/narrated.html) uses [youtube-demo.mp4](https://optionalreality.site/showcase/youtube-demo.mp4), with an English voiceover and music lowered during speech. It starts on request. [English SRT subtitles](../site/showcase/narration.en.srt), [upload title and description](../site/showcase/youtube-description.txt), and the [spoken script](../site/showcase/narration.txt) accompany the file. It is ready for upload; hosting it on this site does not create a YouTube or Vimeo account upload.

Both MP4s contain the original recorded 1280 × 720, 30 fps H.264 video stream, preserved without re-encoding, plus 48 kHz stereo AAC audio at 192 kb/s and fast-start metadata. The original silent `gameplay-loop.mp4` remains intact. All footage and scores come from the original three real playthroughs; these explicit recorded commands use local parsing.

## Audio sources

“A Little Different World” is an original procedural arrangement of the game's original melody: 24 bars of soft plucks, rounded bass, sparse chords and brushed percussion. Oscillators and deterministic noise are rendered locally with NumPy; no third-party music recordings or samples are used. The score repeats at the video boundary, with note tails folded into the start.

Rule confirmations, pickups, toaster launch, exit and completion cues are reconstructed in post from the game's original oscillator designs and timed against the recorded action. Menu/typing cues are editorial additions. They are synthesized audio, not a captured game-audio stream.

The English narrator is Google Gemini `gemini-3.8-flash-tts`, prebuilt `Kore` voice, reading five supplied segments. No voice was cloned or impersonated. The [generation script](../scripts/generate-demo-voice.mjs) accepts the backend key through the environment and saves WAVs locally. The [mixing script](../scripts/build-demo-audio.py) creates the score/cues, trims boundary silence, normalizes each spoken clip, lowers music during speech, produces captions and muxes the two editions. [Production metadata](../site/showcase/audio-production.json) records source hashes, the model, voice and timings. See [AI Usage](../AI_USAGE.md#demo-audio-production).

```sh
# Requires Node 22+, an existing GEMINI_API_KEY environment variable,
# Python with NumPy, and FFmpeg. Generate into a private local directory.
node scripts/generate-demo-voice.mjs .localwork/demo-voice
python3 scripts/build-demo-audio.py --voice-clips .localwork/demo-voice
```

## Verification and release

Full FFmpeg decoding succeeded for both editions. Their compressed video-stream hashes exactly match the silent master. The website loop measured −18.9 LUFS integrated and −1.9 dBFS true peak; the narrated edition measured −16.7 LUFS and −3.0 dBFS true peak. Every voice segment fits its assigned scene window. Captions describe the spoken script; cue boundaries within each segment use proportional sentence timing.

Browser checks covered sound enable/mute, native-control synchronization, preserved mute preference, caption display, paused narrated startup, 320 px local and 390 px public layouts without horizontal overflow, and public chapter seeking. Production serves byte ranges for seeking. The public introduction defaults to English and describes rule input as “any language supported by Google Gemini,” while retaining each level’s supported-editing boundaries.

Static release `20261025T114207Z-demo-sound-optional-reality-game` was layered onto the latest twenty-one-level release. It preserves the game bundle, API release, configuration and QR/share assets. All 95 public files were hash-checked across three domains (285 checks), API health/configuration and existing hashed game assets passed, and four API services plus Apache retained their exact PIDs and start times. No service was stopped, restarted or reloaded for this static release.
