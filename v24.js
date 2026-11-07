 'use strict';
(()=>{
 const $=id=>document.getElementById(id),H='zero_frontier_v16_history',SN='zero_frontier_v24_snapshot',RB='zero_frontier_v24_before_restore',T='zero_frontier_v22_test_sessions',RE='zero_frontier_v24_repro',MAX=300;
 const set=(id,t)=>{const el=$(id);if(el)el.textContent=t;};
 const read=(k,f)=>{try{const v=localStorage.getItem(k);return v===null?f:JSON.parse(v);}catch{return f;}};
 const valid=r=>r&&typeof r==='object'&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=2&&['easy','normal','hard'].includes(r.difficulty)&&typeof r.won==='boolean'&&['shots','hits','score','seconds','damage'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=1e9)&&(!r.date||(typeof r.date==='string'&&r.date.length<100));
 function history(raw){if(raw===null)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>MAX||!rows.every(valid))throw Error('전투 기록이 유효하지 않습니다.');return rows;}
 function download(name,obj){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
 const battle=$('battleStage'),canvas=$('battleCanvas'),fire=$('fireButton');let samples=[],previous=0,slow=0,max=0,active=false,lastDraw=0,finishes=0;
 const isBattle=()=>{if(!battle)return false;const r=battle.getBoundingClientRect();return r.width>0&&r.height>0&&document.visibilityState==='visible'&&!!document.querySelector('.battle-shell')&&getComputedStyle(battle).visibility!=='hidden';};
 function tick(now){const on=isBattle();if(!on){previous=0;active=false;}else{if(!active){active=true;previous=0;}if(previous){const delta=now-previous;if(delta>0&&delta<1000){samples.push(delta);if(samples.length>900)samples.shift();if(delta>50)slow++;max=Math.max(max,delta);}}previous=now;}
 if(now-lastDraw>1200){lastDraw=now;const arr=[...samples].sort((a,b)=>a-b),avg=arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0,p95=arr.length?arr[Math.floor((arr.length-1)*.95)]:0;set('zf24Perf',`전투 화면 ${on?'표시':'대기'} · 샘플 ${arr.length} · 추정 FPS ${avg?(1000/avg).toFixed(1):'—'} · P95 ${p95.toFixed(1)}ms · 50ms 초과 ${slow}회 · 최대 ${max.toFixed(1)}ms · 전투 종료 이벤트 ${finishes}회`);renderTouch();}requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
 window.addEventListener('zf:combat-finished',()=>{finishes++;});
 $('zf24PerfReset')?.addEventListener('click',()=>{samples=[];previous=0;slow=0;max=0;finishes=0;});
 const touches={down:new Map(),count:0,up:0,cancel:0,move:0,max:0,targets:{aim:0,fire:0}};
 function relevant(e){return battle?.contains(e.target)||fire?.contains(e.target);}
 document.addEventListener('pointerdown',e=>{if(!relevant(e))return;touches.down.set(e.pointerId,{time:performance.now(),type:e.pointerType});touches.count++;touches.max=Math.max(touches.max,touches.down.size);touches.targets[fire?.contains(e.target)?'fire':'aim']++;},{capture:true,passive:true});
 document.addEventListener('pointermove',e=>{if(touches.down.has(e.pointerId))touches.move++;},{capture:true,passive:true});
 const end=(e,cancel)=>{if(touches.down.delete(e.pointerId)){if(cancel)touches.cancel++;else touches.up++;}};
 document.addEventListener('pointerup',e=>end(e,false),{capture:true,passive:true});document.addEventListener('pointercancel',e=>end(e,true),{capture:true,passive:true});window.addEventListener('blur',()=>touches.down.clear());
 function renderTouch(){set('zf24Touch',`활성 입력 ${touches.down.size}개 · 최대 동시 입력 ${touches.max}개 · 조준 시작 ${touches.targets.aim}회 · 발사 시작 ${touches.targets.fire}회 · 이동 ${touches.move}회 · 종료 ${touches.up}회 · 취소 ${touches.cancel}회`);}
 function sessions(){const a=read(T,[]);return Array.isArray(a)?a.filter(x=>x&&typeof x==='object').slice(-25):[];}
 function renderSessions(){const a=sessions();set('zf24Sessions',`저장된 v22 테스트 세션 ${a.length}개 (최근 최대 25개) · 최신: ${a.length?JSON.stringify(a.at(-1)).slice(0,180):'없음'}`);}
 $('zf24Refresh')?.addEventListener('click',renderSessions);$('zf24ExportTests')?.addEventListener('click',()=>download('zero-frontier-v24-playtests.json',{format:'zero-frontier-v24-playtests',exportedAt:new Date().toISOString(),sessions:sessions()}));renderSessions();
 const repro=()=>{const a=read(RE,[]);return Array.isArray(a)?a.filter(x=>x&&typeof x==='object').slice(-40):[];};
 $('zf24Capture')?.addEventListener('click',()=>{const note=$('zf24Repro').value.trim();if(!note){set('zf24ReproStatus','재현 절차 또는 증상을 먼저 입력해 주세요.');return;}try{const a=repro();a.push({date:new Date().toISOString(),note,perf:{samples:samples.length,slowFrames:slow,maxGapMs:max},input:{started:touches.count,ended:touches.up,cancelled:touches.cancel,active:touches.down.size},errorCount:Array.isArray(read('zero_frontier_v21_errors',[]))?read('zero_frontier_v21_errors',[]).length:0,screen:{width:innerWidth,height:innerHeight}});localStorage.setItem(RE,JSON.stringify(a.slice(-40)));set('zf24ReproStatus',`재현 기록 ${Math.min(a.length,40)}건 저장됨`);}catch(e){set('zf24ReproStatus',`저장 실패: ${e.message}`);}});
 $('zf24Report')?.addEventListener('click',()=>download('zero-frontier-v24-reproduction.json',{format:'zero-frontier-v24-repro',exportedAt:new Date().toISOString(),records:repro(),errors:read('zero_frontier_v21_errors',[])}));
 $('zf24Snapshot')?.addEventListener('click',()=>{try{const rows=history(localStorage.getItem(H));localStorage.setItem(SN,JSON.stringify(rows));set('zf24SaveStatus',`검증된 전투 기록 ${rows.length}건을 v24 스냅샷으로 저장했습니다.`);}catch(e){set('zf24SaveStatus',`스냅샷 실패: ${e.message}`);}});
 function restore(from,to,label){try{const raw=localStorage.getItem(from);if(raw===null)throw Error('복구본이 없습니다.');const rows=history(raw),current=history(localStorage.getItem(H));if(!confirm(`${label} ${rows.length}건으로 현재 ${current.length}건을 교체할까요?`))return;const prior=localStorage.getItem(H);localStorage.setItem(to,prior===null?'[]':prior);try{localStorage.setItem(H,JSON.stringify(rows));}catch(e){if(prior===null)localStorage.removeItem(H);else localStorage.setItem(H,prior);throw e;}set('zf24SaveStatus',`${label} ${rows.length}건 복원 완료. 이전 기록은 별도 보호 슬롯에 저장되었습니다. 새로고침 후 다른 기록 화면에 반영됩니다.`);}catch(e){set('zf24SaveStatus',`복원 실패: ${e.message}`);}}
 $('zf24Restore')?.addEventListener('click',()=>restore(SN,RB,'v24 스냅샷'));
 $('zf24Rollback')?.addEventListener('click',()=>restore(RB,SN,'v24 직전 복원 기록'));
})();
