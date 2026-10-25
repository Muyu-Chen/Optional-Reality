// The engine accepts acceleration controls, not force magnitudes. A model must
// not silently reinterpret "5 newtons" as "5 m/s²", even for a clear direction.
const forceQuantity = /(?:[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|[零一二三四五六七八九十百千万两]+)\s*(?:newtons?\b|n\b|牛顿|牛頓)/i;

export function checkForceUnits(input: string) {
  if (forceQuantity.test(input)) throw new Error('Force in newtons is not a supported control. Specify the intended acceleration in m/s² instead.');
}
