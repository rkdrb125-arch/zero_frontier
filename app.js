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

// v15 options live in a new key; v1 settings and v9 progress are unchanged.
const zfV15Key='zero_frontier_v15_options';
const zfV15Defaults={difficulty:'normal',aimSensitivity:1,fireMode:'hold',largeControls:false};
function zfV15Sanitize(v){return {difficulty:['easy','normal','hard'].includes(v?.difficulty)?v.difficulty:'normal',aimSensitivity:[.7,1,1.35].includes(Number(v?.aimSensitivity))?Number(v.aimSensitivity):1,fireMode:v?.fireMode==='tap'?'tap':'hold',largeControls:v?.largeControls===true};}
let zfV15Options={...zfV15Defaults};
try{zfV15Options=zfV15Sanitize(JSON.parse(localStorage.getItem(zfV15Key)||'null'));}catch(_){}
const zfV15Inputs={difficulty:document.getElementById('zfOptionDifficulty'),stageDifficulty:document.getElementById('zfDifficulty'),aimSensitivity:document.getElementById('zfAimSensitivity'),fireMode:document.getElementById('zfFireMode'),largeControls:document.getElementById('zfLargeControls')};
function zfV15Apply(){zfV15Inputs.difficulty.value=zfV15Options.difficulty;zfV15Inputs.stageDifficulty.value=zfV15Options.difficulty;zfV15Inputs.aimSensitivity.value=String(zfV15Options.aimSensitivity);zfV15Inputs.fireMode.value=zfV15Options.fireMode;zfV15Inputs.largeControls.checked=zfV15Options.largeControls;document.body.classList.toggle('zf-large-controls',zfV15Options.largeControls);}
function zfV15Save(){try{localStorage.setItem(zfV15Key,JSON.stringify(zfV15Options));}catch(e){document.getElementById('zfDifficultyHint').textContent='설정 저장 실패 · 브라우저 저장 공간을 확인하세요';}zfV15Apply();}
for(const key of ['difficulty','stageDifficulty','aimSensitivity','fireMode','largeControls'])zfV15Inputs[key].addEventListener('change',()=>{const input=zfV15Inputs[key];zfV15Options=zfV15Sanitize({...zfV15Options,[key==='stageDifficulty'?'difficulty':key]:key==='largeControls'?input.checked:input.value});zfV15Save();});
document.getElementById('resetSettings').addEventListener('click',()=>{zfV15Options={...zfV15Defaults};zfV15Save();});
zfV15Apply();window.ZFV15={get:()=>({...zfV15Options})};
