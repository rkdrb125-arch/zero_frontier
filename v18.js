'use strict';
(() => {
  const KEY='zero_frontier_v16_history', HUD_KEY='zero_frontier_v18_compact_hud';
  const stage=document.getElementById('zf17Stage'), difficulty=document.getElementById('zf17Difficulty');
  const chart=document.getElementById('zf18Chart'), summary=document.getElementById('zf18Summary'), status=document.getElementById('zf18Status');
  const compact=document.getElementById('zf18CompactHud');
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(n))?Number(n):min));
  function readRecords(){
    try {
      const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(parsed))throw Error('전투 기록 형식이 올바르지 않습니다.');
      return parsed.filter(x=>x&&Number.isInteger(x.stage)&&x.stage>=0&&x.stage<3&&['easy','normal','hard'].includes(x.difficulty)).slice(-300);
    }catch(e){status.textContent='전투 기록을 읽을 수 없습니다. 기존 저장 데이터는 변경하지 않았습니다.';return [];}
  }
  function filtered(){return readRecords().filter(x=>(stage.value==='all'||String(x.stage)===stage.value)&&(difficulty.value==='all'||x.difficulty===difficulty.value));}
  function accuracy(x){const shots=clamp(x.shots,0,1000000);return shots?Math.round(100*clamp(x.hits,0,shots)/shots):0;}
  function node(name,attrs={}){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
  function draw(){
    const rows=filtered();chart.replaceChildren();chart.setAttribute('role','img');
    if(!rows.length){chart.setAttribute('aria-label','선택한 조건의 전투 기록이 없습니다.');summary.textContent='기록이 없습니다. 출격 후 성과 추이를 확인할 수 있습니다.';return;}
    const data=rows.slice(-30), width=640,height=230,left=44,right=14,top=20,bottom=38;
    const plotW=width-left-right,plotH=height-top-bottom;
    const points=data.map((r,i)=>({x:left+(data.length===1?plotW/2:i*plotW/(data.length-1)),y:top+plotH*(1-accuracy(r)/100),pct:accuracy(r),r}));
    chart.setAttribute('viewBox',`0 0 ${width} ${height}`);
    chart.setAttribute('aria-label',`최근 ${data.length}회 명중률 추이. 최저 ${Math.min(...points.map(p=>p.pct))}%, 최고 ${Math.max(...points.map(p=>p.pct))}%`);
    for(const v of [0,25,50,75,100]){
      const y=top+plotH*(1-v/100);chart.append(node('line',{x1:left,y1:y,x2:width-right,y2:y,stroke:'currentColor','stroke-opacity':'.18'}));
      const t=node('text',{x:left-9,y:y+4,'text-anchor':'end',fill:'currentColor','font-size':'12'});t.textContent=`${v}%`;chart.append(t);
    }
    const poly=node('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),fill:'none',stroke:'#8b7cff','stroke-width':'3','stroke-linecap':'round','stroke-linejoin':'round'});chart.append(poly);
    for(const p of points){const c=node('circle',{cx:p.x,cy:p.y,r:4,fill:p.r.won?'#76d4ba':'#ffad8a',stroke:'#222','stroke-width':'1'});const title=node('title');title.textContent=`${p.r.won?'승리':'실패'} · 스테이지 ${p.r.stage+1} · 명중률 ${p.pct}%`;c.append(title);chart.append(c);}
    const caption=node('text',{x:width/2,y:height-8,'text-anchor':'middle',fill:'currentColor','font-size':'12'});caption.textContent=`최근 ${data.length}회 출격 (왼쪽 → 오른쪽: 오래된 기록 → 최신 기록)`;chart.append(caption);
    const wins=rows.filter(x=>x.won).length, avg=Math.round(rows.reduce((a,x)=>a+accuracy(x),0)/rows.length);
    summary.textContent=`선택 조건 ${rows.length}회 · 승리 ${wins}회 · 승률 ${Math.round(wins*100/rows.length)}% · 평균 명중률 ${avg}% · 최고 명중률 ${Math.max(...rows.map(accuracy))}%`;
  }
  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function exportRecords(format){const rows=filtered();if(!rows.length){status.textContent='내보낼 기록이 없습니다.';return;}
    const filename=`zero_frontier_combat_records_${new Date().toISOString().slice(0,10)}`;
    try{
      if(format==='json')download(filename+'.json',JSON.stringify({format:'zero-frontier-combat-history-export',version:1,records:rows},null,2),'application/json;charset=utf-8');
      else {const headers=['date','stage','difficulty','won','seconds','shots','hits','accuracy','damage','score'];const clean=x=>String(x??'').replace(/^[=+@\-\t\r]/,'\'$&').replace(/"/g,'""');const lines=[headers.join(','),...rows.map(r=>[r.date||'',r.stage+1,r.difficulty,r.won?'win':'loss',r.seconds||0,r.shots||0,r.hits||0,accuracy(r),r.damage||0,r.score||0].map(v=>'"'+clean(v)+'"').join(','))];download(filename+'.csv','\uFEFF'+lines.join('\r\n'),'text/csv;charset=utf-8');}
      status.textContent=`${rows.length}건의 ${format.toUpperCase()} 다운로드를 요청했습니다. 기존 기록은 유지됩니다.`;
    }catch(e){status.textContent='내보내기 실패: 브라우저 다운로드 권한을 확인하세요.';}
  }
  document.getElementById('zf18ExportJson').addEventListener('click',()=>exportRecords('json'));
  document.getElementById('zf18ExportCsv').addEventListener('click',()=>exportRecords('csv'));
  stage.addEventListener('change',draw);difficulty.addEventListener('change',draw);
  window.addEventListener('zf:combat-finished',()=>queueMicrotask(()=>setTimeout(draw,0)));
  function applyCompact(on){document.body.classList.toggle('zf18-compact-hud',on);compact.checked=on;}
  try{applyCompact(localStorage.getItem(HUD_KEY)==='true');}catch(_){applyCompact(false);}
  compact.addEventListener('change',()=>{applyCompact(compact.checked);try{localStorage.setItem(HUD_KEY,String(compact.checked));status.textContent='HUD 설정을 저장했습니다.';}catch(_){status.textContent='HUD 설정을 저장할 수 없습니다. 현재 화면에는 적용했습니다.';}});
  draw();
})();
