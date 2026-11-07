
'use strict';
(() => {
const stage=document.getElementById('battleStage'),canvas=document.getElementById('battleCanvas'),ctx=canvas.getContext('2d');
const hpBar=document.getElementById('playerHealth'),hpText=document.getElementById('hpText'),enemyCount=document.getElementById('enemyCount'),ammoText=document.getElementById('ammoText'),notice=document.getElementById('battleNotice'),result=document.getElementById('battleResult');
const coverBtn=document.getElementById('coverButton'),fireBtn=document.getElementById('fireButton'),reloadBtn=document.getElementById('reloadButton');
const W=800,H=480;
const skillBtn=document.getElementById('skillButton'),skillStatus=document.getElementById('skillStatus'),comboStatus=document.getElementById('comboStatus');
const supportSkillBtn=document.getElementById('zf27SupportSkill'),supportSkillStatus=document.getElementById('zf27SupportStatus'),commandSkillBtn=document.getElementById('zf27CommandSkill'),commandSkillStatus=document.getElementById('zf27CommandStatus');
const extraSkills={medic:{name:'의무관 응급처치',cooldown:24},rapid:{name:'신속 재장전',cooldown:20,duration:7},command:{name:'돌격 통솔',cooldown:26,duration:7}};
let extraReady={medic:0,rapid:0,command:0},extraUntil={rapid:0,command:0};
function extraActive(key){return combatTime<extraUntil[key];}
function useExtraSkill(key){
 if(!active||ended||paused||!['medic','rapid','command'].includes(key)||combatTime<extraReady[key])return;
 if(key==='medic'){if(selected!=='miguel'||hp>=100)return;hp=Math.min(100,hp+20);showFeedback('의무관 · HP +20');}
 if(key==='rapid'){if(selected!=='daniel')return;extraUntil.rapid=combatTime+extraSkills.rapid.duration;showFeedback('신속 재장전 · 7초');}
 if(key==='command'){if(selected!=='daniel')return;extraUntil.command=combatTime+extraSkills.command.duration;comboUntil=Math.max(comboUntil,combatTime+6);comboShots=Math.max(comboShots,3);showFeedback('돌격 통솔 · 연계 강화');}
 extraReady[key]=combatTime+extraSkills[key].cooldown;window.dispatchEvent(new CustomEvent('zf:skill-used',{detail:{skill:key,operative:selected,duration:extraSkills[key].duration||0,cooldown:extraSkills[key].cooldown}}));window.ZFAudio?.play('hit',.22);update();
}
function extraStatus(key){const remain=Math.max(0,Math.ceil(extraReady[key]-combatTime));return extraActive(key)?'ACTIVE '+Math.ceil(extraUntil[key]-combatTime)+'s':remain?'대기 '+remain+'s':'READY';}
function updateExtraUI(){if(!supportSkillBtn||!commandSkillBtn)return;const mig=selected==='miguel',key=mig?'medic':'rapid';supportSkillBtn.firstChild.textContent=extraSkills[key].name+' ';supportSkillStatus.textContent=extraStatus(key)+' · E';supportSkillBtn.disabled=!active||ended||paused||combatTime<extraReady[key]||(mig&&hp>=100);commandSkillBtn.hidden=mig;commandSkillStatus.textContent=extraStatus('command')+' · T';commandSkillBtn.disabled=!active||ended||paused||combatTime<extraReady.command;}
supportSkillBtn?.addEventListener('click',()=>useExtraSkill(selected==='miguel'?'medic':'rapid'));commandSkillBtn?.addEventListener('click',()=>useExtraSkill('command'));

// Gameplay-only prototypes; neither skill is a canonical character ability.
const skillDefs={miguel:{name:'정밀 조준',duration:5,cooldown:15},daniel:{name:'방호 태세',duration:5,cooldown:17}}; // v14 gameplay-only balance
let skillUntil={miguel:0,daniel:0},skillReady={miguel:0,daniel:0},comboUntil=0,comboShots=0,combatTime=0,skillUiSecond=-1;
function skillActive(who){return combatTime<skillUntil[who];}
function activateSkill(){
 if(paused||!active||ended||reloading||combatTime<skillReady[selected])return;
 const def=skillDefs[selected];skillUntil[selected]=combatTime+def.duration;skillReady[selected]=combatTime+def.cooldown;
 window.dispatchEvent(new CustomEvent('zf:skill-used',{detail:{skill:selected==='miguel'?'precision':'guard',operative:selected,duration:def.duration,cooldown:def.cooldown}}));window.ZFAudio?.play('hit',.18);updateSkillUI();
}
function updateSkillUI(){
 const def=skillDefs[selected],remaining=Math.max(0,Math.ceil(skillReady[selected]-combatTime));
 skillBtn.disabled=!active||ended||reloading||remaining>0;
 skillBtn.firstChild.textContent=def.name+' ';
 skillStatus.textContent=skillActive(selected)?'ACTIVE '+Math.ceil(skillUntil[selected]-combatTime)+'s':remaining?'대기 '+remaining+'s':'READY · Q';
 comboStatus.textContent=comboShots>0&&combatTime<comboUntil?'전환 연계 '+comboShots+'발 · '+Math.ceil(comboUntil-combatTime)+'s':'전환 연계 준비';updateExtraUI();
}
skillBtn.addEventListener('click',activateSkill);

const miguelSwitch=document.getElementById('miguelSwitch'),danielSwitch=document.getElementById('danielSwitch');
const operatives={miguel:{label:'미겔 · DESERT EAGLE',capacity:7,reload:1300,damage:1},daniel:{label:'다니엘 · HK416 A5',capacity:18,reload:1700,damage:1}};
let fireTouchMode=false;
let selected='miguel',reserve={miguel:7,daniel:18},recoil=0,coverMotion=0,shells=[],reloadMotion=0,aimingBeforeReload=false,swapBlend=0,aimSmooth={x:400,y:200},fireHeld=false,firePointer=null,aimPointer=null,lastFire=0;
function selectOperative(who){
 if(paused||!active||ended||reloading||!operatives[who]||selected===who)return;
 const previousOperative=selected;reserve[selected]=ammo;selected=who;ammo=reserve[who];window.dispatchEvent(new CustomEvent("zf:operative-switched",{detail:{from:previousOperative,to:who}}));if(window.ZF34CombatEvent)window.ZF34CombatEvent('switch',{from:previousOperative,to:who});comboUntil=combatTime+(extraActive('command')?6:4);comboShots=extraActive('command')?3:2;
 miguelSwitch.classList.toggle('zf-squad-active',who==='miguel');danielSwitch.classList.toggle('zf-squad-active',who==='daniel');
 miguelSwitch.setAttribute('aria-pressed',String(who==='miguel'));danielSwitch.setAttribute('aria-pressed',String(who==='daniel'));
 recoil=0;swapBlend=1;update();updateSkillUI();
}
miguelSwitch.addEventListener('click',()=>selectOperative('miguel'));
danielSwitch.addEventListener('click',()=>selectOperative('daniel'));

let missionDifficulty="normal",missionDamageMultiplier=1,missionEnemyHealth=1,missionStartAt=0;
function difficultySettings(){return window.ZFV15?.get?.()||{difficulty:"normal",aimSensitivity:1,fireMode:"hold"};}
let paused=false,pausedAt=0,diagnosticFrames=0,diagnosticSeconds=0,diagnosticFPS=0;
let combatHits=0,combatShots=0,combatDamageTaken=0,combatBossWarnings=0,combatInputFaults=0;
const feedback=document.getElementById('zfCombatFeedback');let feedbackTimeout=0;
function showFeedback(message){if(!feedback)return;feedback.textContent=message;feedback.hidden=false;feedbackTimeout=combatTime+1.1;}
function takeDamage(raw){const value=Math.max(1,Math.ceil(raw*missionDamageMultiplier*(skillActive('daniel')&&selected==='daniel'?.5:1)));hp=Math.max(0,hp-value);combatDamageTaken+=value;damageFlash=1;if(window.ZF34CombatEvent)window.ZF34CombatEvent('damage',{operative:selected,amount:value});window.ZFAudio?.play('enemy',.22);showFeedback('피격 −'+value+' HP');if(hp<=0){finish(false);return true;}update();return false;}
let active=false,ended=false,aiming=false,covered=true,reloading=false,ammo=7,hp=100,shotFlash=0,damageFlash=0,shake=0,aim={x:400,y:200},last=0,frame=0,enemyTimer=0,spawnTime=0,raf=0;
let enemies=[];
// v11: visual-only combat feedback, never persisted to existing save keys.
let impactParticles=[],bossImpactPulse=0,warningPulse=0,animationClock=0;
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
function burst(x,y,color,count=9){if(reducedMotion())return;for(let i=0;i<count;i++){const a=Math.PI*2*i/count+Math.random()*.35,v=35+Math.random()*100;impactParticles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.42+Math.random()*.22,max:.64,color});}if(impactParticles.length>95)impactParticles.splice(0,impactParticles.length-95);}
function warningDuration(){return bossPattern===3?.85:1.3;}

