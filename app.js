// ═══════ APP ═══════
const App=(()=>{
const DEFAULTS={workSec:40*60,breakSec:10*60};
let durations=Stats.loadDurations()||{...DEFAULTS};
let state={mode:'work',longBreak:false,remaining:durations.workSec,lastTotal:durations.workSec,running:false,session:1,workStartTime:null,intervalId:null,endTime:null};
let histLimit=30;
const els={};
function q(id){return document.getElementById(id);}

function initRefs(){
  ['mode-label','session-num','progress-ring','start-btn','reset-btn','skip-btn','work-btn','break-btn','status-line','timer-min','timer-sec','project-dot']
    .forEach(id=>{els[id.replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=q(id);});
}

// ── Focus mode ───────────────────────────
function toggleFocus(){
  const entering=!document.body.classList.contains('focus-mode');
  document.body.classList.toggle('focus-mode');
  q('focus-toggle').classList.toggle('focus-active',entering);
  if(!entering){document.body.classList.add('focus-exit');setTimeout(()=>document.body.classList.remove('focus-exit'),520);}
}

// ── Project color ────────────────────────
function projColor(){const pid=q('active-project').value,p=pid?Projects.getById(pid):null;return p&&p.color?p.color:'#6E3CD0';}
function applyProjectColor(){
  const pid=q('active-project').value,col=projColor();
  document.documentElement.style.setProperty('--proj',col);
  document.documentElement.style.setProperty('--proj-soft',hexToGlow(col,.15));
  els.projectDot.style.background=pid?col:'transparent';
  els.projectDot.style.borderColor=pid?'transparent':'var(--line)';
  renderSideProjects();render();
}

// ── Timer ────────────────────────────────
function breakSec(){return state.longBreak?Settings.get().longSec:durations.breakSec;}
function totalSec(){return state.mode==='work'?durations.workSec:breakSec();}
function tick(){state.remaining=Math.round((state.endTime-Date.now())/1000);if(state.remaining<=0){state.remaining=0;onPhaseEnd();return;}render();}
function onPhaseEnd(){
  clearInterval(state.intervalId);state.running=false;state.remaining=0;render();
  if(state.mode==='work'){
    SoundEngine.workEnd();Player.autoPlayStop();
    const pid=q('active-project').value;Stats.recordWorkSession(durations.workSec,pid||null);updateStatsPanel();
    setTimeout(()=>switchMode('break'),600);
  }else{
    SoundEngine.breakEnd();setTimeout(()=>{state.session++;switchMode('work');},600);
  }
}

// ── Edit time ────────────────────────────
function startEdit(part){
  if(state.running)return;
  const isMin=part==='min',el=isMin?els.timerMin:els.timerSec;if(!el||el.tagName!=='SPAN')return;
  const cv=isMin?Math.floor(state.remaining/60):state.remaining%60;
  const inp=document.createElement('input');inp.type='number';inp.min='0';inp.max=isMin?'999':'59';inp.value=cv;inp.className='timer-input';
  el.replaceWith(inp);inp.select();
  function commit(){
    let v=parseInt(inp.value,10);if(isNaN(v)||v<0)v=0;if(!isMin&&v>59)v=59;
    const mins=isMin?v:Math.floor(state.remaining/60),secs=isMin?(state.remaining%60):v;
    const nt=Math.max(1,mins*60+secs);
    state.remaining=nt;
    if(state.mode==='work')durations.workSec=nt;
    else if(state.longBreak)Settings.set({longSec:nt});
    else durations.breakSec=nt;
    Stats.saveDurations(durations);rebuildSpan(isMin?'timer-min':'timer-sec',inp);
  }
  function cancel(){rebuildSpan(isMin?'timer-min':'timer-sec',inp);render();}
  inp.addEventListener('blur',commit);
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.removeEventListener('blur',commit);cancel();}});
}
function rebuildSpan(id,old){const s=document.createElement('span');s.id=id;s.className='timer-part editable';s.title='Klikni pro úpravu';old.replaceWith(s);els.timerMin=q('timer-min');els.timerSec=q('timer-sec');bindEditClicks();render();updateModeTabs();}
function bindEditClicks(){if(els.timerMin)els.timerMin.onclick=()=>startEdit('min');if(els.timerSec)els.timerSec.onclick=()=>startEdit('sec');}

