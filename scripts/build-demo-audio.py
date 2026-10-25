#!/usr/bin/env python3
"""Compose original demo music/SFX and mix supplied Gemini voice clips into two MP4s.

Requires Python + NumPy and FFmpeg. No samples or external music tracks are used.
Voice clips are WAVs named by site/showcase/narration.json; pass --voice-clips DIR.
The silent source gameplay-loop.mp4 is preserved byte-for-byte.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 48000


def run(*args):
    subprocess.run([str(a) for a in args], check=True)


def wav(path, audio):
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((np.clip(audio, -.999, .999) * 32767).astype('<i2').tobytes())


def pitch(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--voice-clips', type=Path, required=True)
    parser.add_argument('--work', type=Path, default=ROOT / '.localwork/demo-audio-20261025/mix')
    parser.add_argument('--output', type=Path, default=ROOT / 'site/showcase')
    args = parser.parse_args()
    work, out = args.work.resolve(), args.output.resolve()
    work.mkdir(parents=True, exist_ok=True)
    duration = 1405 / 30
    n = round(duration * SR)
    music = np.zeros((n, 2), np.float64)
    effects = np.zeros_like(music)
    rng = np.random.default_rng(20261025)

    def note(track, start, length, frequency, gain, kind='sine', pan=0, to=None, wrap=False):
        t = np.arange(round(length * SR)) / SR
        if to:
            ratio = np.log(to / frequency) / length
            phase = 2 * np.pi * frequency * np.expm1(ratio * t) / ratio
        else:
            phase = 2 * np.pi * frequency * t
        if kind == 'pluck':
            signal = np.sin(phase) + .22 * np.sin(2 * phase) + .09 * np.sin(3 * phase)
        elif kind == 'bell':
            signal = np.sin(phase) + .25 * np.sin(2.01 * phase) * np.exp(-t * 10)
        elif kind == 'noise':
            signal = rng.normal(0, .25, len(t))
        else:
            signal = np.sin(phase)
        envelope = np.minimum(t / .008, 1) * np.exp(-t * (6 if kind != 'noise' else 60) / length)
        envelope *= np.minimum((length - t) / .025, 1)
        stereo = signal[:, None] * envelope[:, None] * gain * np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])
        offset = round(start * SR)
        if wrap:
            np.add.at(track, (offset + np.arange(len(t))) % n, stereo)
        elif offset < n:
            count = min(len(t), n - offset)
            track[offset:offset + count] += stereo[:count]

    # A new 24-bar arrangement of the game's original melody: soft plucks,
    # rounded bass, sparse chord tones and a quiet brushed pulse. Exactly 96
    # beats fill one video loop; folded reverb tails make the seam continuous.
    beat = duration / 96
    roots = [48, 53, 45, 43, 48, 50, 53, 43]
    melody = [72,None,76,79,None,76,74,None,77,None,79,81,79,None,76,None,
              76,None,72,69,None,72,76,None,74,76,None,79,74,None,71,None,
              72,None,79,76,None,74,76,79,77,None,74,69,74,None,77,None,
              81,79,77,None,76,None,74,None,71,None,74,79,74,None,71,None]
    for b in range(96):
        root = roots[(b // 4) % 8]
        note(music, b * beat, .36, pitch(root - 12 + (7 if b % 2 else 0)), .09, wrap=True)
        if b % 2 == 0:
            note(music, b * beat, .14, 62, .07, to=36, wrap=True)
        note(music, (b + .5) * beat, .07, 4000, .018, 'noise', .22, wrap=True)
        if b % 4 == 0:
            intervals = [0, 3, 7] if (b // 4) % 8 in [2, 5] else [0, 4, 7]
            for j, interval in enumerate(intervals):
                note(music, b * beat + j * .035, 1.3, pitch(root + interval + 12), .018, 'pluck', (j - 1) * .6, wrap=True)
        for half in range(2):
            midi = melody[(b * 2 + half) % len(melody)]
            if midi is None:
                continue
            start = (b + half / 2) * beat
            note(music, start, .38, pitch(midi), .065, 'pluck', -.22, wrap=True)
            note(music, start + .17, .48, pitch(midi), .012, 'bell', .55, wrap=True)

    # Editorial cues reconstructed from the game's original oscillator designs.
    # Times were checked against the recorded action; these are not captured audio.
    events = [(1.9,'menu'),(4.7,'menu'),(7.9,'menu'),(9.95,'rule'),
              (9.0,'star1'),(10.25,'star2'),(11.8,'star3'),(15.4,'exit'),(16.2,'complete'),
              (18.15,'menu'),(20.95,'menu'),(23.7,'rule'),(24.25,'menu'),
              (24.9,'star1'),(26.0,'bounce'),(26.25,'star2'),(26.8,'star3'),(27.2,'exit'),(28.0,'complete'),
              (29.65,'menu'),(32.45,'menu'),(33.8,'menu'),(39.5,'rule'),(40.25,'menu'),
              (40.65,'spring'),(41.0,'star1'),(41.45,'star2'),(41.8,'star3'),(42.8,'exit'),(43.65,'complete')]
    for start, kind in events:
        if kind.startswith('star'):
            f = pitch(72 + (int(kind[-1]) - 1) * 2)
            note(effects, start, .22, f, .15, 'bell', -.1)
            note(effects, start + .018, .14, f * 2, .045, pan=.15)
        elif kind == 'rule':
            note(effects, start, .09, 440, .08)
            note(effects, start + .055, .11, 554.37, .075)
        elif kind == 'spring':
            note(effects, start, .17, 220, .17, to=580)
            note(effects, start + .04, .18, 330, .04)
        elif kind == 'exit':
            note(effects, start, .7, 660, .12, to=90)
            note(effects, start + .03, .75, 330, .055, to=55)
        elif kind == 'complete':
            for i, f in enumerate([523.25, 659.25, 783.99]):
                note(effects, start + i * .07, .42, f, .11, 'bell', (i - 1) * .25)
        elif kind == 'bounce':
            note(effects, start, .10, 190, .07, to=105)
        else:
            note(effects, start, .06, 620, .045, to=440)
    for start, count in [(5.1,23),(21.35,23),(36.8,22)]:
        for i in range(count):
            note(effects, start + i * .069, .023, 900 + i % 3 * 130, .016, 'noise', .1)

    wav(work / 'music.wav', music)
    wav(work / 'effects.wav', effects)
    web_mix = music * .95 + effects
    wav(work / 'web-mix.wav', web_mix)

    clips = json.loads((out / 'narration.json').read_text())
    narration = np.zeros_like(music)
    duck = np.ones(n)
    subtitle_cues = []
    for clip in clips:
        source = args.voice_clips.resolve() / f'{clip["id"]}.wav'
        raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-af',
            'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-2:LRA=7',
            '-ar',str(SR),'-ac','2','-f','f32le','-'])
        audio = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)
        length = len(audio) / SR
        if length > clip['end'] - clip['start']:
            raise ValueError(f'Voice clip {clip["id"]} exceeds its scene window')
        offset = round(clip['start'] * SR)
        narration[offset:offset + len(audio)] += audio
        # Smooth music ducking, including a little lead-in and a gentle release.
        a, b = max(0, offset - round(.16 * SR)), min(n, offset + len(audio) + round(.35 * SR))
        envelope = np.ones(b-a)
        attack, release = min(round(.16 * SR),len(envelope)), min(round(.35 * SR),len(envelope))
        envelope[:attack] = np.linspace(1, .24, attack)
        envelope[attack:-release] = .24
        envelope[-release:] = np.linspace(.24, 1, release)
        duck[a:b] = np.minimum(duck[a:b], envelope)
        clip['spokenEnd'] = round(clip['start'] + length, 3)
        clip['sourceSha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
        sentences = clip['text'].replace('? ', '?|').replace('. ', '.|').split('|')
        total = sum(len(s.split()) for s in sentences)
        elapsed = clip['start']
        for sentence in sentences:
            end = elapsed + length * len(sentence.split()) / total
            subtitle_cues.append((elapsed, end, sentence))
            elapsed = end
    wav(work / 'narration.wav', narration)
    narrated = narration + music * duck[:,None] * .95 + effects * .7
    fade = np.ones(n)
    fade[:round(.25*SR)] = np.linspace(0, 1, round(.25*SR))
    fade[-round(.65*SR):] = np.linspace(1, 0, round(.65*SR))
    wav(work / 'narrated-mix.wav', narrated * fade[:,None])

    def stamp(seconds, separator='.'):
        ms = round(seconds * 1000)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{separator}{ms%1000:03}'

    (out / 'narration.en.vtt').write_text('WEBVTT\n\n' + '\n\n'.join(
        f'{stamp(a)} --> {stamp(b)}\n{text}' for a,b,text in subtitle_cues) + '\n')
    (out / 'narration.en.srt').write_text('\n\n'.join(
        f'{i+1}\n{stamp(a,",")} --> {stamp(b,",")}\n{text}' for i,(a,b,text) in enumerate(subtitle_cues)) + '\n')
    (out / 'narration.txt').write_text('\n\n'.join(c['text'] for c in clips) + '\n')

    for stem, name, title, loudness in [
        ('web-mix','gameplay-sound.mp4','Optional Reality — gameplay with original music and effects',-19),
        ('narrated-mix','youtube-demo.mp4','Optional Reality — Change the rules. Choose the moment.',-16),
    ]:
        run('ffmpeg','-hide_banner','-loglevel','error','-y','-i',out/'gameplay-loop.mp4','-i',work/f'{stem}.wav',
            '-map','0:v:0','-map','1:a:0','-c:v','copy','-af',f'loudnorm=I={loudness}:TP=-3:LRA=9',
            '-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',str(duration),'-movflags','+faststart',
            '-metadata',f'title={title}','-metadata','comment=Real recorded gameplay. Original synthesized music and reconstructed event cues. Narrated version: Gemini TTS, Kore voice.',out/name)
    metadata = {'duration':duration,'sampleRate':SR,'channels':2,'music':{'title':'A Little Different World','composer':'Optional Reality / Codex-assisted original synthesis',
        'tempo':60/beat,'bars':24,'source':'Original game melody, new procedural arrangement; no third-party samples'},
        'effects':'Reconstructed in post from the original game oscillator cues; editorial timing',
        'voice':{'provider':'Google Gemini','model':'gemini-3.8-flash-tts','voice':'Kore','language':'English','clips':clips},
        'files':{name:{'bytes':(out/name).stat().st_size,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()}
                 for name in ['gameplay-loop.mp4','gameplay-sound.mp4','youtube-demo.mp4']}}
    (out / 'audio-production.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps({'duration':duration,'voiceClips':len(clips),'files':metadata['files']},indent=2))


if __name__ == '__main__':
    main()
