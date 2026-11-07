/* ZERO FRONTIER v36 — passive runtime invariants and mobile pointer safety diagnostics. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const panel=stage.querySelector('.zf34-diagnostics');const section=document.createElement('section');section.className='zf36-report';
 section.innerHTML='<strong>v36 전투 안정성 검사</strong><pre class="zf36-status" aria-live="off"></pre><button type="button" class="zf36-export">v36 재현 보고서 JSON</button>';
 const style=document.createElement('style');style.textContent=`
 #battleStage .zf36-report{margin-top:8px;padding-top:7px;border-top:1px solid #ffffff35;font:11px/1.5 ui-monospace,monospace}
 #battleStage .zf36-status{white-space:pre-wrap;overflow-wrap:anywhere;max-height:160px;overflow:auto}
 #battleStage .zf36-export{min-height:40px}
 #battleCanvas,#fireButton{touch-action:none}
 #battleStage .zf33-reload,#battleStage .zf29-shot,#battleStage .zf33-hit{pointer-events:none}
 @media(prefers-reduced-motion:reduce){#battleStage .zf36-report *{animation:none!important;transition:none!important}}
 `;document.head.append(style);if(panel)panel.append(section);
 const faults=[],events=[];const count={shot:0,damage:0,switch:0,skill:0,pause:0,resume:0,'reload-start':0,'reload-complete':0};
 let paused=false,reloading=false,active=false,lastRefresh=0,previousPercent=null;
 const timestamp=()=>Math.round(performance.now());
 function record(type,detail={}){events.push({ms:timestamp(),type,detail});if(events.length>160)events.shift();}
 function fault(type,detail={}){faults.push({ms:timestamp(),type,detail});if(faults.length>80)faults.shift();record('fault:'+type,detail);}
 window.ZF36ReportFault=fault;
 const previous=window.ZF34CombatEvent;
 if(typeof previous==='function')window.ZF34CombatEvent=(type,detail)=>{
  if(Object.hasOwn(count,type))count[type]++;
  if(type==='pause'){if(paused)fault('duplicate-pause');paused=true;}
  if(type==='resume'){if(!paused)fault('resume-without-pause');paused=false;}
  if(type==='reload-start'){if(reloading)fault('reload-overlap');reloading=true;active=true;previousPercent=0;}
  if(type==='reload-complete'){if(!reloading)fault('reload-complete-without-start');reloading=false;previousPercent=null;}
  record(type,detail||{});previous(type,detail);
 };
 const oldReload=window.ZF33ReloadObserver;
 if(typeof oldReload==='function')window.ZF33ReloadObserver=data=>{
  if(!paused&&data&&Number.isFinite(data.elapsed)&&Number.isFinite(data.duration)&&data.duration>0){
   const pct=Math.max(0,Math.min(100,Math.floor(data.elapsed/data.duration*100)));
   if(previousPercent!==null&&pct+2<previousPercent)fault('reload-progress-regressed',{previous:previousPercent,current:pct});
   previousPercent=pct;
  }
  oldReload(data);
 };
 window.addEventListener('zf:combat-finished',()=>{active=false;paused=false;reloading=false;previousPercent=null;record('combat-finished');});
 window.addEventListener('zf:skill-used',e=>record('skill-used',e.detail||{}));
 window.addEventListener('zf:weapon-fired',e=>record('weapon-fired',e.detail||{}));
 window.addEventListener('zf:operative-switched',e=>record('operative-switched',e.detail||{}));
 const pointers=new Map();for(const id of ['battleCanvas','fireButton']){const el=document.getElementById(id);if(!el)continue;
  el.addEventListener('pointerdown',e=>{if(pointers.has(e.pointerId)&&pointers.get(e.pointerId)!==id)fault('pointer-ownership',{pointerId:e.pointerId,old:pointers.get(e.pointerId),new:id});pointers.set(e.pointerId,id);},{passive:true});
  const release=e=>{if(pointers.get(e.pointerId)===id)pointers.delete(e.pointerId);};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,release,{passive:true});
 }
 function resetPointers(){pointers.clear();}
 window.addEventListener('blur',resetPointers);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetPointers();});
 const status=section.querySelector('.zf36-status');function refresh(){if(!panel||panel.hidden)return;const now=timestamp();if(now-lastRefresh<400)return;lastRefresh=now;status.textContent=`발사 ${count.shot} · 피격 ${count.damage} · 전환 ${count.switch} · 스킬 ${count.skill}\n재장전 ${count['reload-start']}/${count['reload-complete']} · 일시정지 ${count.pause}/${count.resume}\n현재 포인터 ${pointers.size} · 재장전 ${reloading?'진행':'대기'} · ${paused?'일시정지':'작동'}\n진단 경고 ${faults.length}건 (관찰 기록, 자동 테스트 아님)`;}
 const timer=setInterval(refresh,500);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 section.querySelector('.zf36-export').addEventListener('click',()=>{
  const report={version:36,createdAt:new Date().toISOString(),counts:{...count},paused,reloading,activePointerCount:pointers.size,faults:[...faults],events:[...events],note:'Runtime event observations; does not constitute automated gameplay tests.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v36-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
})();
