import { useEffect, useId, useRef } from 'react';
import { titleAssets } from './assets';
import { BOXES, SILHOUETTE, TRAJECTORY_PATH, titleFrame } from './scene';

/** Independently drawn sprites, updated without rerendering React every frame. */
export function TitleScene() {
  const clip = useId();
  const scene = useRef<SVGGElement>(null);
  const ball = useRef<SVGGElement>(null);
  const stars = useRef<(SVGGElement | null)[]>([]);
  const clouds = useRef<(SVGImageElement | null)[]>([]);
  const sparkles = useRef<(SVGGElement | null)[]>([]);
  const caption = useRef<SVGTextElement>(null);
  const score = useRef<SVGTextElement>(null);
  const portal = useRef<SVGEllipseElement>(null);
  useEffect(() => {
    let handle = 0, start: number | undefined;
    const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;
    function draw(now: number) {
      start ??= now;
      const frame = titleFrame((now - start) / 1000, motion?.matches);
      scene.current?.setAttribute('opacity', String(frame.sceneOpacity));
      ball.current?.setAttribute('transform', `translate(${frame.ball.x} ${frame.ball.y}) scale(${frame.ball.scale}) rotate(${frame.ball.rotation * 180 / Math.PI})`);
      ball.current?.setAttribute('opacity', String(frame.ball.opacity));
      frame.stars.forEach((star, i) => {
        stars.current[i]?.setAttribute('transform', `translate(${star.x} ${star.y}) rotate(${star.rotation * 180 / Math.PI}) scale(${star.scale})`);
        stars.current[i]?.setAttribute('opacity', String(star.opacity));
        sparkles.current[i]?.setAttribute('opacity', String(star.sparkle));
      });
      frame.clouds.forEach((cloud, i) => {
        clouds.current[i]?.setAttribute('x', String(cloud.x));
      });
      portal.current?.setAttribute('opacity', String(frame.portal));
      portal.current?.setAttribute('rx', String(16 + frame.portal * 18));
      if (caption.current) caption.current.textContent = frame.caption;
      if (score.current) score.current.textContent = `${frame.activeStars} / 3 STARS`;
      if (!motion?.matches) handle = requestAnimationFrame(draw);
    }
    function restart() { cancelAnimationFrame(handle); handle = requestAnimationFrame(draw); }
    restart(); motion?.addEventListener('change', restart);
    return () => { cancelAnimationFrame(handle); motion?.removeEventListener('change', restart); };
  }, []);
  const initial = titleFrame(0, true);
  return <svg className="title-illustration" viewBox="0 0 800 680" role="img"
    aria-label="A little green ball leaps between brass clockwork islands, collecting three stars before a steam-powered doorway draws it in.">
    <defs><clipPath id={clip}><path d={SILHOUETTE} /></clipPath></defs>
    <g clipPath={`url(#${clip})`} ref={scene}>
      <image href={titleAssets.landscape} {...BOXES.landscape} preserveAspectRatio="xMidYMid slice" />
      {initial.clouds.map((cloud, i) => <image key={i} ref={node => { clouds.current[i] = node; }} href={titleAssets.cloud} {...cloud} />)}
      <path d={TRAJECTORY_PATH} stroke="#fff9db" strokeWidth="3" fill="none" strokeDasharray="2 12" opacity=".6" />
      <image href={titleAssets.island} {...BOXES.islandLeft} preserveAspectRatio="none" />
      <image href={titleAssets.island} {...BOXES.islandRight} preserveAspectRatio="none" />
      <image href={titleAssets.exit} {...BOXES.exit} preserveAspectRatio="none" />
      <ellipse ref={portal} cx="602" cy="331" rx="20" ry="35" fill="#101f30" stroke="#92dcdd" strokeWidth="3" opacity="0" />
      {initial.stars.map((star, i) => <g key={i}>
        <g ref={node => { stars.current[i] = node; }} transform={`translate(${star.x} ${star.y})`}>
          <image href={titleAssets.star} x="-24" y="-24" width="48" height="48" />
        </g>
        <g ref={node => { sparkles.current[i] = node; }} opacity="0" stroke="#fff7ca" strokeWidth="3" strokeLinecap="round">
          {[0,1,2,3,4,5].map(j => <path key={j} transform={`translate(${star.x} ${star.y}) rotate(${j * 60})`} d="M32 0h12" />)}
        </g>
      </g>)}
      <g ref={ball} transform="translate(180 396)"><image href={titleAssets.ball} x="-23" y="-23" width="46" height="46" /></g>
      <text ref={score} x="400" y="133" textAnchor="middle" fill="#497b7d" fontSize="13" fontWeight="800" letterSpacing="2">0 / 3 STARS</text>
    </g>
    <g transform="translate(344 535)">
      <rect width="350" height="72" rx="22" fill="#285647" stroke="#c29a55" strokeWidth="3" />
      <path d="m38 72 13 17 12-17" fill="#285647" />
      <text x="23" y="26" fill="#c9dfc9" fontSize="11" fontWeight="800" letterSpacing="1.7">THE RULE ENGINE</text>
      <text ref={caption} x="23" y="51" fill="#fff5db" fontSize="20" fontWeight="750">Choose the moment.</text>
    </g>
  </svg>;
}
