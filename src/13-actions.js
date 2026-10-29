/* ================= PLAYER ACTIONS ================= */
const WEAP=[{name:'КРОМСАТЕЛЬ',cd:.092,pellets:1,spread:.02,dmg:13},{name:'ДВУСТВОЛКА',cd:.88,pellets:10,spread:.085,dmg:12}];
const _fw=new V3(),_rt=new V3(),_upv=new V3(),_d=new V3(),_o=new V3(),_t=new V3(),_t2=new V3();
function lookDir(out){const cp=Math.cos(P.pitch);return out.set(-Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp)}
function swapWeapon(){if(P.swapT>0||state!=='playing')return;P.weapon^=1;P.swapT=.32;P.fireCd=Math.max(P.fireCd,.2);sfx('click')}
function raycast(o,d,maxT,assist){
  let t=worldRay(o,d,maxT),hitE=null;
  for(const e of enemies){if(e.dead||e.spawnT>0)continue;
    for(const s of e.T.sph){const cx=e.pos.x-o.x,cy=e.pos.y+s[0]-o.y,cz=e.pos.z-o.z;const rr=s[1]*assist;
      const tca=cx*d.x+cy*d.y+cz*d.z;if(tca<0)continue;const d2=cx*cx+cy*cy+cz*cz-tca*tca;if(d2>rr*rr)continue;
      const th=tca-Math.sqrt(rr*rr-d2);if(th<t){t=th;hitE=e}}}
  return {t,e:hitE};
}
function muzzle(out){lookDir(_fw);_rt.set(Math.cos(P.yaw),0,-Math.sin(P.yaw));return out.copy(camera.position).addScaledVector(_fw,.75).addScaledVector(_rt,.27).add(_t2.set(0,-.21,0))}
function fire(){
  const w=WEAP[P.weapon];
  if(P.ammo[P.weapon]<=0){if(P.ammo[P.weapon^1]>0){swapWeapon();return}sfx('click');P.fireCd=.35;showPop('НЕТ ПАТРОНОВ: БЕЙ ЦЕПОМ');return}
  P.ammo[P.weapon]--;P.fireCd=w.cd;
  lookDir(_fw);_rt.set(Math.cos(P.yaw),0,-Math.sin(P.yaw));_upv.crossVectors(_rt,_fw);
  _o.copy(camera.position);
  const hits=new Map();const assist=isTouch&&settings.assist?1.35:1.1;
  const mz=muzzle(new V3());
  for(let i=0;i<w.pellets;i++){
    const ang=Math.random()*TAU,rr=Math.sqrt(Math.random())*w.spread;
    _d.copy(_fw).addScaledVector(_rt,Math.cos(ang)*rr).addScaledVector(_upv,Math.sin(ang)*rr).normalize();
    const r=raycast(_o,_d,90,assist);
    const hp=_t.copy(_o).addScaledVector(_d,r.t);
    if(i<4||P.weapon===0)addTracer(mz,hp);
    if(r.e){hits.set(r.e,(hits.get(r.e)||0)+w.dmg);if(i<4)bloodSpray(hp,_d,3)}
    else if(i<5){sparks(hp,4,6,[5,2.5,.8]);if(Math.random()<.5)smoke(hp,1,.4,[.25,.2,.18],.8,.5)}
  }
  let kill=false;
  for(const [e,dmg] of hits){if(damageEnemy(e,dmg,'gun',_fw))kill=true}
  if(hits.size)crossHit(kill);
  P.recoil=Math.min(1.2,P.recoil+(P.weapon?1:.35));P.flash=.05;
  shake=Math.max(shake,P.weapon?.22:.05);
  FX.emit(mz.x,mz.y,mz.z,0,0,0,.05,P.weapon?1.2:.5,P.weapon?1.6:.7,5,2.4,.8,1,0,0);
  if(P.weapon===1){vib(25);smoke(mz,3,.5,[.2,.17,.15],.9,.6);P.vel.addScaledVector(_fw.setY(0).normalize(),-3)}
  sfx(P.weapon?'shotgun':'shred');
}
function addTracer(a,b){if(tracers.length>70)tracers.shift();const len=a.distanceTo(b);tracers.push({a:a.clone(),b:b.clone(),len,d:0,sp:P.weapon?160:130})}
function frontDot(x,z){const dx=x-P.pos.x,dz=z-P.pos.z,l=Math.hypot(dx,dz)||1;return(-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/l}
function execTarget(){
  let best=null,bd=1e9;
  for(const e of enemies){if(e.dead||e.stagger<=0)continue;const d=Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z)-e.T.radius;
    if(d<5&&(frontDot(e.pos.x,e.pos.z)>.25||d<1.6)&&d<bd){bd=d;best=e}}
  return best;
}
function doMelee(){
  if(state!=='playing'||P.meleeAnim>0||P.lunge)return;
  const tg=execTarget();
  if(tg){
    const dx=tg.pos.x-P.pos.x,dz=tg.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;
    P.lunge={t:0,dur:.14,from:P.pos.clone(),to:new V3(tg.pos.x-dx/d*(tg.T.radius+1),0,tg.pos.z-dz/d*(tg.T.radius+1)),e:tg};
    P.invuln=Math.max(P.invuln,.7);P.meleeAnim=.45;P.yaw=Math.atan2(-dx,-dz);sfx('swish');return;
  }
  if(P.melee<=0){sfx('click');return}
  P.melee--;P.meleeAnim=.4;P.meleePending=.11;sfx('swish');
}
function meleeHit(){
  lookDir(_fw);let hit=false,kill=false;
  for(const e of enemies){if(e.dead||e.spawnT>0)continue;
    const dx=e.pos.x-P.pos.x,dz=e.pos.z-P.pos.z,d=Math.hypot(dx,dz)-e.T.radius;
    if(d<4.4&&(frontDot(e.pos.x,e.pos.z)>.3||d<1.4)){
      hit=true;_d.set(dx,0,dz).normalize();
      e.knock.addScaledVector(_d,16*e.T.knock);if(!e.T.boss)e.stun=Math.max(e.stun,.5);
      bloodSpray(_t.set(e.pos.x,e.pos.y+e.T.sph[1%e.T.sph.length][0],e.pos.z),_d,10);
      if(damageEnemy(e,e.T.boss?80:100,'flail',_d))kill=true;
    }}
  for(const p of projs){if(p.kind===2)continue;const dx=p.pos.x-P.pos.x,dz=p.pos.z-P.pos.z;if(dx*dx+dz*dz<9&&frontDot(p.pos.x,p.pos.z)>.2){p.life=0;fireBurst(p.pos,8,4,.5,.3,PROJ_HOT[p.kind])}}
  if(hit){sfx('flail');shake=Math.max(shake,.45);hitStop=.06;vib(40);crossHit(kill)}
}
function finishExecution(e){
  sfx('execute');shake=.9;vib(80);slowT=.45;
  bloodSpray(_t.set(e.pos.x,e.pos.y+e.T.sph[1%e.T.sph.length][0],e.pos.z),lookDir(_fw),30);
  if(e.T.boss){damageEnemy(e,520,'execute',lookDir(_fw));e.stagger=0;e.knock.addScaledVector(_fw.setY(0).normalize(),10);for(let i=0;i<3;i++)spawnPickup('hp',e.pos)}
  else{e.hp=0;damageEnemy(e,1,'execute',lookDir(_fw))}
  showPop('КАЗНЬ');
}
function doDash(){
  if(state!=='playing'||P.dashCd>0||P.dashT>0||P.lunge)return;
  lookDir(_fw);let tg=null,bestDot=.96;
  for(const e of enemies){if(e.dead||e.spawnT>0)continue;
    _d.set(e.pos.x-camera.position.x,e.pos.y+e.T.sph[0][0]-camera.position.y,e.pos.z-camera.position.z);const d=_d.length();if(d>26)continue;
    const dt=_d.dot(_fw)/d;if(dt>bestDot){bestDot=dt;tg=e}}
  P.dashHits.clear();
  if(tg){P.dashDir.set(tg.pos.x-P.pos.x,0,tg.pos.z-P.pos.z);const d=P.dashDir.length();P.dashDir.normalize();P.dashT=clamp(d/42,.12,.55);P.dashTarget=tg}
  else{
    const ix=input.mx+(input.keys.r||0)-(input.keys.l||0),iz=input.mz+(input.keys.b||0)-(input.keys.f||0);
    if(Math.hypot(ix,iz)>.25){const s=Math.sin(P.yaw),c=Math.cos(P.yaw);P.dashDir.set(c*ix+s*iz,0,-s*ix+c*iz).normalize()}
    else P.dashDir.set(-Math.sin(P.yaw),0,-Math.cos(P.yaw));
    P.dashT=.2;P.dashTarget=null;
  }
  P.dashCd=1.25;P.invuln=Math.max(P.invuln,P.dashT+.12);sfx('dash');vib(15);
}
function hurt(dmg){
  if(P.invuln>0||P.dead||state!=="playing"||window.__god)return;
  const ab=Math.min(P.armor,dmg*.5);P.armor-=ab;P.hp-=dmg-ab;
  P.vig=Math.min(1,P.vig+dmg/28);shake=Math.max(shake,.3);sfx('hurt');vib(35);
  if(P.hp<=0){P.hp=0;die()}
}