// ── Controls ─────────────────────────────
function toggleStart(){
  if(state.running){clearInterval(state.intervalId);state.running=false;Player.autoPlayStop();}
  else{
    if(!q('active-project').value){els.statusLine.textContent='Nejdříve si vytvoř projekt (+ v levém panelu)';return;}
    Stats.recordStart();SoundEngine.start();state.running=true;state.endTime=Date.now()+state.remaining*1000;
    if(state.mode==='work'&&!state.workStartTime)state.workStartTime=Date.now();
    state.intervalId=setInterval(tick,1000);if(state.mode==='work')Player.autoPlayStart();
  }
  render();
}
function resetTimer(){clearInterval(state.intervalId);state.running=false;state.remaining=totalSec();render();}
function recordPartial(){Player.autoPlayStop();const done=durations.workSec-state.remaining;const pid=q('active-project').value;if(done>30)Stats.recordWorkSession(done,pid||null);updateStatsPanel();}
function skipPhase(){clearInterval(state.intervalId);state.running=false;if(state.mode==='work'){recordPartial();switchMode('break');}else{state.session++;switchMode('work');}}
function switchMode(mode){
  const s=Settings.get();
  state.mode=mode;
  state.longBreak=mode==='break'&&s.longOn&&state.session%s.longEvery===0;
  state.remaining=totalSec();state.running=false;state.workStartTime=null;clearInterval(state.intervalId);
  if('Notification'in window&&Notification.permission==='granted')
    new Notification(mode==='work'?'Čas na práci':breakName(),{body:mode==='work'?fmtDurBtn(durations.workSec)+' soustředění.':fmtDurBtn(breakSec())+' volno.',silent:true});
  updateModeTabs();render();updateStatsPanel();
}
function fmtDurBtn(sec){const m=Math.floor(sec/60),s=sec%60;return s>0?m+'m '+s+'s':m+' min';}
function breakName(){return state.longBreak?'Dlouhá přestávka':'Přestávka';}
function updateModeTabs(){
  els.workBtn.innerHTML='Práce <span>'+fmtDurBtn(durations.workSec)+'</span>';
  const b=state.mode==='break';
  els.breakBtn.innerHTML=(b?breakName():'Přestávka')+' <span>'+fmtDurBtn(b?breakSec():durations.breakSec)+'</span>';
}

// ── Render ───────────────────────────────
function render(){
  const total=totalSec(),progress=1-state.remaining/total,isWork=state.mode==='work';
  state.lastTotal=total;
  const m=Math.floor(state.remaining/60),s=state.remaining%60,mm=String(m).padStart(2,'0'),ss=String(s).padStart(2,'0');
  if(els.timerMin&&els.timerMin.tagName==='SPAN')els.timerMin.textContent=mm;
  if(els.timerSec&&els.timerSec.tagName==='SPAN')els.timerSec.textContent=ss;
  const ed=!state.running;[els.timerMin,els.timerSec].forEach(el=>{if(el&&el.tagName==='SPAN'){el.classList.toggle('editable',ed);el.title=ed?'Klikni pro úpravu':'';}});
  els.modeLabel.textContent=isWork?'Práce':breakName();els.sessionNum.textContent=state.session;
  els.startBtn.innerHTML=state.running?icon('pause')+'Pauza':icon('play')+(state.remaining===total?'Start':'Pokračovat');
  els.workBtn.classList.toggle('active',isWork);els.breakBtn.classList.toggle('active',!isWork);
  els.workBtn.classList.toggle('disabled',state.running);els.breakBtn.classList.toggle('disabled',state.running);
  els.progressRing.style.strokeDashoffset=2*Math.PI*108*(1-progress);
  // zachovat light/focus třídy
  const classes=[isWork?'mode-work':'mode-break'];
  ['light','focus-mode','focus-exit'].forEach(c=>{if(document.body.classList.contains(c))classes.push(c);});
  document.body.className=classes.join(' ');
  if(state.running){const mins=Math.ceil(state.remaining/60);els.statusLine.textContent=(isWork?'Soustřeď se':'Odpočívej')+' · ještě '+mins+' min';}
  else if(state.remaining===total)els.statusLine.textContent='Připraven · klikni na čísla pro úpravu délky';
  else els.statusLine.textContent='Pozastaveno';
  const active=state.running||state.remaining<total;
  document.title=active?mm+':'+ss+' · '+(isWork?'Práce':breakName())+(state.running?'':' (pauza)'):'Pomodoro';
  const okCol=getComputedStyle(document.body).getPropertyValue('--ok').trim()||'#2F8F5B';
  Charts.favicon(progress,isWork?projColor():okCol,active);
}

