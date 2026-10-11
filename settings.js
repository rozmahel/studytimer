// ═══════ SETTINGS ═══════
// Denní cíl a volitelná dlouhá přestávka. Ukládá se do studytimer_settings_v1 a jde i do exportu.
const Settings=(()=>{const K='studytimer_settings_v1';
const D={dailyGoalH:4,longOn:false,longSec:20*60,longEvery:4};
function get(){try{return{...D,...(JSON.parse(localStorage.getItem(K))||{})};}catch{return{...D};}}
function set(p){const s={...get(),...p};localStorage.setItem(K,JSON.stringify(s));document.dispatchEvent(new CustomEvent('settingschange'));return s;}
function q(id){return document.getElementById(id);}
function fill(){const s=get();q('set-goal').value=s.dailyGoalH;q('set-long').checked=s.longOn;q('set-long-min').value=Math.round(s.longSec/60*10)/10;q('set-long-every').value=s.longEvery;
  q('long-fields').classList.toggle('is-off',!s.longOn);}
function open(){fill();q('settings-modal').classList.add('open');}
function close(){q('settings-modal').classList.remove('open');}
function init(){
  q('settings-btn').addEventListener('click',open);
  q('daily-goal').addEventListener('click',open);
  q('settings-close').addEventListener('click',close);
  q('settings-modal').addEventListener('click',e=>{if(e.target===q('settings-modal'))close();});
  q('set-goal').addEventListener('change',e=>{const v=parseFloat(e.target.value);set({dailyGoalH:isNaN(v)||v<0?0:v});fill();});
  q('set-long').addEventListener('change',e=>{set({longOn:e.target.checked});fill();});
  q('set-long-min').addEventListener('change',e=>{const v=parseFloat(e.target.value);set({longSec:Math.max(60,Math.round((isNaN(v)?20:v)*60))});fill();});
  q('set-long-every').addEventListener('change',e=>{const v=parseInt(e.target.value,10);set({longEvery:Math.max(2,isNaN(v)?4:v)});fill();});
}
return{get,set,init,open,close};})();
