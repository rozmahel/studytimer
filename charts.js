// ═══════ CHARTS ═══════
// Heatmapy (sloupce = týdny, řádky = Po–Ne), sloupcový graf posledních 7 dní, sdílená bublina a favicon s průběhem.
const Charts=(()=>{

// ── Bublina (tooltip) pro cokoli s data-tip ──
let tip=null;
function initTip(){
  tip=document.createElement('div');tip.className='tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);
  const show=el=>{const lines=el.dataset.tip.split('\n');tip.innerHTML='<b>'+esc(lines[0])+'</b>'+lines.slice(1).map(l=>'<div>'+esc(l)+'</div>').join('');
    tip.classList.add('on');const r=el.getBoundingClientRect(),t=tip.getBoundingClientRect();
    let x=r.left+r.width/2-t.width/2,y=r.top-t.height-8;
    x=Math.max(8,Math.min(x,innerWidth-t.width-8));if(y<8)y=r.bottom+8;
    tip.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';};
  document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el)show(el);});
  document.addEventListener('mouseout',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el&&!el.contains(e.relatedTarget))tip.classList.remove('on');});
  document.addEventListener('scroll',()=>tip.classList.remove('on'),true);
}

// ── Heatmapa ──
// data: [{date:'YYYY-MM-DD', seconds}] chronologicky; opts: {color, max, labels}
function heatmap(el,data,opts){if(!el||!data.length)return;opts=opts||{};
  const max=opts.max||Math.max(...data.map(d=>d.seconds),1);
  const pad=(parseDay(data[0].date).getDay()+6)%7; // Po = 0
  let cells='';for(let i=0;i<pad;i++)cells+='<span class="hm-cell hm-pad"></span>';
  cells+=data.map(d=>{const r=d.seconds/max,l=d.seconds<=0?0:r<.25?1:r<.5?2:r<.75?3:4;
    const t=fmtDayShort(d.date)+(d.date===dayKey()?' · dnes':'')+'\n'+(d.seconds>0?fmtDur(d.seconds):'bez práce');
    const st=opts.color&&l>0?' style="background:'+hexToGlow(opts.color,[0,.25,.5,.75,1][l])+'"':'';
    return'<span class="hm-cell hm-'+l+(d.date===dayKey()?' today':'')+'"'+st+' data-tip="'+esc(t)+'"></span>';}).join('');
  const labels=opts.labels===false?'':'<div class="hm-days"><span>Po</span><span></span><span>St</span><span></span><span>Pá</span><span></span><span></span></div>';
  el.classList.add('hm');el.innerHTML=labels+'<div class="hm-cells">'+cells+'</div>';}

// ── Posledních 7 dní, skládané podle projektů ──
function week(el,legendEl,prjs){if(!el)return;
  const days=[];for(let i=6;i>=0;i--){const k=dayKey(daysAgo(i));
    const parts=prjs.map(p=>({p,s:(p.days&&p.days[k])||0})).filter(x=>x.s>0);
    days.push({k,parts,total:parts.reduce((a,x)=>a+x.s,0)});}
  const max=Math.max(...days.map(d=>d.total),0);
  if(!max){el.innerHTML='<div class="wk-empty">Za posledních 7 dní zatím žádná práce.</div>';if(legendEl)legendEl.innerHTML='';return;}
  // osa: zaokrouhlit nahoru na celé hodiny
  const top=Math.max(1,Math.ceil(max/3600))*3600;
  el.innerHTML='<div class="wk-grid"><span style="bottom:100%">'+top/3600+' h</span><span style="bottom:50%">'+(top/7200).toFixed(top/3600%2?1:0).replace('.',',')+' h</span><span style="bottom:0">0</span></div>'
   +'<div class="wk-bars">'+days.map(d=>{
    const t=fmtDayShort(d.k)+(d.k===dayKey()?' · dnes':'')+'\n'+(d.total?'Celkem '+fmtDur(d.total):'bez práce')+d.parts.map(x=>'\n'+x.p.name+': '+fmtDur(x.s)).join('');
    return'<div class="wk-col'+(d.k===dayKey()?' today':'')+'" data-tip="'+esc(t)+'">'
      +'<div class="wk-val">'+(d.total?(d.total/3600).toFixed(1).replace('.',','):'')+'</div>'
      +'<div class="wk-stack" style="height:'+(d.total/top*100)+'%">'+d.parts.map(x=>'<span style="flex:'+x.s+';background:'+(x.p.color||'#6E3CD0')+'"></span>').join('')+'</div>'
      +'<div class="wk-lbl">'+WD_SHORT[parseDay(d.k).getDay()]+' '+parseDay(d.k).getDate()+'.</div></div>';}).join('')+'</div>';
  if(legendEl){const used=prjs.filter(p=>days.some(d=>d.parts.some(x=>x.p.id===p.id)));
    legendEl.innerHTML=used.length>1?used.map(p=>'<span class="lg"><i style="background:'+(p.color||'#6E3CD0')+'"></i>'+esc(p.name)+'</span>').join(''):'';}}

// ── Favicon s průběhem ──
const DEF='icon-192.png';let link=null,lastKey='',cv=null;
function favicon(progress,color,active){
  if(!link){link=document.querySelector('link[rel="icon"]');cv=document.createElement('canvas');cv.width=cv.height=64;}
  const key=active?Math.round(progress*60)+'|'+color:'off';if(key===lastKey)return;lastKey=key;
  if(!active){link.href=DEF;return;}
  const c=cv.getContext('2d');c.clearRect(0,0,64,64);c.lineCap='round';
  c.lineWidth=9;c.strokeStyle='rgba(128,128,128,.35)';c.beginPath();c.arc(32,32,25,0,Math.PI*2);c.stroke();
  c.strokeStyle=color;c.beginPath();c.arc(32,32,25,-Math.PI/2,-Math.PI/2+Math.max(.02,progress)*Math.PI*2);c.stroke();
  link.href=cv.toDataURL('image/png');}

return{initTip,heatmap,week,favicon};})();
