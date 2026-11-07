/* ZERO FRONTIER v33: authoritative reload telemetry and low-cost overlay. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const old=stage.querySelector('.zf32-reload');if(old)old.hidden=true;
 const style=document.createElement('style');style.textContent=`
 #battleStage .zf32-reload{display:none!important}
 #battleStage .zf33-reload{position:absolute;left:50%;bottom:15%;transform:translateX(-50%);z-index:62;width:min(270px,72%);padding:9px 12px;border-radius:10px;background:#091a2eea;border:1px solid #9fd8ff;color:white;font:700 12px system-ui;text-align:center;pointer-events:none;contain:layout paint}
 #battleStage .zf33-reload[hidden]{display:none!important}
 #battleStage .zf33-track{height:6px;border-radius:6px;background:#ffffff30;overflow:hidden;margin-top:6px}
 #battleStage .zf33-fill{height:100%;width:100%;background:#89d8ff;transform:scaleX(0);transform-origin:left;will-change:transform}
 #battleStage .zf33-hit{position:absolute;inset:0;pointer-events:none;z-index:57;background:radial-gradient(circle,#f74a3a22,#ff363600 70%);opacity:0;transition:opacity .15s}
 #battleStage .zf33-hit.on{opacity:1}
 @media (hover:none),(pointer:coarse){#battleStage #fireButton,#battleStage #reloadButton,#battleStage #skillButton,#battleStage #zf27SupportSkill,#battleStage #zf27CommandSkill{touch-action:manipulation;min-height:48px;min-width:48px}}
 @media(prefers-reduced-motion:reduce){#battleStage .zf33-hit{transition:none}#battleStage .zf33-fill{will-change:auto}}
 `;document.head.append(style);
 const hud=document.createElement('div');hud.className='zf33-reload';hud.hidden=true;hud.setAttribute('role','status');hud.setAttribute('aria-label','재장전 진행률');hud.innerHTML='<span class="zf33-label">재장전</span><div class="zf33-track"><div class="zf33-fill"></div></div>';
 const hit=document.createElement('div');hit.className='zf33-hit';hit.setAttribute('aria-hidden','true');stage.append(hud,hit);
 const fill=hud.querySelector('.zf33-fill'),label=hud.querySelector('.zf33-label');let lastPercent=-1,lastTime=0,hitTimer=0;
 // Invoked by combat.js only while reloading; elapsed/duration come directly from its actual timing variables.
 window.ZF33ReloadObserver=({operative,elapsed,duration})=>{
  if(!duration||!Number.isFinite(elapsed))return;
  const pct=Math.max(0,Math.min(100,Math.floor(elapsed/duration*100)));
  if(pct===lastPercent)return;
  lastPercent=pct;hud.hidden=false;fill.style.transform=`scaleX(${pct/100})`;
  if(pct%5===0||performance.now()-lastTime>250){label.textContent=`${operative==='miguel'?'DESERT EAGLE':'HK416 A5'} · 재장전 ${pct}%`;lastTime=performance.now();}
 };
 function sync(){const notice=document.getElementById('battleNotice')?.textContent||'';const running=/재장전 중/.test(notice);if(!running){hud.hidden=true;lastPercent=-1;}}
 const notice=document.getElementById('battleNotice');if(notice)new MutationObserver(sync).observe(notice,{childList:true,characterData:true,subtree:true});
 window.addEventListener('zf:combat-finished',()=>{hud.hidden=true;lastPercent=-1;});
 window.addEventListener('zf:operative-switched',()=>{hud.hidden=true;lastPercent=-1;});
 // Existing game hit feedback remains authoritative; this only mirrors a visible feedback message.
 const feedback=document.getElementById('battleFeedback');if(feedback){new MutationObserver(()=>{if(feedback.hidden||!(/피격/.test(feedback.textContent||'')))return;hit.classList.add('on');clearTimeout(hitTimer);hitTimer=setTimeout(()=>hit.classList.remove('on'),160);}).observe(feedback,{childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});}
 // Release transient visual states on interrupted touch; do not consume pointer events.
 const controls=['fireButton','reloadButton','skillButton','zf27SupportSkill','zf27CommandSkill','coverButton'];
 function clear(){for(const id of controls){const b=document.getElementById(id);b?.classList.remove('zf30-pressed','zf31-down');}}
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 for(const id of controls){const b=document.getElementById(id);if(b){b.addEventListener('pointercancel',clear,{passive:true});b.addEventListener('lostpointercapture',clear,{passive:true});}}
})();