// ── Stats panel ──────────────────────────
function streakText(n){return n>0?n+' '+plDays(n):'—';}
function updateStatsPanel(){
  renderSideProjects();updateDaily();
  const pid=q('active-project').value,ps=pid?Projects.getStats(pid):null,hdr=q('stats-proj-header');
  if(ps){
    hdr.style.display='block';
    q('stats-proj-name').textContent=ps.name;
    const pct=ps.goalHours?Math.min(100,ps.totalSec/3600/ps.goalHours*100):0;
    q('stats-proj-bar').style.width=pct+'%';q('stats-proj-bar').style.background=ps.color;
    q('stats-proj-pct').textContent=(ps.totalSec/3600).toFixed(1)+' / '+ps.goalHours+' h · '+pct.toFixed(0)+' %';
    st('stat-today-time',fmtHM(ps.todaySec));st('stat-today-sessions',ps.todaySessions);st('stat-today-starts','—');
    st('stat-week-time',fmtHM(ps.weekSec));st('stat-total-time',fmtHM(ps.totalSec));
    st('stat-total-sessions',ps.sessions);st('stat-total-starts','—');st('stat-streak',streakText(ps.streak));
    Charts.heatmap(q('heatmap'),ps.heatmap,{color:ps.color});
  }else{
    hdr.style.display='none';
    const s=Stats.get();
    st('stat-today-time',s.today.hours+'h '+s.today.minutes+'min');st('stat-today-sessions',s.today.sessions);st('stat-today-starts',s.today.starts);
    st('stat-total-time',s.total.hours+'h '+s.total.minutes+'min');st('stat-total-sessions',s.total.sessions);st('stat-total-starts',s.total.starts);
    st('stat-week-time',s.week.hours+'h '+s.week.minutes+'min');st('stat-streak',streakText(s.streak));
    Charts.heatmap(q('heatmap'),s.heatmap,{});
  }
}
function st(id,v){const e=q(id);if(e)e.textContent=v;}

// ── Daily goal (sidebar) ─────────────────
function updateDaily(){
  const w=q('daily-goal');if(!w)return;
  const goal=Settings.get().dailyGoalH,done=Stats.todaySeconds();
  w.hidden=!(goal>0);if(!(goal>0))return;
  const pct=Math.min(100,done/3600/goal*100),ok=pct>=100;
  q('daily-val').textContent=ok?'Splněno':(done/3600).toFixed(1).replace('.',',')+' / '+String(goal).replace('.',',')+' h';
  q('daily-fill').style.width=pct+'%';w.classList.toggle('done',ok);
  w.title='Dnes '+fmtDur(done)+' z '+String(goal).replace('.',',')+' h · upravit v Nastavení';
}

// ── Project select ───────────────────────
function refreshProjectSelect(){
  const sel=q('active-project'),prjs=Projects.getAll(),prev=sel.value;
  sel.innerHTML=prjs.length?prjs.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join(''):'<option value="">— vytvořte projekt —</option>';
  if(prjs.find(p=>p.id===prev))sel.value=prev;else if(prjs.length)sel.value=prjs[0].id;
  applyProjectColor();updateStatsPanel();
}

// ── Sidebar projects ────────────────────
function renderSideProjects(){
  const box=q('side-projects');if(!box)return;const prjs=Projects.getAll(),cur=q('active-project').value;
  if(!prjs.length){box.innerHTML='<button class="side-empty" id="side-empty">'+icon('plus')+' Vytvoř první projekt</button>';q('side-empty').onclick=()=>openModal();return;}
  box.innerHTML=prjs.map(p=>'<button class="side-project'+(p.id===cur?' active':'')+'" data-id="'+p.id+'"><span class="dot" style="background:'+(p.color||'#6E3CD0')+'"></span><span class="name">'+esc(p.name)+'</span><span class="hrs">'+((p.workedSeconds||0)/3600).toFixed(1)+' h</span></button>').join('');
  box.querySelectorAll('.side-project').forEach(b=>{b.onclick=()=>{q('active-project').value=b.dataset.id;applyProjectColor();updateStatsPanel();if(q('view-overview').classList.contains('active'))showView('timer');};});
}