// v9 stage progression: separate key; existing settings and sound keys remain untouched.
const stageKey='zero_frontier_v9_progress';
const recoveryKey='zero_frontier_v13_recovery';
const stages=[{name:'외곽 경계',waves:2,reward:100},{name:'사막 전초',waves:3,reward:160},{name:'수복 방어선',waves:3,reward:240}];
let stageIndex=0,waveIndex=0,stageScore=0,waveTransition=0,boss=null,bossPhase=1,bossAttackClock=0,bossWarning=0,bossPattern=0,bossStrike=0,stageProgress={unlocked:1,cleared:[],credits:0,best:{}};
try{const saved=JSON.parse(localStorage.getItem(stageKey)||'null');if(saved&&typeof saved==='object'){
 stageProgress.unlocked=Math.max(1,Math.min(stages.length,Number(saved.unlocked)||1));
 stageProgress.cleared=Array.isArray(saved.cleared)?saved.cleared.filter(v=>Number.isInteger(v)&&v>=0&&v<stages.length):[];
 stageProgress.credits=Math.max(0,Math.floor(Number(saved.credits)||0));
 stageProgress.best=saved.best&&typeof saved.best==='object'?saved.best:{};
}}catch(e){try{const recovery=JSON.parse(localStorage.getItem(recoveryKey)||'null');if(recovery)stageProgress=safeProgress(recovery);}catch(_){document.getElementById('stageSaveStatus').textContent='저장 데이터를 읽지 못했습니다. 백업 파일로 복원할 수 있습니다.';}}
// v12: opt-in portable progress backup; existing localStorage keys remain unchanged.
const restoreStatus=document.getElementById('zfRestoreStatus');
function safeProgress(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('진행도 형식이 올바르지 않습니다.');
 const unlocked=Number(value.unlocked),credits=Number(value.credits);
 if(!Number.isInteger(unlocked)||unlocked<1||unlocked>stages.length||!Number.isSafeInteger(credits)||credits<0||credits>1000000000)throw Error('해금 정보 또는 보상 값이 올바르지 않습니다.');
 if(!Array.isArray(value.cleared)||value.cleared.some(x=>!Number.isInteger(x)||x<0||x>=stages.length))throw Error('클리어 목록이 올바르지 않습니다.');
 if(!value.best||typeof value.best!=='object'||Array.isArray(value.best))throw Error('최고 점수 기록이 올바르지 않습니다.');
 const best={};for(const [k,v] of Object.entries(value.best)){if(!/^[0-2]$/.test(k)||!Number.isSafeInteger(v)||v<0||v>1000000000)throw Error('점수 기록이 올바르지 않습니다.');best[k]=v;}
 return {unlocked,credits,cleared:[...new Set(value.cleared)],best};
}
document.getElementById('zfExport').addEventListener('click',()=>{
 try{const data=JSON.stringify({format:'zero-frontier-stage-backup',version:1,progress:safeProgress(stageProgress)},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero_frontier_progress_backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);restoreStatus.textContent='백업 파일 다운로드를 요청했습니다.';}catch(e){restoreStatus.textContent='백업 실패: '+e.message;}
});
document.getElementById('zfImport').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{if(file.size>100000)throw Error('백업 파일이 너무 큽니다.');const data=JSON.parse(await file.text());if(data.format!=='zero-frontier-stage-backup'||data.version!==1)throw Error('ZERO FRONTIER 백업 파일이 아닙니다.');const parsed=safeProgress(data.progress);
 if(!confirm('현재 스테이지 진행도를 백업 내용으로 교체하시겠습니까?'))return;
 localStorage.setItem(stageKey,JSON.stringify(parsed));localStorage.setItem(recoveryKey,JSON.stringify(parsed));stageProgress=parsed;stageIndex=0;reset();restoreStatus.textContent='진행도를 복원했습니다. 스테이지 목록을 확인하세요.';
 }catch(err){restoreStatus.textContent='복원 실패: '+(err instanceof Error?err.message:'파일을 읽을 수 없습니다.');}finally{e.target.value='';}
});
const warningBanner=document.getElementById('zfWarningBanner'),warningFill=document.getElementById('zfWarningFill');
let lastWarningDisplay='';
function updateWarningUX(){
 const activeWarning=!!(boss&&boss.hp>0&&bossWarning>0&&!ended);
 warningBanner.hidden=!activeWarning;
 warningFill.style.width=activeWarning?(100*bossWarning/warningDuration()).toFixed(1)+'%':'0%';
 const label=activeWarning?(['','정면 충격','광역 충격','연속 충격'][bossPattern]+' · '+bossWarning.toFixed(1)+'초 후 공격 · 엄폐!'):'';
 if(label!==lastWarningDisplay){warningBanner.textContent=label;lastWarningDisplay=label;}
 warningBanner.classList.toggle('urgent',activeWarning&&bossWarning<.45);
}
const stageCards=document.getElementById('stageCards'),stageCredits=document.getElementById('stageCredits'),stageTitle=document.getElementById('stageTitle'),waveText=document.getElementById('waveText'),stageScoreText=document.getElementById('stageScore'),nextStageBtn=document.getElementById('nextStageBattle');
function saveStage(){try{const valid=safeProgress(stageProgress);localStorage.setItem(recoveryKey,JSON.stringify(valid));localStorage.setItem(stageKey,JSON.stringify(valid));document.getElementById('stageSaveStatus').textContent='진행도 저장 완료 · 이 브라우저에만 보관';}catch(e){document.getElementById('stageSaveStatus').textContent='저장할 수 없습니다. 브라우저 저장 공간을 확인하세요.';}}
function renderStages(){stageCredits.textContent='보급 포인트 '+stageProgress.credits;stageCards.replaceChildren();stages.forEach((stage,i)=>{
 const btn=document.createElement('button');btn.type='button';btn.disabled=i>=stageProgress.unlocked;
 btn.className='zf-stage-card'+(i===stageIndex?' selected':'');
 btn.textContent=`${String(i+1).padStart(2,'0')} · ${stage.name} | ${stage.waves}웨이브 | ${stageProgress.cleared.includes(i)?'완료':i>=stageProgress.unlocked?'잠김':'출격 가능'}`;
 btn.addEventListener('click',()=>{stageIndex=i;reset();renderStages();});stageCards.append(btn);
});}
function updateWaveHud(){stageTitle.textContent=`STAGE ${String(stageIndex+1).padStart(2,'0')} · ${stages[stageIndex].name}`;waveText.textContent=`WAVE ${waveIndex+1} / ${stages[stageIndex].waves}`;stageScoreText.textContent='점수 '+stageScore;}
function spawnWave(){
 const scale=stageIndex+waveIndex;
 const finalBoss=stageIndex===2&&waveIndex===stages[stageIndex].waves-1;
 boss=finalBoss?{x:405,y:160,r:57,hp:Math.ceil(65*missionEnemyHealth),max:Math.ceil(65*missionEnemyHealth),hit:0,stun:0}:null;
 bossPhase=1;bossAttackClock=0;bossWarning=0;bossPattern=0;bossStrike=0;bossImpactPulse=0;warningPulse=0;
 enemies=finalBoss?[]:[makeEnemy(245,168,28,3+scale,0,0),makeEnemy(520,190,32,5+scale,1.8,1),makeEnemy(397,127,23,4+scale,3.1,2)];
 waveTransition=0;updateWaveHud();update();updateBossHUD();
}
function updateBossHUD(){
 const hud=document.getElementById('zfBossHud');if(!hud)return;
 hud.hidden=!boss||boss.hp<=0;
 if(!boss)return;
 document.getElementById('zfBossFill').style.width=(100*Math.max(0,boss.hp)/boss.max)+'%';
 document.getElementById('zfBossHP').textContent=`${Math.max(0,Math.ceil(boss.hp))} / ${boss.max}`;
 document.getElementById('zfBossPhase').textContent=`PHASE ${bossPhase} / 3`;
 document.getElementById('zfBossWarning').textContent=bossWarning>0?['','정면 충격 예고 · 엄폐!','광역 충격 예고 · 엄폐!','연속 충격 예고 · 엄폐!'][bossPattern]: '공격 대기';
}
function advanceBoss(dt){
 if(!boss||boss.hp<=0||ended)return;
 const next=boss.hp/boss.max<=.33?3:boss.hp/boss.max<=.67?2:1;
 if(next!==bossPhase){bossPhase=next;bossImpactPulse=.65;burst(boss.x,boss.y,'#cf8cff',24);bossAttackClock=0;bossWarning=0;bossStrike=0;updateBossHUD();}
 boss.x=405+Math.sin(combatTime*.8)*Math.min(35,bossPhase*12);
 if(bossWarning>0){bossWarning=Math.max(0,bossWarning-dt);if(bossWarning===0){
  burst(boss.x,boss.y,'#ff896f',16);if(!covered){const damage=(bossPattern===1?16:bossPattern===2?22:11);if(takeDamage(damage))return;}else{showFeedback('보스 공격 방어 성공');}
  if(bossPattern===3&&bossStrike<2){bossStrike++;bossWarning=.72;warningPulse=1;}else{bossStrike=0;bossAttackClock=0;}
  update();updateBossHUD();
 }return;}
 bossAttackClock+=dt;
 if(bossAttackClock>Math.max(1.2,3.6-bossPhase*.55)){
  bossPattern=bossPhase===1?1:bossPhase===2?2:3;
  bossWarning=warningDuration();combatBossWarnings++;warningPulse=1;bossAttackClock=0;updateBossHUD();
 }
}

