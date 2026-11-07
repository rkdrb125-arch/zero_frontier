/* ZERO FRONTIER v30: presentation-only overlay. Combat.js remains authoritative. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),stage=$('battleStage');if(!stage)return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const defs={precision:['정밀 조준',15],guard:['방호 태세',17],medic:['응급처치',24],rapid:['신속 재장전',22],command:['돌격 통솔',26]};
 const slots=[['skillButton','skillStatus','main'],['zf27SupportSkill','zf27SupportStatus','support'],['zf27CommandSkill','zf27CommandStatus','command']];
 const overlay=document.createElement('div');overlay.id='zf30Overlay';overlay.className='zf30-overlay';overlay.setAttribute('aria-label','전술 상태');overlay.innerHTML='<div class="zf30-active" id="zf30Active" aria-live="off"></div><div class="zf30-swap" id="zf30Swap" aria-live="polite"></div><div class="zf30-hit" id="zf30Hit" aria-hidden="true"></div>';
 stage.append(overlay);
 const activeEl=$('zf30Active'),swapEl=$('zf30Swap'),hitEl=$('zf30Hit');
 let current='miguel',active=new Map(),shotTimeout=0,swapTimeout=0,burstTimeout=0;
 const who=()=> $('danielSwitch')?.classList.contains('active')?'daniel':$('miguelSwitch')?.classList.contains('active')?'miguel':current;
 const keyFor=type=>type==='main'?(who()==='miguel'?'precision':'guard'):type==='support'?(who()==='miguel'?'medic':'rapid'):'command';
 function paint(){
  let activeItems=[];
  for(const [btnId,statusId,type] of slots){
   const btn=$(btnId),status=$(statusId);if(!btn||!status)continue;
   const key=keyFor(type),[name,total]=defs[key],t=(status.textContent||'').trim();
   const match=t.match(/(\d+(?:\.\d+)?)\s*s/i),seconds=match?Number(match[1]):0;
   const cooldown=/대기/.test(t),buff=/ACTIVE/i.test(t);
   const fraction=cooldown?Math.max(0,Math.min(1,seconds/total)):0;
   btn.style.setProperty('--zf30-cooldown',`${(fraction*100).toFixed(1)}%`);
   btn.dataset.zf30State=cooldown?'cooldown':buff?'active':'ready';
   btn.setAttribute('aria-label',`${name}: ${t||'준비'}`);
   let label=btn.querySelector('.zf30-counter');if(!label){label=document.createElement('span');label.className='zf30-counter';label.setAttribute('aria-hidden','true');btn.append(label);}
   label.textContent=cooldown?`${Math.ceil(seconds)}s`:buff?`ON ${Math.ceil(seconds)}s`:'✓';
   if(buff)activeItems.push(`${name} ${Math.ceil(seconds)}s`);
  }
  activeEl.textContent=activeItems.join('  ·  ');
  activeEl.classList.toggle('zf30-visible',activeItems.length>0);
  const notice=$('battleNotice')?.textContent||'';
  stage.classList.toggle('zf30-reloading',notice.includes('재장전 중'));
 }
 const observer=new MutationObserver(paint);
 for(const [,status] of slots){const node=$(status);if(node)observer.observe(node,{childList:true,subtree:true,characterData:true});}
 if($('battleNotice'))observer.observe($('battleNotice'),{childList:true,subtree:true,characterData:true});
 window.addEventListener('zf:skill-used',e=>{
  const skill=e.detail?.skill;if(!defs[skill])return;
  stage.dataset.zf30Skill=skill;
  if(!reduced?.matches){stage.classList.remove('zf30-burst');void stage.offsetWidth;stage.classList.add('zf30-burst');}
  clearTimeout(burstTimeout);burstTimeout=setTimeout(()=>stage.classList.remove('zf30-burst'),750);
  paint();
 });
 window.addEventListener('zf:operative-switched',e=>{
  current=e.detail?.to||current;
  swapEl.textContent=current==='miguel'?'MIGUEL · DESERT EAGLE':'DANIEL · HK416 A5';
  swapEl.classList.remove('zf30-show');void swapEl.offsetWidth;swapEl.classList.add('zf30-show');
  stage.dataset.zf30Operative=current;
  clearTimeout(swapTimeout);swapTimeout=setTimeout(()=>swapEl.classList.remove('zf30-show'),1050);
  paint();
 });
 window.addEventListener('zf:weapon-fired',e=>{
  const operative=e.detail?.operative||who();
  hitEl.dataset.weapon=operative;
  hitEl.classList.remove('zf30-fire');void hitEl.offsetWidth;
  if(!reduced?.matches)hitEl.classList.add('zf30-fire');
  clearTimeout(shotTimeout);shotTimeout=setTimeout(()=>hitEl.classList.remove('zf30-fire'),220);
 });
 window.addEventListener('zf:combat-finished',()=>{active.clear();activeEl.textContent='';activeEl.classList.remove('zf30-visible');stage.classList.remove('zf30-reloading');paint();});
 for(const id of ['fireButton','reloadButton','skillButton','zf27SupportSkill','zf27CommandSkill']){
  const el=$(id);if(!el)continue;
  el.classList.add('zf30-touch');
  el.addEventListener('pointerdown',()=>el.classList.add('zf30-pressed'),{passive:true});
  for(const event of ['pointerup','pointercancel','pointerleave'])el.addEventListener(event,()=>el.classList.remove('zf30-pressed'),{passive:true});
 }
 paint();
})();