// ── Nav ──────────────────────────────────
function showView(v){
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  q('focus-toggle').style.display=v==='timer'?'':'none';
  q('crumb').textContent=v==='timer'?'Časovač':'Přehled';
  if(v==='overview')renderOverview();
}
function setupNav(){document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));}

// ── Overview ─────────────────────────────
function renderOverview(){
  const prjs=Projects.getAll(),s=Stats.get();
  q('overview-totals').innerHTML=
    card('Celkem odpracováno',s.total.hours+'h '+s.total.minutes+'m')+card('Bloků celkem',s.total.sessions)+
    card('Aktivní projekty',prjs.length)+card('Série',streakText(s.streak));
  Charts.week(q('week-chart'),q('week-legend'),prjs);
  q('projects-grid').innerHTML=prjs.map(p=>{const h=(p.workedSeconds||0)/3600,pct=p.goalHours?Math.min(100,h/p.goalHours*100):0,col=p.color||'#6E3CD0';
    return`<div class="project-card"><div class="p-head"><span class="p-dot" style="background:${col}"></span><div class="p-name">${esc(p.name)}</div></div>`
      +`<div class="p-hours">${h.toFixed(1)} h</div><div class="p-goal">Cíl ${p.goalHours} h · ${pct.toFixed(0)} %</div>`
      +`<div class="p-bar-wrap"><div class="p-bar" style="width:${pct}%;background:${col}"></div></div><div class="p-heatmap" id="hm-${p.id}"></div>`
      +`<div class="p-actions"><button class="p-btn" onclick="App.editProject('${p.id}')">Upravit</button><button class="p-btn" onclick="App.addTimeDialog('${p.id}')">Přidat čas</button><button class="p-btn danger" onclick="App.deleteProject('${p.id}')">Smazat</button></div></div>`;}).join('')
    +'<div class="add-project-card" id="add-project-btn">'+icon('plus')+'Nový projekt</div>';
  q('add-project-btn').addEventListener('click',()=>openModal());
  prjs.forEach(p=>{const ps=Projects.getStats(p.id);if(ps)Charts.heatmap(q('hm-'+p.id),ps.heatmap,{color:ps.color,labels:false});});
  // Celková aktivita · 15 týdnů
  const combined=[];for(let i=104;i>=0;i--){const k=dayKey(daysAgo(i));let tot=0;prjs.forEach(p=>{if(p.days&&p.days[k])tot+=p.days[k];});combined.push({date:k,seconds:tot});}
  const acc=getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#6E3CD0';
  Charts.heatmap(q('overview-hm'),combined,{color:acc});
  renderHistory();
}
function card(l,v){return'<div class="overview-card"><div class="label">'+l+'</div><div class="value">'+v+'</div></div>';}

// ── History ──────────────────────────────
function renderHistory(){
  const box=q('history'),hist=Stats.getHistory();
  if(!hist.length){box.innerHTML='<div class="hist-empty">Zatím žádné dokončené bloky.</div>';q('history-more').hidden=true;return;}
  const prj={};Projects.getAll().forEach(p=>prj[p.id]=p);
  const today=dayKey(),yest=dayKey(daysAgo(1));
  const rows=hist.map((e,i)=>({e,i,day:e.manual?Stats.entryDay(e):dayKey(new Date(e.date)),t:new Date(e.date).getTime()}))
    .sort((a,b)=>b.day.localeCompare(a.day)||b.t-a.t).slice(0,histLimit);
  let html='',last='';
  rows.forEach(({e,i,day})=>{
    if(day!==last){last=day;html+='<div class="hist-day">'+(day===today?'Dnes':day===yest?'Včera':fmtDayShort(day))+'</div>';}
    const p=e.projectId?prj[e.projectId]:null;
    const name=p?esc(p.name):(e.projectId?'Smazaný projekt':'Bez projektu');
    const time=e.manual?'ručně':new Date(e.date).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
    html+='<div class="hist-row"><span class="dot" style="background:'+(p&&p.color||'var(--faint)')+'"></span>'
      +'<span class="hist-name">'+name+'</span><span class="hist-time">'+time+'</span>'
      +'<span class="hist-dur'+(e.durationSeconds<0?' neg':'')+'">'+fmtDur(e.durationSeconds)+'</span>'
      +'<button class="hist-del" data-i="'+i+'" title="Smazat záznam" aria-label="Smazat záznam">'+icon('x')+'</button></div>';
  });
  box.innerHTML=html;
  box.querySelectorAll('.hist-del').forEach(b=>b.onclick=()=>{
    if(!confirm('Smazat tento záznam? Odečte se i ze statistik a z projektu.'))return;
    Stats.removeHistoryAt(+b.dataset.i);updateStatsPanel();renderOverview();
  });
  q('history-more').hidden=hist.length<=histLimit;
}

