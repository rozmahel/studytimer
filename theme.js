// ═══════ THEME ═══════
// Motiv (Výchozí / Papír / Les) = atribut data-skin na <html>; režim světlý/tmavý = třída .light na <body>.
const Theme=(()=>{const SK='pomodoro_skin',MK='pomodoro_theme';
const SKINS=[
  {id:'default',name:'Výchozí',light:['#FBFAFD','#F4F3F7','#6E3CD0','#1C1B22'],dark:['#17161B','#121115','#A887F0','#ECEAF2']},
  {id:'paper',name:'Papír',light:['#F4ECD8','#E6DABC','#944B29','#3B3226'],dark:['#1F1A14','#17130E','#D08A5C','#E6D9C0'],serif:true},
  {id:'forest',name:'Les',light:['#EEF2EC','#D9E3D6','#376D4E','#1F2A24'],dark:['#121A16','#0D1310','#6FB08A','#D6E2D9']}
];
function q(id){return document.getElementById(id);}
function get(k,def){try{return localStorage.getItem(k)||def;}catch{return def;}}
function put(k,v){try{localStorage.setItem(k,v);}catch{}}
function skin(){const s=get(SK,'default');return SKINS.some(x=>x.id===s)?s:'default';}
function isLight(){return document.body.classList.contains('light');}
function apply(){
  const s=skin();
  if(s==='default')document.documentElement.removeAttribute('data-skin');else document.documentElement.setAttribute('data-skin',s);
  document.body.classList.toggle('light',get(MK,'light')!=='dark');
  const l=isLight();
  q('theme-toggle').innerHTML=icon(l?'sun':'moon');
  renderMenu();
  document.dispatchEvent(new CustomEvent('themechange'));
}
function renderMenu(){
  const l=isLight(),cur=skin();
  q('skin-list').innerHTML=SKINS.map(x=>{const c=l?x.light:x.dark;
    return'<button class="skin-sw'+(x.id===cur?' active':'')+'" data-skin="'+x.id+'" role="menuitemradio" aria-checked="'+(x.id===cur)+'">'
      +'<span class="sw-prev" style="background:'+c[0]+'"><span class="sw-side" style="background:'+c[1]+'"></span>'
      +'<span class="sw-line" style="background:'+c[3]+'"></span><span class="sw-line short" style="background:'+c[3]+'"></span>'
      +'<span class="sw-dot" style="background:'+c[2]+'"></span></span>'
      +'<span class="sw-name'+(x.serif?' serif':'')+'">'+x.name+'</span></button>';}).join('');
  q('skin-list').querySelectorAll('.skin-sw').forEach(b=>b.onclick=()=>{put(SK,b.dataset.skin);apply();});
  document.querySelectorAll('#mode-seg button').forEach(b=>{const on=(b.dataset.mode==='light')===l;b.classList.toggle('active',on);b.setAttribute('aria-checked',on);});
}
function init(){
  const wrap=q('theme-wrap'),btn=q('theme-toggle');
  btn.addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('open');btn.setAttribute('aria-expanded',wrap.classList.contains('open'));});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))wrap.classList.remove('open');});
  document.querySelectorAll('#mode-seg button').forEach(b=>b.addEventListener('click',()=>{put(MK,b.dataset.mode);apply();}));
  apply();
}
return{init,apply,isLight};})();
