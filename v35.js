/* ZERO FRONTIER v35 — diagnostics, pointer ownership and HUD lifecycle; no gameplay values changed. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const css=document.createElement('style');css.textContent=`
 #battleStage .zf35-report{display:grid;gap:5px;margin-top:7px;padding-top:7px;border-top:1px solid #ffffff45;font:11px/1.45 ui-monospace,monospace}
 #battleStage .zf35-report button{min-height:32px}
 #battleStage .zf35-report .zf35-status{white-space:pre-wrap;overflow-wrap:anywhere}
 @media(pointer:coarse){#battleStage .zf34-diag-toggle{min-width:48px;min-height:44px}#battleStage .zf34-diagnostics button{min-height:44px}}
 @media(prefers-reduced-motion:reduce){#battleStage .zf33-hit,#battleStage .zf29-shot{animation:none!important;transition:none!important}}
 `;document.head.append(css);
 const panel=stage.querySelector('.zf34-diagnostics');const report=document.createElement('section');report.className='zf35-report';report.innerHTML='<strong>v35 입력·HUD 진단</strong><div class="zf35-status" aria-live="off"></div><button class="zf35-export" type="button">v35 보고서 JSON</button>';
 if(panel)panel.append(report);
 const status=report.querySelector('.zf35-status');
 const counts={shots:0,hits:0,switches:0,skills:0,pauses:0,resumes:0,reloadStarts:0,reloadEnds:0,pointerCancels:0,pointerConflicts:0};
 const timeline=[];let paused=false,activePointers=new Map(),lastHudValue='',lastHudUpdate=0,lastRender=0;
 const now=()=>performance.now();
 function log(type,detail={}){timeline.push({ms:Math.round(now()),type,detail});if(timeline.length>200)timeline.shift();}
 const original=window.ZF34CombatEvent;
 if(typeof original==='function')window.ZF34CombatEvent=(type,detail)=>{
  if(type==='shot')counts.shots++;if(type==='damage')counts.hits++;if(type==='switch')counts.switches++;
  if(type==='skill')counts.skills++;if(type==='pause'){counts.pauses++;paused=true;}if(type==='resume'){counts.resumes++;paused=false;}
  if(type==='reload-start')counts.reloadStarts++;if(type==='reload-complete')counts.reloadEnds++;
  log(type,detail||{});original(type,detail);
 };
 const reload=stage.querySelector('.zf33-reload');const label=reload?.querySelector('.zf33-label');
 const previousReload=window.ZF33ReloadObserver;
 if(typeof previousReload==='function')window.ZF33ReloadObserver=(data)=>{
  if(paused)return;
  previousReload(data);
  if(reload&&!reload.hidden&&label){
   if(label.textContent.includes('일시정지'))label.textContent=label.textContent.replace(/\s*·\s*일시정지/g,'');
   lastHudValue=label.textContent;lastHudUpdate=now();
  }
 };
 const controls=['fireButton','reloadButton','skillButton','zf27SupportSkill','zf27CommandSkill','coverButton'];
 for(const id of controls){const el=document.getElementById(id);if(!el)continue;
  el.addEventListener('pointerdown',e=>{if(activePointers.has(e.pointerId)&&activePointers.get(e.pointerId)!==id){counts.pointerConflicts++;log('pointer-conflict',{id,pointerId:e.pointerId});}activePointers.set(e.pointerId,id);},{passive:true});
  const release=e=>{if(e.type==='pointercancel')counts.pointerCancels++;if(activePointers.get(e.pointerId)===id)activePointers.delete(e.pointerId);};
  el.addEventListener('pointerup',release,{passive:true});el.addEventListener('pointercancel',release,{passive:true});el.addEventListener('lostpointercapture',release,{passive:true});
 }
 function reset(){activePointers.clear();}
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 window.addEventListener('zf:operative-switched',e=>{log('operative-switched',e.detail||{});});
 window.addEventListener('zf:weapon-fired',e=>{log('weapon-fired',e.detail||{});});
 window.addEventListener('zf:skill-used',e=>{counts.skills++;log('skill-used',e.detail||{});});
 window.addEventListener('zf:combat-finished',()=>{paused=false;reset();log('combat-finished');});
 function render(){if(!panel||panel.hidden)return;const t=now();if(t-lastRender<250)return;lastRender=t;
  status.textContent=`발사 ${counts.shots} · 피격 ${counts.hits} · 전환 ${counts.switches} · 스킬 ${counts.skills}\n재장전 ${counts.reloadStarts}/${counts.reloadEnds} · 정지/재개 ${counts.pauses}/${counts.resumes}\n동시 터치 ${activePointers.size} · 취소 ${counts.pointerCancels} · 충돌 ${counts.pointerConflicts}\nHUD ${paused?'일시정지':(reload&&!reload.hidden?'진행 중':'대기')} · 마지막 갱신 ${lastHudUpdate?Math.round(t-lastHudUpdate)+'ms 전':'없음'}`;
 }
 if(panel)new MutationObserver(render).observe(panel,{attributes:true,attributeFilter:['hidden']});
 const timer=window.setInterval(()=>{if(!panel||panel.hidden)return;render();},300);
 report.querySelector('.zf35-export').addEventListener('click',()=>{
  const payload={version:35,createdAt:new Date().toISOString(),counts:{...counts},paused,activePointerCount:activePointers.size,lastReloadHud:lastHudValue,timeline:[...timeline],note:'Browser-side observational diagnostics; not an automated gameplay verification.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v35-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 window.addEventListener('pagehide',()=>window.clearInterval(timer),{once:true});
})();
