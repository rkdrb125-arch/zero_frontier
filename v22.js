'use strict';
(()=>{
 const $=id=>document.getElementById(id),H='zero_frontier_v16_history',S='zero_frontier_v21_history_safety',B='zero_frontier_v22_before_restore',T='zero_frontier_v22_test_sessions',E='zero_frontier_v21_errors';
 const status=$('zf22Status'), perf=$('zf22Perf'), touch=$('zf22Touch'), issues=$('zf22Issues');
 const say=s=>{status.textContent=s;};
 const valid=r=>r&&typeof r==='object'&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<3&&['easy','normal','hard'].includes(r.difficulty)&&typeof r.won==='boolean'&&['shots','hits','score','seconds','damage'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0&&r[k]<=1e9)&&(!r.date||(typeof r.date==='string'&&r.date.length<100));
 function parseHistory(raw){if(raw===null)return null;const rows=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>300||!rows.every(valid))throw Error('전투 기록 형식이 유효하지 않습니다.');return rows;}
 function readSessions(){try{const a=JSON.parse(localStorage.getItem(T)||'[]');return Array.isArray(a)?a.filter(x=>x&&typeof x==='object').slice(-25):[];}catch{return [];}}
 let sessions=readSessions(),slow=0,total=0,maxGap=0,last=0,average=0,visibleFrames=0,warningAt=0,frameCount=0;
 const samples=[];
 function frame(now){if(last&&document.visibilityState==='visible'){
  const dt=now-last;if(dt>0&&dt<2000){samples.push(dt);if(samples.length>120)samples.shift();total++;if(dt>50)slow++;maxGap=Math.max(maxGap,dt);visibleFrames++;}
 }last=now;
 if(++frameCount%45===0){average=samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:0;const fps=average?1000/average:0;perf.textContent=`${fps?fps.toFixed(0):'-'} FPS · 느린 프레임 ${slow}/${total} (>50ms) · 최대 간격 ${maxGap.toFixed(0)}ms`;
  const alert=$('zf22Alert');if(samples.length>=45&&fps<25&&document.visibilityState==='visible'){
   alert.hidden=false;alert.textContent='⚠ 프레임 저하 감지: 그래픽 부하 또는 기기 상태를 확인하세요. (측정치는 화면 전체 기준)';warningAt=now;
  }else if(now-warningAt>3000){alert.hidden=true;}
 }
 requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
 let inputDown=new Map(),latencies=[],cancels=0;
 const area=$('battleStage'),fire=$('fireButton')||document.querySelector('.battle-controls button');
 function down(e){if(e.pointerType==='mouse')return;inputDown.set(e.pointerId,performance.now());}
 function move(e){if(!inputDown.has(e.pointerId))return;const dt=performance.now()-inputDown.get(e.pointerId);if(Number.isFinite(dt)&&dt>=0&&dt<2000){latencies.push(dt);if(latencies.length>50)latencies.shift();}inputDown.delete(e.pointerId);renderTouch();}
 function end(e){if(inputDown.has(e.pointerId)){inputDown.delete(e.pointerId);if(e.type==='pointercancel')cancels++;renderTouch();}}
 function renderTouch(){const avg=latencies.length?Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length):'-';touch.textContent=`터치 첫 이동까지 ${avg}ms (관측 ${latencies.length}회) · 취소 ${cancels}회 · 활성 터치 ${inputDown.size}개`;}
 if(area){area.addEventListener('pointerdown',down,{passive:true});area.addEventListener('pointermove',move,{passive:true});area.addEventListener('pointerup',end,{passive:true});area.addEventListener('pointercancel',end,{passive:true});}
 if(fire){fire.addEventListener('pointerdown',down,{passive:true});fire.addEventListener('pointerup',end,{passive:true});fire.addEventListener('pointercancel',end,{passive:true});}
 window.addEventListener('blur',()=>{inputDown.clear();renderTouch();});renderTouch();
 function getIssues(){try{const a=JSON.parse(localStorage.getItem(E)||'[]');return Array.isArray(a)?a.slice(-40):[];}catch{return [];}}
 function renderIssues(){const a=getIssues(),group={};for(const x of a){const k=x?.type==='promise'?'비동기 오류':x?.type==='storage'||x?.type==='restore'||x?.type==='snapshot'?'저장·복구 오류':x?.type==='error'?'JavaScript 오류':'기타';group[k]=(group[k]||0)+1;}issues.textContent=a.length?`최근 오류 ${a.length}건 · `+Object.entries(group).map(([k,v])=>`${k} ${v}건`).join(' · '):'기록된 오류가 없습니다. (오류가 없다는 것은 정상 플레이 검증을 의미하지 않습니다.)';}
 $('zf22Analyze').addEventListener('click',renderIssues);renderIssues();
 function renderSessions(){const host=$('zf22Sessions');host.replaceChildren();if(!sessions.length){host.textContent='저장된 테스트 결과가 없습니다.';return;}for(const x of sessions.slice().reverse().slice(0,10)){const row=document.createElement('div');row.className='zf22-session';row.textContent=`${x.date} · ${x.label} · ${x.passed?'통과':'추가 확인'} · ${x.notes||'메모 없음'}`;host.append(row);}}
 $('zf22SaveTest').addEventListener('click',()=>{const label=$('zf22TestName').value.trim().slice(0,60)||'수동 플레이 테스트',notes=$('zf22TestNotes').value.trim().slice(0,250),passed=$('zf22TestResult').value==='pass';const next=[...sessions,{date:new Date().toISOString(),label,notes,passed,metrics:{avgFrameMs:Math.round(average),slowFrames:slow,totalFrames:total,touchCancels:cancels}}].slice(-25);try{localStorage.setItem(T,JSON.stringify(next));sessions=next;renderSessions();say('테스트 결과를 저장했습니다. 체크 여부는 직접 검증한 사실만 기록해 주세요.');}catch(e){say('테스트 결과 저장 실패: '+e.message);}});
 $('zf22Export').addEventListener('click',()=>{const report={format:'zero-frontier-v22-playtest',generatedAt:new Date().toISOString(),sessions,performance:{averageFrameMs:average,slowFrames:slow,totalFrames:total,maxFrameMs:maxGap},touch:{firstMoveMs:latencies,cancelled:cancels},errors:getIssues()};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='zero_frontier_v22_playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
 $('zf22CheckRestore').addEventListener('click',()=>{try{const raw=localStorage.getItem(S);if(!raw)throw Error('v21 안전 복구본이 없습니다.');const s=JSON.parse(raw);if(s.format!=='zero-frontier-v21-safety')throw Error('복구본 버전이 맞지 않습니다.');const rows=parseHistory(JSON.stringify(s.records));say(`안전 복구본 검사 통과: ${rows.length}건. 현재 데이터는 변경하지 않았습니다.`);}catch(e){say('안전 복구본 검사 실패: '+e.message);}});
 $('zf22SafeRestore').addEventListener('click',()=>{try{const raw=localStorage.getItem(S);if(!raw)throw Error('안전 복구본이 없습니다.');const snapshot=JSON.parse(raw);if(snapshot.format!=='zero-frontier-v21-safety')throw Error('복구본 버전 불일치');const rows=parseHistory(JSON.stringify(snapshot.records));const old=localStorage.getItem(H);if(old!==null)parseHistory(old);if(!confirm(`검증된 ${rows.length}건으로 현재 기록을 교체할까요? 복원 전 기록을 별도 롤백 슬롯에 먼저 저장합니다.`))return;
  if(old!==null){localStorage.setItem(B,old);if(localStorage.getItem(B)!==old)throw Error('롤백 데이터 확인 실패');}else localStorage.removeItem(B);
  localStorage.setItem(H,JSON.stringify(rows));if(!parseHistory(localStorage.getItem(H)))throw Error('복원 후 검증 실패');window.dispatchEvent(new Event('zf:history-restored'));window.dispatchEvent(new Event('zf:combat-finished'));say(`복원 완료: ${rows.length}건. 복원 전 기록은 v22 롤백 슬롯에 보관했습니다.`);
 }catch(e){say('복원 중단: '+e.message+' · 롤백 슬롯을 확인하세요.');}});
 $('zf22Rollback').addEventListener('click',()=>{try{const raw=localStorage.getItem(B);if(raw===null)throw Error('v22 롤백 기록이 없습니다.');const rows=parseHistory(raw);const current=localStorage.getItem(H);if(current!==null)parseHistory(current);if(!confirm(`롤백 기록 ${rows.length}건으로 교체할까요? 현재 기록은 v21 안전 복구본으로 자동 덮어쓰지 않습니다.`))return;localStorage.setItem(H,raw);window.dispatchEvent(new Event('zf:history-restored'));window.dispatchEvent(new Event('zf:combat-finished'));say(`롤백 완료: ${rows.length}건.`);}catch(e){say('롤백 실패: '+e.message);}});
 renderSessions();
})();
