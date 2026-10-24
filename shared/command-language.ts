// Known spelling fixes only. Numbers, negation and scene IDs stay intact.
export function normalizeCommand(input: string): string {
  let text = input.trim();
  const replacements: readonly [RegExp, string][] = [
    [/\bgrav(?:tiy|itiy|ty)\b/gi, 'gravity'],
    [/\baccel(?:aration|eraton|leration|ation)\b/gi, 'acceleration'],
    [/\bfricton\b/gi, 'friction'],
    [/\brest(?:ituion|itutionn)\b/gi, 'restitution'],
    [/\bbouce\b/gi, 'bounce'],
  ];
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  if (/\bacceleration\b/i.test(text)) {
    text = text.replace(/\bright\s+(?:word|ward)\b/gi, 'rightward')
      .replace(/\bleft\s+(?:word|ward)\b/gi, 'leftward')
      .replace(/\brigth\b/gi, 'right');
  }
  return text;
}
