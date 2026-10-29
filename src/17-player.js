/* ================= PLAYER UPDATE ================= */
function updatePlayer(dt,rdt){
  const s=settings.sens*(isTouch?.0055:.0024);
  P.yaw-=input.ldx*s;P.pitch=clamp(P.pitch-input.ldy*s,-1.25,1.25);
  const looked=Math.abs(input.ldx)+Math.abs(input.ldy);
  vm.swayX=clamp((vm.swayX||0)+input.ldx*.0006,-.05,.05);vm.swayY=clamp((vm.swayY||0)+input.ldy*.0006,-.05,.05);
  input.ldx=input.ldy=0;
  if(isTouch&&settings.assist&&!P.dead){
    lookDir(_fw);let best=null,ba=.13;
    for(const e of enemies){if(e.dead||e.spawnT>0)continue;const sph=e.T.sph[Math.min(1,e.T.sph.length-1)];
      _d.set(e.pos.x-camera.position.x,e.pos.y+sph[0]-camera.position.y,e.pos.z-camera.position.z);const d=_d.length();if(d>45)continue;
      const a=Math.acos(clamp(_d.dot(_fw)/d,-1,1));if(a<ba){ba=a;best=_d.clone()}}
    if(best){const ty=Math.atan2(-best.x,-best.z),tp=Math.atan2(best.y,Math.hypot(best.x,best.z));
      const k=(input.fire?3.2:1.2)*(1-ba/.13)*rdt*(looked>0?.6:1);P.yaw+=angDiff(P.yaw,ty)*Math.min(1,k);P.pitch+=(tp-P.pitch)*Math.min(1,k*.7)}
  }
  if(P.lunge){const L=P.lunge;L.t+=rdt;const k=Math.min(1,L.t/L.dur);P.pos.lerpVectors(L.from,L.to,k*k);if(k>=1){P.lunge=null;if(!L.e.dead)finishExecution(L.e)}}
  else if(P.dashT>0){
    P.dashT-=dt;P.vel.copy(P.dashDir).multiplyScalar(40);
    if(Math.random()<.6)SMK.emit(P.pos.x,.2,P.pos.z,rand(-1,1),rand(.3,1),rand(-1,1),.6,.4,1.2,.3,.22,.18,.4,0,1);
    for(const e of enemies){if(e.dead||e.spawnT>0||P.dashHits.has(e))continue;
      if(e.T.fly&&e.pos.y>3.2)continue;
      const d=Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z);
      if(d<e.T.radius+1){P.dashHits.add(e);e.knock.addScaledVector(P.dashDir,20*e.T.knock);if(!e.T.boss)e.stun=Math.max(e.stun,.7);
        sparks(_t.set(e.pos.x,1.2,e.pos.z),16,10,[5,2.4,.6]);bloodSpray(_t,P.dashDir,8);
        damageEnemy(e,e.T.boss?60:75,'dash',P.dashDir);shake=.55;hitStop=.05;sfx('flail');vib(40);
        if(e===P.dashTarget||e.T.radius>1){P.dashT=0;P.vel.multiplyScalar(-.15)}}}
    if(P.dashTarget&&!P.dashTarget.dead){const tg=P.dashTarget;P.dashDir.set(tg.pos.x-P.pos.x,0,tg.pos.z-P.pos.z).normalize()}
  }else{
    let ix=input.mx+(input.keys.r||0)-(input.keys.l||0),iz=input.mz+(input.keys.b||0)-(input.keys.f||0);
    const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il}
    const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
    const sp=10.5*(input.shield?.62:1)*(P.dead?0:1);
    const tx=(cs*ix+sn*iz)*sp,tz=(-sn*ix+cs*iz)*sp;
    const a=1-Math.exp(-13*dt);P.vel.x+=(tx-P.vel.x)*a;P.vel.z+=(tz-P.vel.z)*a;
  }
  if(!P.lunge)P.pos.addScaledVector(P.vel,dt);
  worldPush(P.pos,.5);
  if(WORLD.lava.length&&!P.dead&&lavaAt(P.pos.x,P.pos.z)){P.lavaT-=dt;if(P.lavaT<=0){P.lavaT=.25;if(P.invuln<=0){hurt(6);showTip('lava','Лава обжигает: <b>не стой</b> в ней')}fireBurst(_t.set(P.pos.x,.2,P.pos.z),5,3,.5,.4,[5,1.5,.3])}}
  for(const e of enemies){if(e.dead||e.spawnT>0||(e.T.fly&&e.pos.y>2.5))continue;const px=P.pos.x-e.pos.x,pz=P.pos.z-e.pos.z,pd=Math.hypot(px,pz),mr=e.T.radius+.5;if(pd<mr&&pd>0){P.pos.x=e.pos.x+px/pd*mr;P.pos.z=e.pos.z+pz/pd*mr}}
  P.invuln=Math.max(0,P.invuln-rdt);P.dashCd=Math.max(0,P.dashCd-dt);P.fireCd-=dt;P.swapT=Math.max(0,P.swapT-dt);
  if(P.melee<3){P.meleeRe+=dt;if(P.meleeRe>=3.2){P.meleeRe=0;P.melee++}}else P.meleeRe=0;
  if(P.meleeAnim>0)P.meleeAnim-=dt;
  if(P.meleePending>0){P.meleePending-=dt;if(P.meleePending<=0){P.meleePending=-1;meleeHit()}}
  P.shield=input.shield&&!P.dead;
  if(input.fire&&P.fireCd<=0&&!P.shield&&P.meleeAnim<=0&&P.swapT<=0&&!P.dead&&!P.lunge&&P.dashT<=0)fire();
  P.vig=Math.max(0,P.vig-dt*1.4);P.recoil=Math.max(0,P.recoil-dt*(P.weapon?2.5:9));P.flash-=rdt;
  chainT-=dt;if(chainT<=0){chain=0;mult=1}
  const hs=Math.hypot(P.vel.x,P.vel.z);P.bob+=hs*dt*1.1;
  shake=Math.max(0,shake-rdt*2.2);const sk=shake*shake*(settings.shake?.35:.08);
  camera.position.set(P.pos.x+rand(-sk,sk),EYE+Math.sin(P.bob*2)*.045*Math.min(1,hs/8)+rand(-sk,sk)-(P.dead?Math.min(1.2,P.deadT*2):0),P.pos.z+rand(-sk,sk));
  camera.rotation.set(P.pitch+P.recoil*.012,P.yaw,P.dead?Math.min(.6,P.deadT):0);
  const fov=80+(P.dashT>0?10:0)+(P.lunge?8:0);if(Math.abs(camera.fov-fov)>.1){camera.fov=lerp(camera.fov,fov,1-Math.exp(-12*rdt));camera.updateProjectionMatrix()}
  camLight.intensity=P.flash>0?(P.weapon?4:2.2):0;
  updateSun(P.pos);
}
function updateViewmodel(rdt){
  const hs=Math.min(1,Math.hypot(P.vel.x,P.vel.z)/10);
  const bx=Math.sin(P.bob)*.018*hs,by=-Math.abs(Math.cos(P.bob))*.016*hs;
  vm.swayX=(vm.swayX||0)*Math.exp(-8*rdt);vm.swayY=(vm.swayY||0)*Math.exp(-8*rdt);
  const sw=P.swapT>0?Math.sin(P.swapT/.32*Math.PI)*.5:0;
  const rc=P.recoil;
  const sk=(P.shieldK=lerp(P.shieldK,(P.shield||P.dashT>0)?1:0,1-Math.exp(-20*rdt)));
  for(const [g,i] of [[vm.shred,0],[vm.shot,1]]){g.visible=P.weapon===i&&!P.dead;
    g.position.set(.34+bx-vm.swayX+sk*.08,-.33+by+vm.swayY-sw-rc*.03-sk*.12-(P.meleeAnim>0?.15:0),-.72+rc*(i?.14:.05));
    g.rotation.set(rc*(i?.3:.06),vm.swayX*2,0)}
  if(P.weapon===0)vm.drum.rotation.z+=rdt*(input.fire&&!P.shield?28:2);
  vm.shield.visible=sk>.02&&!P.dead;
  vm.shield.position.set(lerp(-.75,-.2,sk),lerp(-.75,-.12,sk)+by,-.62);vm.shield.rotation.set(0,lerp(.9,.25,sk),0);
  vm.teeth.rotation.z+=rdt*(P.dashT>0?40:8);
  if(P.meleeAnim>0||P.lunge){const k=P.lunge?.15:1-P.meleeAnim/.4;vm.flail.visible=true;
    vm.flail.position.set(lerp(.5,-.15,k),lerp(.05,-.25,k),-.55);vm.flail.rotation.set(lerp(.9,-.6,k),lerp(-.6,.7,k),lerp(-.8,.9,k))}
  else vm.flail.visible=false;
  vm.mf.visible=P.flash>0&&!P.shield;
  if(vm.mf.visible){const g=P.weapon?vm.shot:vm.shred;vm.mf.position.set(g.position.x,g.position.y+.02,g.position.z-(P.weapon?.82:.72));vm.mf.rotation.z=rand(0,TAU);vm.mf.scale.setScalar(P.weapon?1.6:rand(.7,1))}
  vmFlashL.intensity=P.flash>0?3:0;
}