function waveCleared(){stageScore+=100+stageIndex*50+waveIndex*25;updateWaveHud();if(waveIndex+1>=stages[stageIndex].waves){finish(true);return;}waveTransition=1.4;covered=true;aiming=false;fireHeld=false;notice.textContent='웨이브 완료 · 다음 적 출현 준비';update();}

// Prototype combat archetypes only; these are not canonical Zero classifications.
const enemyArchetypes=[
 {kind:'scout',name:'기동형',speed:32,interval:2.9,damage:9,color:'#628b91'},
 {kind:'brute',name:'중장형',speed:13,interval:4.2,damage:18,color:'#78818d'},
 {kind:'ranger',name:'원거리형',speed:20,interval:3.4,damage:12,color:'#8b7775'}
];
function makeEnemy(x,y,r,max,phase,index){
 max=Math.max(1,Math.ceil(max*missionEnemyHealth));
 const type=enemyArchetypes[index];return {x,y,originX:x,originY:y,r,hp:max,max,phase,kind:type.kind,name:type.name,speed:type.speed,interval:type.interval,damage:type.damage,color:type.color,attackClock:0.6+index*.7,telegraph:0,hit:0,stun:0,dir:index%2?-1:1,attackCount:0};
}
function enemyY(e){return e.y+Math.sin(frame*.0017+e.phase)*7;}
function advanceEnemyAI(dt){
 let changed=false;
 for(const e of enemies){
  if(e.hp<=0)continue;
  if(e.hit>0||e.stun>0){e.stun=Math.max(0,e.stun-dt);continue;}
  if(e.telegraph>0){
   e.telegraph-=dt;
   if(e.telegraph<=0){
    e.telegraph=0;e.attackCount++;
    if(!covered&&!ended){changed=true;if(takeDamage(e.damage))break;}else if(covered){showFeedback('엄폐 성공');}
   }
   continue;
  }
  // Movement is constrained to the original target lanes so enemies cannot leave the arena.
  const span=e.kind==='scout'?95:e.kind==='brute'?42:66;
  e.x+=e.dir*e.speed*dt;
  if(e.x>Math.min(W-e.r-18,e.originX+span)){e.x=Math.min(W-e.r-18,e.originX+span);e.dir=-1;}
  if(e.x<Math.max(e.r+18,e.originX-span)){e.x=Math.max(e.r+18,e.originX-span);e.dir=1;}
  e.attackClock+=dt;
  if(e.attackClock>=e.interval){e.attackClock=0;e.telegraph=e.kind==='brute'?1.15:.9;}
 }
 if(changed)update();
}