// ── Project modal ────────────────────────
let editingId=null,selectedColor=PROJECT_COLORS[0];
function buildColorGrid(){const grid=q('color-grid');grid.innerHTML=PROJECT_COLORS.map(c=>`<div class="color-swatch${c===selectedColor?' selected':''}" data-color="${c}" style="background:${c}"></div>`).join('');grid.querySelectorAll('.color-swatch').forEach(sw=>{sw.addEventListener('click',()=>{grid.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected'));sw.classList.add('selected');selectedColor=sw.dataset.color;});});}
function openModal(id){editingId=id||null;q('modal-title').textContent=id?'Upravit projekt':'Nový projekt';
  if(id){const p=Projects.getById(id);q('modal-name').value=p?p.name:'';q('modal-goal').value=p?p.goalHours:100;selectedColor=p&&p.color?p.color:PROJECT_COLORS[0];}
  else{q('modal-name').value='';q('modal-goal').value=100;selectedColor=PROJECT_COLORS[0];}
  buildColorGrid();q('project-modal').classList.add('open');q('modal-name').focus();}
function closeModal(){q('project-modal').classList.remove('open');editingId=null;}
function saveModal(){const name=q('modal-name').value.trim(),goal=parseInt(q('modal-goal').value,10)||100;if(!name)return;
  if(editingId)Projects.update(editingId,{name,goalHours:goal,color:selectedColor});else Projects.add(name,goal,selectedColor);
  closeModal();refreshProjectSelect();renderOverview();}
function editProject(id){openModal(id);}
function deleteProject(id){if(confirm('Smazat projekt?')){Projects.remove(id);refreshProjectSelect();renderOverview();}}

// ── Add time manually ────────────────────
let timeProjectId=null;
function addTimeDialog(pid){timeProjectId=pid;const p=Projects.getById(pid);q('time-modal-project').textContent=p?p.name:'';
  q('time-date').value=dayKey();q('time-minutes').value=30;q('time-modal').classList.add('open');q('time-minutes').focus();}
function saveTimeAdd(){const date=q('time-date').value,mins=parseInt(q('time-minutes').value,10);
  if(!date||!date.match(/^\d{4}-\d{2}-\d{2}$/)||isNaN(mins)||mins===0){alert('Neplatné hodnoty.');return;}
  Stats.addManualTime(date,mins*60,timeProjectId);q('time-modal').classList.remove('open');timeProjectId=null;
  updateStatsPanel();refreshProjectSelect();renderOverview();}

// ── Keyboard shortcuts ───────────────────
function anyOverlayOpen(){return!!document.querySelector('.modal-overlay.open,.music-overlay.open');}
function closeOverlays(){document.querySelectorAll('.modal-overlay.open,.music-overlay.open').forEach(o=>o.classList.remove('open'));editingId=null;}
function onKey(e){
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const t=e.target,typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable);
  if(e.key==='Escape'){
    if(anyOverlayOpen()){closeOverlays();return;}
    if(q('theme-wrap').classList.contains('open')){q('theme-wrap').classList.remove('open');return;}
    if(document.body.classList.contains('focus-mode'))toggleFocus();
    return;
  }
  if(typing&&t.type!=='range'&&t.type!=='checkbox')return;
  if(anyOverlayOpen())return;
  const inTimer=q('view-timer').classList.contains('active');
  switch(e.key){
    case' ':if(!inTimer)return;e.preventDefault();if(t&&t.blur)t.blur();toggleStart();break;
    case'r':case'R':if(inTimer)resetTimer();break;
    case's':case'S':if(inTimer)skipPhase();break;
    case'f':case'F':if(!inTimer)showView('timer');toggleFocus();break;
  }
}

// ── Init ─────────────────────────────────
function init(){
  initRefs();bindEditClicks();setupNav();Player.init();Theme.init();Settings.init();Charts.initTip();
  q('focus-toggle').addEventListener('click',toggleFocus);
  els.startBtn.addEventListener('click',toggleStart);els.resetBtn.addEventListener('click',resetTimer);els.skipBtn.addEventListener('click',skipPhase);
  els.workBtn.addEventListener('click',()=>{if(state.running||state.mode==='work')return;if(state.remaining<totalSec())state.session++;switchMode('work');});
  els.breakBtn.addEventListener('click',()=>{if(state.running||state.mode==='break')return;if(state.remaining<totalSec())recordPartial();switchMode('break');});
  q('reset-all-btn').addEventListener('click',()=>{if(confirm('Opravdu smazat VŠECHNY statistiky a projekty? Tato akce je nevratná.')){['pomodoro_stats_v2','pomodoro_durations_v1','pomodoro_notes_v1'].forEach(k=>localStorage.removeItem(k));Projects.setAll([]);location.reload();}});
  q('export-btn').addEventListener('click',doExport);
  q('import-btn').addEventListener('click',()=>q('import-file').click());
  q('import-file').addEventListener('change',e=>{Stats.importData(e.target.files[0],()=>{durations=Stats.loadDurations()||durations;state.remaining=totalSec();updateModeTabs();updateStatsPanel();refreshProjectSelect();renderOverview();render();e.target.value='';});});
  q('side-add-project').addEventListener('click',()=>openModal());
  q('modal-cancel').addEventListener('click',closeModal);q('modal-ok').addEventListener('click',saveModal);
  q('project-modal').addEventListener('click',e=>{if(e.target===q('project-modal'))closeModal();});
  q('modal-name').addEventListener('keydown',e=>{if(e.key==='Enter')saveModal();});
  q('time-cancel').addEventListener('click',()=>q('time-modal').classList.remove('open'));
  q('time-ok').addEventListener('click',saveTimeAdd);
  q('time-modal').addEventListener('click',e=>{if(e.target===q('time-modal'))q('time-modal').classList.remove('open');});
  q('time-minutes').addEventListener('keydown',e=>{if(e.key==='Enter')saveTimeAdd();});
  q('active-project').addEventListener('change',()=>{applyProjectColor();updateStatsPanel();});
  q('history-more').addEventListener('click',()=>{histLimit+=30;renderHistory();});
  document.addEventListener('keydown',onKey);
  document.addEventListener('themechange',()=>{render();if(q('view-overview').classList.contains('active'))renderOverview();});
  document.addEventListener('settingschange',()=>{
    // nespuštěná (plná) přestávka převezme novou délku dlouhé přestávky
    if(!state.running&&state.remaining===state.lastTotal)state.remaining=totalSec();
    updateModeTabs();updateDaily();render();
  });
  updateModeTabs();
  if('Notification'in window&&Notification.permission==='default')setTimeout(()=>Notification.requestPermission(),2000);
  refreshProjectSelect();render();updateStatsPanel();
  setInterval(()=>{if(state.running)updateStatsPanel();},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.running)tick();});
  // připomínka exportu
  const lastExp=localStorage.getItem('pomodoro_last_export');
  const daysSince=lastExp?Math.floor((Date.now()-new Date(lastExp).getTime())/86400000):999;
  const remEl=q('export-reminder');
  if(daysSince>=7&&remEl){remEl.textContent='Poslední export: '+(lastExp?daysSince+' '+plDays(daysSince)+' zpět':'nikdy')+' · klikni pro export';remEl.style.display='block';}
}

function doExport(){Stats.exportData();const r=q('export-reminder');if(r)r.style.display='none';}

return{init,editProject,deleteProject,addTimeDialog,doExport};})();
document.addEventListener('DOMContentLoaded',App.init);
