/* ZERO FRONTIER v39: bounded diagnostics and input-state validation. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const panel=stage.querySelector('.zf34-diagnostics');
 const events=[],faults=[],owners=new Map();let paused=false,reloading=false,ended=false;
 const counts={aim:0,fire:0,capture:0,pause:0,resume:0,reload:0,finish:0};
 const now=()=>Math.round(performance.now());
 function add(type,detail){events.push({t:now(),type,detail});if(events.length>140)events.shift();}
 function fault(code,detail){faults.push({t:now(),code,detail});if(faults.length>80)faults.shift();add('fault',code);}
 window.ZF39InputState=function(e){if(!e||!e.kind)return;add('input',e);const k=e.kind;
  if(k==='reset'){owners.clear();return;}
  if(k==='capture-failed'){counts.capture++;fault('CAPTURE_FAILED',e);return;}
  if(k==='aim-start'||k==='fire-start'){
   const role=k==='aim-start'?'aim':'fire';counts[role]++;
   if(owners.has(e.pointerId)&&owners.get(e.pointerId)!==role)fault('POINTER_OWNER_CONFLICT',e);
   owners.set(e.pointerId,role);
  }else if(k==='aim-end'||k==='fire-end'){
   const role=k==='aim-end'?'aim':'fire';if(owners.has(e.pointerId)&&owners.get(e.pointerId)!==role)fault('POINTER_END_MISMATCH',e);
   owners.delete(e.pointerId);
  }
 };
 window.ZF39CombatState=function(e){if(!e||!e.kind)return;add('combat',e);const k=e.kind;
  if(k==='pause'){counts.pause++;if(paused)fault('DUPLICATE_PAUSE',e);paused=true;}
  if(k==='resume'){counts.resume++;if(!paused)fault('RESUME_WITHOUT_PAUSE',e);paused=false;}
  if(k==='reload-start'){counts.reload++;if(reloading)fault('OVERLAPPING_RELOAD',e);reloading=true;ended=false;}
  if(k==='reload-complete'){if(!reloading)fault('RELOAD_COMPLETE_WITHOUT_START',e);reloading=false;}
  if(k==='combat-end'){counts.finish++;reloading=false;paused=false;ended=true;owners.clear();}
 };
 for(const kind of ['zf:weapon-fired','zf:operative-switched','zf:skill-used','zf:combat-finished'])window.addEventListener(kind,e=>add(kind,e.detail||{}));
 const section=document.createElement('section');section.className='zf39-diagnostics';
 section.innerHTML='<strong>v39 입력·전투 경계 진단</strong><pre aria-live="off"></pre><button type="button">v39 재현 보고서 JSON 저장</button>';
 panel?.append(section);
 const style=document.createElement('style');style.textContent='#battleStage .zf39-diagnostics{margin-top:8px;padding-top:8px;border-top:1px solid #ffffff44;font:11px/1.5 ui-monospace,monospace}#battleStage .zf39-diagnostics pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:120px;overflow:auto}#battleStage .zf39-diagnostics button{min-height:44px}#battleCanvas,#fireButton{touch-action:none!important}';document.head.append(style);
 const pre=section.querySelector('pre');let lastText='';
 function render(){if(!panel||!panel.getClientRects().length)return;const value=`포인터 ${owners.size} · 조준 ${counts.aim} · 사격 ${counts.fire} · 캡처 실패 ${counts.capture}\n일시정지 ${counts.pause} · 재개 ${counts.resume} · 재장전 ${counts.reload} · 종료 ${counts.finish}\n진단 오류 ${faults.length} · ${paused?'일시정지':ended?'전투 종료':'진행/대기'}`;if(value!==lastText){pre.textContent=value;lastText=value;}}
 // Only refresh when diagnostic panel is visible; no perpetual animation frame.
 const observer=new MutationObserver(render);if(panel)observer.observe(panel,{attributes:true,attributeFilter:['hidden','style','class']});
 stage.addEventListener('click',()=>queueMicrotask(render));
 section.querySelector('button').addEventListener('click',()=>{
  const report={version:39,generated:new Date().toISOString(),userAgent:navigator.userAgent,viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio},counts,states:{paused,reloading,ended,owners:[...owners]},faults:[...faults],events:[...events]};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='zero-frontier-v39-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
 render();
})();
