import type { RuleComparisonView } from './rule-comparison';

export function drawRuleComparison(ctx:CanvasRenderingContext2D,view:RuleComparisonView,width=800) {
  if(view.reference.length<2 || view.opacity<=0)return;
  ctx.save();ctx.globalAlpha=view.opacity;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3;
  for(const [points,colour,dash] of [[view.reference,'#77828a',[5,7]],[view.actual,'#32865e',[]]] as const) {
    ctx.setLineDash([...dash]);ctx.strokeStyle=colour;ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  }
  ctx.setLineDash([]);
  const [x,y]=view.reference[0];
  const labelX=Math.max(12,Math.min(width-222,x-90)),labelY=Math.max(52,y-60);
  ctx.fillStyle='#fffdf0e8';ctx.beginPath();ctx.roundRect(labelX-8,labelY-23,214,48,9);ctx.fill();
  ctx.font='600 12px sans-serif';ctx.fillStyle='#65737c';ctx.fillText('DASHED · Without your change',labelX,labelY-5);
  ctx.fillStyle='#28734e';ctx.fillText('GREEN · Your new path',labelX,labelY+13);
  ctx.restore();
}
