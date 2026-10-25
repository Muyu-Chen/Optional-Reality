type Step = 'write' | 'time' | 'collect';

/** Small entrance illustrations reuse the game's ball / rail / star vocabulary. */
export function IntroDiagram({ step }: { step: Step }) {
  return <svg className="intro-diagram" viewBox="0 0 260 110" aria-hidden="true">
    <path d="M14 91h232" stroke="#a7cbd9" strokeWidth="2" strokeDasharray="3 7" />
    {step === 'write' ? <>
      <rect x="26" y="18" width="174" height="58" rx="14" fill="#fff8e3" stroke="#759b97" strokeWidth="2" />
      <text x="43" y="52" fill="#234e40" fontSize="17" fontWeight="700">add gravity</text>
      <path d="m167 76 12 13 11-13" fill="#fff8e3" stroke="#759b97" strokeWidth="2" />
      <rect x="184" y="58" width="45" height="29" rx="9" fill="#2d624b" /><path d="M197 72h19m-7-6 7 6-7 6" fill="none" stroke="#fff8e3" strokeWidth="2" />
    </> : step === 'time' ? <>
      <path d="M22 32q80 106 153 23h28" fill="none" stroke="#355e50" strokeWidth="7" strokeLinecap="round" />
      <circle cx="64" cy="55" r="13" fill="#c8e956" stroke="#305242" strokeWidth="3" /><circle cx="60" cy="50" r="4" fill="#fcffe0" />
      <path d="M179 41h30" stroke="#b88b35" strokeWidth="2" strokeDasharray="3 5" />
      <circle cx="218" cy="29" r="20" fill="#fff8e3" stroke="#bd944a" strokeWidth="3" /><path d="M218 17v12l9 5" fill="none" stroke="#315b4d" strokeWidth="3" strokeLinecap="round" />
    </> : <>
      {[55,108,161].map((x,i) => <path key={x} transform={`translate(${x} ${i===1?35:53})`} d="m0-16 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#f8cd62" stroke="#a77b2f" strokeWidth="2" />)}
      <path d="M204 80V45a18 18 0 0 1 36 0v35Z" fill="#2d624b" stroke="#b89b50" strokeWidth="2" /><path d="M213 58h18m-6-6 6 6-6 6" stroke="#fff7d9" strokeWidth="3" fill="none" />
    </>}
  </svg>;
}
