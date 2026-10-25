import { useId } from 'react';
import type { OnboardingStep } from '../levels/onboarding';

export type BakeryDiagramKind = Extract<OnboardingStep['diagram'], `bakery-${string}`>;

function Bread({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><circle r="11" className="bakery-lesson-bread" />
    <path d="m-6-3 4-4m0 7 5-6" className="bakery-lesson-score" /></g>;
}
function Toaster({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x="-23" y="3" width="46" height="26" rx="6" className="bakery-lesson-machine" />
    <path d="M-17 0h34M-9 24l18-5-18-5 18-5" className="bakery-lesson-coil" />
    <circle cx="17" cy="20" r="2" className="bakery-lesson-light" />
  </g>;
}
function Pickup({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-14-15h28l3 41h-34Z" className="bakery-lesson-pickup" />
    <path d="M-10-15v-8h20v8M-7 7h14m-5-5 5 5-5 5" className="bakery-lesson-bag-mark" />
  </g>;
}
const star = 'm0-7 2.2 4.5 5 .7-3.6 3.5.8 5L0 4.3l-4.4 2.4.8-5-3.6-3.5 5-.7Z';

export function BakeryOnboardingDiagram({ kind }: { kind: BakeryDiagramKind }) {
  const arrow = useId();
  return <svg className="onboarding-diagram bakery-lesson-diagram" viewBox="0 0 260 132" aria-hidden="true" focusable="false">
    <defs><marker id={arrow} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto-start-reverse">
      <path d="m1 1 4 2.5L1 6" fill="none" stroke="context-stroke" strokeWidth="1.6" />
    </marker></defs>
    {kind === 'bakery-setup' ? <>
      <rect x="13" y="87" width="108" height="12" rx="6" className="bakery-lesson-belt" />
      <path d="m23 91 5 2-5 2m22-4 5 2-5 2m22-4 5 2-5 2m22-4 5 2-5 2" className="bakery-lesson-belt-marks" />
      <Bread x={48} y={74} /><Toaster x={147} y={71} />
      <path d="M70 67h42" className="bakery-lesson-flight" markerEnd={`url(#${arrow})`} />
      <path d="M157 59q23-38 64-35" className="bakery-lesson-launch" markerEnd={`url(#${arrow})`} />
      <text x="24" y="117">CONVEYOR</text><text x="122" y="117">TOASTER</text>
      <text x="175" y="51" className="bakery-lesson-accent">UP + RIGHT</text>
    </> : kind === 'bakery-charge' ? <>
      <Toaster x={111} y={77} /><Bread x={111} y={63} />
      <path d="M84 82v19m54-19v19" className="bakery-lesson-launch" markerEnd={`url(#${arrow})`} />
      <path d="M129 53q25-37 55-33" className="bakery-lesson-launch" strokeDasharray="4 4" markerEnd={`url(#${arrow})`} />
      <circle cx="204" cy="55" r="15" className="bakery-lesson-clock" />
      <path d="M204 45v10l7 4" className="bakery-lesson-clock-hand" />
      <text x="184" y="84">0.6 s</text><text x="23" y="124">CONTACT → CHARGE → LAUNCH</text>
    </> : kind === 'bakery-bell' ? <>
      <circle cx="94" cy="57" r="36" className="bakery-lesson-bell-range" />
      <path d="M78 62h32l-5-6v-8a11 11 0 0 0-22 0v8Zm12 5a4 4 0 0 0 8 0" className="bakery-lesson-clock" />
      <path d="M94 35v-4m-21 8-4-4m46 4 4-4" className="bakery-lesson-clock-hand" />
      <Bread x={57} y={57} />
      <path d="M130 48h57" className="bakery-lesson-link" markerEnd={`url(#${arrow})`} />
      <rect x="195" y="18" width="12" height="84" className="bakery-lesson-closed-gate" />
      <rect x="195" y="18" width="12" height="15" rx="2" className="bakery-lesson-open-gate" />
      <Pickup x={235} y={63} /><text x="45" y="120">BELL CONTACT → OPEN SHUTTER</text>
    </> : kind === 'bakery-delivery' ? <>
      <rect x="103" y="24" width="104" height="85" rx="5" className="bakery-lesson-field" />
      <path d="M124 97V76m33 21V76m33 21V76" className="bakery-lesson-draft" markerEnd={`url(#${arrow})`} />
      <path d="M21 101Q85 0 149 42T229 73" className="bakery-lesson-flight" strokeDasharray="4 4" />
      <Bread x={119} y={34} /><Pickup x={234} y={67} />
      {[[63, 54], [167, 44], [205, 62]].map(([x, y]) => <path key={x} d={star} transform={`translate(${x} ${y})`} className="lesson-star" />)}
      <text x="27" y="125">LAUNCH → UPDRAFT → PICKUP</text>
    </> : <>
      <rect x="87" y="13" width="121" height="99" rx="5" className="bakery-lesson-field" />
      <path d="M112 96V72m35 24V72m35 24V72" className="bakery-lesson-draft" markerEnd={`url(#${arrow})`} />
      {kind === 'bakery-field' ? <>
        <path d="M17 75Q73 34 126 48T242 78" className="bakery-lesson-flight" strokeDasharray="4 4" />
        <Bread x={42} y={59} /><Bread x={155} y={54} />
        <path d="M42 22v16" className="lesson-vector" markerEnd={`url(#${arrow})`} />
        <text x="111" y="32">ONLY INSIDE</text><text x="92" y="128">LOCAL UPDRAFT</text>
      </> : <>
        <path d="M20 45Q117 1 233 113" className="bakery-lesson-no-draft" />
        <path d="M20 45Q113 1 227 67" className="bakery-lesson-flight" />
        <Bread x={130} y={32} /><Pickup x={235} y={63} />
        <text x="209" y="130">OFF</text><text x="94" y="128" className="bakery-lesson-accent">POWER 0.45</text>
      </>}
    </>}
  </svg>;
}
