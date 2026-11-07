/* ZERO FRONTIER v28: skill feedback only. Core combat balance unchanged. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const stage=$('battleStage'),notice=$('zf28SkillNotice'),buttons=[['skillButton','skillStatus'],['zf27SupportSkill','zf27SupportStatus'],['zf27CommandSkill','zf27CommandStatus']];
 if(!stage||!notice)return;
 const labels={medic:'의무관 응급처치 · 회복',precision:'정밀 조준 · 집중',rapid:'신속 재장전 · 가속',command:'돌격 통솔 · 지휘',guard:'방호 태세 · 방어'};
 let clearNotice=0;
 const durations={};
 window.addEventListener('zf:skill-used',e=>{
  const d=e.detail||{},key=d.skill;if(!Object.hasOwn(labels,key))return;
  stage.dataset.zf28Skill=key;
  stage.classList.remove('zf28-skill-burst');void stage.offsetWidth;stage.classList.add('zf28-skill-burst');
  notice.textContent=labels[key];notice.hidden=false;
  clearTimeout(clearNotice);clearNotice=setTimeout(()=>{notice.hidden=true;stage.classList.remove('zf28-skill-burst');},1250);
  if(d.duration>0)durations[key]=performance.now()+d.duration*1000;
 });
 // Read the actual combat skill status; do not introduce a second gameplay clock.
 function paint(){
  for(const [id,statusId] of buttons){
   const btn=$(id),status=$(statusId);if(!btn||!status)continue;
   const t=status.textContent||'',m=t.match(/(?:대기|ACTIVE)\s*(\d+)s?/i);
   const seconds=m?Number(m[1]):0;
   btn.style.setProperty('--zf28-cooldown',seconds>0?String(Math.min(100,seconds/(id==='zf27CommandSkill'?26:id==='zf27SupportSkill'?24:17)*100))+'%':'0%');
   btn.classList.toggle('zf28-on-cooldown',/대기/.test(t));btn.classList.toggle('zf28-active',/ACTIVE/.test(t));
   btn.setAttribute('aria-description',t.trim());
  }
  const reload=$('battleNotice')?.textContent.includes('재장전 중');stage.classList.toggle('zf28-reload-visual',!!reload);
 }
 const watch=new MutationObserver(paint);
 for(const [,id] of buttons){const node=$(id);if(node)watch.observe(node,{subtree:true,childList:true,characterData:true});}
 const battleNotice=$('battleNotice');if(battleNotice)watch.observe(battleNotice,{subtree:true,childList:true,characterData:true});
 window.addEventListener('zf:combat-finished',()=>{notice.hidden=true;stage.removeAttribute('data-zf28-skill');});
 paint();
})();
