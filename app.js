'use strict';
const screens=[...document.querySelectorAll('.screen')];
function showScreen(id){if(!document.getElementById(id))return;screens.forEach(el=>el.classList.toggle('active',el.id===id));window.scrollTo({top:0,behavior:'instant'});}
document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
const lines=[['기록','수복 구역 외곽. 통신탑에서 정체불명의 신호가 포착되었다.'],['미겔','……이 시간에 통신탑에서?'],['다니엘','정상적인 송신은 아닙니다. 출처를 확인하겠습니다.'],['기록','두 사람은 아직 알지 못했다. 그 신호가 무엇을 깨울지.']];
let line=0;
function renderLine(){document.getElementById('speaker').textContent=lines[line][0];document.getElementById('dialogue').textContent=lines[line][1];document.getElementById('nextLine').textContent=line===lines.length-1?'처음부터 ↺':'다음 대사 →';}
document.getElementById('nextLine').addEventListener('click',()=>{line=(line+1)%lines.length;renderLine();});
document.getElementById('restartStory').addEventListener('click',()=>{line=0;renderLine();});
const settingsKey='zero_frontier_v1_settings';
let settings={fontSize:'normal',reduceMotion:false};
try{const v=JSON.parse(localStorage.getItem(settingsKey)||'null');if(v&&typeof v==='object')settings={fontSize:v.fontSize==='large'?'large':'normal',reduceMotion:v.reduceMotion===true};}catch(e){}
const font=document.getElementById('fontSize'),motion=document.getElementById('reduceMotion');
function applySettings(){font.value=settings.fontSize;motion.checked=settings.reduceMotion;document.body.classList.toggle('large-text',settings.fontSize==='large');document.body.classList.toggle('reduce-motion',settings.reduceMotion);}
function saveSettings(){settings={fontSize:font.value,reduceMotion:motion.checked};localStorage.setItem(settingsKey,JSON.stringify(settings));applySettings();}
font.addEventListener('change',saveSettings);motion.addEventListener('change',saveSettings);
document.getElementById('resetSettings').addEventListener('click',()=>{settings={fontSize:'normal',reduceMotion:false};saveReset();});
function saveReset(){font.value=settings.fontSize;motion.checked=settings.reduceMotion;saveSettings();}
applySettings();
// Audio toggle and playback are initialized in audio.js (v3).
