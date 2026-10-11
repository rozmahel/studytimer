// ═══════ PROJECTS ═══════
const Projects=(()=>{const K='pomodoro_projects_v1';
function ld(){try{return JSON.parse(localStorage.getItem(K))||[];}catch{return[];}}
function sv(p){localStorage.setItem(K,JSON.stringify(p));}
function find(p,id){return p.findIndex(x=>x.id===id);}
function addAt(id,s,k){const p=ld();const i=find(p,id);if(i<0)return;const x=p[i];
  x.workedSeconds=Math.max(0,(x.workedSeconds||0)+s);
  if(!x.days)x.days={};x.days[k]=Math.max(0,(x.days[k]||0)+s);
  x.sessions=(x.sessions||0)+1;
  if(!x.daySessions)x.daySessions={};x.daySessions[k]=(x.daySessions[k]||0)+1;
  sv(p);}
return{
getAll(){return ld();},
setAll(p){sv(p);},
add(n,g,c){const p=ld();p.push({id:Date.now().toString(36),name:n,goalHours:g||100,color:c||PROJECT_COLORS[0],workedSeconds:0,days:{},sessions:0});sv(p);return p;},
remove(id){sv(ld().filter(p=>p.id!==id));},
update(id,d){const p=ld();const i=find(p,id);if(i>=0)Object.assign(p[i],d);sv(p);},
addSeconds(id,s){addAt(id,s,dayKey());},
addManualTime(id,s,date){addAt(id,s,date);},
// vrácení záznamu z historie (opak addAt)
removeTime(id,s,k){const p=ld();const i=find(p,id);if(i<0)return;const x=p[i];
  x.workedSeconds=Math.max(0,(x.workedSeconds||0)-s);
  if(x.days&&k in x.days){x.days[k]=Math.max(0,x.days[k]-s);if(!x.days[k])delete x.days[k];}
  x.sessions=Math.max(0,(x.sessions||0)-1);
  if(x.daySessions&&x.daySessions[k]){x.daySessions[k]--;if(!x.daySessions[k])delete x.daySessions[k];}
  sv(p);},
getById(id){return ld().find(p=>p.id===id)||null;},
getStats(id){const p=ld().find(x=>x.id===id);if(!p)return null;const days=p.days||{};const k=dayKey();const tSec=days[k]||0;
  let wSec=0;for(let i=0;i<7;i++)wSec+=days[dayKey(daysAgo(i))]||0;
  let streak=0,i=days[k]>0?0:1;while(days[dayKey(daysAgo(i))]>0){streak++;i++;}
  const hm=[];for(let j=34;j>=0;j--){const k2=dayKey(daysAgo(j));hm.push({date:k2,seconds:days[k2]||0});}
  const ds=p.daySessions||{};
  return{todaySec:tSec,weekSec:wSec,totalSec:p.workedSeconds||0,sessions:p.sessions||0,todaySessions:ds[k]||0,streak,heatmap:hm,goalHours:p.goalHours,name:p.name,color:p.color};}
};})();
