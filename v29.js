/* ZERO FRONTIER v29 - visual-only tactical feedback. No gameplay balance changes. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const stage=$('battleStage'),switchToast=$('zf29Switch'),shot=$('zf29Shot');
 if(!stage)return;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const defs={precision:{name:'정밀 조준',cooldown:15,duration:5},guard:{name:'방호 태세',cooldown:17,duration:5},medic:{name:'의무관 응급처치',cooldown:24,duration:0},rapid:{name:'신속 재장전',cooldown:22,duration:7},command:{name:'돌격 통솔',cooldown:26,duration:7}};
 const active=new Map(), cool=new Map();let switchTimer=0,shotTimer=0,clock=0,paused=false;
 const slots=[{btn:'skillButton',status:'skillStatus',kind:'main'},{btn:'zf27SupportSkill',status:'zf27SupportStatus',kind:'support'},{btn:'zf27CommandSkill',status:'zf27CommandStatus',kind:'command'}];
 function operative(){return $('miguelSwitch')?.classList.contains('active')?'miguel':$('danielSwitch')?.classList.contains('active')?'daniel':(($('skillButton')?.textContent||'').includes('정밀')?'miguel':'daniel');}
 function currentKey(kind){const who=operative();return kind==='main'?(who==='miguel'?'precision':'guard'):kind==='support'?(who==='miguel'?'medic':'rapid'):'command';}
 window.addEventListener('zf:skill-used',event=>{
  const d=event.detail||{},def=defs[d.skill];if(!def)return;
  const now=performance.now();cool.set(d.skill,{start:now,duration:(Number(d.cooldown)||def.cooldown)*1000});
  if(Number(d.duration)>0)active.set(d.skill,{start:now,duration:Number(d.duration)*1000});
  stage.classList.remove('zf29-'+d.skill);void stage.offsetWidth;stage.classList.add('zf29-'+d.skill);
  if(!reduced?.matches)stage.classList.add('zf29-ability-pulse');
  setTimeout(()=>stage.classList.remove('zf29-ability-pulse'),850);
 });
 window.addEventListener('zf:operative-switched',event=>{
  const who=event.detail?.to;if(!who)return;
  stage.dataset.zf29Operative=who;
  if(switchToast){switchToast.hidden=false;switchToast.textContent=who==='miguel'?'미겔 · DESERT EAGLE':'다니엘 · HK416 A5';}
  stage.classList.remove('zf29-swap');void stage.offsetWidth;stage.classList.add('zf29-swap');
  clearTimeout(switchTimer);switchTimer=setTimeout(()=>{if(switchToast)switchToast.hidden=true;stage.classList.remove('zf29-swap');},950);
 });
 window.addEventListener('zf:weapon-fired',event=>{
  const who=event.detail?.operative;if(!who)return;
  stage.dataset.zf29Shot=who;
  if(shot&&!reduced?.matches){shot.classList.remove('zf29-firing');void shot.offsetWidth;shot.classList.add('zf29-firing');}
  clearTimeout(shotTimer);shotTimer=setTimeout(()=>{shot?.classList.remove('zf29-firing');stage.removeAttribute('data-zf29-shot');},170);
 });
 function paint(){
  const now=performance.now();
  for(const item of slots){
   const btn=$(item.btn),status=$(item.status);if(!btn||!status)continue;
   const key=currentKey(item.kind),def=defs[key];
   const text=status.textContent||'';
   const match=text.match(/(?:대기|ACTIVE)\s*(\d+)s?/i);
   const displaySeconds=match?Number(match[1]):0;
   const isActive=/ACTIVE/i.test(text),waiting=/대기/.test(text);
   const cd=cool.get(key),elapsed=cd?now-cd.start:Infinity;
   // The game's own status is authoritative; animation is merely an estimate.
   const fraction=waiting?(cd&&elapsed<cd.duration?Math.max(0,1-elapsed/cd.duration):Math.min(1,displaySeconds/def.cooldown)):0;
   btn.style.setProperty('--zf29-cd',`${(fraction*100).toFixed(2)}%`);
   btn.dataset.zf29State=isActive?'active':waiting?'cooldown':'ready';
   btn.setAttribute('aria-label',`${def.name} · ${text.trim()||'상태 확인'}`);
   btn.title=`${def.name} · ${text.trim()}`;
  }
  for(const [key,value] of active){if(now-value.start>=value.duration){active.delete(key);stage.classList.remove('zf29-'+key);}}
  stage.classList.toggle('zf29-buff-precision',active.has('precision'));
  stage.classList.toggle('zf29-buff-guard',active.has('guard'));
  stage.classList.toggle('zf29-buff-rapid',active.has('rapid'));
  stage.classList.toggle('zf29-buff-command',active.has('command'));
 }
 // Status mutation observer updates on actual combat time, including pause; no parallel combat timer.
 const observer=new MutationObserver(paint);
 for(const item of slots){const el=$(item.status);if(el)observer.observe(el,{childList:true,characterData:true,subtree:true});}
 window.addEventListener('zf:combat-finished',()=>{active.clear();cool.clear();for(const key of Object.keys(defs))stage.classList.remove('zf29-'+key);paint();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
 paint();
})();
