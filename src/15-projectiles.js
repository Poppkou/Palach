/* ================= PROJECTILES ================= */
function updateProjs(dt){
  const counts=[0,0,0];
  for(let i=projs.length-1;i>=0;i--){
    const p=projs[i];p.life-=dt;p.t+=dt;
    if(p.homing&&!p.homing.dead){_t.set(p.homing.pos.x,p.homing.pos.y+p.homing.T.sph[0][0]+.3,p.homing.pos.z).sub(p.pos).setLength(32);p.vel.lerp(_t,1-Math.exp(-7*dt))}
    p.pos.addScaledVector(p.vel,dt);
    let dead=p.life<=0||p.pos.y<.05||p.pos.y>30;
    if(!dead&&worldSolid(p.pos.x,p.pos.y,p.pos.z))dead=true;
    if(!dead&&p.kind===2){
      for(const e of enemies){if(e.dead||e.spawnT>0)continue;let h=false;
        for(const s of e.T.sph){const dx=p.pos.x-e.pos.x,dy=p.pos.y-e.pos.y-s[0],dz=p.pos.z-e.pos.z,r=s[1]+p.r;if(dx*dx+dy*dy+dz*dz<r*r){h=true;break}}
        if(h){dead=true;explosion(p.pos,.7);sfx('boom');
          if(e.T.boss){e.parryHits++;if(e.parryHits>=3){e.parryHits=0;e.stagger=3.2;e.wind=0;e.burstN=0;sfx('stagger');showMsg(e.T.title+' ОШЕЛОМЛЁН','КАЗНИ ЕГО ЦЕПОМ',2)}}
          else if(e.type!=='imp'&&!e.dead&&e.hp>p.dmg){stagger(e,2.6)}
          damageEnemy(e,p.dmg,'parry',p.vel.clone().normalize());crossHit(e.dead);break}}
    }else if(!dead&&state==='playing'){
      const dx=p.pos.x-P.pos.x,dz=p.pos.z-P.pos.z,r=.55+p.r;
      if(dx*dx+dz*dz<r*r&&p.pos.y<2.1){
        if(P.invuln>0){}
        else if(input.shield&&frontDot(p.pos.x,p.pos.z)>.15){
          if(p.kind===1&&time-P.shieldRaise<PARRY_WIN){
            p.kind=2;p.dmg=p.owner&&p.owner.T.boss?160:130;p.life=4;p.homing=(p.owner&&!p.owner.dead)?p.owner:nearestEnemy(p.pos);
            p.vel.set(-p.vel.x,-p.vel.y*.2,-p.vel.z).setLength(30);parryFx();sparks(p.pos,24,10,[1,5,1.4]);
            for(const e of enemies)if(!e.dead&&Math.hypot(e.pos.x-P.pos.x,e.pos.z-P.pos.z)<6)e.stun=Math.max(e.stun,.5);
          }else{dead=true;sfx('block');hurt(p.kind===1?0:p.dmg*.12);sparks(p.pos,10,7,PROJ_HOT[p.kind]);shake=Math.max(shake,.12)}
        }else{dead=true;hurt(p.dmg);fireBurst(p.pos,10,4,.6,.3,PROJ_HOT[p.kind])}
      }
    }
    if(dead){if(p.life>0){fireBurst(p.pos,8,4,.7,.35,PROJ_HOT[p.kind]);smoke(p.pos,2,.6,[.1,.07,.06],.9,.6);if(p.pos.y<.2)decal(p.pos.x,p.pos.z,.8,true)}
      projs[i]=projs[projs.length-1];projs.pop();continue}
    const k=p.kind,ci=counts[k]++,hc=PROJ_HOT[k];
    dummy.position.copy(p.pos);dummy.rotation.set(0,0,0);dummy.scale.setScalar(p.r*.75);dummy.updateMatrix();projCore[k].setMatrixAt(ci,dummy.matrix);
    FX.once(p.pos.x,p.pos.y,p.pos.z,p.r*(4+Math.sin(p.t*30)*.5),hc[0]*.5,hc[1]*.5,hc[2]*.5,1);
    if(Math.random()<.7)FX.emit(p.pos.x+rand(-.1,.1),p.pos.y+rand(-.1,.1),p.pos.z+rand(-.1,.1),p.vel.x*.05,rand(.3,.8),p.vel.z*.05,rand(.2,.35),p.r*2.4,p.r*.5,hc[0],hc[1],hc[2],.9,0,1);
  }
  for(let k=0;k<3;k++){projCore[k].count=counts[k];projCore[k].instanceMatrix.needsUpdate=true}
}
function nearestEnemy(pos){let b=null,bd=1e9;for(const e of enemies){if(e.dead)continue;const d=e.pos.distanceToSquared(pos);if(d<bd){bd=d;b=e}}return b}
function updateFX(dt){
  let tn=0;
  for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.d+=t.sp*dt;if(t.d-3>t.len){tracers.splice(i,1);continue}
    const h=Math.min(t.d,t.len),tl=Math.max(0,t.d-3),len=h-tl;if(len<=0)continue;
    _d.subVectors(t.b,t.a).normalize();dummy.position.copy(t.a).addScaledVector(_d,(h+tl)/2);dummy.lookAt(_t.copy(t.a).addScaledVector(_d,h+1));
    dummy.scale.set(1,1,len);dummy.updateMatrix();tracerMesh.setMatrixAt(tn++,dummy.matrix)}
  tracerMesh.count=tn;tracerMesh.instanceMatrix.needsUpdate=true;
  // portals: swirling hellfire columns
  for(let i=portals.length-1;i>=0;i--){const q=portals[i];q.t+=dt;const k=q.t/q.dur;if(k>=1){portals.splice(i,1);continue}
    const n=Math.ceil(2.5*q.sc);for(let j=0;j<n;j++){const a=rand(0,TAU),r=q.sc*(1-k*.4)*rand(.7,1.1);
      FX.emit(q.x+Math.cos(a)*r,.1,q.z+Math.sin(a)*r,-Math.sin(a)*3,rand(3,7)*q.sc,Math.cos(a)*3,rand(.25,.5),.55*q.sc,.15,3.2,.9,.2,1,-2,1.5)}
    if(Math.random()<.5)smoke(_t.set(q.x,.5,q.z),1,1.4*q.sc,[.06,.03,.03],1.2,2)}
  // ambient fire: braziers, torches
  for(const f of WORLD.fireSpots){const fdx=f.p.x-P.pos.x,fdz=f.p.z-P.pos.z;if(fdx*fdx+fdz*fdz>3600)continue;const k=f.k||.6,n=Math.random()<dt*60*k?1+(k>1?1:0):0;
    for(let j=0;j<n;j++)FX.emit(f.p.x+rand(-.35,.35)*k,f.p.y,f.p.z+rand(-.35,.35)*k,rand(-.2,.2),rand(1.5,2.6)*Math.max(.6,k),rand(-.2,.2),rand(.45,.8),.9*Math.max(.5,k),.15,4.5,1.4,.25,1,-1.2,1.2);
    if(k>1&&Math.random()<dt*3)smoke(_t.set(f.p.x,f.p.y+1.5,f.p.z),1,1.6,[.07,.05,.05],2.5,1.5);
    if(Math.random()<dt*4*k)FX.emit(f.p.x,f.p.y+.4,f.p.z,rand(-1,1),rand(2,4),rand(-1,1),rand(1.5,3),.07,.04,6,2.4,.6,1,-.6,.3)}
  // drifting embers around the player
  if(Math.random()<dt*30){const a=rand(0,TAU),r=rand(3,22);FX.emit(P.pos.x+Math.cos(a)*r,rand(0,4),P.pos.z+Math.sin(a)*r,rand(-.5,.5),rand(.4,1.2),rand(-.5,.5),rand(3,6),.06,.03,5,1.8,.4,1,-.05,.2)}
  // shockwaves
  for(let i=waves.length-1;i>=0;i--){const w=waves[i];w.r+=w.sp*dt;w.mesh.position.set(w.x,.25,w.z);w.mesh.scale.set(w.r,1,w.r);w.mesh.material.opacity=.9*(1-w.r/w.max);
    if(Math.random()<.8){const a=rand(0,TAU);SMK.emit(w.x+Math.cos(a)*w.r,.3,w.z+Math.sin(a)*w.r,Math.cos(a)*3,rand(.5,1.5),Math.sin(a)*3,.8,.8,2,.3,.2,.15,.5,0,1)}
    const pd=Math.hypot(P.pos.x-w.x,P.pos.z-w.z);if(!w.hit&&Math.abs(pd-w.r)<.7){w.hit=true;if(P.invuln<=0){hurt(input.shield?10:24);showTip('wave','Ударную волну проходи <b>РЫВКОМ</b>: он неуязвим')}}
    if(w.r>=w.max){scene.remove(w.mesh);w.mesh.material.dispose();waves.splice(i,1)}}
  FX.update(dt);SMK.update(dt);updateGore(dt);updateDecals(dt);
}
const PICK_GEO=new THREE.OctahedronGeometry(.24,0);
const PICK_MAT={hp:new THREE.MeshBasicMaterial({color:new THREE.Color(4,.5,.7),toneMapped:false}),ar:new THREE.MeshBasicMaterial({color:new THREE.Color(4,2.6,.5),toneMapped:false}),am:new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.4,4.5),toneMapped:false})};
const PICK_HOT={hp:[2,.3,.4],ar:[2,1.3,.2],am:[.4,1.2,2.4]};
function spawnPickup(kind,at){
  if(pickups.length>40){const o=pickups.shift();scene.remove(o.m)}
  const m=new THREE.Mesh(PICK_GEO,PICK_MAT[kind]);m.position.set(at.x,Math.max(1,at.y+1),at.z);scene.add(m);
  pickups.push({kind,m,v:new V3(rand(-3,3),rand(4,7),rand(-3,3)),t:0});
}
function needs(k){return k==='hp'?P.hp<P.maxHp:k==='ar'?P.armor<P.maxArmor:(P.ammo[0]<P.maxAmmo[0]||P.ammo[1]<P.maxAmmo[1])}
function updatePickups(dt){
  for(let i=pickups.length-1;i>=0;i--){const q=pickups[i];q.t+=dt;const m=q.m;
    const dx=P.pos.x-m.position.x,dz=P.pos.z-m.position.z,dy=P.pos.y+1-m.position.y,d=Math.hypot(dx,dy,dz);
    if(q.t>.35&&d<6&&needs(q.kind)&&!P.dead){q.v.lerp(_t.set(dx,dy,dz).setLength(22),1-Math.exp(-8*dt))}
    else{q.v.y-=18*dt;q.v.x*=Math.exp(-2*dt);q.v.z*=Math.exp(-2*dt)}
    m.position.addScaledVector(q.v,dt);if(m.position.y<.45){m.position.y=.45;q.v.y=Math.abs(q.v.y)*.3}
    m.rotation.y+=dt*3;m.rotation.x=.3;
    const h=PICK_HOT[q.kind];FX.once(m.position.x,m.position.y,m.position.z,1.1,h[0]*.6,h[1]*.6,h[2]*.6,1);
    if(d<1.3&&needs(q.kind)&&!P.dead){
      if(q.kind==='hp')P.hp=Math.min(P.maxHp,P.hp+7);else if(q.kind==='ar')P.armor=Math.min(P.maxArmor,P.armor+10);else{P.ammo[0]=Math.min(P.maxAmmo[0],P.ammo[0]+30);P.ammo[1]=Math.min(P.maxAmmo[1],P.ammo[1]+4)}
      sfx('pickup');scene.remove(m);pickups.splice(i,1);continue}
    if(q.t>18){scene.remove(m);pickups.splice(i,1)}
  }
}

