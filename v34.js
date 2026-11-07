/* ZERO FRONTIER v34 — non-invasive combat diagnostics and pause-aware HUD. */
'use strict';
(()=>{
 const stage=document.getElementById('battleStage');if(!stage)return;
 const style=document.createElement('style');style.textContent=`
 #battleStage .zf34-diagnostics{position:absolute;top:8px;right:8px;z-index:75;max-width:min(280px,70vw);padding:8px 10px;background:#071425e8;border:1px solid #7591b0;border-radius:9px;color:#e7f5ff;font:11px/1.5 ui-monospace,monospace;pointer-events:auto}
 #battleStage .zf34-diagnostics[hidden]{display:none!important}
 #battleStage .zf34-diag-toggle{position:absolute;top:8px;right:8px;z-index:74;font:11px system-ui;padding:5px 9px;min-height:32px;opacity:.82}
 #battleStage .zf34-diagnostics button{font-size:11px;padding:4px 7px;margin-top:4px}
 @media (pointer:coarse){#battleStage .zf34-diag-toggle{top:42px}#battleStage .zf34-diagnostics{top:42px}}
 `;document.head.append(style);
 const toggle=document.createElement('button');toggle.className='zf34-diag-toggle';toggle.type='button';toggle.textContent='진단';toggle.setAttribute('aria-label','전투 이벤트 진단 열기');
 const panel=document.createElement('div');panel.className='zf34-diagnostics';panel.hidden=true;panel.innerHTML='<strong>전투 이벤트 진단 · v34</strong><div class="zf34-stats" aria-live="off"></div><button type="button" class="zf34-export">JSON 저장</button> <button type="button" class="zf34-close">닫기</button>';
 stage.append(toggle,panel);const stats=panel.querySelector('.zf34-stats');const counts={shot:0,damage:0,switch:0,'reload-start':0,'reload-complete':0,pause:0,resume:0,skill:0};let events=[],paused=false,started=performance.now(),lastRender=0;
 function record(type,detail={}){if(!(type in counts))return;counts[type]++;events.push({t:Math.round(performance.now()-started),type,detail});if(events.length>120)events.shift();refresh();}
 window.ZF34CombatEvent=record;
 window.addEventListener('zf:skill-used',e=>record('skill',{skill:e.detail?.skill||'unknown'}));
 function refresh(){if(panel.hidden)return;const now=performance.now();if(now-lastRender<120)return;lastRender=now;stats.textContent=`사격 ${counts.shot} · 피격 ${counts.damage} · 전환 ${counts.switch} · 스킬 ${counts.skill} | 재장전 ${counts['reload-start']}/${counts['reload-complete']} · 일시정지 ${counts.pause}/${counts.resume}${paused?' · PAUSED':''}`;}
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.hidden=!panel.hidden;refresh();});
 panel.querySelector('.zf34-close').addEventListener('click',()=>{panel.hidden=true;toggle.hidden=false;});
 panel.querySelector('.zf34-export').addEventListener('click',()=>{const data={version:34,created:new Date().toISOString(),counts,events};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='zero-frontier-v34-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 // v33's progress is based on the combat clock, not an independent timeout. Freeze it on pause.
 const progress=stage.querySelector('.zf33-reload');
 const prev=window.ZF33ReloadObserver;
 if(typeof prev==='function')window.ZF33ReloadObserver=function(data){if(paused)return;prev(data);};
 const originalRecord=window.ZF34CombatEvent;
 window.ZF34CombatEvent=(type,detail)=>{if(type==='pause'){paused=true;if(progress&&!progress.hidden){progress.dataset.zf34Paused='true';const label=progress.querySelector('.zf33-label');if(label&&!label.textContent.includes('일시정지'))label.textContent+=' · 일시정지';}}else if(type==='resume'){paused=false;if(progress)delete progress.dataset.zf34Paused;}originalRecord(type,detail);};
 // Avoid decorative overlays intercepting aim/fire pointers. Buttons remain independently operable.
 for(const node of stage.querySelectorAll('.zf29-shot,.zf33-hit,.zf28-effect,.zf30-flash'))node.style.pointerEvents='none';
 window.addEventListener('zf:combat-finished',()=>{paused=false;});
})();
