/* ZERO FRONTIER v37 — boundary diagnostics, paused reload presentation and mobile control stability. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const panel=stage.querySelector('.zf34-diagnostics');
 const css=document.createElement('style');css.textContent=`
 #battleCanvas,#fireButton{touch-action:none;overscroll-behavior:contain}
 #battleStage .zf37-report{border-top:1px solid #ffffff44;margin-top:8px;padding-top:8px;font:11px/1.5 ui-monospace,monospace}
 #battleStage .zf37-status{white-space:pre-wrap;overflow-wrap:anywhere;max-height:125px;overflow:auto}
 #battleStage .zf37-report button{min-height:40px}
 #battleStage .zf33-reload.zf37-paused .zf33-fill{opacity:.6}
 @media(pointer:coarse){#fireButton,#reloadButton,#coverButton{touch-action:manipulation;min-height:48px}}
 @media(prefers-reduced-motion:reduce){#battleStage .zf37-report *{animation:none!important;transition:none!important}}
 `;document.head.append(css);
 const section=document.createElement('section');section.className='zf37-report';section.innerHTML='<strong>v37 경계 상황 진단</strong><pre class="zf37-status"></pre><button type="button" class="zf37-export">v37 재현 정보 JSON</button>';
 if(panel)panel.append(section);
 const status=section.querySelector('.zf37-status');const events=[],warnings=[];
 const totals={shot:0,damage:0,switch:0,skill:0,'reload-start':0,'reload-complete':0,pause:0,resume:0};
 let paused=false,reloading=false,owner=null,aimActive=false,fireActive=false,lastRefresh=0,runId=0;
 const stamp=()=>Math.round(performance.now());
 function log(type,detail={}){events.push({ms:stamp(),type,detail});if(events.length>150)events.shift();}
 function warn(code,detail={}){warnings.push({ms:stamp(),code,detail});if(warnings.length>70)warnings.shift();log('warning:'+code,detail);}
 const previous=window.ZF34CombatEvent;
 if(typeof previous==='function')window.ZF34CombatEvent=(type,detail)=>{
  if(Object.prototype.hasOwnProperty.call(totals,type))totals[type]++;
  if(type==='reload-start'){if(reloading)warn('reload-overlap');reloading=true;}
  if(type==='reload-complete'){if(!reloading)warn('reload-complete-without-start');reloading=false;}
  if(type==='pause'){if(paused)warn('duplicate-pause');paused=true;}
  if(type==='resume'){if(!paused)warn('resume-without-pause');paused=false;}
  if(type==='shot'&&paused)warn('shot-during-pause');
  log(type,detail||{});return previous(type,detail);
 };
 const reloadHud=stage.querySelector('.zf33-reload');const reloadLabel=reloadHud?.querySelector('.zf33-label');
 window.ZF37ReloadState=({state,operative})=>{
  if(state==='start'){reloading=true;owner=operative;reloadHud?.classList.remove('zf37-paused');}
  if(state==='pause'){paused=true;reloadHud?.classList.add('zf37-paused');if(reloadLabel&&!reloadHud.hidden&&!reloadLabel.textContent.includes('일시정지'))reloadLabel.textContent+=' · 일시정지';}
  if(state==='resume'){paused=false;reloadHud?.classList.remove('zf37-paused');if(reloadLabel)reloadLabel.textContent=reloadLabel.textContent.replace(/\s*·\s*일시정지/g,'');}
  if(state==='complete'){reloading=false;owner=null;reloadHud?.classList.remove('zf37-paused');}
  log('reload-state',{state,operative});
 };
 window.ZF37InputEvent=(type,detail={})=>{if(type==='aim-start')aimActive=true;if(type==='aim-end')aimActive=false;if(type==='fire-start')fireActive=true;if(type==='fire-end')fireActive=false;log(type,detail);};
 for(const [type,key] of [['zf:weapon-fired','shot'],['zf:operative-switched','switch'],['zf:skill-used','skill']])window.addEventListener(type,e=>{if(key==='shot'&&!e.detail?.operative)warn('shot-missing-operative');log(type,e.detail||{});});
 window.addEventListener('zf:combat-finished',e=>{reloading=false;paused=false;aimActive=false;fireActive=false;runId++;log('combat-finished',e.detail||{});});
 const reset=()=>{aimActive=false;fireActive=false;};window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 const oldReload=window.ZF33ReloadObserver;
 if(typeof oldReload==='function')window.ZF33ReloadObserver=data=>{
  if(!data||!Number.isFinite(data.elapsed)||!Number.isFinite(data.duration)||data.duration<=0){warn('invalid-reload-telemetry');return;}
  if(data.elapsed>data.duration+150)warn('reload-overrun',{elapsed:Math.round(data.elapsed),duration:data.duration});
  if(!paused)oldReload(data);
 };
 function refresh(){if(!panel||panel.hidden)return;const now=stamp();if(now-lastRefresh<450)return;lastRefresh=now;
  status.textContent=`발사 ${totals.shot} · 피격 ${totals.damage} · 전환 ${totals.switch} · 스킬 ${totals.skill}\n재장전 ${totals['reload-start']}/${totals['reload-complete']} · 정지/재개 ${totals.pause}/${totals.resume}\n조준 ${aimActive?'활성':'대기'} · 사격 ${fireActive?'활성':'대기'} · ${paused?'일시정지':'진행'}\n경고 ${warnings.length}건 · 최근 이벤트 ${events.length}개`;
 }
 const observer=panel&&new MutationObserver(refresh);if(panel)observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
 const timer=setInterval(refresh,550);window.addEventListener('pagehide',()=>{clearInterval(timer);observer?.disconnect();},{once:true});
 section.querySelector('.zf37-export').addEventListener('click',()=>{
  const report={version:37,createdAt:new Date().toISOString(),runId,counts:{...totals},state:{paused,reloading,owner,aimActive,fireActive},warnings:[...warnings],events:[...events],environment:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},pixelRatio:devicePixelRatio},note:'Browser runtime observations, not automated device playtesting.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v37-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
})();
