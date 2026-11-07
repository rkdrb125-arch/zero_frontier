/* ZERO FRONTIER v40: lightweight, bounded combat-input diagnostics. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const panel=stage.querySelector('.zf34-diagnostics');
 const owners=new Map(),history=[],faults=[];let paused=false,reloading=false,finished=false,updated=0;
 const counters={aim:0,fire:0,pause:0,resume:0,reload:0,complete:0,cancel:0};
 const stamp=()=>Math.round(performance.now());
 function record(kind,data){history.push({ms:stamp(),kind,data});if(history.length>160)history.shift();}
 function fault(code,data){const item={ms:stamp(),code,data};faults.push(item);if(faults.length>80)faults.shift();record('fault',item);}
 function input(e){if(!e)return;const k=e.kind;record(k,e);if(k==='reset'){owners.clear();render();return;}
  if(k==='aim-start'||k==='fire-start'){const role=k.slice(0,k.indexOf('-'));if(owners.has(e.pointerId))fault('DUPLICATE_POINTER_OWNERSHIP',{old:owners.get(e.pointerId),new:role,id:e.pointerId});owners.set(e.pointerId,role);counters[role]++;}
  if(k==='aim-end'||k==='fire-end'){const role=k.slice(0,k.indexOf('-'));if(owners.has(e.pointerId)&&owners.get(e.pointerId)!==role)fault('POINTER_ROLE_MISMATCH',e);owners.delete(e.pointerId);}
  render();}
 function reload(e){if(!e)return;record('reload-'+e.kind,e);if(e.kind==='start'){if(reloading)fault('OVERLAPPING_RELOAD',e);reloading=true;counters.reload++;finished=false;}
  if(e.kind==='complete'){if(!reloading)fault('ORPHAN_RELOAD_COMPLETE',e);reloading=false;counters.complete++;}
  if(e.kind==='cancel'){reloading=false;counters.cancel++;}
  if(e.kind==='pause'){paused=true;if(!reloading)fault('PAUSE_RELOAD_NOT_ACTIVE',e);}
  if(e.kind==='resume'){paused=false;if(!reloading)fault('RESUME_RELOAD_NOT_ACTIVE',e);}
  render();}
 window.ZF40InputState=input;window.ZF40ReloadState=reload;
 const sec=document.createElement('section');sec.className='zf40-diagnostics';sec.innerHTML='<strong>v40 입력·HUD 진단</strong><pre></pre><button type="button">v40 재현 보고서 JSON 저장</button>';
 panel?.append(sec);const pre=sec.querySelector('pre');let last='';
 function render(){if(!panel||!panel.getClientRects().length)return;const now=stamp();if(now-updated<100)return;updated=now;const msg=`조준 ${counters.aim} · 사격 ${counters.fire} · 활성 포인터 ${owners.size}\n재장전 ${counters.reload} / 완료 ${counters.complete} / 취소 ${counters.cancel}\n오류 ${faults.length} · ${finished?'전투 종료':paused?'일시정지':'진행/대기'}`;if(msg!==last){pre.textContent=msg;last=msg;}}
 const mo=new MutationObserver(()=>{updated=0;render();});if(panel)mo.observe(panel,{attributes:true,attributeFilter:['hidden','class','style']});
 stage.addEventListener('click',()=>{updated=0;render();});
 window.addEventListener('zf:weapon-fired',e=>record('shot',e.detail||{}));
 window.addEventListener('zf:operative-switched',e=>record('switch',e.detail||{}));
 window.addEventListener('zf:skill-used',e=>record('skill',e.detail||{}));
 window.addEventListener('zf:combat-finished',e=>{record('finish',e.detail||{});finished=true;reloading=false;paused=false;owners.clear();updated=0;render();});
 const oldState=window.ZF39CombatState;
 window.ZF39CombatState=function(e){oldState?.(e);if(!e)return;record('combat-'+e.kind,e);if(e.kind==='pause'){if(paused)fault('DUPLICATE_PAUSE',e);paused=true;counters.pause++;}if(e.kind==='resume'){if(!paused)fault('RESUME_WITHOUT_PAUSE',e);paused=false;counters.resume++;}if(e.kind==='combat-end'){finished=true;owners.clear();reloading=false;paused=false;}if(e.kind==='reload-start')finished=false;render();};
 sec.querySelector('button').addEventListener('click',()=>{const report={version:40,generated:new Date().toISOString(),device:{userAgent:navigator.userAgent,width:innerWidth,height:innerHeight,dpr:devicePixelRatio},state:{paused,reloading,finished,owners:[...owners]},counters:{...counters},faults:[...faults],history:[...history]};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero-frontier-v40-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const css=document.createElement('style');css.textContent='#battleStage .zf40-diagnostics{margin-top:8px;border-top:1px solid #ffffff44;padding-top:8px;font:11px/1.5 ui-monospace,monospace}#battleStage .zf40-diagnostics pre{white-space:pre-wrap;overflow-wrap:anywhere}#battleStage .zf40-diagnostics button{min-height:44px}#battleCanvas,#fireButton{touch-action:none!important}@media(prefers-reduced-motion:reduce){#battleStage .zf33-hit{transition:none!important}}';document.head.append(css);
})();
