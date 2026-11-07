/* ZERO FRONTIER v31 — visual-only UI enhancements; combat.js authoritative. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),stage=$('battleStage');if(!stage)return;
 const reduce=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||$('reduceMotion')?.checked);
 const defs={precision:{name:'정밀 조준',cool:15},guard:{name:'방호 태세',cool:17},medic:{name:'의무관 응급처치',cool:24},rapid:{name:'신속 재장전',cool:22},command:{name:'돌격 통솔',cool:26}};
 const slots=[['skillButton','skillStatus','main'],['zf27SupportSkill','zf27SupportStatus','support'],['zf27CommandSkill','zf27CommandStatus','command']];
 const key=kind=>{const miguel=$('miguelSwitch')?.classList.contains('active');return kind==='main'?(miguel?'precision':'guard'):kind==='support'?(miguel?'medic':'rapid'):'command';};
 const layer=document.createElement('div');layer.id='zf31Layer';layer.className='zf31-layer';layer.setAttribute('aria-hidden','true');layer.innerHTML='<div class="zf31-flash"></div><div class="zf31-impact"></div><div class="zf31-swap"></div><div class="zf31-reload"><span></span></div>';
 stage.append(layer);
 const flash=layer.querySelector('.zf31-flash'),impact=layer.querySelector('.zf31-impact'),swap=layer.querySelector('.zf31-swap'),reload=layer.querySelector('.zf31-reload');
 let current='miguel',fireTimeout=0,swapTimeout=0,impactTimeout=0;
 function paint(){
  for(const [btnId,statusId,kind] of slots){const btn=$(btnId),status=$(statusId);if(!btn||!status)continue;
   const d=defs[key(kind)],t=(status.textContent||'').trim();
   const match=t.match(/(\d+(?:\.\d+)?)\s*s\b/i);const seconds=match?Number(match[1]):null;
   const waiting=/대기/.test(t),active=/ACTIVE/i.test(t);
   // Only display seconds that the combat HUD actually reports; never run an independent clock.
   let label=btn.querySelector('.zf31-time');if(!label){label=document.createElement('span');label.className='zf31-time';label.setAttribute('aria-hidden','true');btn.append(label);}
   label.textContent=seconds!==null&&(waiting||active)?`${seconds.toFixed(seconds<10?1:0)}s`:active?'ON':waiting?'…':'';
   btn.dataset.zf31State=waiting?'cooldown':active?'active':'ready';
   btn.setAttribute('aria-label',`${d.name} · ${t||'준비'}`);
   if(waiting&&seconds!==null)btn.style.setProperty('--zf31-progress',`${Math.max(0,Math.min(100,seconds/d.cool*100)).toFixed(2)}%`);
   else btn.style.setProperty('--zf31-progress','0%');
  }
  const notice=$('battleNotice')?.textContent||'';reload.classList.toggle('zf31-visible',/재장전 중/.test(notice));
 }
 const observer=new MutationObserver(paint);for(const [,id] of slots){const el=$(id);if(el)observer.observe(el,{childList:true,characterData:true,subtree:true});}
 if($('battleNotice'))observer.observe($('battleNotice'),{childList:true,characterData:true,subtree:true});
 const restart=(node,cls,timeout,setter)=>{node.classList.remove(cls);if(!reduce()){void node.offsetWidth;node.classList.add(cls);}clearTimeout(setter.value);setter.value=setTimeout(()=>node.classList.remove(cls),timeout);};
 const fireRef={value:0},swapRef={value:0},impactRef={value:0};
 window.addEventListener('zf:weapon-fired',e=>{const who=e.detail?.operative||current;flash.dataset.weapon=who;restart(flash,'zf31-firing',who==='miguel'?230:150,fireRef);});
 window.addEventListener('zf:operative-switched',e=>{current=e.detail?.to||current;swap.dataset.weapon=current;restart(swap,'zf31-changing',440,swapRef);paint();});
 // Only use genuine damage-related events when available; do not simulate hits or change health.
 for(const eventName of ['zf:target-hit','zf:enemy-hit','zf:player-hit'])window.addEventListener(eventName,e=>{impact.dataset.kind=eventName==='zf:player-hit'?'player':'enemy';restart(impact,'zf31-struck',280,impactRef);});
 window.addEventListener('zf:combat-finished',()=>{flash.classList.remove('zf31-firing');impact.classList.remove('zf31-struck');reload.classList.remove('zf31-visible');paint();});
 for(const id of ['fireButton','reloadButton','skillButton','zf27SupportSkill','zf27CommandSkill','coverButton','miguelSwitch','danielSwitch']){
  const btn=$(id);if(!btn)continue;btn.classList.add('zf31-touch');
  const reset=()=>btn.classList.remove('zf31-down');
  btn.addEventListener('pointerdown',()=>btn.classList.add('zf31-down'),{passive:true});
  for(const ev of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])btn.addEventListener(ev,reset,{passive:true});
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});paint();
})();
