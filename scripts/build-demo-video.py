#!/usr/bin/env python3
"""Edit captured browser JPEG frames into the looping showcase (requires FFmpeg)."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def run(*args):
    subprocess.run([str(arg) for arg in args], check=True)

def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]))

def quoted(path):
    return "'" + str(path).replace("'", "'\\''") + "'"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path, help='Directory containing title.png and scene JPEGs with frames.json')
    parser.add_argument('--output', type=Path, default=ROOT / 'site/showcase')
    args = parser.parse_args()
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        parser.error('Install FFmpeg and ffprobe before building media.')
    capture = args.capture.resolve()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    segments = capture / 'edited'
    segments.mkdir(exist_ok=True)
    scenes = [
        ('title-open', 'title.png', 2.2),
        ('00-gallery-motion', None, 3.2),
        ('01-motion-final', None, None),
        ('02-gallery-collisions', None, 3.2),
        ('03-collision-final', None, None),
        ('04-gallery-devices', None, 3.2),
        ('05-toaster-final', None, None),
        ('title-close', 'title.png', 1.5),
    ]
    timeline = []
    for name, still, hold in scenes:
        target = segments / (name + '.mp4')
        if still:
            inputs = ['-loop', '1', '-framerate', '30', '-i', capture / still, '-t', str(hold)]
        else:
            folder = capture / name
            frames = json.loads((folder / 'frames.json').read_text())
            assert frames, f'No recorded frames: {name}'
            concat = ['ffconcat version 1.0']
            for i, frame in enumerate(frames):
                delta = frames[i + 1]['time'] - frame['time'] if i + 1 < len(frames) else 1 / 30
                if len(frames) == 1:
                    delta = hold or 1.6
                concat += ['file ' + quoted(folder / frame['file']), f'duration {max(delta, .001):.6f}']
            concat += ['file ' + quoted(folder / frames[-1]['file'])]
            sequence = segments / (name + '.ffconcat')
            sequence.write_text('\n'.join(concat) + '\n')
            inputs = ['-f', 'concat', '-safe', '0', '-i', sequence]
            if hold is not None:
                inputs += ['-t', str(hold)]
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs,
            '-vf', 'fps=30,scale=1280:720:flags=lanczos,setsar=1', '-an', '-c:v', 'libx264',
            '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target)
        timeline.append({'scene': name, 'duration': duration(target)})
    transition = .4
    offset = 0.0
    for scene in timeline:
        scene['start'] = round(offset, 6)
        offset += scene['duration'] - transition
    filters = [f'[{i}:v]settb=AVTB,setpts=PTS-STARTPTS[v{i}]' for i in range(len(scenes))]
    previous = 'v0'
    elapsed = timeline[0]['duration']
    for i in range(1, len(scenes)):
        offset = elapsed - transition
        filters.append(f'[{previous}][v{i}]xfade=transition=fade:duration={transition}:offset={offset:.6f}[mix{i}]')
        previous = f'mix{i}'
        elapsed += timeline[i]['duration'] - transition
    inputs = [arg for name, _, _ in scenes for arg in ['-i', segments / (name + '.mp4')]]
    movie = output / 'gameplay-loop.mp4'
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs,
        '-filter_complex', ';'.join(filters), '-map', f'[{previous}]', '-an', '-c:v', 'libx264',
        '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        '-metadata', 'title=Optional Reality — gameplay loop',
        '-metadata', 'comment=Actual browser gameplay with scripted typing. Original simulation and scoring.', movie)
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', movie,
        '-vf', 'fps=8,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
        '-loop', '0', output / 'preview.gif')
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', capture / 'title.png',
        '-frames:v', '1', '-q:v', '2', output / 'poster.jpg')
    info = {'width': 1280, 'height': 720, 'fps': 30, 'duration': duration(movie), 'silent': True,
        'transitionSeconds': transition, 'scenes': timeline,
        'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'files': {name: (output / name).stat().st_size for name in ['gameplay-loop.mp4', 'preview.gif', 'poster.jpg']}}
    (output / 'media.json').write_text(json.dumps(info, indent=2) + '\n')
    print(json.dumps(info, indent=2))

if __name__ == '__main__':
    main()
