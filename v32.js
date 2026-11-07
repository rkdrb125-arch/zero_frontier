/* ZERO FRONTIER v32 — unified read-only HUD; combat.js remains authoritative. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),stage=$('battleStage');if(!stage)return;
 const slots=[['skillButton','skillStatus','main'],['zf27SupportSkill','zf27SupportStatus','support'],['zf27CommandSkill','zf27CommandStatus','command']];
 const names={precision:'정밀 조준',guard:'방호 태세',medic:'응급처치',rapid:'신속 재장전',command:'돌격 통솔'};
 const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const style=document.createElement('style');style.textContent=`
 /* v32 owns the single compact counter; earlier counters remain in DOM for compatibility */
 #battleStage .zf30-counter,#battleStage .zf31-time{display:none!important}
 #battleStage .zf32-counter{display:block;font-size:11px;font-weight:800;line-height:1.1;margin-top:2px;font-variant-numeric:tabular-nums}
 #battleStage .zf32-reload{position:absolute;left:50%;bottom:15%;transform:translateX(-50%);z-index:60;width:min(280px,70%);padding:8px 12px;border-radius:9px;background:#081525dd;color:#f5faff;border:1px solid #a3c3e5;pointer-events:none;text-align:center;font-size:12px;font-weight:700}
 #battleStage .zf32-reload[hidden]{display:none!important}
 #battleStage .zf32-track{height:5px;background:#ffffff35;border-radius:8px;overflow:hidden;margin-top:5px}
 #battleStage .zf32-track>span{display:block;height:100%;background:#8fd8ff;transform-origin:left;transform:scaleX(var(--zf32-reload-progress,0))}
 #battleStage .zf32-weapon{position:absolute;top:15%;left:50%;transform:translateX(-50%);z-index:61;color:white;background:#0b1739d9;border-radius:7px;padding:7px 12px;font-weight:800;pointer-events:none;white-space:nowrap}
 #battleStage .zf32-weapon[hidden]{display:none!important}
 #battleStage .zf32-fire{position:absolute;inset:0;pointer-events:none;z-index:58;opacity:0}
 #battleStage .zf32-fire.miguel{background:radial-gradient(ellipse at 52% 65%,#ffbb633c,transparent 48%)}
 #battleStage .zf32-fire.daniel{background:radial-gradient(ellipse at 52% 65%,#7ad6ff32,transparent 43%)}
 #battleStage .zf32-fire.show{animation:zf32shot .16s ease-out}
 @keyframes zf32shot{0%{opacity:.85}100%{opacity:0}}
 @media(hover:none),(pointer:coarse){#battleStage #fireButton,#battleStage #reloadButton,#battleStage #skillButton,#battleStage #zf27SupportSkill,#battleStage #zf27CommandSkill{touch-action:manipulation;min-width:44px;min-height:44px}}
 @media(prefers-reduced-motion:reduce){#battleStage .zf32-fire.show{animation:none}}
 `;document.head.append(style);
 const reload=document.createElement('div');reload.className='zf32-reload';reload.hidden=true;reload.innerHTML='<span>재장전 중</span><div class="zf32-track"><span></span></div>';
 const weapon=document.createElement('div');weapon.className='zf32-weapon';weapon.hidden=true;
 const fire=document.createElement('div');fire.className='zf32-fire';fire.setAttribute('aria-hidden','true');
 stage.append(reload,weapon,fire);
 let current='miguel',reloadStart=null,reloadDuration=1300,reloadPausedAt=null,swapTimer=0,shotTimer=0,raf=0,previousNotice='';
 const operative=()=> $('danielSwitch')?.classList.contains('active')?'daniel':$('miguelSwitch')?.classList.contains('active')?'miguel':current;
 const skillKey=kind=>kind==='main'?(operative()==='miguel'?'precision':'guard'):kind==='support'?(operative()==='miguel'?'medic':'rapid'):'command';
 const parse=text=>{const t=(text||'').trim(),m=t.match(/(\d+(?:\.\d+)?)\s*s\b/i);return {seconds:m?Number(m[1]):null,active:/ACTIVE/i.test(t),waiting:/대기/.test(t),text:t};};
 function paint(){
  for(const [btnId,statusId,kind] of slots){const btn=$(btnId),status=$(statusId);if(!btn||!status)continue;
   const state=parse(status.textContent),name=names[skillKey(kind)];let label=btn.querySelector('.zf32-counter');if(!label){label=document.createElement('span');label.className='zf32-counter';label.setAttribute('aria-hidden','true');btn.append(label);}
   label.textContent=state.seconds!==null&&(state.waiting||state.active)?`${state.active?'ON ':''}${state.seconds.toFixed(state.seconds<10?1:0)}s`:state.active?'ON':state.waiting?'대기':'준비';
   btn.dataset.zf32State=state.active?'active':state.waiting?'cooldown':'ready';btn.setAttribute('aria-label',`${name} · ${state.text||'준비'}`);
  }
  const notice=$('battleNotice')?.textContent||'',isReloading=/재장전 중/.test(notice);
  if(isReloading&&!/재장전 중/.test(previousNotice)){
   reloadStart=performance.now();const rapid=/ACTIVE/i.test($('zf27SupportStatus')?.textContent||'')&&operative()==='daniel';reloadDuration=(operative()==='miguel'?1300:1700)*(rapid?.55:1);
  }
  if(!isReloading){reloadStart=null;reloadPausedAt=null;}
  reload.hidden=!isReloading;previousNotice=notice;
 }
 const observer=new MutationObserver(paint);for(const [,id] of slots){const el=$(id);if(el)observer.observe(el,{childList:true,subtree:true,characterData:true});}
 if($('battleNotice'))observer.observe($('battleNotice'),{childList:true,subtree:true,characterData:true});
 function tick(now){
  if(reloadStart!==null&&!document.hidden){const progress=Math.max(0,Math.min(1,(now-reloadStart)/reloadDuration));reload.style.setProperty('--zf32-reload-progress',String(progress));}
  raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){reloadPausedAt=performance.now();}else{if(reloadStart!==null&&reloadPausedAt!==null)reloadStart+=performance.now()-reloadPausedAt;reloadPausedAt=null;paint();}});
 window.addEventListener('zf:operative-switched',e=>{current=e.detail?.to||current;weapon.textContent=current==='miguel'?'미겔 · DESERT EAGLE':'다니엘 · HK416 A5';weapon.hidden=false;clearTimeout(swapTimer);swapTimer=setTimeout(()=>weapon.hidden=true,950);paint();});
 window.addEventListener('zf:weapon-fired',e=>{const who=e.detail?.operative||operative();fire.className='zf32-fire '+who;if(!reduce()){void fire.offsetWidth;fire.classList.add('show');}clearTimeout(shotTimer);shotTimer=setTimeout(()=>fire.classList.remove('show'),180);});
 window.addEventListener('zf:combat-finished',()=>{reloadStart=null;reload.hidden=true;weapon.hidden=true;fire.classList.remove('show');paint();});
 // Prevent stuck visual pressed states after a touch is interrupted, without intercepting gameplay input.
 for(const id of ['fireButton','reloadButton','skillButton','zf27SupportSkill','zf27CommandSkill','coverButton']){const btn=$(id);if(!btn)continue;for(const event of ['pointercancel','lostpointercapture','touchcancel','blur'])btn.addEventListener(event,()=>{btn.classList.remove('zf30-pressed','zf31-down');},{passive:true});}
 window.addEventListener('blur',()=>{for(const btn of document.querySelectorAll('.zf30-pressed,.zf31-down'))btn.classList.remove('zf30-pressed','zf31-down');});
 paint();
})();
