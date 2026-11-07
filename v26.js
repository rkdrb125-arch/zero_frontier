/* ZERO FRONTIER v26 — visual-only weapon feedback; no combat logic changes */
'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const ammo=$('ammoText'),mag=$('zf26Magazine'),status=$('zf26WeaponStatus'),flash=$('zf26Muzzle'),shell=$('zf26Shell'),stage=$('battleStage');
 if(!ammo||!mag||!status||!stage)return;
 const guns={miguel:{name:'DESERT EAGLE',capacity:7,style:'precision',label:'대구경 권총 · 단발 타이밍 중심'},daniel:{name:'HK416 A5',capacity:18,style:'rifle',label:'돌격소총 · 지속 교전 중심'}};
 let who='miguel',lastCount=null,lastWho=null,animTimer=0,reloadStart=0,reloadTimer=0;
 function active(){return stage.getClientRects().length>0&&getComputedStyle(stage).display!=='none';}
 function current(){return $('danielSwitch')?.getAttribute('aria-pressed')==='true'?'daniel':'miguel';}
 function paint(){
  const nextWho=current(),g=guns[nextWho],match=/^(\d+)\s*\/\s*(\d+)/.exec(ammo.textContent.trim());if(!match)return;
  const count=Math.min(g.capacity,Math.max(0,Number(match[1]))),cap=Number(match[2]);
  if(nextWho!==lastWho){lastWho=nextWho;lastCount=count;reloadStart=0;stage.dataset.zf26Weapon=g.style;}
  if(count<lastCount&&active()){
   stage.classList.remove('zf26-shot');void stage.offsetWidth;stage.classList.add('zf26-shot');
   clearTimeout(animTimer);animTimer=setTimeout(()=>stage.classList.remove('zf26-shot'),210);
  }
  if(count>lastCount)reloadStart=0;
  lastCount=count;
  mag.replaceChildren();
  const fragments=document.createDocumentFragment();for(let i=0;i<cap&&i<30;i++){const cell=document.createElement('i');if(i<count)cell.className='loaded';fragments.appendChild(cell);}mag.appendChild(fragments);
  mag.setAttribute('aria-label',`${g.name} 잔탄 ${count}발 / ${cap}발`);
  const reloading=$('battleNotice')?.textContent.includes('재장전 중');
  status.textContent=`${g.name} · ${count}/${cap}발${reloading?' · 재장전 중':''}`;
  stage.classList.toggle('zf26-reloading',Boolean(reloading));
  if(reloading&&!reloadStart)reloadStart=performance.now();
  if(!reloading)reloadStart=0;
  const btn=$('reloadButton');if(btn){btn.setAttribute('aria-label',`${g.name} 재장전, 잔탄 ${count}발`);}
 }
 const observer=new MutationObserver(()=>{if(!document.hidden)paint();});observer.observe(ammo,{childList:true,characterData:true,subtree:true});
 const notice=$('battleNotice');if(notice)observer.observe(notice,{childList:true,characterData:true,subtree:true});
 ['miguelSwitch','danielSwitch'].forEach(id=>$(id)?.addEventListener('click',()=>queueMicrotask(paint)));
 const archive=$('zf26WeaponPreview');
 if(archive){
  const content={miguel:{name:'DESERT EAGLE',role:'정밀 단발',ammo:'7 / 7',reload:'1.3초',desc:'실제: 가스 작동식·회전 노리쇠의 대구경 권총. 게임: 단발 타이밍과 정밀 조준을 강조하는 무장. 구체 탄종은 확정하지 않음.',caution:'미겔의 데저트 이글 사용은 기존 설정. 탄창·재장전 수치는 게임 전용.'},daniel:{name:'HK416 A5',role:'연속 교전',ammo:'18 / 18',reload:'1.7초',desc:'실제: 5.56×45mm NATO 탄약과 쇼트 스트로크 피스톤 계열의 현대식 소총. 게임: 연속 교전 역할을 표현하며 실제 발사 속도나 탄창 용량을 재현하지 않음.',caution:'다니엘의 HK416 A5는 ZERO FRONTIER 전용 채택. 원작 공식 무장 아님.'}};
  function preview(w){const x=content[w];archive.innerHTML=`<div class="zf26-preview-card"><div class="zf26-preview-top"><strong>${x.name}</strong><span>${x.role}</span></div><div class="zf26-preview-metrics"><span>게임 탄창 <b>${x.ammo}</b></span><span>게임 재장전 <b>${x.reload}</b></span></div><p>${x.desc}</p><small>${x.caution}</small></div>`;}
  $('zf25Miguel')?.addEventListener('click',()=>preview('miguel'));
  $('zf25Daniel')?.addEventListener('click',()=>preview('daniel'));
  preview('miguel');
 }
 paint();
})();
