/* ================= INPUT ================= */
const input={mx:0,mz:0,ldx:0,ldy:0,fire:false,shield:false,keys:{}};
const ptrs=new Map();let joyId=null,joyOX=0,joyOY=0;const JR=58;
const LOOK_KINDS={look:1,fire:1,shield:1,melee:1,dash:1};
const gameEl=$('game');
function showTouch(){if(H.touch.hidden)H.touch.hidden=false}
if(isTouch)showTouch();
gameEl.addEventListener('pointerdown',e=>{
  if(state!=='playing')return;
  const b=e.target.closest('[data-btn]');
  if(e.pointerType==='mouse'){
    if(b){press(b.dataset.btn,true);return}
    if(document.pointerLockElement!==canvas){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(err){}}
    if(e.button===0)input.fire=true;if(e.button===2)setShield(true);
    ptrs.set('mouse',{k:'mouse',x:e.clientX,y:e.clientY});return;
  }
  e.preventDefault();showTouch();
  const id=e.pointerId;
  if(b){const k=b.dataset.btn;ptrs.set(id,{k,x:e.clientX,y:e.clientY,el:b});b.classList.add('on');press(k,true)}
  else if(e.clientX<innerWidth*.45&&joyId===null){joyId=id;joyOX=e.clientX;joyOY=e.clientY;ptrs.set(id,{k:'joy'});
    H.joy.style.left=joyOX+'px';H.joy.style.top=joyOY+'px';H.knob.style.transform='';H.joy.classList.add('show');H.joyHint.style.opacity='0'}
  else ptrs.set(id,{k:'look',x:e.clientX,y:e.clientY});
},{passive:false});
addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){
    if(document.pointerLockElement===canvas){input.ldx+=e.movementX*.9;input.ldy+=e.movementY*.9}
    else{const p=ptrs.get('mouse');if(p){input.ldx+=e.clientX-p.x;input.ldy+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY}}
    return;
  }
  const p=ptrs.get(e.pointerId);if(!p)return;
  if(p.k==='joy'){
    let dx=e.clientX-joyOX,dy=e.clientY-joyOY;const d=Math.hypot(dx,dy);
    if(d>JR){const k=(d-JR)/d;joyOX+=dx*k;joyOY+=dy*k;dx=e.clientX-joyOX;dy=e.clientY-joyOY;H.joy.style.left=joyOX+'px';H.joy.style.top=joyOY+'px'}
    input.mx=dx/JR;input.mz=dy/JR;H.knob.style.transform=`translate(${dx}px,${dy}px)`;
  }else if(LOOK_KINDS[p.k]){input.ldx+=e.clientX-p.x;input.ldy+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY}
});
function endPtr(e){
  if(e.pointerType==='mouse'){if(e.button===0)input.fire=false;if(e.button===2)setShield(false);ptrs.delete('mouse');return}
  const p=ptrs.get(e.pointerId);if(!p)return;ptrs.delete(e.pointerId);
  if(p.k==='joy'){joyId=null;input.mx=input.mz=0;H.joy.classList.remove('show')}
  else if(p.el){p.el.classList.remove('on');press(p.k,false)}
}
addEventListener('pointerup',endPtr);addEventListener('pointercancel',endPtr);
gameEl.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
function setShield(v){if(v&&!input.shield)P.shieldRaise=time;input.shield=v}
function press(k,down){
  if(k==='fire')input.fire=down;
  else if(k==='shield')setShield(down);
  else if(down&&k==='melee')doMelee();
  else if(down&&k==='dash')doDash();
  else if(down&&k==='swap')swapWeapon();
  else if(down&&k==='pause')pauseGame();
}
const KEYMAP={KeyW:'f',ArrowUp:'f',KeyS:'b',ArrowDown:'b',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(state==='dialog'){if(e.code==='Space'||e.code==='Enter'||e.code==='KeyE'){e.preventDefault();dialogNext()}return}
  if(e.code==='Escape'||e.code==='KeyP'){if(state==='playing')pauseGame();else if(state==='paused')resumeGame();return}
  if(state!=='playing')return;
  if(KEYMAP[e.code])input.keys[KEYMAP[e.code]]=1;
  if(e.code==='Space'||e.code==='ShiftLeft')doDash();
  if(e.code==='KeyE'||e.code==='KeyF'||e.code==='KeyV')doMelee();
  if(e.code==='KeyQ'||e.code==='Digit1'&&P.weapon!==0||e.code==='Digit2'&&P.weapon!==1)swapWeapon();
  if(e.code==='KeyC'||e.code==='ControlLeft')setShield(true);
  if(e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])input.keys[KEYMAP[e.code]]=0;if(e.code==='KeyC'||e.code==='ControlLeft')setShield(false)});

// Drop every held touch and key: called whenever the game stops listening (pause, dialog, death, menu).
function resetInput(){
  for(const [id,p] of ptrs){if(p.el)p.el.classList.remove('on')}
  ptrs.clear();joyId=null;input.mx=input.mz=0;input.ldx=input.ldy=0;input.fire=false;input.shield=false;
  for(const k in input.keys)input.keys[k]=0;H.joy.classList.remove('show');
}
