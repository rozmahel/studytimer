// Verze aplikace – zobrazuje se v Nastavení. Měnit při každé úpravě.
const APP_VERSION='5.2.0';

const PROJECT_COLORS=['#f0c040','#e8a020','#e06830','#e05050','#d84888','#c050d0','#8060e0','#5070e8','#3898e8','#30b8d0','#30c8a0','#3dd68c','#60c040','#98b830','#b8a040','#a89080'];
function hexToGlow(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}

// Klíč dne v MÍSTNÍM čase (YYYY-MM-DD). Dřív se používalo toISOString() = UTC,
// takže bloky mezi půlnocí a 1–2 h ráno padaly do předchozího dne.
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function parseDay(k){const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
function daysAgo(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return d;}
// Kolik dní zpět je potřeba, aby heatmapa začínala pondělím a měla přesně `weeks` sloupců (poslední = tento týden).
function weeksBack(weeks){return 7*(weeks-1)+(new Date().getDay()+6)%7;}

// Formátování
function fmtHM(sec){sec=Math.max(0,Math.round(sec||0));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h+'h '+m+'min';}
function fmtDur(sec){const neg=sec<0;sec=Math.abs(Math.round(sec||0));const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);const t=h?(m?h+' h '+m+' min':h+' h'):m+' min';return(neg?'−':'')+t;}
function plDays(n){return n===1?'den':(n>=2&&n<=4)?'dny':'dní';}
const WD_SHORT=['ne','po','út','st','čt','pá','so'];
const WD_LABELS=['Po','Út','St','Čt','Pá','So','Ne'];
function fmtDayShort(k){const d=parseDay(k);return WD_SHORT[d.getDay()]+' '+d.getDate()+'. '+(d.getMonth()+1)+'.';}
function esc(s){const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
function icon(n){return'<svg class="ic"><use href="#i-'+n+'"/></svg>';}
