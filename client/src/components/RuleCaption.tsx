import { useEffect } from 'react';

export interface Caption { id: string; lines: string[]; group: string }
export function captionHeads(captions: Caption[]) {
  return captions.filter((caption,index) => captions.findIndex(item=>item.group === caption.group) === index);
}
function CaptionCard({ caption, finish, hidden }: { caption: Caption; finish: (id: string) => void; hidden: boolean }) {
  useEffect(() => {
    const timer = window.setTimeout(() => finish(caption.id),5000);
    return () => window.clearTimeout(timer);
  }, [caption.id, finish]);
  return <aside className="rule-caption" role="status" hidden={hidden}><span>RULE CHANGED</span>{caption.lines.map((line,index) => <p key={index}>{line}</p>)}</aside>;
}
export function RuleCaption({ captions, finish }: { captions: Caption[]; finish: (id: string) => void }) {
  const active=captionHeads(captions);
  return <div className="caption-stack">{active.map((caption,index)=><CaptionCard key={caption.id} caption={caption} finish={finish} hidden={index<active.length-3}/>)}</div>;
}
