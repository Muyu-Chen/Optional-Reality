const video=document.getElementById('demo'),status=document.getElementById('status');
function resume(){video.play().catch(()=>{status.textContent='Press play to start the looping demo.'})}
video.addEventListener('loadedmetadata',()=>{status.textContent=`${Math.round(video.duration)} seconds · 1280 × 720 · repeats automatically.`});
video.addEventListener('pause',()=>{status.textContent='Paused. Press play to continue the loop.'});
video.addEventListener('playing',()=>{status.textContent=`${Math.round(video.duration||0)} seconds · 1280 × 720 · repeats automatically.`});
document.getElementById('restart').addEventListener('click',()=>{video.currentTime=0;resume()});
document.getElementById('fullscreen').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{status.textContent='Use the video controls to enter fullscreen.'});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()});
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>{video.currentTime=Number(button.dataset.seek);resume()}));
document.getElementById('captions').addEventListener('click',event=>{const show=event.currentTarget.getAttribute('aria-pressed')!=='true';for(const track of video.textTracks)track.mode=show&&track.language==='zh'?'showing':'disabled';event.currentTarget.setAttribute('aria-pressed',String(show))});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause();status.textContent='Reduced motion is enabled. Press play to watch.'}
