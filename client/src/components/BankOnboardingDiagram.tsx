export type BankDiagramKind='bank-approach'|'bank-impact'|'bank-exit';
const star='m0-8 2.5 5.1 5.6.8-4.1 4 .9 5.6L0 4.8l-5 2.7.9-5.6-4.1-4 5.6-.8Z';

export function BankOnboardingDiagram({kind}:{kind:BankDiagramKind}) {
  const x=kind==='bank-approach'?49:139,y=kind==='bank-exit'?30:70;
  return <svg className="onboarding-diagram" viewBox="0 0 220 106" aria-hidden="true" focusable="false">
    <defs><marker id={`lesson-arrow-${kind}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="m1 1 4 2.5L1 6" fill="none" className="lesson-speed-arrow" strokeWidth="1.5" />
    </marker></defs>
    <path d="M128 94 190 32" className="lesson-bounce-floor" />
    <path d="m145 90 7 0 0-7m12-5 7 0 0-7m12-5 7 0 0-7" className="lesson-bounce-pattern" />
    <path d="M24 70h115V18" className="lesson-motion" strokeDasharray="4 5" markerEnd={`url(#lesson-arrow-${kind})`} />
    <circle cx={x} cy={y} r="9" className="lesson-ball" />
    <path d={star} transform="translate(87 70)" className="lesson-star" />
    <path d={star} transform="translate(139 49)" className="lesson-star" />
    <path d={star} transform="translate(139 23)" className="lesson-star" />
    <rect x="129" y="0" width="20" height="12" rx="3" className="lesson-exit" />
    <text x="20" y="21" className="lesson-small-label">GRAVITY OFF</text>
    <text x="151" y="103" className="lesson-small-label">BOUNCE 1</text>
  </svg>;
}
