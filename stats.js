// ═══════ STATS ═══════
const Stats=(()=>{const K='studytimer_stats_v2',DK='studytimer_durations_v1',NK='studytimer_notes_v1';
function td(){return dayKey();}
function ld(){try{return JSON.parse(localStorage.getItem(K))||df();}catch{return df();}}
function df(){return{totalWorkSeconds:0,totalSessions:0,totalStarts:0,days:{},history:[]};}
function sv(d){localStorage.setItem(K,JSON.stringify(d));}
function ensure(d,k){if(!d.days[k])d.days[k]={workSeconds:0,sessions:0,starts:0};return d.days[k];}
function loadDurations(){try{return JSON.parse(localStorage.getItem(DK));}catch{return null;}}
function saveDurations(d){localStorage.setItem(DK,JSON.stringify(d));}
function recordStart(){const d=ld();d.totalStarts++;ensure(d,td()).starts++;sv(d);}
function recordWorkSession(s,pid){const d=ld(),k=td(),day=ensure(d,k);d.totalWorkSeconds+=s;d.totalSessions++;day.workSeconds+=s;day.sessions++;
  d.history.unshift({date:new Date().toISOString(),day:k,type:'work',durationSeconds:s,projectId:pid||null});if(d.history.length>200)d.history.length=200;sv(d);if(pid)Projects.addSeconds(pid,s);}
function streak(days){let s=0,i=days[td()]&&days[td()].workSeconds>0?0:1;for(;;){const x=days[dayKey(daysAgo(i))];if(x&&x.workSeconds>0){s++;i++;}else break;}return s;}
function week(days){let t=0;for(let i=0;i<7;i++){const x=days[dayKey(daysAgo(i))];if(x)t+=x.workSeconds;}return{hours:Math.floor(t/3600),minutes:Math.floor(t%3600/60),seconds:t};}
function heat(days){const r=[];for(let i=weeksBack(5);i>=0;i--){const k=dayKey(daysAgo(i));r.push({date:k,seconds:days[k]?days[k].workSeconds:0});}return r;}
function get(){const d=ld(),t=d.days[td()]||{workSeconds:0,sessions:0,starts:0};
  return{total:{hours:Math.floor(d.totalWorkSeconds/3600),minutes:Math.floor(d.totalWorkSeconds%3600/60),sessions:d.totalSessions,starts:d.totalStarts},
  today:{hours:Math.floor(t.workSeconds/3600),minutes:Math.floor(t.workSeconds%3600/60),seconds:t.workSeconds,sessions:t.sessions,starts:t.starts},
  week:week(d.days),streak:streak(d.days),heatmap:heat(d.days)};}
function todaySeconds(){const d=ld(),t=d.days[td()];return t?t.workSeconds:0;}

// ── Historie ──
function getHistory(){return ld().history||[];}
// den záznamu: nové záznamy mají .day (místní), staré se ukládaly podle UTC → stejný klíč jako tehdy
function entryDay(e){return e.day||String(e.date).slice(0,10);}
function removeHistoryAt(i){const d=ld(),e=d.history[i];if(!e)return;const k=entryDay(e),s=e.durationSeconds||0;
  d.totalWorkSeconds=Math.max(0,d.totalWorkSeconds-s);d.totalSessions=Math.max(0,d.totalSessions-1);
  if(e.manual)d.totalStarts=Math.max(0,d.totalStarts-1);
  const day=d.days[k];if(day){day.workSeconds=Math.max(0,day.workSeconds-s);day.sessions=Math.max(0,day.sessions-1);if(e.manual)day.starts=Math.max(0,day.starts-1);}
  d.history.splice(i,1);sv(d);if(e.projectId)Projects.removeTime(e.projectId,s,k);}

// ── Export / import ──
function rawNotes(){try{return JSON.parse(localStorage.getItem(NK))||undefined;}catch{return undefined;}}
function exportData(){localStorage.setItem('studytimer_last_export',new Date().toISOString());
  const p={version:3,exportedAt:new Date().toISOString(),stats:ld(),durations:loadDurations(),projects:Projects.getAll(),settings:Settings.get(),notes:rawNotes()};
  const b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='studytimer-'+td()+'.json';a.click();URL.revokeObjectURL(u);}
function importData(f,cb){if(!f)return;const r=new FileReader();r.onload=e=>{try{const p=JSON.parse(e.target.result);if(p.stats)sv(p.stats);if(p.durations)saveDurations(p.durations);if(p.projects)Projects.setAll(p.projects);if(p.settings)Settings.set(p.settings);if(p.notes)localStorage.setItem(NK,JSON.stringify(p.notes));alert('Data načtena!');if(cb)cb();}catch{alert('Chyba importu.');}};r.readAsText(f);}
function addManualTime(date,secs,pid){const d=ld(),day=ensure(d,date);
  d.totalWorkSeconds=Math.max(0,d.totalWorkSeconds+secs);d.totalSessions+=1;d.totalStarts+=1;
  day.workSeconds=Math.max(0,day.workSeconds+secs);day.sessions+=1;day.starts+=1;
  d.history.unshift({date:new Date(date+'T12:00:00').toISOString(),day:date,type:'work',durationSeconds:secs,projectId:pid||null,manual:true});
  if(d.history.length>200)d.history.length=200;sv(d);if(pid)Projects.addManualTime(pid,secs,date);}
return{recordStart,recordWorkSession,get,todaySeconds,getHistory,entryDay,removeHistoryAt,loadDurations,saveDurations,exportData,importData,addManualTime};})();
