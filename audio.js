'use strict';
(()=>{
const base='assets/audio/';
const files={shot:'sfx_45.mp3',shell:'sfx_56.mp3',hit:'sfx_10.mp3',empty:'sfx_42.mp3',ready:'sfx_43.mp3',reload:'sfx_41.mp3',enemy:'sfx_63.mp3',victory:'sfx_20.mp3',defeat:'sfx_12.mp3',ambient:'sfx_62.mp3'};
// Files are indexed against the original archive. See assets/audio/catalog.json.
const button=document.getElementById('sound');let enabled=false,ambient=null;const pool=new Map();
function get(name){const src=base+files[name];if(!files[name])return null;if(!pool.has(name)){const a=new Audio(src);a.preload='none';pool.set(name,a);}return pool.get(name);}
function play(name,volume=.5){if(!enabled)return;const proto=get(name);if(!proto)return;const a=proto.cloneNode();a.volume=Math.max(0,Math.min(1,volume));a.play().catch(()=>{});a.addEventListener('ended',()=>{a.src='';},{once:true});}
function setAmbient(on){if(!on||!enabled){if(ambient){ambient.pause();ambient.currentTime=0;}return;}if(!ambient){ambient=get('ambient');ambient.loop=true;ambient.volume=.14;}ambient.play().catch(()=>{});}
function setEnabled(on){enabled=Boolean(on);button.textContent=enabled?'♪ ON':'♪ OFF';button.setAttribute('aria-pressed',String(enabled));if(!enabled)setAmbient(false);else if(document.getElementById('combat').classList.contains('active'))setAmbient(true);}
button.addEventListener('click',()=>setEnabled(!enabled));
window.ZFAudio={play,setAmbient,isEnabled:()=>enabled};setEnabled(false);
})();
