// ═══════ PLAYER ═══════
const Player=(()=>{let tracks=[],current=-1,audio=new Audio(),playing=false,autoPlay=false;
function setPlayIcon(p){const t='<svg class="ic"><use href="#i-'+(p?'pause':'play')+'"/></svg>';['pl-play','mq-play'].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=t;});}
function init(){audio.volume=.5;
const ap=document.getElementById('pl-autoplay');
const savedAP=localStorage.getItem('pomodoro_autoplay');
if(savedAP==='1'){autoPlay=true;ap.checked=true;}
ap.addEventListener('change',()=>{autoPlay=ap.checked;localStorage.setItem('pomodoro_autoplay',autoPlay?'1':'0');});
const ov=document.getElementById('music-overlay');
document.getElementById('music-toggle').addEventListener('click',()=>ov.classList.toggle('open'));
document.getElementById('music-close').addEventListener('click',()=>ov.classList.remove('open'));
ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});
document.getElementById('pl-add').addEventListener('click',()=>document.getElementById('pl-file').click());
document.getElementById('pl-file').addEventListener('change',e=>{for(const f of e.target.files){if(f.type.startsWith('audio/')||f.name.endsWith('.mp3'))tracks.push({name:f.name.replace(/\.\w+$/,''),url:URL.createObjectURL(f)});}if(tracks.length&&current<0)loadTrack(0);renderList();e.target.value='';document.getElementById('music-toggle').classList.toggle('playing',tracks.length>0);});
document.getElementById('pl-play').addEventListener('click',togglePlay);
document.getElementById('pl-prev').addEventListener('click',()=>{if(tracks.length){loadTrack((current-1+tracks.length)%tracks.length);if(playing)audio.play();renderList();}});
document.getElementById('pl-next').addEventListener('click',()=>{if(tracks.length){loadTrack((current+1)%tracks.length);if(playing)audio.play();renderList();}});
document.getElementById('pl-vol').addEventListener('input',e=>{audio.volume=e.target.value/100;const mq=document.getElementById('mq-vol');if(mq)mq.value=e.target.value;});
const mqPlay=document.getElementById('mq-play'),mqVol=document.getElementById('mq-vol');
if(mqPlay)mqPlay.addEventListener('click',togglePlay);
if(mqVol){mqVol.value=document.getElementById('pl-vol').value;mqVol.addEventListener('input',e=>{audio.volume=e.target.value/100;document.getElementById('pl-vol').value=e.target.value;});}
document.getElementById('pl-progress-bar').addEventListener('click',e=>{if(!audio.duration)return;audio.currentTime=(e.offsetX/e.currentTarget.offsetWidth)*audio.duration;});
audio.addEventListener('timeupdate',()=>{if(!audio.duration)return;document.getElementById('pl-progress-fill').style.width=(audio.currentTime/audio.duration*100)+'%';document.getElementById('pl-time').textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration);});
audio.addEventListener('ended',()=>{if(tracks.length>1){loadTrack((current+1)%tracks.length);audio.play();renderList();}else{playing=false;setPlayIcon(false);document.getElementById('music-toggle').classList.remove('playing');}});}
function loadTrack(i){current=i;audio.src=tracks[i].url;document.getElementById('pl-track').textContent=tracks[i].name;document.getElementById('pl-progress-fill').style.width='0%';document.getElementById('pl-time').textContent='0:00 / 0:00';}
function togglePlay(){if(current<0)return;if(playing){audio.pause();playing=false;setPlayIcon(false);}else{audio.play();playing=true;setPlayIcon(true);}document.getElementById('music-toggle').classList.toggle('playing',playing);}
function renderList(){const el=document.getElementById('pl-tracklist');if(!tracks.length){el.innerHTML='<div class="music-empty">Zatím žádné skladby.<br>Přidej mp3 soubory tlačítkem výše.</div>';return;}el.innerHTML=tracks.map((t,i)=>`<div class="music-track-item${i===current?' active':''}" data-i="${i}">${t.name}</div>`).join('');el.querySelectorAll('.music-track-item').forEach(it=>{it.addEventListener('click',()=>{loadTrack(parseInt(it.dataset.i));if(!playing)togglePlay();else audio.play();renderList();});});}
function fmt(s){return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');}
function autoPlayStart(){if(!autoPlay||current<0)return;if(!playing){audio.play();playing=true;setPlayIcon(true);document.getElementById('music-toggle').classList.add('playing');}}
function autoPlayStop(){if(!autoPlay)return;if(playing){audio.pause();playing=false;setPlayIcon(false);document.getElementById('music-toggle').classList.remove('playing');}}
return{init,autoPlayStart,autoPlayStop};})();
