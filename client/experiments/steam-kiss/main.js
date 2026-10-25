import {createWorld,stepWorld,applyRule,gapOf,closingSpeed,STEP} from './simulation.js';
import {createRenderer} from './renderer.js';

export function mountSteamKiss(root,onBack){
 const $=id=>root.querySelector('#'+id),abort=new AbortController();
 const listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
 let world=createWorld(),last=0,accumulator=0,raf=0,shown=false,context=null,sound=false,eventIndex=0,slow=false;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,renderer=createRenderer($('scene'),reduce);
 const names={pressure:'锅炉压力',friction:'路面摩擦',brake:'制动强度',bounce:'接触弹性'};
 const setNotice=(text,error=false)=>{$('notice').textContent=text;$('notice').className=error?'error':'';};
 function noise(energy){
  if(!sound||!context||context.state!=='running')return;
  const length=context.sampleRate*.7,buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(length*.2));
  const src=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=1200;gain.gain.value=Math.min(.22,.03+energy/500000);src.connect(filter);filter.connect(gain);gain.connect(context.destination);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};src.start();
 }
 function reset(all=false){world=createWorld(all?undefined:world.rules);accumulator=0;renderer.reset();shown=false;eventIndex=0;$('result').hidden=true;setNotice(all?'已恢复初始规则。先发车，再决定何时改变世界。':'保留同样的规则，汽车回到起点。换一个时机，再试一次。');sync();}
 function sync(){
  $('gap').innerHTML=gapOf(world).toFixed(2)+'<sup>m</sup>';
  $('speed').innerHTML=closingSpeed(world).toFixed(2)+'<sup>m/s</sup>';
  $('time').textContent=world.time.toFixed(2).padStart(5,'0')+' s';
  $('status').textContent=world.ended?'本轮完成':world.running?'相向而行':world.time?'时间暂停':'静候发车';
  $('play').textContent=world.running?'暂停 Ⅱ':world.time?'继续 ↗':'发车 ↗';$('play').disabled=world.ended;
  $('proximity').style.width=`${100*(1-Math.min(23.2,gapOf(world))/23.2)}%`;
  for(const key of Object.keys(names))$(key).textContent=world.rules[key].toFixed(2);
  if(world.impact)$('contact-note').textContent=`已接触 · ${world.impact.speed.toFixed(2)} m/s · ${(world.impact.energy/1000).toFixed(1)} kJ`;
  else $('contact-note').textContent='接触速度 ≤ 2.4 m/s，稳定停住后完成轻吻。';
  if(world.ended&&!shown){shown=true;const outcomes={
   kiss:['THE KISS','钢铁，也可以温柔。','两辆车在接触后稳定停住。你找到了速度、摩擦与时机之间的平衡。'],
   crash:['THE CONSEQUENCE','这一次，吻得太重。','相遇的速度变成了火花、蒸汽和飞散的零件。换个时机，看看能不能让钢铁温柔一点。'],
   bump:['A LITTLE TOO FAST','差一点，就是轻吻。','已经接触，但相对速度仍然偏高。试着更早制动，或增加一点路面摩擦。'],
   rebound:['A DIFFERENT ENDING','相吻，然后各奔东西。','接触速度很轻，回弹却把两辆车分开了。降低接触弹性，试着让它们停在一起。'],
   stopped:['TOO SOON','隔着一段距离，停住了。','制动生效了，不过你出手稍早。重试保留规则；也可以恢复初始规则再挑战。'],
   timeout:['ANOTHER POSSIBILITY','还没有等到相遇。','这一轮到时间了。重新考虑压力、摩擦和制动的组合。']};
   const [kicker,title,copy]=outcomes[world.result];$('result-kicker').textContent=kicker;$('result-title').textContent=title;$('result-copy').textContent=copy;
   $('impact-speed').textContent=world.impact?world.impact.speed.toFixed(2)+' m/s':'未接触';$('impact-energy').textContent=world.impact?(world.impact.energy/1000).toFixed(2)+' kJ':'—';$('result').hidden=false;
  }
 }
 const toggle=()=>{if(world.ended)return;world.running=!world.running;accumulator=0;sync();};
 listen($('play'),'click',toggle);listen($('retry'),'click',()=>reset());listen($('result-retry'),'click',()=>reset());listen($('reset'),'click',()=>reset(true));
 listen($('slow'),'click',()=>{slow=!slow;$('slow').textContent=slow?'慢放中 ×0.35':'慢放 ×0.35';$('slow').setAttribute('aria-pressed',String(slow));});
 listen($('rule-form'),'submit',event=>{event.preventDefault();try{const rule=applyRule(world,$('command').value);setNotice(`${names[rule.field]} → ${rule.value.toFixed(2)}。已立即生效。`);$('command').value='';sync();}catch(error){setNotice(error.message,true);}});
 root.querySelectorAll('[data-rule]').forEach(button=>listen(button,'click',()=>{$('command').value=button.dataset.rule;$('command').focus();setNotice('规则已填写。点击「应用规则」才会改变世界。');}));
 listen($('help-toggle'),'click',()=>{const open=$('help').hidden;$('help').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));});
 listen($('sound'),'click',()=>{sound=!sound;if(sound&&!context){try{context=new AudioContext();}catch{sound=false;setNotice('当前浏览器没有可用的音频，仍可正常体验。');}}if(sound)context?.resume().catch(()=>{});else context?.suspend().catch(()=>{});$('sound').textContent=sound?'声音开启':'声音关闭';$('sound').setAttribute('aria-pressed',String(sound));});
 listen(root.querySelector('.brand'),'click',event=>{event.preventDefault();onBack();});
 listen(window,'keydown',event=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLButtonElement)return;if(event.code==='Space'){event.preventDefault();toggle();}else if(event.key.toLowerCase()==='r')reset();else if(event.key==='Escape'&&world.running)toggle();});
 listen(document,'visibilitychange',()=>{if(document.hidden){world.running=false;accumulator=0;last=0;context?.suspend().catch(()=>{});sync();}else if(sound)context?.resume().catch(()=>{});});
 function frame(timestamp){const delta=last?Math.min(.06,(timestamp-last)/1000):0;last=timestamp;if(world.running){accumulator+=delta*(slow?.35:1);while(accumulator>=STEP&&world.running){stepWorld(world);renderer.update(world,STEP);accumulator-=STEP;}}
  while(eventIndex<world.events.length){const event=world.events[eventIndex++];if(event.kind==='impact')noise(event.energy);}
  renderer.draw(world);sync();raf=requestAnimationFrame(frame);
 }
 sync();raf=requestAnimationFrame(frame);
 return ()=>{abort.abort();cancelAnimationFrame(raf);context?.close().catch(()=>{});};
}
