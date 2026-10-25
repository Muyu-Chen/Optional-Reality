const translations = {
  navHow:'怎么玩',navChapters:'探索关卡',navShare:'分享给朋友',heroTag:'一个已经可以玩的物理世界',
  heroLineOne:'现实，',heroLineTwo:'可以改写。',heroKicker:'改变规则，选择生效的时刻。',
  heroDescription:'你不直接操控小球，而是改变它的世界。写下一句话，改写一条规则，看看好奇心会把你带到哪里。',
  watchDemo:'看看实际演示',playDesktop:'在电脑上开始游戏 ↗',deviceNote:'手机可以浏览介绍、观看演示和分享；实际游戏请使用电脑的键盘与鼠标。',
  statLevels:'个小小世界',statChapters:'个主题章节',statStars:'颗星等你发现',heroRuleLabel:'一条小小的规则',heroReady:'已就绪 ↗',artCaption:'一点小改变，一条完全不同的通关路线。',
  demoEyebrow:'01 / 先看看它怎么玩',demoTitle:'一句话，改变一个瞬间。',demoDescription:'三个真实关卡，自动逐字输入，三次满星通关。直接看看世界如何回应。',
  actualGameplay:'真实游戏录像',videoHint:'默认静音，自动循环。每个小变化，都可以再看一次。',captions:'中文字幕',fullscreen:'全屏观看 ↗',
  motion:'运动',collisions:'碰撞',devices:'机关',demoProof:'真实界面录制与自动输入，使用原本的物理引擎和评分规则。',
  howEyebrow:'02 / 换一种方式操控',howTitleOne:'寥寥几句话，',howTitleTwo:'打开更多可能。',howDescription:'通关不只有一个答案。乐趣就在于找到属于你的那条路。',
  stepOneTitle:'写下一个小改变。',stepOneBody:'用中文或英文调整重力、弹性、摩擦，或场景中可修改的机关。准备好的消息会先留在队列里。',
  stepTwoTitle:'选择关键的时刻。',stepTwoBody:'时机到了，再按 Send now。关闭重力会保留惯性；向左制动，也不会让向右移动的小球瞬间停下。',
  stepThreeTitle:'再找一种走法。',stepThreeBody:'到达出口即可过关，收齐三颗星才能满分。重试、换个时机，探索一条属于你的路线。',
  chaptersEyebrow:'03 / 十五个小小世界',chaptersTitle:'同样的规则，不一样的可能。',chaptersDescription:'所有关卡从一开始就开放。按章节慢慢探索，也可以跟着好奇心走。',
  fiveLevels:'5 个关卡',sevenLevels:'7 个关卡',threeLevels:'3 个关卡',motionTitle:'让惯性给你惊喜。',motionBody:'下落、滑行、反转，再绕过一堵墙。同样一句话，在另一个时刻发送，就是另一种解法。',watchMotion:'看运动关演示 ↗',
  collisionsTitle:'让每次落地都算数。',collisionsBody:'把一次碰撞变成新的方向。弹得更高，落得更轻，或者增加恰到好处的摩擦，回到终点。',watchCollisions:'看碰撞关演示 ↗',
  devicesTitle:'一块面包，一点配合。',devicesBody:'开启面包机，调整向上的气流，再让门铃打开卷帘门。完成面包店的最后一单配送。',watchDevices:'看机关关演示 ↗',
  whyEyebrow:'一个听得懂你的世界',whyTitle:'你的想法，成为规则。',whyBody:'AI 帮你把日常语言理解成受支持的修改，物理引擎负责接下来的运动。想改什么、何时生效、怎样通关，仍然由你决定。',
  youWrite:'你写下',exampleIntent:'“给风扇一点向上的气流。”',worldResponds:'世界回应',exampleResult:'面包在风场里下落得慢了一点。于是，原本够不到的取货袋，突然近在眼前。',
  shareEyebrow:'04 / 把可能性传下去',shareTitle:'分享一个值得探索的小世界。',shareBody:'用手机扫码打开这页介绍。保存链接、发给朋友，或者把分享卡摆在现场演示旁。',
  copyLink:'复制介绍页链接',downloadCard:'下载分享卡 ↓',shareNote:'二维码打开的是手机介绍页，不会直接进入电脑游戏。',scanToExplore:'扫码，开始探索',downloadQr:'下载单独二维码 ↓',
  faqEyebrow:'你可能还想知道',faqTitle:'在你问“如果……”之前。',faqPhoneTitle:'手机可以玩吗？',faqPhoneBody:'手机可以完整浏览介绍、观看循环演示和分享链接。实际关卡目前需要电脑，以及键盘和鼠标。',
  faqRulesTitle:'可以随便写什么规则吗？',faqRulesBody:'可以用中英文修改环境中已有的、受支持的规则。小球、出口和固定布局不变；每关都会显示哪些内容可以修改。',
  faqScoreTitle:'必须收齐三颗星才能过关吗？',faqScoreBody:'不用。到达出口就能过关，收齐三颗星才是满分。所有关卡均开放，也可以随时重试。',
  faqAiTitle:'AI 具体参与什么？',faqAiBody:'AI 理解语言，物理引擎计算运动。演示视频是真实游戏录制与自动输入。开发中的 AI 辅助、素材来源和验证方式，都在仓库中说明。',
  aiUsage:'查看 AI 使用说明 ↗',finalEyebrow:'通关，从来不止一种走法。',finalTitle:'试试另一条规则。',watchAgain:'再看一次演示 ↻',footerLine:'一个关于“如果”的小小游乐场。',aiUsageShort:'AI 使用与素材说明',standaloneDemo:'独立循环播放页 ↗',
  dockTitle:'47 秒，认识这个小世界。',dockSubtitle:'手机先看演示，之后用电脑玩。',dockWatch:'看演示'
};

