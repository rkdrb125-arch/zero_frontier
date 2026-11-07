/* ZERO FRONTIER v38 — low-overhead runtime diagnostics and HUD boundary synchronization. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const panel=stage.querySelector('.zf34-diagnostics');
 const css=document.createElement('style');css.textContent=`
 #battleCanvas,#fireButton{touch-action:none!important;overscroll-behavior:contain}
 #battleStage .zf38-report{border-top:1px solid #ffffff44;margin-top:8px;padding-top:8px;font:11px/1.5 ui-monospace,monospace}
 #battleStage .zf38-report pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:140px;overflow:auto}
 #battleStage .zf38-report button{min-height:44px}
 #battleStage .zf33-reload.zf37-paused .zf33-fill{transition:none!important}
 @media(prefers-reduced-motion:reduce){#battleStage .zf38-report *{animation:none!important;transition:none!important}}
 `;document.head.append(css);
 const section=document.createElement('section');section.className='zf38-report';section.innerHTML='<strong>v38 입력·HUD 동기화 진단</strong><pre aria-live="off"></pre><button type="button">v38 진단 JSON 저장</button>';panel?.append(section);
 const output=section.querySelector('pre'),events=[],warnings=[],owners=new Map();let paused=false,reloading=false,lastReloadPercent=null,updates=0;
 const counters={shot:0,damage:0,switch:0,skill:0,'reload-start':0,'reload-complete':0,pause:0,resume:0};
 function append(target,item,max){target.push({at:Math.round(performance.now()),...item});if(target.length>max)target.shift();}
 function warn(code,detail={}){append(warnings,{code,detail},80);}
 function log(type,detail={}){append(events,{type,detail},180);}
 window.ZF38PointerEvent=(type,detail={})=>{
  const id=detail.pointerId;
  if(type.endsWith('start')){if(owners.has(id)&&owners.get(id)!==type.slice(0,-6))warn('pointer-owner-conflict',{id,type});owners.set(id,type.slice(0,-6));}
  else if(type.endsWith('end')){if(owners.has(id)&&owners.get(id)!==type.slice(0,-4))warn('pointer-release-mismatch',{id,type});owners.delete(id);}
  log(type,detail);schedule();
 };
 window.ZF38InputReset=detail=>{owners.clear();log('input-reset',detail);schedule();};
 window.ZF38PauseState=state=>{paused=state.paused;log('pause-state',state);schedule();};
 const prior=window.ZF34CombatEvent;
 if(typeof prior==='function')window.ZF34CombatEvent=(type,detail)=>{
  if(Object.prototype.hasOwnProperty.call(counters,type))counters[type]++;
  if(type==='reload-start'){if(reloading)warn('overlapping-reload');reloading=true;lastReloadPercent=0;}
  if(type==='reload-complete'){if(!reloading)warn('reload-complete-without-start');reloading=false;lastReloadPercent=null;}
  if(type==='shot'&&paused)warn('shot-during-pause');
  if(type==='pause'&&paused)log('pause-observed-after-state-update');
  if(type==='resume'&&!paused)log('resume-observed-after-state-update');
  log(type,detail||{});schedule();return prior(type,detail);
 };
 const oldReload=window.ZF33ReloadObserver;
 if(typeof oldReload==='function')window.ZF33ReloadObserver=data=>{
  if(data&&Number.isFinite(data.elapsed)&&Number.isFinite(data.duration)&&data.duration>0){
   const pct=Math.max(0,Math.min(100,Math.floor(data.elapsed/data.duration*100)));
   if(lastReloadPercent!==null&&pct+2<lastReloadPercent&&!paused)warn('reload-percent-regression',{previous:lastReloadPercent,current:pct});
   lastReloadPercent=pct;
  }else warn('invalid-reload-telemetry');
  return oldReload(data);
 };
 for(const [name,type] of [['zf:weapon-fired','shot'],['zf:operative-switched','switch'],['zf:skill-used','skill']])window.addEventListener(name,e=>{
  if(!e.detail?.operative)warn('missing-operative',{event:name});
  log('verified:'+type,e.detail||{});schedule();
 });
 window.addEventListener('zf:combat-finished',()=>{owners.clear();paused=false;reloading=false;lastReloadPercent=null;log('combat-finished');schedule();});
 const reset=()=>{owners.clear();schedule();};window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 let pending=false;function refresh(){pending=false;if(!panel||panel.hidden||document.hidden)return;updates++;
  output.textContent=`발사 ${counters.shot} · 피격 ${counters.damage} · 전환 ${counters.switch} · 스킬 ${counters.skill}\n재장전 ${counters['reload-start']}/${counters['reload-complete']} · 정지/재개 ${counters.pause}/${counters.resume}\n포인터 ${owners.size}개 · ${paused?'일시정지':'진행'} · 재장전 ${reloading?'활성':'대기'} ${lastReloadPercent??'-'}%\n경고 ${warnings.length}건 · 최근 기록 ${events.length}개`;
 }
 function schedule(){if(pending||!panel||panel.hidden||document.hidden)return;pending=true;requestAnimationFrame(refresh);}
 const mutation=panel&&new MutationObserver(schedule);mutation?.observe(panel,{attributes:true,attributeFilter:['hidden']});
 section.querySelector('button').addEventListener('click',()=>{
  const report={version:38,createdAt:new Date().toISOString(),counters,paused,reloading,owners:[...owners],lastReloadPercent,warnings,events,uiRefreshes:updates,environment:{userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight]},note:'Runtime observations only; not automated device playtesting.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v38-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 window.addEventListener('pagehide',()=>mutation?.disconnect(),{once:true});
 schedule();
})();
