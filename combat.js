
'use strict';
(() => {
const stage=document.getElementById('battleStage'),canvas=document.getElementById('battleCanvas'),ctx=canvas.getContext('2d');
const hpBar=document.getElementById('playerHealth'),hpText=document.getElementById('hpText'),enemyCount=document.getElementById('enemyCount'),ammoText=document.getElementById('ammoText'),notice=document.getElementById('battleNotice'),result=document.getElementById('battleResult');
const coverBtn=document.getElementById('coverButton'),fireBtn=document.getElementById('fireButton'),reloadBtn=document.getElementById('reloadButton');
const W=800,H=480;
const miguelSwitch=document.getElementById('miguelSwitch'),danielSwitch=document.getElementById('danielSwitch');
const operatives={miguel:{label:'미겔 · DESERT EAGLE',capacity:7,reload:1300,damage:1},daniel:{label:'다니엘 · SUPPORT',capacity:18,reload:1700,damage:1}};
let selected='miguel',reserve={miguel:7,daniel:18},recoil=0,coverMotion=0,shells=[],reloadMotion=0,aimingBeforeReload=false;
function selectOperative(who){
 if(!active||ended||reloading||!operatives[who])return;
 reserve[selected]=ammo;selected=who;ammo=reserve[who];
 miguelSwitch.classList.toggle('zf-squad-active',who==='miguel');danielSwitch.classList.toggle('zf-squad-active',who==='daniel');
 miguelSwitch.setAttribute('aria-pressed',String(who==='miguel'));danielSwitch.setAttribute('aria-pressed',String(who==='daniel'));
 recoil=0;update();
}
miguelSwitch.addEventListener('click',()=>selectOperative('miguel'));
danielSwitch.addEventListener('click',()=>selectOperative('daniel'));

let active=false,ended=false,aiming=false,covered=true,reloading=false,ammo=7,hp=100,shotFlash=0,damageFlash=0,shake=0,aim={x:400,y:200},last=0,frame=0,enemyTimer=0,spawnTime=0,raf=0;
let enemies=[];
function reset(){
 active=true;ended=false;aiming=false;covered=true;reloading=false;selected='miguel';reserve={miguel:7,daniel:18};ammo=7;recoil=0;coverMotion=0;reloadMotion=0;shells=[];hp=100;shotFlash=0;damageFlash=0;shake=0;enemyTimer=0;spawnTime=0;aim={x:400,y:200};
 enemies=[{x:245,y:168,r:28,hp:3,max:3,phase:0},{x:520,y:190,r:27,hp:3,max:3,phase:1.8},{x:397,y:127,r:23,hp:4,max:4,phase:3.1}];
 result.hidden=true;miguelSwitch.classList.add('zf-squad-active');danielSwitch.classList.remove('zf-squad-active');miguelSwitch.setAttribute('aria-pressed','true');danielSwitch.setAttribute('aria-pressed','false');window.ZFAudio?.setAmbient(true);update();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function update(){
 hpBar.style.width=hp+'%';hpText.textContent='HP '+hp+' / 100';
 ammoText.textContent=ammo+' / '+operatives[selected].capacity;document.querySelector('.battle-hud small').textContent=operatives[selected].label;enemyCount.textContent=enemies.filter(e=>e.hp>0).length+' / 3';
 coverBtn.classList.toggle('active',!covered);coverBtn.setAttribute('aria-pressed',String(!covered));
 coverBtn.textContent=covered?'엄폐 해제 / 조준':'엄폐하기';
 notice.textContent=ended?'작전 종료':reloading?'재장전 중…':covered?'엄폐 중 · 조준 후 사격하세요':'노출 중 · 적 공격에 주의!';
}
function setCover(value){if(!active||ended)return;covered=value;aiming=!value;update();}
function reload(){if(!active||ended||reloading||ammo===operatives[selected].capacity)return;reloading=true;reloadMotion=1;window.ZFAudio?.play('reload',.3);update();const started=performance.now();reloadStarted=started;}
let reloadStarted=0;
function shoot(){
 if(!active||ended||covered||reloading)return;
 if(ammo<=0){window.ZFAudio?.play('empty',.4);reload();return;}
 ammo--;reserve[selected]=ammo;shotFlash=.15;shake=6;recoil=selected==='miguel'?1:.42;shells.push({x:selected==='miguel'?335:350,y:covered?335:280,vx:140+Math.random()*55,vy:-170-Math.random()*70,life:1});window.ZFAudio?.play('shot',.65);window.setTimeout(()=>window.ZFAudio?.play('shell',.22),130);
 // Hit testing uses logical coordinates matching canvas rendering, independent of CSS size.
 const hit=enemies.filter(e=>e.hp>0&&Math.hypot(aim.x-e.x,aim.y-(e.y+Math.sin(frame*.0017+e.phase)*7))<e.r+8).sort((a,b)=>Math.hypot(aim.x-a.x,aim.y-a.y)-Math.hypot(aim.x-b.x,aim.y-b.y))[0];
 if(hit){window.ZFAudio?.play('hit',.5);hit.hp-=operatives[selected].damage;hit.hit=.25;if(hit.hp<=0&&enemies.every(e=>e.hp<=0)){finish(true);}}
 update();
}
function finish(won){ended=true;active=false;window.ZFAudio?.setAmbient(false);window.ZFAudio?.play(won?'victory':'defeat',.45);covered=true;aiming=false;reloading=false;document.getElementById('resultTitle').textContent=won?'MISSION CLEAR':'MISSION FAILED';document.getElementById('resultText').textContent=won?'표적 3기를 모두 무력화했습니다.':'HP가 0이 되었습니다. 엄폐를 활용해 다시 도전하세요.';result.hidden=false;update();}
function roundedRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawOperative(c,who,isCovered,kick,reload,transition,t){
 const mig=who==='miguel',p=1-transition;
 // Miguel is compact, Daniel noticeably taller and broad-shouldered.
 const sc=mig?.84:1.12,baseY= isCovered?436:399;
 c.save();c.translate(mig?270:275,baseY+transition*10+kick*8);c.scale(sc,sc);
 const crouch=transition;const torsoTop=-102+crouch*31;
 // Boots and trousers, both legs bend as operative crouches.
 c.lineCap='round';c.strokeStyle='#17262b';c.lineWidth=mig?22:26;
 c.beginPath();c.moveTo(-20,8);c.lineTo(-29,64-crouch*15);c.moveTo(20,8);c.lineTo(27,64-crouch*15);c.stroke();
 c.fillStyle='#23363d';c.fillRect(-42,52-crouch*15,30,13);c.fillRect(12,52-crouch*15,32,13);
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
 c.restore();
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
 for(const e of enemies){if(e.hp<=0)continue;const y=e.y+Math.sin(t*.0017+e.phase)*7;
 ctx.save();ctx.translate(e.x,y);
 ctx.shadowColor=e.hit>0?'#fff0b8':'#ff775b';ctx.shadowBlur=e.hit>0?28:7;
 roundedRect(-e.r,-e.r*.72,e.r*2,e.r*1.7,7,e.hit>0?'#d7e8d7':'#566f78');
 roundedRect(-e.r*.6,-e.r*.42,e.r*1.2,e.r*.75,4,'#172c36');
 roundedRect(-e.r*.24,-e.r*.18,e.r*.48,e.r*.36,4,'#fa8a71');
 ctx.fillStyle='#344853';ctx.fillRect(-e.r*1.3,0,e.r*.4,e.r*.65);ctx.fillRect(e.r*.9,0,e.r*.4,e.r*.65);
 ctx.shadowBlur=0;ctx.fillStyle='#1b2a32';ctx.fillRect(-e.r,-e.r-18,e.r*2,5);ctx.fillStyle='#e9947c';ctx.fillRect(-e.r,-e.r-18,e.r*2*(e.hp/e.max),5);ctx.restore();
 }
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
 const dt=Math.min((now-last)/1000,.05);last=now;frame=now;
 if(active&&!ended){
 if(reloading&&now-reloadStarted>=operatives[selected].reload){reloading=false;ammo=operatives[selected].capacity;reserve[selected]=ammo;reloadMotion=0;update();}
 if(!covered){enemyTimer+=dt;if(enemyTimer>=1.8){enemyTimer=0;hp=Math.max(0,hp-14);window.ZFAudio?.play('enemy',.22);damageFlash=1;update();if(hp<=0)finish(false);}}
 }
 recoil=Math.max(0,recoil-dt*4.2);coverMotion+=( (covered?1:0)-coverMotion)*Math.min(1,dt*11);
 if(reloading)reloadMotion=Math.max(0,1-(now-reloadStarted)/operatives[selected].reload);
 for(const sh of shells){sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.vy+=390*dt;sh.life-=dt*1.25;}
 shells=shells.filter(sh=>sh.life>0);
 shotFlash=Math.max(0,shotFlash-dt);damageFlash=Math.max(0,damageFlash-dt*2);for(const e of enemies)e.hit=Math.max(0,(e.hit||0)-dt);
 draw(now);if(document.getElementById('combat').classList.contains('active'))raf=requestAnimationFrame(tick);
}
function setAim(clientX,clientY){const r=canvas.getBoundingClientRect();aim.x=Math.max(15,Math.min(W-15,(clientX-r.left)/r.width*W));aim.y=Math.max(25,Math.min(315,(clientY-r.top)/r.height*H));}
let pointerDown=false;
stage.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;e.preventDefault();pointerDown=true;stage.setPointerCapture(e.pointerId);setAim(e.clientX,e.clientY);setCover(false);if(e.pointerType==='mouse'&&e.button===0)shoot();});
stage.addEventListener('pointermove',e=>{if(!pointerDown&&e.pointerType!=='mouse')return;if(e.pointerType==='mouse'||pointerDown)setAim(e.clientX,e.clientY);});
stage.addEventListener('pointerup',e=>{pointerDown=false;if(e.pointerType!=='mouse')setCover(true);});
stage.addEventListener('pointercancel',()=>{pointerDown=false;setCover(true);});
fireBtn.addEventListener('click',()=>{setCover(false);shoot();});
coverBtn.addEventListener('click',()=>setCover(!covered));
reloadBtn.addEventListener('click',reload);
document.addEventListener('keydown',e=>{if(!document.getElementById('combat').classList.contains('active')||e.repeat)return;if(e.code==='Space'){e.preventDefault();setCover(!covered);}if(e.code==='KeyR')reload();if(e.code==='Digit1')selectOperative('miguel');if(e.code==='Digit2')selectOperative('daniel');if(e.code==='KeyF'){setCover(false);shoot();}});
document.getElementById('retryBattle').addEventListener('click',reset);
document.querySelectorAll('[data-screen="combat"]').forEach(b=>b.addEventListener('click',()=>{reset();}));
document.querySelectorAll('#combat [data-screen="home"]').forEach(b=>b.addEventListener('click',()=>{active=false;window.ZFAudio?.setAmbient(false);cancelAnimationFrame(raf);}));
const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2);const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));draw(performance.now());};
new ResizeObserver(resize).observe(canvas);resize();
})();
