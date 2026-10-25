import type { OnboardingStep } from '../levels/onboarding';

const star = 'm0-8 2.5 5.1 5.6.8-4.1 4 .9 5.6L0 4.8l-5 2.7.9-5.6-4.1-4 5.6-.8Z';
export function OnboardingDiagram({ kind }: { kind: OnboardingStep['diagram'] }) {
  return <svg className="onboarding-diagram" viewBox="0 0 220 106" aria-hidden="true" focusable="false">
    <defs><marker id={`lesson-arrow-${kind}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="m1 1 4 2.5L1 6" fill="none" className={kind === 'coast' ? 'lesson-speed-arrow' : kind === 'spring' ? 'lesson-spring-arrow' : 'lesson-acceleration-arrow'} strokeWidth="1.5" /></marker></defs>
    {kind === 'queue' ? <>
      <rect x="20" y="15" width="180" height="32" rx="8" className="lesson-message" />
      <rect x="20" y="56" width="180" height="32" rx="8" className="lesson-message" />
      <text x="33" y="35">add gravity</text><text x="33" y="76">stop gravity</text>
      <circle cx="183" cy="31" r="4" className="lesson-ready" /><circle cx="183" cy="72" r="4" className="lesson-ready" />
    </> : kind === 'ramp' || kind === 'coast' ? <>
      <path d="M18 24 69 72Q105 110 132 67T159 53" className="lesson-track" />
      <circle cx={kind === 'ramp' ? 51 : 164} cy={kind === 'ramp' ? 40 : 43} r="10" className="lesson-ball" />
      {kind === 'ramp' ? <path d="M76 20v26" className="lesson-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
        : <><path d="M166 43h30" className="lesson-motion" markerEnd={`url(#lesson-arrow-${kind})`} /><text x="164" y="22" className="lesson-small-label">a = 0</text></>}
      <rect x="198" y="27" width="15" height="36" rx="3" className="lesson-exit" />
    </> : kind === 'soft-floor' || kind === 'low-star' || kind === 'rise' ? <>
      <path d="M18 90h184" className="lesson-bounce-floor" />
      <path d="M31 82q4-7 8 0m20 0q4-7 8 0m20 0q4-7 8 0m20 0q4-7 8 0m20 0q4-7 8 0m20 0q4-7 8 0" className="lesson-bounce-pattern" />
      {kind === 'rise' ? <>
        <path d="M35 76q88 25 139-50" className="lesson-motion" strokeDasharray="4 5" />
        <circle cx="123" cy="58" r="10" className="lesson-ball" />
        <path d="M96 67V30" className="lesson-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
        <path d={star} transform="translate(147 48)" className="lesson-star" /><path d={star} transform="translate(174 24)" className="lesson-star" />
        <rect x="198" y="12" width="15" height="36" rx="3" className="lesson-exit" />
      </> : <>
        <circle cx={kind === 'soft-floor' ? 58 : 103} cy={kind === 'soft-floor' ? 33 : 74} r="10" className="lesson-ball" />
        <path d={star} transform="translate(143 74)" className="lesson-star" />
        {kind === 'soft-floor' ? <path d="M89 24v32" className="lesson-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
          : <path d="M113 73h17" className="lesson-motion" />}
        <text x="26" y="105" className="lesson-small-label">BOUNCE 0.1</text>
      </>}
    </> : <>
      <path d="M83 94h54M99 94l22-6-22-6 22-6-22-6 22-6-11-5" className="lesson-spring" />
      <circle cx="110" cy={kind === 'fall' ? 22 : kind === 'spring' ? 52 : 34} r="10" className="lesson-ball" />
      {kind === 'fall' ? <>
        <path d="M139 22v34" className="lesson-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
        <path d={star} transform="translate(110 51)" className="lesson-star" />
      </> : kind === 'spring' ? <>
        <path d="M81 64V35" className="lesson-spring-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
        <path d="M56 22h106" className="lesson-start-height" /><text x="146" y="17" className="lesson-small-label">START</text>
      </> : <>
        <path d="M139 66V26" className="lesson-vector" markerEnd={`url(#lesson-arrow-${kind})`} />
        <path d={star} transform="translate(110 12)" className="lesson-star" />
        <path d={star} transform="translate(80 31)" className="lesson-star" />
        <rect x="102" y="0" width="16" height="4" rx="2" className="lesson-exit" />
      </>}
    </>}
  </svg>;
}
