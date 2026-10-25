#!/usr/bin/env python3
"""Create English demo subtitles from a LOCAL MLX Whisper large-v3 model.

Uses Pillow subtitle overlays so FFmpeg does not need libass. Original audio is
copied unchanged. The input movie and downloaded model are never modified.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]


def stamp(seconds, separator='.'):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{separator}{ms%1000:03}'


def make_cues(result):
    words = [dict(word) for segment in result['segments'] for word in segment['words']]
    corrections = []
    # Editorial review of the model result: title capitalization and a homophone
    # checked against the actual spoken script. Timing stays from Whisper.
    for i, word in enumerate(words):
        original = word['word']
        word['word'] = re.sub(r'\boptional\b', 'Optional', word['word'])
        if i and 'Optional' in words[i - 1]['word']:
            word['word'] = re.sub(r'\breality\b', 'Reality', word['word'])
        if word['word'].strip() == 'Break' and ' '.join(w['word'].strip() for w in words[i:i+3]) == 'Break the drift,':
            word['word'] = word['word'].replace('Break', 'Brake')
        if word['word'] != original:
            corrections.append({'from': original.strip(), 'to': word['word'].strip(), 'time': word['start']})

    # The approved narration supplies the words and punctuation. Whisper only
    # supplies the measured timing. Join split ASR words such as "three -star";
    # abort on any unexplained mismatch instead of silently inventing alignment.
    reference = json.loads((ROOT / 'site/showcase/narration.json').read_text())
    normalize = lambda text: re.sub(r'[^a-z]', '', text.lower())
    aligned, index = [], 0
    for token in ' '.join(clip['text'] for clip in reference).split():
        start_index, combined = index, ''
        while index < len(words) and len(combined) < len(normalize(token)):
            combined += normalize(words[index]['word'])
            index += 1
        assert combined == normalize(token), f'Unmatched narration word: {token}'
        aligned.append({'word':' '+token,'start':words[start_index]['start'],'end':words[index-1]['end'],
                        'probability':min(word['probability'] for word in words[start_index:index])})
    assert index == len(words), 'Unmatched extra ASR words'
    words = aligned

    # Whisper can assign intro music to the beginning of a phrase. Constrain
    # its first word to the known narration onset, without replacing ASR text.
    production = json.loads((ROOT / 'site/showcase/audio-production.json').read_text())
    onset_corrections = []
    for clip in production['voice']['clips']:
        candidates = [word for word in words if word['start'] <= clip['start'] < word['end']]
        if not candidates: continue
        nearest = candidates[0]
        if nearest['start'] < clip['start'] and abs(nearest['start'] - clip['start']) < .8:
            start = min(clip['start'], nearest['end'] - .04)
            onset_corrections.append({'word':nearest['word'].strip(),'from':nearest['start'],'to':start})
            nearest['start'] = start

    groups, pending = [], []
    def flush():
        if pending:
            groups.append({'start':round(pending[0]['start'],3),'end':round(pending[-1]['end'] + .14,3),
                           'text':re.sub(r'\s+(-[A-Za-z])',r'\1',' '.join(w['word'].strip() for w in pending)),'words':[dict(w) for w in pending]})
            pending.clear()
    for word in words:
        candidate = ' '.join(w['word'].strip() for w in [*pending,word])
        if pending and (len(candidate) > 72 or word['start'] - pending[-1]['end'] > .65):
            flush()
        pending.append(word)
        if re.search(r'[.!?]$',word['word']) or (word['word'].endswith(',') and len(candidate) > 33):
            flush()
    flush()
    for i, cue in enumerate(groups):
        if i + 1 < len(groups): cue['end'] = min(cue['end'],groups[i+1]['start'] - .025)
        assert cue['end'] > cue['start'] >= 0
    return groups,corrections,onset_corrections


def render_overlay(text,font):
    canvas = Image.new('RGBA',(1280,128))
    if not text:return canvas.tobytes()
    draw=ImageDraw.Draw(canvas)
    words=text.split();lines=[];line=''
    for word in words:
        candidate=(line+' '+word).strip()
        if draw.textlength(candidate,font=font)>1060 and line:
            lines.append(line);line=word
        else:line=candidate
    if line:lines.append(line)
    assert len(lines)<=2,text
    line_height=43
    height=line_height*len(lines)+14
    top=128-27-height
    width=max(draw.textlength(line,font=font) for line in lines)+38
    draw.rounded_rectangle(((1280-width)/2,top,(1280+width)/2,top+height),radius=11,fill=(15,30,25,219))
    for i,line in enumerate(lines):
        draw.text((640,top+7+i*line_height),line,font=font,anchor='mt',fill=(255,255,246,255),stroke_width=1,stroke_fill=(0,0,0,220))
    return canvas.tobytes()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',type=Path)
    parser.add_argument('--model',type=Path,required=True,help='Existing local MLX Whisper model directory')
    parser.add_argument('--work',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=ROOT/'site/showcase/youtube-demo-subtitled.mp4')
    parser.add_argument('--transcript-json',type=Path,help='Reuse the unedited local model output')
    args=parser.parse_args();work=args.work.resolve();work.mkdir(parents=True,exist_ok=True)
    assert (args.model/'config.json').is_file() and (args.model/'weights.npz').is_file(),'A complete local model is required'
    if args.transcript_json:
        result=json.loads(args.transcript_json.read_text())
    else:
        os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
        import mlx_whisper
        result=mlx_whisper.transcribe(str(args.input.resolve()),path_or_hf_repo=str(args.model.resolve()),language='en',temperature=0.0,
            task='transcribe',word_timestamps=True,condition_on_previous_text=False,hallucination_silence_threshold=1.5,verbose=False)
        (work/'whisper-raw.json').write_text(json.dumps(result,indent=2)+'\n')
    cues,corrections,onsets=make_cues(result)
    showcase=ROOT/'site/showcase'
    (showcase/'narration.en.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"],",")} --> {stamp(c["end"],",")}\n{c["text"]}' for i,c in enumerate(cues))+'\n')
    (showcase/'narration.en.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for c in cues)+'\n')
    data={'engine':'mlx-whisper','model':'whisper-large-v3 (local MLX weights)','offline':True,
          'textSource':'Confirmed narration.json script; ASR used for word timestamps',
          'inputSha256':hashlib.sha256(args.input.read_bytes()).hexdigest(),'rawText':result['text'].strip(),
          'editorialCorrections':corrections,'onsetCorrections':onsets,'cues':cues}
    (showcase/'narration.whisper.json').write_text(json.dumps(data,indent=2)+'\n')

    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height,r_frame_rate','-show_entries','format=duration','-of','json',str(args.input)]))
    assert info['streams'][0]['width']==1280 and info['streams'][0]['height']==720
    duration=float(info['format']['duration']);fps=30;frames=round(duration*fps)
    font_path=Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
    font=ImageFont.truetype(str(font_path),34)
    overlays=[render_overlay(c['text'],font) for c in cues];blank=render_overlay('',font)
    command=['ffmpeg','-hide_banner','-loglevel','warning','-y','-i',str(args.input.resolve()),
        '-f','rawvideo','-pixel_format','rgba','-video_size','1280x128','-framerate','30','-i','pipe:0',
        '-filter_complex','[0:v][1:v]overlay=x=0:y=H-h:format=auto[v]','-map','[v]','-map','0:a:0',
        '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-t',str(duration),
        '-movflags','+faststart','-metadata','title=Optional Reality — English narrated demo with subtitles',
        '-metadata','comment=Subtitles transcribed offline by local Whisper large-v3, reviewed and burned into the picture.',str(args.output.resolve())]
    with (work/'encode.log').open('w') as log:
        process=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=log)
        try:
            for frame in range(frames):
                now=frame/fps
                index=next((i for i,cue in enumerate(cues) if cue['start']<=now<cue['end']),None)
                process.stdin.write(overlays[index] if index is not None else blank)
            process.stdin.close()
            if process.wait():raise RuntimeError('FFmpeg encoding failed; inspect encode.log')
        except BaseException:
            if process.stdin and not process.stdin.closed:process.stdin.close()
            process.wait();raise
    print(json.dumps({'output':str(args.output.resolve()),'cues':len(cues),'corrections':corrections,'onsetCorrections':onsets},indent=2))


if __name__=='__main__':main()
