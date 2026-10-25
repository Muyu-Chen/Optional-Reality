const video=document.getElementById('demo'),status=document.getElementById('status');
const sound=document.getElementById('sound'),captions=document.getElementById('captions');
const narrated=document.body.dataset.edition==='narrated';
let soundPreference=null;
let captionChoice=null;
function soundState(){
  const audible=!video.muted&&video.volume>0;
  sound.textContent=audible?'Mute sound':'Enable sound';
  sound.setAttribute('aria-pressed',String(audible));
  status.textContent=audible?(narrated?'English voiceover + original music and cues.':'Original music + gameplay cues. Repeats automatically.'):'Tap Enable sound for original music and gameplay cues.';
}
function resume(){
  if(soundPreference!==false){video.muted=false;video.volume=.75;soundPreference=true}
  video.play().catch(()=>{status.textContent='Press the video’s play button to start.'});
}
sound.addEventListener('click',()=>{
  const enable=video.muted||video.volume===0;
  soundPreference=enable;video.muted=!enable;if(enable)video.volume=.75;
  soundState();if(enable)video.play().catch(()=>{status.textContent='Press play to listen.'});
});
video.addEventListener('volumechange',()=>{soundPreference=!video.muted&&video.volume>0;soundState()});
video.addEventListener('loadedmetadata',soundState);
video.addEventListener('playing',soundState);
video.addEventListener('pause',()=>{status.textContent='Paused. Press play to continue.'});
document.getElementById('play-narrated')?.addEventListener('click',resume);
document.getElementById('restart').addEventListener('click',()=>{video.currentTime=0;resume()});
document.getElementById('fullscreen').addEventListener('click',()=>{if(video.requestFullscreen)video.requestFullscreen().catch(()=>{status.textContent='Use the video controls to enter fullscreen.'});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen()});
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>{video.currentTime=Number(button.dataset.seek);resume()}));
function captionState(){captions.setAttribute('aria-pressed',String(Array.from(video.textTracks).some(t=>t.language==='en'&&t.mode==='showing')))}
function showCaptions(show){for(const track of video.textTracks)track.mode=show&&track.language==='en'?'showing':'disabled';captionState()}
captions.addEventListener('click',()=>{captionChoice=captions.getAttribute('aria-pressed')!=='true';showCaptions(captionChoice)});
video.addEventListener('loadedmetadata',()=>{if(captionChoice===null)showCaptions(true)});
video.textTracks.addEventListener('change',captionState);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause()});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause();status.textContent='Reduced motion is enabled. Press play to watch.'}
soundState();showCaptions(true);