const pauseBtn=document.getElementById('zfPauseButton'),pauseLayer=document.getElementById('zfPauseLayer'),resumeBtn=document.getElementById('zfResumeButton'),diagText=document.getElementById('zfDiagnostics'),diagToggle=document.getElementById('zfDiagToggle');
function releaseInputs(){
 fireHeld=false;fireTouchMode=false;
 for(const [el,id] of [[fireBtn,firePointer],[canvas,aimPointer]]){
  if(id!==null){try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch(_){combatInputFaults++;}}
 }
 firePointer=null;aimPointer=null;aimPointerType=null;heldKeys.clear();
 window.ZF38InputReset?.({reason:'release-inputs'});window.ZF39InputState?.({kind:'reset',reason:'release-inputs'});window.ZF40InputState?.({kind:'reset',reason:'release-inputs'});
}
function syncPauseUI(){pauseLayer.hidden=!paused;pauseBtn.textContent=paused?'▶ 재개':'Ⅱ 일시정지';pauseBtn.setAttribute('aria-pressed',String(paused));}
function pauseCombat(){if(!active||ended||paused)return;paused=true;pausedAt=performance.now();if(reloading)window.ZF37ReloadState?.({state:'pause',operative:selected});window.ZF39CombatState?.({kind:'pause',combatTime,reloading,selected});if(window.ZF34CombatEvent)window.ZF34CombatEvent('pause',{reloading,combatTime});releaseInputs();window.ZFAudio?.setAmbient(false);syncPauseUI();if(reloading)window.ZF40ReloadState?.({kind:'pause',operative:selected,elapsed:Math.max(0,pausedAt-reloadStarted)});window.ZF38PauseState?.({paused:true,combatTime,reloading});}
function resumeCombat(){if(!paused)return;const now=performance.now();if(reloading)reloadStarted+=now-pausedAt;last=now;paused=false;if(reloading)window.ZF37ReloadState?.({state:'resume',operative:selected});window.ZF39CombatState?.({kind:'resume',combatTime,reloading,selected});if(window.ZF34CombatEvent)window.ZF34CombatEvent('resume',{reloading,combatTime});window.ZFAudio?.setAmbient(true);syncPauseUI();if(reloading)window.ZF40ReloadState?.({kind:'resume',operative:selected,elapsed:Math.max(0,now-reloadStarted)});update();window.ZF38PauseState?.({paused:false,combatTime,reloading});}
function togglePause(){if(paused)resumeCombat();else pauseCombat();}
pauseBtn.addEventListener('click',togglePause);resumeBtn.addEventListener('click',resumeCombat);
function updateDiagnostics(){if(!diagToggle.checked)return;diagText.textContent=`FPS ${diagnosticFPS} · 캔버스 ${canvas.width}×${canvas.height} · 파티클 ${impactParticles.length} · 적 ${enemies.filter(e=>e.hp>0).length} · 명중 ${combatHits}/${combatShots} · 받은 피해 ${combatDamageTaken} · 보스 경고 ${combatBossWarnings} · 입력 오류 ${combatInputFaults} · ${paused?'일시정지':'진행 중'}`;}
diagToggle.addEventListener('change',()=>{diagText.hidden=!diagToggle.checked;updateDiagnostics();});
function reset(){
 paused=false;syncPauseUI();active=true;ended=false;combatTime=0;combatHits=0;combatShots=0;combatDamageTaken=0;combatBossWarnings=0;combatInputFaults=0;if(feedback)feedback.hidden=true;skillUntil={miguel:0,daniel:0};skillReady={miguel:0,daniel:0};extraReady={medic:0,rapid:0,command:0};extraUntil={rapid:0,command:0};comboUntil=0;comboShots=0;skillUiSecond=-1;aiming=false;covered=true;reloading=false;selected='miguel';reserve={miguel:7,daniel:18};ammo=7;recoil=0;coverMotion=0;reloadMotion=0;shells=[];impactParticles=[];bossImpactPulse=0;warningPulse=0;swapBlend=0;aimSmooth={x:400,y:200};lastFire=0;fireHeld=false;firePointer=null;aimPointer=null;hp=100;shotFlash=0;damageFlash=0;shake=0;enemyTimer=0;spawnTime=0;aim={x:400,y:200};
 const difficulty=difficultySettings().difficulty;missionDifficulty=difficulty;missionDamageMultiplier=difficulty==='easy'?.7:difficulty==='hard'?1.3:1;missionEnemyHealth=difficulty==='easy'?.8:difficulty==='hard'?1.25:1;missionStartAt=performance.now();
 waveIndex=0;stageScore=0;waveTransition=0;boss=null;spawnWave();
 result.hidden=true;nextStageBtn.hidden=true;renderStages();updateWarningUX();miguelSwitch.classList.add('zf-squad-active');danielSwitch.classList.remove('zf-squad-active');miguelSwitch.setAttribute('aria-pressed','true');danielSwitch.setAttribute('aria-pressed','false');window.ZFAudio?.setAmbient(true);update();updateSkillUI();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function update(){
 if(paused)return;
 hpBar.style.width=hp+'%';hpText.textContent='HP '+hp+' / 100';
 ammoText.textContent=ammo+' / '+operatives[selected].capacity;document.querySelector('.battle-hud small').textContent=operatives[selected].label;enemyCount.textContent=boss&&boss.hp>0?'BOSS':enemies.filter(e=>e.hp>0).length+' / '+enemies.length;
 coverBtn.classList.toggle('active',!covered);coverBtn.setAttribute('aria-pressed',String(!covered));
 coverBtn.textContent=covered?'엄폐 해제 / 조준':'엄폐하기';
 updateSkillUI();notice.textContent=ended?'작전 종료':reloading?'재장전 중…':covered?'엄폐 중 · 조준 후 사격하세요':'노출 중 · 적 공격에 주의!';
}
function setCover(value){if(!active||ended||paused)return;covered=value;aiming=!value;update();}
function reload(){if(!active||ended||paused||reloading||ammo===operatives[selected].capacity)return;reloading=true;reloadMotion=1;window.ZF37ReloadState?.({state:'start',operative:selected});window.ZF39CombatState?.({kind:'reload-start',combatTime,selected});if(window.ZF34CombatEvent)window.ZF34CombatEvent('reload-start',{operative:selected});window.ZFAudio?.play('reload',.3);update();const started=performance.now();reloadStarted=started;window.ZF40ReloadState?.({kind:'start',operative:selected,elapsed:0});}
let reloadStarted=0;
function shoot(){
 if(paused||!active||ended||covered||reloading||waveTransition>0)return;
 const now=performance.now();if(now-lastFire<260)return;lastFire=now;
 if(ammo<=0){window.ZFAudio?.play('empty',.4);reload();return;}
 ammo--;combatShots++;window.dispatchEvent(new CustomEvent("zf:weapon-fired",{detail:{operative:selected,remaining:ammo}}));if(window.ZF34CombatEvent)window.ZF34CombatEvent('shot',{operative:selected,remaining:ammo});reserve[selected]=ammo;shotFlash=.15;shake=6;recoil=selected==='miguel'?1:.42;shells.push({x:selected==='miguel'?335:350,y:covered?335:280,vx:140+Math.random()*55,vy:-170-Math.random()*70,life:1});window.ZFAudio?.play('shot',.65);window.setTimeout(()=>window.ZFAudio?.play('shell',.22),130);
 // Hit testing uses logical coordinates matching canvas rendering, independent of CSS size.
 const hit=enemies.filter(e=>e.hp>0&&Math.hypot(aim.x-e.x,aim.y-enemyY(e))<e.r+8).sort((a,b)=>Math.hypot(aim.x-a.x,aim.y-a.y)-Math.hypot(aim.x-b.x,aim.y-b.y))[0];
 if(boss&&boss.hp>0&&Math.hypot(aim.x-boss.x,aim.y-boss.y)<boss.r+9){
  const combo=comboShots>0&&combatTime<comboUntil;
  boss.hp=Math.max(0,boss.hp-operatives[selected].damage-(selected==='miguel'&&skillActive('miguel')?1:0)-(combo?1:0));
  combatHits++;showFeedback('보스 명중');if(combo)comboShots--;boss.hit=.32;bossImpactPulse=.32;burst(boss.x,boss.y,'#e5b8ff',13);window.ZFAudio?.play('hit',.5);updateBossHUD();
  if(boss.hp<=0){stageScore+=500;waveCleared();}update();return;
 }
 if(hit){combatHits++;showFeedback('명중 · '+hit.name);window.ZFAudio?.play('hit',.5);const combo=comboShots>0&&combatTime<comboUntil;hit.hp-=operatives[selected].damage+(selected==='miguel'&&skillActive('miguel')?1:0)+(combo?1:0);if(combo)comboShots--;hit.hit=.25;burst(hit.x,enemyY(hit),'#f4c89b',8);hit.stun=.35;hit.telegraph=0;if(hit.hp<=0&&enemies.every(e=>e.hp<=0)){waveCleared();}}
 update();
}
function finish(won){
 paused=false;syncPauseUI();ended=true;active=false;paused=false;syncPauseUI();window.ZF39CombatState?.({kind:'combat-end',combatTime,selected,reloading});if(reloading){window.ZF37ReloadState?.({state:'cancel',operative:selected});window.ZF40ReloadState?.({kind:'cancel',operative:selected});}releaseInputs();fireHeld=false;window.ZFAudio?.setAmbient(false);window.ZFAudio?.play(won?'victory':'defeat',.45);covered=true;aiming=false;reloading=false;
 let reward=0;
 if(won){const first=!stageProgress.cleared.includes(stageIndex);if(first){stageProgress.cleared.push(stageIndex);reward=stages[stageIndex].reward;stageProgress.credits+=reward;}
 stageProgress.unlocked=Math.max(stageProgress.unlocked,Math.min(stages.length,stageIndex+2));
 stageProgress.best[stageIndex]=Math.max(Number(stageProgress.best[stageIndex])||0,stageScore);saveStage();}
 try{window.dispatchEvent(new CustomEvent('zf:combat-finished',{detail:{stage:stageIndex,difficulty:missionDifficulty,won,shots:combatShots,hits:combatHits,damage:combatDamageTaken,seconds:Math.floor(combatTime),score:stageScore,date:new Date().toISOString()}}));}catch(_){}
 document.getElementById('resultTitle').textContent=won?'STAGE CLEAR':'MISSION FAILED';
 const accuracy=combatShots?Math.round(combatHits/combatShots*100):0;const elapsed=Math.floor(combatTime);document.getElementById('zfResultStats').textContent=`난이도 ${ {easy:'쉬움',normal:'보통',hard:'어려움'}[missionDifficulty]} · 전투 시간 ${Math.floor(elapsed/60)}분 ${elapsed%60}초 · 명중률 ${accuracy}% (${combatHits}/${combatShots}) · 받은 피해 ${combatDamageTaken} · 점수 ${stageScore}`;
 document.getElementById('resultText').textContent=won?`모든 웨이브 완료 · 점수 ${stageScore} · 최초 클리어 보상 +${reward} 포인트`:`WAVE ${waveIndex+1}에서 작전 실패 · 점수 ${stageScore} · 재도전 가능`;
 nextStageBtn.hidden=!won||stageIndex>=stages.length-1;boss=null;updateBossHUD();result.hidden=false;renderStages();update();
}
function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawOperative(c,who,isCovered,kick,reload,transition,t){
 const mig=who==='miguel',p=1-transition;
 // Miguel is compact, Daniel noticeably taller and broad-shouldered.
 const sc=mig?.78:1.18,baseY= 399+transition*37+(reducedMotion()?0:Math.sin(animationClock*2.4)*(.9+recoil*1.2));
 const look=Math.max(-1,Math.min(1,(aimSmooth.x-400)/350));
 c.save();c.translate(mig?270:275,baseY+kick*8+swapBlend*8);c.scale(sc*(1-swapBlend*.06),sc*(1-swapBlend*.06));
 const crouch=transition;const torsoTop=-102+crouch*35;
 const sway=(reducedMotion()?0:Math.sin(animationClock*1.8)*1.8)*(1-crouch);
 // Boots and trousers, both legs bend as operative crouches.
 c.lineCap='round';c.strokeStyle='#17262b';c.lineWidth=mig?22:26;
 c.beginPath();c.moveTo(-20,8);c.lineTo(-29,64-crouch*15);c.moveTo(20,8);c.lineTo(27,64-crouch*15);c.stroke();
 c.fillStyle='#23363d';c.fillRect(-42,52-crouch*15,30,13);c.fillRect(12,52-crouch*15,32,13);
 // Torso rotates independently from planted legs.
 c.save();c.translate(0,torsoTop+48);c.transform(1,0,look*.16+kick*.035,1,look*8+sway-kick*3,0);c.translate(0,-torsoTop-48);
 // torso / armor vest with a character-specific profile
 c.fillStyle=mig?'#3c5558':'#45545d';c.beginPath();c.moveTo(-37,torsoTop+10);c.lineTo(37,torsoTop+10);c.lineTo(43,15);c.lineTo(-42,15);c.closePath();c.fill();
 c.fillStyle=mig?'#20383c':'#293a45';c.beginPath();c.roundRect(-26,torsoTop+24,52,55,8);c.fill();
 c.strokeStyle=mig?'#a5c3b5':'#9eaeb4';c.lineWidth=3;c.beginPath();c.moveTo(-20,torsoTop+30);c.lineTo(-11,torsoTop+73);c.lineTo(12,torsoTop+73);c.lineTo(22,torsoTop+30);c.stroke();
 c.fillStyle='#182a32';c.fillRect(-34,torsoTop+75,68,10);
 // neck and head viewed from behind; Daniel has short hair, Miguel a compact swept silhouette
 c.fillStyle='#c4a68e';c.fillRect(-11,torsoTop-12,22,19);
 c.fillStyle=mig?'#24222a':'#242a2d';c.beginPath();c.ellipse(0,torsoTop-26,mig?26:28,mig?30:32,0,0,Math.PI*2);c.fill();
 if(mig){c.fillStyle='#302c32';c.beginPath();c.moveTo(-25,torsoTop-29);c.lineTo(-28,torsoTop-3);c.lineTo(-16,torsoTop+2);c.lineTo(-17,torsoTop-23);c.closePath();c.fill();}
 else {c.strokeStyle='#aab6b8';c.lineWidth=2;c.beginPath();c.arc(0,torsoTop-24,27,Math.PI*.2,Math.PI*.8);c.stroke();}
 // Shoulders and arms: both hands lift weapon when exposed; cover pose is lowered.
 const armY=torsoTop+24;const raise=1-crouch;
 c.strokeStyle=mig?'#506b69':'#53656b';c.lineWidth=mig?19:24;
 c.beginPath();c.moveTo(-35,armY);c.lineTo(-48,armY+39-raise*12);c.lineTo(-15,armY+45-raise*32);c.stroke();
 c.beginPath();c.moveTo(35,armY);c.lineTo(52,armY+34-raise*21);c.lineTo(36+raise*40,armY+43-raise*55);c.stroke();
 if(raise>.12){
  const bx=60,by=armY-5-kick*8;
  c.save();c.translate(bx,by);c.rotate(-.16-kick*.18+reload*.65);
  // Miguel: distinctive short heavy Desert Eagle silhouette; Daniel: unassigned generic training silhouette.
  c.fillStyle='#10191f';c.beginPath();c.roundRect(-4,-10,mig?57:67,mig?17:12,3);c.fill();
  c.fillStyle='#0c151a';c.fillRect(2,5,13,23);c.fillRect(20,-14,17,5);
  if(!mig){c.strokeStyle='#94a7a9';c.lineWidth=2;c.strokeRect(0,-10,67,12);}
  if(reload>.02){c.fillStyle='#b7b6a6';c.fillRect(4,20+reload*26,10,16);}
  c.restore();
 }
 // Visible weapon-hand and gloves
 c.fillStyle='#1a262b';c.beginPath();c.arc(36+raise*40,armY+43-raise*55,10,0,Math.PI*2);c.fill();
 c.restore(); // torso
 c.restore(); // character
}
function draw(t){
 const w=canvas.width,h=canvas.height;ctx.save();ctx.scale(w/W,h/H);
 ctx.fillStyle='#0b1b2b';ctx.fillRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#152b40');sky.addColorStop(.58,'#35515b');sky.addColorStop(1,'#1c2830');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#273a45';ctx.beginPath();ctx.moveTo(0,245);for(let i=0;i<=W;i+=75)ctx.lineTo(i,200+Math.sin(i*.023)*24);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
 for(let i=0;i<12;i++){let x=i*75-20,y=165+(i%4)*14;ctx.fillStyle='#20323e';ctx.fillRect(x,y,40,135);ctx.fillStyle='#445c65';ctx.fillRect(x+4,y+8,4,13);}
 ctx.fillStyle='#142630';ctx.fillRect(0,280,W,200);
 ctx.strokeStyle='#44616a';ctx.lineWidth=2;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(400,270);ctx.lineTo(i*170-110,H);ctx.stroke();}
 // hostile units
 for(const e of enemies){if(e.hp<=0)continue;const y=enemyY(e);
 ctx.save();ctx.translate(e.x,y);
 ctx.shadowColor=e.hit>0?'#fff0b8':'#ff775b';ctx.shadowBlur=e.hit>0?28:7;
 roundedRect(-e.r,-e.r*.72,e.r*2,e.r*1.7,7,e.hit>0?'#d7e8d7':e.color);
 roundedRect(-e.r*.6,-e.r*.42,e.r*1.2,e.r*.75,4,'#172c36');
 roundedRect(-e.r*.24,-e.r*.18,e.r*.48,e.r*.36,4,'#fa8a71');
 ctx.fillStyle='#344853';ctx.fillRect(-e.r*1.3,0,e.r*.4,e.r*.65);ctx.fillRect(e.r*.9,0,e.r*.4,e.r*.65);
 ctx.shadowBlur=0;
 if(e.telegraph>0){ctx.strokeStyle='#ffb45b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-e.telegraph/(e.kind==='brute'?1.05:.75)));ctx.stroke();ctx.fillStyle='#ffbf78';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('공격 준비',0,-e.r-28);}
 ctx.fillStyle='#cbd9dd';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(e.name,0,e.r+24);
 ctx.fillStyle='#1b2a32';ctx.fillRect(-e.r,-e.r-18,e.r*2,5);ctx.fillStyle='#e9947c';ctx.fillRect(-e.r,-e.r-18,e.r*2*(e.hp/e.max),5);ctx.restore();
 }
 // Prototype boss: temporary game encounter, not a canonical Zero species.
 if(boss&&boss.hp>0){
  const bx=boss.x,by=boss.y,br=boss.r;
  ctx.save();ctx.translate(bx+(bossImpactPulse>0?Math.sin(animationClock*90)*bossImpactPulse*9:0),by);
  ctx.shadowColor=boss.hit>0?'#ffe5a5':'#a56bde';ctx.shadowBlur=boss.hit>0?25:15;
  roundedRect(-br,-br*.7,br*2,br*1.5,17,boss.hit>0?'#d3c6df':'#574b6b');
  roundedRect(-br*.62,-br*.38,br*1.24,br*.58,8,'#22243a');
  ctx.fillStyle='#d2a2ef';ctx.fillRect(-br*.34,-8,br*.68,12);
  ctx.fillStyle='#3d334b';ctx.fillRect(-br*1.2,0,br*.38,br*.9);ctx.fillRect(br*.82,0,br*.38,br*.9);
  ctx.shadowBlur=0;
  if(bossWarning>0){const fraction=Math.max(0,Math.min(1,1-bossWarning/warningDuration()));ctx.strokeStyle=bossPattern===1?'#ffcb71':bossPattern===2?'#ff7967':'#ef8cff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,br+16,-Math.PI/2,-Math.PI/2+2*Math.PI*fraction);ctx.stroke();ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(['','정면 충격','광역 충격','연속 충격'][bossPattern],0,-br-28);}
  ctx.restore();
  if(bossWarning>0){ctx.save();const pulse=reducedMotion()?.11:(.08+.065*Math.sin(animationClock*16)**2);ctx.fillStyle=`rgba(255,93,72,${pulse})`;ctx.fillRect(0,0,W,H);ctx.strokeStyle=bossPattern===2?'#ff6655':bossPattern===3?'#d987ff':'#ffbe67';ctx.lineWidth=3;ctx.setLineDash(bossPattern===3?[9,7]:[]);if(bossPattern===1){ctx.strokeRect(W*.28,20,W*.44,H-40);}else if(bossPattern===2){ctx.strokeRect(12,12,W-24,H-24);}else{for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(W*.24+i*W*.22,0);ctx.lineTo(W*.12+i*W*.22,H);ctx.stroke();}}ctx.restore();}
 }
 // impact fragments: logical-coordinate rendering keeps visual effects aligned with hits.
 for(const particle of impactParticles){ctx.globalAlpha=Math.max(0,Math.min(1,particle.life/particle.max));ctx.fillStyle=particle.color;ctx.fillRect(particle.x-2,particle.y-2,4,4);}ctx.globalAlpha=1;
 // foreground cover
 ctx.fillStyle='#243b45';ctx.beginPath();ctx.moveTo(0,365);ctx.lineTo(190,342);ctx.lineTo(610,342);ctx.lineTo(800,365);ctx.lineTo(800,480);ctx.lineTo(0,480);ctx.fill();
 ctx.strokeStyle='#799297';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,365);ctx.lineTo(190,342);ctx.lineTo(610,342);ctx.lineTo(800,365);ctx.stroke();
 // Rear-view operative, different silhouettes, animated crouch/aim/reload.
 drawOperative(ctx,selected,covered,recoil,reloadMotion,coverMotion,t);
 if(!covered&&!ended){
 ctx.strokeStyle='#e2f3df';ctx.lineWidth=2;ctx.beginPath();ctx.arc(aim.x,aim.y,18,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(aim.x-29,aim.y);ctx.lineTo(aim.x-10,aim.y);ctx.moveTo(aim.x+10,aim.y);ctx.lineTo(aim.x+29,aim.y);ctx.moveTo(aim.x,aim.y-29);ctx.lineTo(aim.x,aim.y-10);ctx.moveTo(aim.x,aim.y+10);ctx.lineTo(aim.x,aim.y+29);ctx.stroke();
 }
 for(const sh of shells){ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate((1-sh.life)*7);ctx.fillStyle='#dbbd78';ctx.fillRect(-4,-2,8,4);ctx.restore();}
 if(shotFlash>0){ctx.fillStyle=`rgba(255,220,158,${shotFlash*1.8})`;ctx.beginPath();ctx.arc(selected==='miguel'?345:370,selected==='miguel'?275:250,30+recoil*13,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(255,247,200,${shotFlash*3})`;ctx.beginPath();ctx.moveTo(345,277);ctx.lineTo(393,248);ctx.lineTo(371,276);ctx.lineTo(393,303);ctx.closePath();ctx.fill();}
 if(damageFlash>0){ctx.fillStyle=`rgba(230,50,45,${damageFlash*.28})`;ctx.fillRect(0,0,W,H);}
 ctx.restore();
}
function tick(now){
 if(paused){last=now;if(document.getElementById('combat').classList.contains('active'))raf=requestAnimationFrame(tick);return;}
 const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;frame=now;animationClock+=dt;
 if(active&&!ended){
 diagnosticFrames++;diagnosticSeconds+=dt;if(diagnosticSeconds>=1){diagnosticFPS=Math.round(diagnosticFrames/diagnosticSeconds);diagnosticFrames=0;diagnosticSeconds=0;updateDiagnostics();}
 combatTime+=dt;if(Math.floor(combatTime)!==skillUiSecond){skillUiSecond=Math.floor(combatTime);updateSkillUI();}
 if(feedback&&!feedback.hidden&&combatTime>=feedbackTimeout)feedback.hidden=true;
 if(comboShots&&combatTime>=comboUntil){comboShots=0;updateSkillUI();}
 if(reloading&&now-reloadStarted>=operatives[selected].reload*(selected==='daniel'&&extraActive('rapid')?.55:1)){window.ZF37ReloadState?.({state:'complete',operative:selected});window.ZF39CombatState?.({kind:'reload-complete',combatTime,selected});reloading=false;window.ZF40ReloadState?.({kind:'complete',operative:selected});ammo=operatives[selected].capacity;reserve[selected]=ammo;reloadMotion=0;if(window.ZF34CombatEvent)window.ZF34CombatEvent('reload-complete',{operative:selected});update();}
 if(waveTransition>0){waveTransition=Math.max(0,waveTransition-dt);if(waveTransition===0){waveIndex++;spawnWave();}}else if(boss)advanceBoss(dt);else advanceEnemyAI(dt);
 }
 if(fireHeld&&!covered&&!reloading&&(!fireTouchMode||difficultySettings().fireMode==='hold'))shoot();
 const easing=Math.min(1,dt*16);aimSmooth.x+=(aim.x-aimSmooth.x)*easing;aimSmooth.y+=(aim.y-aimSmooth.y)*easing;swapBlend=Math.max(0,swapBlend-dt*5);
 recoil=Math.max(0,recoil-dt*4.2);coverMotion+=( (covered?1:0)-coverMotion)*Math.min(1,dt*11);
 if(reloading)reloadMotion=Math.max(0,1-(now-reloadStarted)/(operatives[selected].reload*(selected==='daniel'&&extraActive('rapid')?.55:1)));
 if(active&&reloading&&window.ZF33ReloadObserver){window.ZF33ReloadObserver({operative:selected,elapsed:Math.max(0,now-reloadStarted),duration:operatives[selected].reload*(selected==='daniel'&&extraActive('rapid')?.55:1),paused:false});}
 for(const sh of shells){sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.vy+=390*dt;sh.life-=dt*1.25;}
 shells=shells.filter(sh=>sh.life>0);
 bossImpactPulse=Math.max(0,bossImpactPulse-dt);warningPulse=Math.max(0,warningPulse-dt*2);
 for(const particle of impactParticles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=150*dt;particle.life-=dt;}impactParticles=impactParticles.filter(p=>p.life>0);
 shotFlash=Math.max(0,shotFlash-dt);damageFlash=Math.max(0,damageFlash-dt*2);for(const e of enemies)e.hit=Math.max(0,(e.hit||0)-dt);if(boss)boss.hit=Math.max(0,boss.hit-dt);
 updateWarningUX();draw(now);if(document.getElementById('combat').classList.contains('active'))raf=requestAnimationFrame(tick);
}
function setAim(clientX,clientY){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;aim.x=Math.max(15,Math.min(W-15,(clientX-r.left)/r.width*W));aim.y=Math.max(25,Math.min(315,(clientY-r.top)/r.height*H));}
// Independent pointer IDs permit dragging the aim and holding FIRE simultaneously.
const heldKeys=new Set();let aimPointerType=null;
function aimDown(e){if(e.target!==canvas||!active||ended||paused)return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(e.pointerId===firePointer){combatInputFaults++;window.ZF36ReportFault?.('shared-pointer',{pointerId:e.pointerId});return;}if(aimPointer!==null)return;aimPointer=e.pointerId;aimPointerType=e.pointerType;window.ZF40InputState?.({kind:'aim-start',pointerId:e.pointerId,pointerType:e.pointerType});window.ZF39InputState?.({kind:'aim-start',pointerId:e.pointerId,pointerType:e.pointerType});window.ZF37InputEvent?.('aim-start',{pointerType:e.pointerType});window.ZF38PointerEvent?.('aim-start',{pointerId:e.pointerId,pointerType:e.pointerType});try{canvas.setPointerCapture(e.pointerId);}catch(_){combatInputFaults++;window.ZF39InputState?.({kind:'capture-failed',role:'aim',pointerId:e.pointerId});}setAim(e.clientX,e.clientY);setCover(false);if(e.pointerType==='mouse'&&e.button===0){fireHeld=true;shoot();}}
canvas.addEventListener('pointerdown',aimDown);
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&aimPointer===null&&!paused&&active&&!ended){setAim(e.clientX,e.clientY);return;}if(e.pointerId===aimPointer){e.preventDefault();const sensitivity=e.pointerType==='mouse'?1:difficultySettings().aimSensitivity;const rect=canvas.getBoundingClientRect();const centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;setAim(centerX+(e.clientX-centerX)*sensitivity,centerY+(e.clientY-centerY)*sensitivity);}});
function aimRelease(e){if(e.pointerId!==aimPointer)return;aimPointer=null;aimPointerType=null;window.ZF40InputState?.({kind:'aim-end',pointerId:e.pointerId,reason:e.type});window.ZF39InputState?.({kind:'aim-end',reason:e.type,pointerId:e.pointerId});window.ZF37InputEvent?.('aim-end',{reason:e.type});window.ZF38PointerEvent?.('aim-end',{pointerId:e.pointerId,reason:e.type});fireHeld=firePointer!==null||heldKeys.has('KeyF');if(!fireHeld)setCover(true);}
canvas.addEventListener('pointerup',aimRelease);canvas.addEventListener('pointercancel',aimRelease);canvas.addEventListener('lostpointercapture',aimRelease);
function fireStart(e){if(!active||ended||paused)return;e.preventDefault();if(e.pointerId===aimPointer){combatInputFaults++;window.ZF36ReportFault?.('shared-pointer',{pointerId:e.pointerId});return;}if(firePointer!==null)return;firePointer=e.pointerId;window.ZF40InputState?.({kind:'fire-start',pointerId:e.pointerId,pointerType:e.pointerType});window.ZF39InputState?.({kind:'fire-start',pointerId:e.pointerId,pointerType:e.pointerType});window.ZF37InputEvent?.('fire-start',{pointerType:e.pointerType});window.ZF38PointerEvent?.('fire-start',{pointerId:e.pointerId,pointerType:e.pointerType});fireTouchMode=e.pointerType==='touch';try{fireBtn.setPointerCapture(e.pointerId);}catch(_){combatInputFaults++;window.ZF39InputState?.({kind:'capture-failed',role:'fire',pointerId:e.pointerId});}setCover(false);fireHeld=true;shoot();}
function fireEnd(e){if(e.pointerId!==firePointer)return;firePointer=null;window.ZF40InputState?.({kind:'fire-end',pointerId:e.pointerId,reason:e.type});window.ZF39InputState?.({kind:'fire-end',reason:e.type,pointerId:e.pointerId});window.ZF37InputEvent?.('fire-end',{reason:e.type});window.ZF38PointerEvent?.('fire-end',{pointerId:e.pointerId,reason:e.type});fireHeld=heldKeys.has('KeyF')||(aimPointer!==null&&aimPointerType==='mouse');fireTouchMode=false;if(aimPointer===null&&!fireHeld)setCover(true);}
fireBtn.addEventListener('pointerdown',fireStart);fireBtn.addEventListener('pointerup',fireEnd);fireBtn.addEventListener('pointercancel',fireEnd);fireBtn.addEventListener('lostpointercapture',fireEnd);
// v39: recover from capture failures when the pointer ends outside its original target.
window.addEventListener('pointerup',e=>{if(e.pointerId===aimPointer)aimRelease(e);if(e.pointerId===firePointer)fireEnd(e);},true);
window.addEventListener('pointercancel',e=>{if(e.pointerId===aimPointer)aimRelease(e);if(e.pointerId===firePointer)fireEnd(e);},true);
// If a browser drops pointer capture, release the affected role without cancelling other active touches.
window.addEventListener('lostpointercapture',e=>{if(e.pointerId===aimPointer)aimRelease(e);if(e.pointerId===firePointer)fireEnd(e);},true);
coverBtn.addEventListener('click',()=>setCover(!covered));
reloadBtn.addEventListener('click',reload);
document.addEventListener('keydown',e=>{if(!document.getElementById('combat').classList.contains('active'))return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)togglePause();return;}if(paused)return;if(['Space','KeyR','KeyF','Digit1','Digit2','KeyQ','KeyE','KeyT'].includes(e.code))e.preventDefault();if(heldKeys.has(e.code))return;heldKeys.add(e.code);if(e.code==='Space')setCover(!covered);if(e.code==='KeyR')reload();if(e.code==='KeyQ')activateSkill();if(e.code==='KeyE')useExtraSkill(selected==='miguel'?'medic':'rapid');if(e.code==='KeyT')useExtraSkill('command');if(e.code==='Digit1')selectOperative('miguel');if(e.code==='Digit2')selectOperative('daniel');if(e.code==='KeyF'){setCover(false);fireHeld=true;shoot();}});
document.addEventListener('keyup',e=>{heldKeys.delete(e.code);if(e.code==='KeyF'){fireHeld=firePointer!==null||(aimPointer!==null&&aimPointerType==='mouse');if(!fireHeld&&aimPointer===null)setCover(true);}});
window.addEventListener('blur',()=>{if(active&&!ended)pauseCombat();releaseInputs();});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active&&!ended)pauseCombat();releaseInputs();last=performance.now();}});
document.getElementById('retryBattle').addEventListener('click',reset);
nextStageBtn.addEventListener('click',()=>{if(stageIndex+1<stageProgress.unlocked){stageIndex++;reset();}});
renderStages();
document.querySelectorAll('[data-screen="combat"]').forEach(b=>b.addEventListener('click',()=>{reset();}));
document.querySelectorAll('#combat [data-screen="home"]').forEach(b=>b.addEventListener('click',()=>{active=false;paused=false;syncPauseUI();releaseInputs();window.ZFAudio?.setAmbient(false);cancelAnimationFrame(raf);}));
const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,1.75);const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));draw(performance.now());};
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>{if(active&&!ended)pauseCombat();setTimeout(resize,180);});resize();
})();
