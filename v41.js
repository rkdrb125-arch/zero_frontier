/* ZERO FRONTIER v41 — unified diagnostics and authoritative HUD boundary checks. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage'),panel=stage?.querySelector('.zf34-diagnostics');if(!stage||!panel)return;
 // Keep historical hooks alive, but expose one diagnostic surface and one export action.
 for(const selector of ['.zf35-diagnostics','.zf36-diagnostics','.zf37-diagnostics','.zf38-report','.zf39-diagnostics','.zf40-diagnostics']){
  panel.querySelectorAll(selector).forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true');});
 }
 const oldExport=panel.querySelector('.zf34-export');if(oldExport){oldExport.hidden=true;oldExport.setAttribute('aria-hidden','true');}
 const style=document.createElement('style');style.textContent=`
 #battleStage .zf34-diagnostics{max-height:min(75vh,520px);overflow:auto;overscroll-behavior:contain;contain:layout style}
 #battleStage .zf34-diagnostics :is(.zf35-diagnostics,.zf36-diagnostics,.zf37-diagnostics,.zf38-report,.zf39-diagnostics,.zf40-diagnostics){display:none!important}
 #battleStage .zf41-unified{border-top:1px solid #a6c8e055;margin-top:8px;padding-top:8px;font:11px/1.55 ui-monospace,monospace}
 #battleStage .zf41-unified pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;margin:5px 0}
 #battleStage .zf41-unified button{min-height:44px;touch-action:manipulation}
 #battleStage .zf33-reload[hidden],#battleStage .zf32-reload{display:none!important}
 #battleCanvas,#fireButton{touch-action:none!important;overscroll-behavior:contain}
 @media (pointer:coarse){#battleStage .zf34-diagnostics{max-width:min(340px,90vw)}}
 @media(prefers-reduced-motion:reduce){#battleStage .zf33-fill{will-change:auto!important}}
 `;document.head.append(style);
 const sec=document.createElement('section');sec.className='zf41-unified';sec.innerHTML='<strong>v41 통합 전투 진단</strong><pre aria-live="off"></pre><button type="button">v41 통합 재현 보고서 JSON 저장</button>';panel.append(sec);
 const pre=sec.querySelector('pre'),reloadHud=stage.querySelector('.zf33-reload'),reloadLabel=reloadHud?.querySelector('.zf33-label');
 const events=[],issues=[],owners=new Map(),counts={shot:0,damage:0,switch:0,skill:0,reloadStart:0,reloadComplete:0,pause:0,resume:0,finish:0};
 let paused=false,reloading=false,finished=false,lastReload=null,lastRender='',pending=false,session=0;
 const stamp=()=>Math.round(performance.now());
 function log(type,detail={}){events.push({ms:stamp(),session,type,detail});if(events.length>200)events.shift();schedule();}
 function issue(code,detail={},severity='warning'){issues.push({ms:stamp(),session,severity,code,detail});if(issues.length>100)issues.shift();log('issue:'+code,detail);}
 function render(){pending=false;if(panel.hidden||document.hidden)return;
  const statuses=['skillStatus','zf27SupportStatus','zf27CommandStatus'].map(id=>{const el=document.getElementById(id);return el?`${id}: ${(el.textContent||'').trim()}`:null;}).filter(Boolean);
  const value=`세션 ${session} · ${finished?'전투 종료':paused?'일시정지':'진행/대기'} · 포인터 ${owners.size}\n사격 ${counts.shot} · 피격 ${counts.damage} · 전환 ${counts.switch} · 스킬 ${counts.skill}\n재장전 ${counts.reloadStart}/${counts.reloadComplete} · ${reloading?'진행 '+(lastReload??'-')+'%':'대기'}\n일시정지/재개 ${counts.pause}/${counts.resume} · 종료 ${counts.finish}\n오류·경고 ${issues.length} · 이벤트 ${events.length}\n${statuses.join('\n')}`;
  if(value!==lastRender){pre.textContent=value;lastRender=value;}
 }
 function schedule(){if(pending||panel.hidden||document.hidden)return;pending=true;requestAnimationFrame(render);}
 // Hook the authoritative combat events, preserving every previous diagnostic listener.
 const previous=window.ZF34CombatEvent;
 window.ZF34CombatEvent=function(type,detail={}){
  if(type==='shot'){counts.shot++;if(paused||finished)issue('SHOT_WHILE_INACTIVE',{paused,finished});}
  if(type==='damage')counts.damage++;
  if(type==='switch')counts.switch++;
  if(type==='reload-start'){counts.reloadStart++;if(reloading)issue('OVERLAPPING_RELOAD');reloading=true;finished=false;lastReload=0;}
  if(type==='reload-complete'){counts.reloadComplete++;if(!reloading)issue('ORPHAN_RELOAD_COMPLETE');reloading=false;lastReload=null;hideReload();}
  if(type==='pause'){counts.pause++;if(paused)issue('DUPLICATE_PAUSE');paused=true;syncReloadPause();}
  if(type==='resume'){counts.resume++;if(!paused)issue('RESUME_WITHOUT_PAUSE');paused=false;syncReloadPause();}
  log('combat:'+type,detail);return previous?.(type,detail);
 };
 const oldReload=window.ZF33ReloadObserver;
 if(typeof oldReload==='function')window.ZF33ReloadObserver=function(data){
  if(!data||!Number.isFinite(data.elapsed)||!Number.isFinite(data.duration)||data.duration<=0){issue('INVALID_RELOAD_TELEMETRY',data||{});return;}
  const pct=Math.max(0,Math.min(100,Math.floor(data.elapsed/data.duration*100)));
  if(!paused&&lastReload!==null&&pct+2<lastReload)issue('RELOAD_PROGRESS_REGRESSION',{previous:lastReload,next:pct});
  lastReload=pct;if(paused)return;const result=oldReload(data);syncReloadPause();schedule();return result;
 };
 function hideReload(){if(reloadHud){reloadHud.hidden=true;reloadHud.classList.remove('zf37-paused');delete reloadHud.dataset.zf34Paused;} }
 function syncReloadPause(){if(!reloadHud)return;reloadHud.classList.toggle('zf37-paused',paused&&reloading);if(reloadLabel){const text=(reloadLabel.textContent||'').replace(/\s*·\s*일시정지/g,'');reloadLabel.textContent=text+(paused&&reloading&&!reloadHud.hidden?' · 일시정지':'');}schedule();}
 // Input tracking is observational; no synthetic input or gameplay balance changes.
 const priorInput=window.ZF40InputState;
 window.ZF40InputState=function(e){if(e){const k=e.kind,id=e.pointerId;if(k==='reset')owners.clear();else if(k==='aim-start'||k==='fire-start'){const role=k.split('-')[0];if(owners.has(id))issue('POINTER_OWNERSHIP_CONFLICT',{id,previous:owners.get(id),role});owners.set(id,role);}else if(k==='aim-end'||k==='fire-end'){if(owners.has(id)&&owners.get(id)!==k.split('-')[0])issue('POINTER_RELEASE_MISMATCH',{id,kind:k});owners.delete(id);}log('input:'+k,{pointerId:id,reason:e.reason,pointerType:e.pointerType});}return priorInput?.(e);};
 window.addEventListener('zf:skill-used',e=>{counts.skill++;log('skill',e.detail||{});});
 window.addEventListener('zf:operative-switched',e=>log('switch',e.detail||{}));
 window.addEventListener('zf:weapon-fired',e=>log('weapon-fired',e.detail||{}));
 window.addEventListener('zf:combat-finished',e=>{counts.finish++;finished=true;paused=false;reloading=false;owners.clear();lastReload=null;hideReload();log('finish',e.detail||{});});
 // Native game HUD text remains authoritative; only observe changes and avoid background polling.
 const statusNodes=['skillStatus','zf27SupportStatus','zf27CommandStatus'].map(id=>document.getElementById(id)).filter(Boolean);
 const statusObserver=new MutationObserver(()=>{if(!finished)schedule();});statusNodes.forEach(el=>statusObserver.observe(el,{subtree:true,childList:true,characterData:true}));
 const pauseLayer=document.getElementById('zfPauseLayer');if(pauseLayer)new MutationObserver(()=>{if(pauseLayer.hidden!==!paused){paused=!pauseLayer.hidden;syncReloadPause();}schedule();}).observe(pauseLayer,{attributes:true,attributeFilter:['hidden']});
 const notice=document.getElementById('battleNotice');if(notice)new MutationObserver(()=>{if(!/재장전 중/.test(notice.textContent||'')&&!reloading)hideReload();}).observe(notice,{childList:true,characterData:true,subtree:true});
 // Detect fresh deployment without touching saved progress or stage mechanics.
 const combat=document.getElementById('combat');const resetButton=document.getElementById('retryBattle');resetButton?.addEventListener('click',()=>{session++;paused=false;finished=false;reloading=false;lastReload=null;owners.clear();hideReload();log('session-retry');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){owners.clear();}else schedule();});
 const toggle=stage.querySelector('.zf34-diag-toggle');toggle?.addEventListener('click',schedule);panel.querySelector('.zf34-close')?.addEventListener('click',()=>{pending=false;});
 sec.querySelector('button').addEventListener('click',()=>{const report={version:41,generated:new Date().toISOString(),device:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}},state:{session,paused,reloading,finished,owners:[...owners],reloadPercent:lastReload},counts:{...counts},hud:Object.fromEntries(statusNodes.map(el=>[el.id,el.textContent.trim()])),issues:[...issues],events:[...events]};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v41-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
 schedule();
})();