const originals = new Map(Array.from(document.querySelectorAll('[data-i18n]'),node=>[node.dataset.i18n,node.textContent]));
const video = document.getElementById('intro-video');
const videoStatus = document.getElementById('video-status');
const captionsButton = document.getElementById('video-captions');
const languageButton = document.getElementById('language');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const languageKey = 'optional-reality:intro:language:v1';
let language = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
try { const saved=localStorage.getItem(languageKey);if(saved==='zh'||saved==='en')language=saved; } catch { /* The page also works without storage. */ }
const requested = new URLSearchParams(location.search).get('lang');
if(requested==='zh'||requested==='en')language=requested;
let captionsOn = language==='zh';
function text(key){return language==='zh' ? translations[key]||originals.get(key)||key : originals.get(key)||key}
function setCaptions(){
  for(const track of video.textTracks)track.mode=captionsOn&&track.language===language?'showing':'disabled';
  captionsButton.setAttribute('aria-pressed',String(captionsOn));
}
function applyLanguage(){
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=text(node.dataset.i18n)});
  document.title=language==='zh'?'Optional Reality｜现实，可以改写。':'Optional Reality — Change the rules. Choose the moment.';
  languageButton.textContent=language==='zh'?'EN':'中文';
  languageButton.setAttribute('aria-label',language==='zh'?'Switch language to English':'切换为中文');
  setCaptions();
}
languageButton.addEventListener('click',()=>{language=language==='zh'?'en':'zh';captionsOn=language==='zh';try{localStorage.setItem(languageKey,language)}catch{}applyLanguage()});
applyLanguage();
video.addEventListener('loadedmetadata',setCaptions);
captionsButton.addEventListener('click',()=>{captionsOn=!captionsOn;setCaptions()});
document.getElementById('video-fullscreen').addEventListener('click',()=>{
  if(video.requestFullscreen)video.requestFullscreen().catch(()=>{});
  else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
});

function playVideo(){
  const promise=video.play();
  if(promise)promise.catch(()=>{videoStatus.textContent=language==='zh'?'点击视频中的播放按钮，即可观看循环演示。':'Tap the video’s play button to watch the loop.'});
}
function showDemo(seconds){
  document.getElementById('demo').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
  if(seconds!==undefined){
    if(video.readyState)video.currentTime=seconds;
    else video.addEventListener('loadedmetadata',()=>{video.currentTime=seconds},{once:true});
  }
  playVideo();
}
document.querySelectorAll('[data-watch]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showDemo()}));
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>showDemo(Number(button.dataset.seek))));
video.addEventListener('playing',()=>{videoStatus.textContent=text('videoHint')});
video.addEventListener('error',()=>{videoStatus.textContent=language==='zh'?'视频暂时无法加载，可尝试页面底部的独立循环播放页。':'The video could not load. Try the standalone player linked below.'});

let inView=false,autoAttempted=false,resumeWhenVisible=false;
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    const visible=entries[0].intersectionRatio>=.3;
    document.body.classList.toggle('video-visible',visible);
    if(visible&&!inView&&!document.hidden){
      if(!reduced.matches&&(!autoAttempted||resumeWhenVisible)){autoAttempted=true;playVideo()}
      resumeWhenVisible=false;
    }else if(!visible&&inView){resumeWhenVisible=!video.paused;video.pause()}
    inView=visible;
  },{threshold:[0,.3,.6]});
  observer.observe(video);
}
let resumeAfterHidden=false;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeAfterHidden=!video.paused;video.pause()}
  else if(resumeAfterHidden&&inView&&!reduced.matches){resumeAfterHidden=false;playVideo()}
});
reduced.addEventListener?.('change',()=>{if(reduced.matches)video.pause()});

document.getElementById('copy-link').addEventListener('click',async()=>{
  const status=document.getElementById('share-status');
  try{
    await navigator.clipboard.writeText('https://optionalreality.site/intro');
    status.textContent=language==='zh'?'已复制介绍页链接，可以粘贴分享。':'Introduction link copied. It is ready to share.';
  }catch{
    status.textContent=language==='zh'?'请复制上方地址：optionalreality.site/intro':'Copy the address above: optionalreality.site/intro';
  }
});
