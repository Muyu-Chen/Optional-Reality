// Drawing only: shared by Canvas layers, with the UI palette in styles/base.css.
export const sceneColours = {
  background: '#f5f1e7',
  ink: '#203b30',
  muted: '#52665a',
  grid: '#cbd1c0',
  guide: '#adb9a7',
  trail: '#4d805f99',
  actor: '#cbe65b',
  actorHighlight: '#f6ffcc',
  actorOutline: '#25472f',
  star: '#ffc644',
  starOutline: '#986411',
  danger: '#bd4e39',
  goalArrow: '#fffbe4',
  bakeryBackground: '#f2e6ce',
  bakeryInk: '#59452c',
  bakeryMuted: '#756044',
  bakeryTrail: '#8b612caa',
} as const;

export const sceneFonts = {
  label: '15px ui-monospace,monospace',
  small: '14px ui-monospace,monospace',
} as const;
