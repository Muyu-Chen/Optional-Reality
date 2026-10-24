import { useEffect } from 'react';

export interface Caption { id: string; lines: string[] }
export function RuleCaption({ captions, finish }: { captions: Caption[]; finish: (id: string) => void }) {
  const current = captions[0];
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => finish(current.id),5000);
    return () => window.clearTimeout(timer);
  }, [current?.id, finish]);
  return current ? <aside className="rule-caption" key={current.id} role="status"><span>RULE CHANGED</span>{current.lines.map((line,index) => <p key={index}>{line}</p>)}</aside> : null;
}
