/** Generate the five public demo narration clips; never logs API keys or audio data.
 * Node 22+, GEMINI_API_KEY in the environment. Output WAVs are private local inputs.
 * Usage: node scripts/generate-demo-voice.mjs /absolute/output/directory
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('Set GEMINI_API_KEY in the environment.');
if (!process.argv[2]) throw new Error('Pass a local output directory.');
const output = path.resolve(process.argv[2]);
await fs.mkdir(output, { recursive: true, mode: 0o700 });
const script = JSON.parse(await fs.readFile(new URL('../site/showcase/narration.json', import.meta.url), 'utf8'));
for (const clip of script) {
  const destination = path.join(output, `${clip.id}.wav`);
  try { await fs.access(destination); console.log(`${clip.id}: keeping existing WAV`); continue; } catch {}
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(110000),
    body: JSON.stringify({
      model: 'gemini-3.8-flash-tts',
      input: [{ type: 'user_input', content: [{ type: 'text', text: clip.text, annotations: [{
        type: 'speech_metadata',
        style: 'Warm, engaging product-demo narrator. Clear neutral American English. Natural conversational delivery, light curiosity, no exaggerated sales voice. Brisk but intelligible, about 165 words per minute. Read only the supplied text, with short pauses and no extra words.',
      }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: 'Kore' }] },
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Speech generation failed: HTTP ${response.status} (${result.error?.status || 'unknown'})`);
  const audio = (result.steps || []).filter(step => step.type === 'model_output')
    .flatMap(step => step.content || []).find(content => content.type === 'audio');
  if (!audio?.data) throw new Error(`No audio returned for ${clip.id}`);
  const bytes = Buffer.from(audio.data, 'base64');
  if (bytes.toString('ascii', 0, 4) !== 'RIFF') throw new Error(`Expected a WAV for ${clip.id}`);
  await fs.writeFile(destination, bytes, { mode: 0o600, flag: 'wx' });
  console.log(`${clip.id}: generated ${bytes.length} bytes`);
}
