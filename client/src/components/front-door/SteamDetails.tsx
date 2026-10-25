/** Decorative SVG parts shared by the title machine; no game or simulation state. */
export function Cog({ x, y, radius = 30, reverse = false }: { x: number; y: number; radius?: number; reverse?: boolean }) {
  return <g transform={`translate(${x} ${y})`}><g className={`steam-cog${reverse ? ' steam-cog--reverse' : ''}`}>
    {Array.from({ length: 12 }, (_, index) => <rect key={index} x={-radius * .16} y={-radius * 1.12} width={radius * .32} height={radius * .45} rx="2" fill="#bd8b49" stroke="#765338" strokeWidth="2" transform={`rotate(${index * 30})`} />)}
    <circle r={radius * .84} fill="#c79855" stroke="#765338" strokeWidth="3" />
    <circle r={radius * .55} fill="#34584e" stroke="#f0cf88" strokeWidth="3" />
    {[0, 60, 120].map(angle => <path key={angle} d={`M0 ${-radius * .55}V${radius * .55}`} stroke="#c79855" strokeWidth="7" transform={`rotate(${angle})`} />)}
    <circle r={radius * .16} fill="#f4d390" stroke="#765338" strokeWidth="2" />
  </g></g>;
}

export function PressureGauge({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M0 29v24" stroke="#73563c" strokeWidth="14" /><path d="M0 29v24" stroke="#c99c59" strokeWidth="7" />
    <circle r="33" fill="#b98545" stroke="#5b4835" strokeWidth="3" /><circle r="26" fill="#fff1cd" stroke="#e6c686" strokeWidth="3" />
    {[-60, -30, 0, 30, 60].map(angle => <path key={angle} d="M0-21v5" stroke="#73684c" strokeWidth="2" transform={`rotate(${angle})`} />)}
    <path className="steam-gauge-needle" d="M0 4-13-14" stroke="#9c552f" strokeWidth="3" strokeLinecap="round" /><circle r="4" fill="#43584b" />
    <text y="18" textAnchor="middle" fill="#786444" fontSize="7" fontWeight="800" letterSpacing="1">POSSIBILITY</text>
  </g>;
}

export function SteamPuffs() {
  return <g fill="#fff7df" opacity=".78">
    {[0, 1, 2].map(index => <g className={`steam-puff steam-puff--${index}`} key={index} transform={`translate(${111 + index * 6} ${318 - index * 23})`}>
      <ellipse rx={14 + index * 4} ry={10 + index * 3} /><circle cx="-7" cy="-6" r={8 + index * 3} /><circle cx="8" cy="-5" r={10 + index * 2} />
    </g>)}
  </g>;
}

export function Rivets({ x, y, width }: { x: number; y: number; width: number }) {
  return <g fill="#f2d59b" stroke="#785638" strokeWidth="1.4">
    {[0, width].map(offset => <circle key={offset} cx={x + offset} cy={y} r="4" />)}
  </g>;
}
