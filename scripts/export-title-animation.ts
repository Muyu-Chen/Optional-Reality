// Optional art tooling; not a runtime dependency. Uses @napi-rs/canvas and ffmpeg.
// TITLE_CANVAS_MODULE=/absolute/path/to/@napi-rs/canvas npx tsx scripts/export-title-animation.ts
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { renderTitleFrame, type TitleSprites } from '../client/src/components/front-door/title-animation/render';
import { LOOP_SECONDS, SILHOUETTE } from '../client/src/components/front-door/title-animation/scene';

const { createCanvas, loadImage, Path2D } = createRequire(import.meta.url)(process.env.TITLE_CANVAS_MODULE || '@napi-rs/canvas');
const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(process.argv[2] || join(root, '.localwork/title-animation'));
await mkdir(output, { recursive: true });
const frames = await mkdtemp(join(output, 'frames-'));
const names = ['ball','star','island','exit','cloud','landscape'];
const sprites = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(join(root, `client/src/assets/title-scene/${name}.webp`))]))) as TitleSprites;
const canvas = createCanvas(640,544), ctx = canvas.getContext('2d');
const clip = new Path2D(SILHOUETTE), fps = 20;
for(let i=0;i<LOOP_SECONDS*fps;i++) {
  ctx.save();ctx.scale(.8,.8);renderTitleFrame(ctx,sprites,clip,i/fps);ctx.restore();
  await writeFile(join(frames,`${String(i).padStart(4,'0')}.png`),canvas.toBuffer('image/png'));
  if(i===50) await writeFile(join(output,'title-animation-poster.png'),canvas.toBuffer('image/png'));
}
const result = spawnSync('ffmpeg',['-y','-v','error','-framerate',String(fps),'-i',join(frames,'%04d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',join(output,'title-animation.gif')],{stdio:'inherit'});
if(result.status!==0) throw new Error('GIF export failed; PNG frames preserved for inspection.');
await rm(frames,{recursive:true});
console.log(join(output,'title-animation.gif'));
