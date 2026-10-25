import { useId } from 'react';
import type { LevelDefinition } from '../../levels/types';

const colours = { bounce: '#2374c7', friction: '#14847f', structure: '#395d4e' };

/** The preview uses the real level geometry, rather than an unrelated screenshot. */
export function LevelPreview({ level }: { level: LevelDefinition }) {
  const id = useId();
  const { width, height } = level.viewport;
  const bakery = level.presentation === 'bakery';
  return <svg className={`level-preview${bakery ? ' level-preview--bakery' : ''}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={bakery ? '#efcf99' : '#bedcd1'} /><stop offset="1" stopColor="#f7edc9" /></linearGradient></defs>
    <path fill={`url(#${id}-sky)`} d={`M0 0h${width}v${height}H0z`} />
    {bakery ? <g opacity=".3" stroke="#997a50" strokeWidth="3"><path d={`M0 ${height * .7}h${width}M0 ${height * .86}h${width}`} />
      {[.15, .35, .55, .75, .95].map(x => <path key={x} d={`M${width * x} ${height * .7}v${height * .3}`} />)}</g>
      : <><circle cx={width * .79} cy={height * .19} r={height * .13} fill="#fff4c5" />
        <path d={`M0 ${height * .6} ${width * .17} ${height * .3} ${width * .39} ${height * .58} ${width * .62} ${height * .22} ${width} ${height * .6}V${height}H0Z`} fill="#86b7a8" opacity=".35" />
        <path d={`M0 ${height * .9}Q${width * .3} ${height * .67} ${width * .5} ${height * .88}T${width} ${height * .86}V${height}H0Z`} fill="#9cb894" opacity=".35" /></>}
    {level.tracks.map(track => <polyline key={track.id} points={track.points.map(point => point.join(',')).join(' ')}
      fill="none" stroke={track.feature ? colours[track.feature] : colours.structure} strokeWidth={track.thickness}
      strokeLinecap="round" strokeLinejoin="round" />)}
    {level.devices?.map(device => {
      if (device.kind === 'sensor') return <circle key={device.id} cx={device.position[0]} cy={device.position[1]} r={device.radius} fill="#ffd267" stroke="#a88130" strokeWidth="4" />;
      if (device.kind === 'rotor') return <circle key={device.id} cx={device.position[0]} cy={device.position[1]} r={device.radius} fill="#d9b773" />;
      const { x, y, width: w, height: h } = device.area;
      return <g key={device.id}>
        <rect x={x} y={y} width={w} height={device.kind === 'fan' ? h : Math.max(h, 12)} rx="5"
          fill={device.kind === 'fan' ? '#a9d8d1' : device.kind === 'gate' ? '#778c75' : '#d6883f'} opacity={device.kind === 'fan' ? .6 : 1} />
        {device.kind === 'fan' && <path d={`m${x + w / 2} ${y + h * .65}v-${h * .35}m-14 14 14-14 14 14`} fill="none" stroke="#267c70" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />}
        {device.kind === 'spring' && <path d={`M${x + w * .2} ${y + h}l${w * .6} ${-h * .2}-${w * .6} ${-h * .2} ${w * .6} ${-h * .2}-${w * .6} ${-h * .2}`} fill="none" stroke="#895e2d" strokeWidth="5" />}
      </g>;
    })}
    <rect x={level.exit.x} y={level.exit.y} width={level.exit.width} height={level.exit.height} rx="9" fill="#397456" stroke="#d2d5a1" strokeWidth="4" />
    <path d={`M${level.exit.x + level.exit.width * .25} ${level.exit.y + level.exit.height * .5}h${level.exit.width * .5}m${-level.exit.width * .18} ${-level.exit.height * .14} ${level.exit.width * .18} ${level.exit.height * .14}-${level.exit.width * .18} ${level.exit.height * .14}`} fill="none" stroke="#fffbdc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {level.stars?.map(star => <g key={star.id} transform={`translate(${star.position[0]} ${star.position[1]}) scale(${(star.radius || 14) / 12})`}>
      <path d="m0-13 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z" fill="#ffd15d" stroke="#9d7228" strokeWidth="2.5" />
    </g>)}
    {level.ball.shape?.kind === 'box'
      ? <rect x={level.ball.position[0] - level.ball.shape.width / 2} y={level.ball.position[1] - level.ball.shape.height / 2}
        width={level.ball.shape.width} height={level.ball.shape.height} rx="4" fill="#cce762" stroke="#31553d" strokeWidth="4" />
      : <circle cx={level.ball.position[0]} cy={level.ball.position[1]} r={level.ball.radius} fill="#d1e963" stroke="#31553d" strokeWidth="4" />}
  </svg>;
}
