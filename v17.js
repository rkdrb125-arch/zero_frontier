 'use strict';
(()=>{
 const KEY='zero_frontier_v16_history', stage=document.getElementById('zf17Stage'), difficulty=document.getElementById('zf17Difficulty'), comparison=document.getElementById('zf17Comparison'), recordsNode=document.getElementById('zf17Records'), diag=document.getElementById('zf17Diagnostics');
 const diffNames={easy:'쉬움',normal:'보통',hard:'어려움'};
 const esc=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function history(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&Number.isInteger(x.stage)&&x.stage>=0&&x.stage<3&&Object.prototype.hasOwnProperty.call(diffNames,x.difficulty)).slice(-300):[];}catch(_){return [];}}
 const safeNum=(n)=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;
 function pct(x){const shots=safeNum(x.shots);return shots?Math.min(100,Math.round(safeNum(x.hits)*100/shots)):0;}
 function render(){const all=history(), filtered=all.filter(x=>(stage.value==='all'||String(x.stage)===stage.value)&&(difficulty.value==='all'||x.difficulty===difficulty.value));
 comparison.replaceChildren();recordsNode.replaceChildren();
 if(!filtered.length){comparison.textContent='선택한 조건의 전투 기록이 없습니다.';return;}
 const groups=[0,1,2].map(i=>({i,rows:filtered.filter(x=>x.stage===i)})).filter(g=>g.rows.length);
 const tbl=document.createElement('table');tbl.className='zf17-table';const head=document.createElement('tr');['스테이지','출격','승리','승률','평균 명중률','최고 점수'].forEach(t=>{const th=document.createElement('th');th.textContent=t;head.append(th);});tbl.append(head);
 for(const {i,rows} of groups){const wins=rows.filter(x=>x.won).length;const tr=document.createElement('tr');[String(i+1).padStart(2,'0'),rows.length,wins,Math.round(wins*100/rows.length)+'%',Math.round(rows.reduce((sum,x)=>sum+pct(x),0)/rows.length)+'%',Math.max(...rows.map(x=>safeNum(x.score)))].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});tbl.append(tr);}
 const wrap=document.createElement('div');wrap.className='zf-history-scroll';wrap.append(tbl);comparison.append(wrap);
 const h=document.createElement('h4');h.textContent=`최근 전투 상세 (${filtered.length}건)`;recordsNode.append(h);
 for(const [index,x] of filtered.slice().reverse().entries()){const details=document.createElement('details');details.className='zf17-entry';const summary=document.createElement('summary');summary.textContent=`${x.won?'승리':'실패'} · ${String(x.stage+1).padStart(2,'0')} / ${diffNames[x.difficulty]} · ${pct(x)}% 명중 · ${safeNum(x.score)}점`;details.append(summary);const body=document.createElement('div');body.className='zf17-entry-body';const date=x.date&&Number.isFinite(Date.parse(x.date))?new Date(x.date).toLocaleString('ko-KR'):'기록 없음';body.textContent=`기록: ${date} | 전투 시간: ${safeNum(x.seconds)}초 | 발사: ${safeNum(x.shots)} | 명중: ${safeNum(x.hits)} | 받은 피해: ${safeNum(x.damage)} | 점수: ${safeNum(x.score)}`;details.append(body);recordsNode.append(details);if(index>=49)break;}
 if(filtered.length>50){const note=document.createElement('p');note.className='muted';note.textContent='상세 목록은 최근 50건만 표시합니다. 성과 비교는 선택 조건의 전체 기록을 사용합니다.';recordsNode.append(note);}
 }
 stage.addEventListener('change',render);difficulty.addEventListener('change',render);window.addEventListener('zf:combat-finished',()=>queueMicrotask(render));
 function inspect(){diag.replaceChildren();const specs=[['화면 설정','zero_frontier_v1_settings','object'],['전투 옵션','zero_frontier_v15_options','object'],['모바일 배치','zero_frontier_v16_layout','layout'],['전투 기록',KEY,'array'],['진행도','zero_frontier_v9_progress','object']];
 const list=document.createElement('ul');for(const [label,key,type] of specs){const li=document.createElement('li');try{const raw=localStorage.getItem(key);if(raw===null){li.textContent=`${label}: 저장 내역 없음 (초기 상태일 수 있음)`;}else if(type==='layout'){li.textContent=`${label}: ${['left','right'].includes(raw)?'정상':'값 확인 필요'}`;}else{const value=JSON.parse(raw);const ok=type==='array'?Array.isArray(value):value!==null&&typeof value==='object'&&!Array.isArray(value);li.textContent=`${label}: ${ok?'형식 정상':'형식 확인 필요'}${ok&&type==='array'?' · '+value.length+'건':''}`;}}catch(e){li.textContent=`${label}: 읽기 또는 JSON 형식 오류`;}list.append(li);}diag.append(list);const note=document.createElement('p');note.className='muted';note.textContent='읽기 전용 검사입니다. 다른 버전에서 사용하는 키는 검사 범위에 포함되지 않을 수 있습니다.';diag.append(note);}
 document.getElementById('zf17Inspect').addEventListener('click',inspect);
 // Accessibility: cancel held gestures when leaving combat and prevent native context menus on controls.
 const canvas=document.getElementById('battleCanvas'), controls=document.querySelector('.battle-controls');
 for(const el of [canvas,controls])el?.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('zf17-keyboard');});document.addEventListener('pointerdown',()=>document.body.classList.remove('zf17-keyboard'),{passive:true});
 render();
})();