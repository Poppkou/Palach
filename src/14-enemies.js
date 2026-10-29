/* ================= ENEMIES ================= */
const TYPES={
  imp:{hp:60,speed:6.4,radius:.55,sph:[[.95,.36],[1.42,.4],[1.8,.24]],score:100,knock:1,h:2.1,stride:1.6},
  brute:{hp:170,speed:7.8,radius:.95,sph:[[.9,.55],[1.75,.75],[2.4,.4]],score:250,knock:.6,h:3.1,stride:2.2},
  skull:{hp:35,speed:8,radius:.5,sph:[[0,.48]],score:80,knock:1.4,fly:true,h:.8},
  tank:{hp:480,speed:2.8,radius:1.4,sph:[[1.0,1.0],[1.85,1.15],[2.9,.45]],score:600,knock:.25,h:3.4,stride:1.6},
  boss:{hp:2600,speed:3.3,radius:1.9,sph:[[1.6,.9],[3.0,1.25],[4.3,.6]],score:6000,knock:.08,boss:true,h:6,stride:3,title:'ТИРАН'},
  prince:{hp:4200,speed:3.6,radius:2.3,sph:[[1.9,1.1],[3.6,1.5],[5.2,.72]],score:12000,knock:.05,boss:true,h:7.2,stride:3.6,base:'boss',scale:1.2,title:'КНЯЗЬ ПЕПЛА'},
  spire:{hp:380,speed:0,radius:1.5,sph:[[1.4,1.3],[3.4,1],[5.6,.7]],score:500,knock:0,h:7.5,static:true}
};
const ENEMY_GLOW=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const shadowGeo=new THREE.CircleGeometry(1,16);shadowGeo.rotateX(-Math.PI/2);
const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.42,depthWrite:false});
let diff=1;
function spawnPortal(type,x,z){
  if(x===undefined){
    for(let k=0;k<20;k++){const a=rand(0,TAU),r=rand(19,31);x=Math.cos(a)*r;z=Math.sin(a)*r;
      if(Math.hypot(x-P.pos.x,z-P.pos.z)<13)continue;let ok=true;for(const p of WORLD.circles)if(Math.hypot(x-p.x,z-p.z)<p.r+2)ok=false;if(ok)break}
  }
  const e=makeEnemy(type,x,z);e.spawnT=.9;
  const sc=TYPES[type].boss?2.6:type==='spire'?2:type==='tank'?1.7:type==='brute'?1.25:1;
  portals.push({x,z,t:0,dur:1.1,sc});decal(x,z,2.4*sc,true);
  sfx('portal');
  return e;
}
function makeMesh(geo,mat,cast){const m=new THREE.Mesh(geo,mat);m.castShadow=cast&&!!QP.shadow;m.receiveShadow=QUAL==='high';return m}
function makeEnemy(type,x,z){
  const T=TYPES[type],M=MODELS[type];
  const B=T.base||type,mat=MAT({vertexColors:true,map:TEX.flesh.map,normalMap:TEX.flesh.normal,roughness:B==='boss'?.42:type==='spire'?.3:.58,metalness:B==='boss'?.35:type==='spire'?.2:.05,emissive:new THREE.Color(0,0,0)});
  if(type==='prince')mat.color.setRGB(.62,.6,.66);
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  body.add(makeMesh(M.body,mat,true));const glow=new THREE.Mesh(M.glow,ENEMY_GLOW);body.add(glow);
  const rig={};
  for(const k of ['armL','armR','legL','legR']){if(!M[k])continue;const grp=new THREE.Group();grp.position.set(...M[k].p);grp.add(makeMesh(M[k].g,mat,true));
    if(M[k].glow)grp.add(new THREE.Mesh(M[k].glow,ENEMY_GLOW));
    if(M[k].hand){const hg=new THREE.Mesh(new THREE.IcosahedronGeometry(.08,1),new THREE.MeshBasicMaterial({color:new THREE.Color(5,1.6,.3),toneMapped:false}));hg.position.set(...M[k].hand);hg.scale.setScalar(.01);grp.add(hg);rig.hand=hg}
    (k[0]==='a'?body:g).add(grp);rig[k]=grp}
  let sh=null;if(!QP.shadow||T.fly){sh=new THREE.Mesh(shadowGeo,shadowMat);sh.scale.setScalar(T.radius*1.3);sh.position.y=.02;g.add(sh)}
  if(T.scale)g.scale.setScalar(T.scale);
  g.position.set(x,T.fly?2.4:-T.h,z);scene.add(g);
  const hp=Math.round(T.hp*(mode==='story'?diff:T.boss?1+Math.max(0,W.n/5-1)*.35:diff));
  const e={type,T,g,body,mat,glow,sh,...rig,pos:g.position,vel:new V3(),knock:new V3(),hp,maxHp:hp,face:Math.atan2(P.pos.x-x,P.pos.z-z),
    t:rand(0,5),phase:rand(0,TAU),atk:rand(1.2,2.5),wind:0,swing:0,parryable:false,stagger:0,staggerUsed:false,stun:0,flash:0,strafe:Math.random()<.5?1:-1,
    mode:'orbit',ct:0,cv:new V3(),burstN:0,burstT:0,pattern:'',parryHits:0,summonCd:8,dvx:0,dvz:0,spawnT:0,dead:false,spin:0,pose:0,growl:rand(2,6),base:B,aggro:mode==='arena',home:new V3(x,0,z),wander:new V3(x,0,z),wT:rand(1,4),kids:0};
  if(type==='spire')e.staggerUsed=true;
  enemies.push(e);return e;
}
function localToWorld(e,lx,ly,lz,out){const k=e.T.scale||1;lx*=k;ly*=k;lz*=k;const c=Math.cos(e.face),s=Math.sin(e.face);return out.set(e.pos.x+lx*c+lz*s,e.pos.y+ly,e.pos.z-lx*s+lz*c)}
function shootAt(from,speed,kind,dmg,r,owner,spreadA,lead){
  _t.set(P.pos.x+P.vel.x*(lead||0),P.pos.y+1.1,P.pos.z+P.vel.z*(lead||0));
  _d.subVectors(_t,from).normalize();
  if(spreadA){const c=Math.cos(spreadA),s=Math.sin(spreadA),x=_d.x,z=_d.z;_d.x=x*c-z*s;_d.z=x*s+z*c}
  spawnProj(from,_d.multiplyScalar(speed),kind,dmg,r,owner);
}
function spawnProj(pos,vel,kind,dmg,r,owner){
  if(projs.length>=210)return;
  projs.push({pos:pos.clone(),vel:vel.clone(),kind,dmg,r,owner,life:7,homing:null,t:Math.random()*5});
  fireBurst(pos,4,2,r*2,.2,PROJ_HOT[kind]);
  if(kind===1)showTip('green','<b>Зелёный снаряд</b>: подними ЩИТ прямо перед попаданием и он отлетит во врага');
  sfx('eshot');
}
function damageEnemy(e,dmg,cause,dir){
  if(e.dead)return false;
  e.hp-=dmg;e.flash=1;sfx('hit');if(!e.aggro)setAggro(e);
  if(dir&&cause!=='execute')e.knock.addScaledVector(_t2.copy(dir).setY(0),Math.min(dmg,40)*.05*e.T.knock);
  if(e.hp<=0){killEnemy(e,cause,dmg);return true}
  if(!e.T.boss&&!e.staggerUsed&&e.hp<e.maxHp*.25)stagger(e,2.6);
  return false;
}
function stagger(e,dur){e.stagger=dur;e.staggerUsed=true;e.wind=0;e.swing=0;e.burstN=0;e.mode='orbit';sfx('stagger');
  showTip('stagger','Враг светится <b style="color:#8ad6ff">синим</b>: жми ЦЕП для казни, она даёт здоровье')}
function gib(e,scale){
  const c=new V3(e.pos.x,e.pos.y+e.T.sph[1%e.T.sph.length][0],e.pos.z);
  const col=e.type==='skull'?0xd8c8a4:e.type==='tank'?0xa47258:0x7a2a1a;
  for(let i=0;i<Math.round(16*scale);i++)gore(c,rand(-6,6)*scale*.6,rand(2,9),rand(-6,6)*scale*.6,rand(.06,.16)*Math.sqrt(scale),i%3?0x4a0606:col);
  bloodSpray(c,null,Math.round(14*scale));if(!e.T.fly)decal(e.pos.x,e.pos.z,rand(1.6,2.4)*Math.sqrt(scale));
  if(e.type==='tank'||e.T.boss||e.type==='skull'||e.type==='spire'){explosion(c,e.T.boss?2.2:e.type==='spire'?2:e.type==='tank'?1.4:.6);sfx('boom')}
}
function killEnemy(e,cause,dmg){
  e.dead=true;kills++;
  const gibIt=e.type==='skull'||e.type==='tank'||e.type==='spire'||cause==='execute'||cause==='flail'||cause==='dash'||cause==='parry'||dmg>=e.maxHp*.5;
  if(gibIt||e.T.boss)gib(e,e.T.boss?3:e.type==='tank'||e.type==='spire'?2:1);
  else bloodSpray(_t.set(e.pos.x,e.pos.y+e.T.sph[0][0],e.pos.z),null,8);
  if(e.onDeath)e.onDeath(e);
  if(gibIt&&!e.T.boss){scene.remove(e.g);e.mat.dispose()}
  else{e.glow.visible=false;if(e.hand)e.hand.visible=false;e.mat.emissive.setRGB(0,0,0);corpses.push({e,t:0,dir:Math.random()<.5?-1:1});if(corpses.length>10){const o=corpses.shift();scene.remove(o.e.g);o.e.mat.dispose()}}
  sfx('kill');
  chain++;chainT=3.2;mult=Math.min(8,1+Math.floor(chain/3));
  const pts=e.T.score*mult;score+=pts;showPop('+'+pts+(mult>1?'  ×'+mult:''));
  const at=e.pos.clone();at.y=Math.max(0,at.y);
  if(cause==='execute'){for(let i=0;i<5;i++)spawnPickup('hp',at);spawnPickup('ar',at)}
  else if(cause==='flail'){for(let i=0;i<3;i++)spawnPickup('am',at)}
  else if(cause==='dash'){spawnPickup('ar',at);spawnPickup('ar',at)}
  else if(cause==='parry'){spawnPickup('hp',at);spawnPickup('am',at)}
  else{if(Math.random()<.3)spawnPickup('am',at);if(Math.random()<.18)spawnPickup('hp',at)}
  if(e.T.boss){shake=1.2;slowT=1;showMsg(e.T.title+' ПОВЕРЖЕН','+'+pts,3);P.hp=Math.min(P.maxHp,P.hp+40);for(let i=0;i<6;i++)spawnPickup(i%2?'am':'ar',at)}
  if(P.dashTarget===e)P.dashTarget=null;
}
function updateCorpses(dt){
  for(let i=corpses.length-1;i>=0;i--){const c=corpses[i],e=c.e;c.t+=dt;
    const k=Math.min(1,c.t/.55),ease=1-Math.pow(1-k,3);
    e.g.rotation.x=-ease*1.5*(e.T.boss?.9:1);e.g.rotation.z=c.dir*ease*.15;
    if(e.legL){e.legL.rotation.x=ease*.5;e.legR.rotation.x=ease*.2}
    if(e.armL){e.armL.rotation.x=lerp(e.armL.rotation.x,-2.2,dt*5);e.armR.rotation.x=lerp(e.armR.rotation.x,-1.8,dt*5)}
    e.pos.x+=e.knock.x*dt*(1-k);e.pos.z+=e.knock.z*dt*(1-k);e.knock.multiplyScalar(Math.exp(-4*dt));
    if(c.t>.5&&!c.pooled){c.pooled=true;decal(e.pos.x-Math.sin(e.face)*e.T.h*.5,e.pos.z-Math.cos(e.face)*e.T.h*.5,e.T.h*.8)}
    if(e.T.boss&&c.t<2.5&&Math.random()<dt*8){explosion(_t.set(e.pos.x+rand(-2,2),rand(.5,3),e.pos.z+rand(-2,2)),.8);sfx('boom')}
    if(c.t>6)e.pos.y-=dt*.35;
    if(c.t>9){scene.remove(e.g);e.mat.dispose();corpses.splice(i,1)}
  }
}
function enemyAI(e,dt,d,nx,nz){
  const T=e.T,sp=T.speed*(.9+diff*.1);
  switch(e.base){
  case 'imp':{
    if(e.wind>0){e.wind-=dt;e.dvx=e.dvz=0;e.pose=1;
      if(e.wind<=0){const h=localToWorld(e,.45,2.05,.2,_o);const g=e.parryable;shootAt(h,g?13:17+diff*1.5,g?1:0,g?16:11,g?.38:.24,e,0,g?0:.35)}return}
    e.pose=0;
    if(d>17){e.dvx=nx*sp;e.dvz=nz*sp}
    else if(d<8){e.dvx=-nx*sp;e.dvz=-nz*sp}
    else{e.dvx=(-nz*e.strafe*.85+nx*.12)*sp;e.dvz=(nx*e.strafe*.85+nz*.12)*sp}
    if(Math.random()<dt*.45)e.strafe*=-1;
    e.atk-=dt;if(e.atk<=0&&d<38){e.wind=.5;e.parryable=Math.random()<.3;e.atk=rand(1.7,3)/diff}
    break}
  case 'brute':{
    if(e.wind>0){e.wind-=dt;e.dvx=nx*2;e.dvz=nz*2;e.pose=1;if(e.wind<=0){e.swing=.28;bruteSwing(e,d)}return}
    if(e.swing>0){e.swing-=dt;e.dvx=e.dvz=0;e.pose=2;return}
    e.pose=0;e.dvx=nx*sp;e.dvz=nz*sp;
    e.atk-=dt;if(d<T.radius+2.6&&e.atk<=0){e.wind=.6;e.parryable=Math.random()<.45;e.atk=1.2;sfx('growl')}
    break}
  case 'skull':{
    if(e.mode==='charge'){e.ct-=dt;e.dvx=e.cv.x;e.dvz=e.cv.z;e.vel.set(e.cv.x,0,e.cv.z);e.pos.y=Math.max(.6,e.pos.y+e.cv.y*dt);
      const dy=e.pos.y-(P.pos.y+1.1);
      if(d<1.15&&Math.abs(dy)<1.2&&!e.dead){
        if(P.invuln>0){}
        else if(input.shield&&frontDot(e.pos.x,e.pos.z)>.2){sfx('block');shake=.3;damageEnemy(e,999,'parry',_t2.set(nx,0,nz))}
        else{hurt(14);e.dead=true;gib(e,1);scene.remove(e.g);e.mat.dispose()}
        return}
      if(e.ct<=0)e.mode='orbit';return}
    if(e.mode==='aim'){e.ct-=dt;e.dvx=e.dvz=0;e.spin=Math.sin(e.t*50)*.15;
      if(e.ct<=0){e.mode='charge';e.ct=1.2;e.cv.set(P.pos.x-e.pos.x,P.pos.y+1.1-e.pos.y,P.pos.z-e.pos.z).normalize().multiplyScalar(21+diff*2);sfx('screech')}return}
    e.spin=0;const rad=(d-10)*.35;
    e.dvx=(-nz*e.strafe+nx*rad)*sp;e.dvz=(nx*e.strafe+nz*rad)*sp;
    e.pos.y=lerp(e.pos.y,2.4+Math.sin(e.t*2.3)*.6,1-Math.exp(-3*dt));
    e.atk-=dt;if(e.atk<=0&&d<24){e.mode='aim';e.ct=.6;e.atk=rand(2.4,3.8)/diff}
    break}
  case 'tank':{
    if(e.wind>0){e.wind-=dt;e.dvx=e.dvz=0;e.pose=1;if(e.wind<=0){e.burstT=0}return}
    if(e.burstN>0){e.dvx=e.dvz=0;e.pose=1;e.burstT-=dt;if(e.burstT<=0){tankFire(e);e.burstN--;e.burstT=e.pattern==='green'?.42:.5}return}
    e.pose=0;
    if(d>21){e.dvx=nx*sp;e.dvz=nz*sp}else if(d<11){e.dvx=-nx*sp;e.dvz=-nz*sp}else{e.dvx=-nz*e.strafe*sp*.6;e.dvz=nx*e.strafe*sp*.6}
    e.atk-=dt;if(e.atk<=0&&d<42){const r=Math.random();e.pattern=r<.4?'fan':r<.72?'green':'wall';e.burstN=e.pattern==='fan'?2:e.pattern==='green'?3:1;e.wind=.7;e.parryable=e.pattern==='green';e.atk=rand(2.8,4.2)/diff;e.side=0;sfx('growl')}
    break}
  case 'boss':{
    const ph2=e.hp<e.maxHp*.5;e.summonCd-=dt;
    if(e.wind>0){e.wind-=dt;e.dvx=e.dvz=0;e.pose=e.pattern==='slam'?1:3;if(e.wind<=0){e.burstT=0;if(e.pattern==='slam')bossSlam(e,d)}return}
    if(e.burstN>0){e.dvx=e.dvz=0;e.pose=3;e.burstT-=dt;if(e.burstT<=0){bossFire(e,ph2);e.burstN--;e.burstT=e.pattern==='spiral'?.07:e.pattern==='green'?.45:.5}return}
    e.pose=0;
    if(d>10){e.dvx=nx*sp*(ph2?1.3:1);e.dvz=nz*sp*(ph2?1.3:1)}else{e.dvx=-nz*sp*.5;e.dvz=nx*sp*.5}
    e.atk-=dt;
    if(e.atk<=0){
      let p;if(d<8)p='slam';else{const opts=['ring','spiral','green','green'];if(e.summonCd<=0&&enemies.length<(e.type==='prince'?9:7))opts.push('summon');p=opts[Math.random()*opts.length|0]}
      e.pattern=p;e.parryable=p==='green';e.wind=p==='slam'?.75:.6;e.spinA=rand(0,TAU);
      e.burstN=p==='ring'?(ph2?3:2):p==='spiral'?(ph2?36:26):p==='green'?(ph2?4:3):0;
      if(p==='summon'){e.summonCd=14;e.wind=.5;for(let i=0;i<3;i++){const a=e.face+(i-1)*1.1;_o.set(e.pos.x+Math.sin(a)*6,0,e.pos.z+Math.cos(a)*6);worldPush(_o,1);const k=spawnPortal(e.type==='prince'&&i===1?'skull':i===2&&e.hp<e.maxHp*.5?'brute':'imp',_o.x,_o.z);k.aggro=true}}
      e.atk=(ph2?2.1:2.9);sfx('growl');
    }
    break}
  case 'spire':{
    e.dvx=e.dvz=0;e.atk-=dt;e.summonCd-=dt;
    if(e.summonCd<=0){e.summonCd=rand(5,7);if(e.kids<3){const a=rand(0,TAU);_o.set(e.pos.x+Math.cos(a)*5,0,e.pos.z+Math.sin(a)*5);worldPush(_o,1);
      if(!lavaAt(_o.x,_o.z)){const k=spawnPortal(Math.random()<.35?'skull':'imp',_o.x,_o.z);k.aggro=true;e.kids++;k.onDeath=()=>{e.kids--}}}}
    if(e.atk<=0&&d<34){e.atk=rand(2.6,3.6);const m=localToWorld(e,0,7.3,0,_o);fireBurst(m,10,4,.8,.3,[5,1.6,.3]);shootAt(m,11,Math.random()<.5?1:0,14,.45,e,0,.2)}
    break}
  }
}
// Story enemies idle near their post until the player comes close or something hits them; the alarm spreads to neighbours.
function setAggro(e){if(e.aggro||e.dead)return;e.aggro=true;e.atk=Math.max(e.atk,rand(.6,1.4));if(e.type!=='skull'&&e.type!=='spire')sfx('growl');
  for(const o of enemies)if(!o.aggro&&!o.dead&&Math.abs(o.pos.x-e.pos.x)<18&&Math.abs(o.pos.z-e.pos.z)<18)setAggro(o)}
function idleEnemy(e,dt,d){
  const aggroR=e.T.boss?70:e.type==='spire'?36:28;
  if(d<aggroR){setAggro(e);return}
  e.pose=0;e.dvx=e.dvz=0;if(e.T.static)return;
  if(e.T.fly)e.pos.y=lerp(e.pos.y,2.4+Math.sin(e.t*2.3)*.6,1-Math.exp(-3*dt));
  e.wT-=dt;if(e.wT<=0){e.wT=rand(3,7);e.wander.set(e.home.x+rand(-4,4),0,e.home.z+rand(-4,4))}
  const wx=e.wander.x-e.pos.x,wz=e.wander.z-e.pos.z,wd=Math.hypot(wx,wz);if(wd>.6){e.dvx=wx/wd*1.3;e.dvz=wz/wd*1.3}
}
function bruteSwing(e,d){
  if(d>e.T.radius+3||state!=='playing')return;
  const facing=Math.cos(angDiff(e.face,Math.atan2(P.pos.x-e.pos.x,P.pos.z-e.pos.z)));if(facing<.3)return;
  if(P.invuln>0)return;
  if(input.shield&&frontDot(e.pos.x,e.pos.z)>.2){
    if(e.parryable&&time-P.shieldRaise<PARRY_WIN+.1){parryFx();stagger(e,2.8);e.knock.set(e.pos.x-P.pos.x,0,e.pos.z-P.pos.z).setLength(8);sparks(_t.set(P.pos.x,1.3,P.pos.z).addScaledVector(lookDir(_fw),.8),20,10,[1,5,1.4])}
    else{hurt(5);sfx('block')}
  }else{hurt(22);P.vel.add(_t2.set(P.pos.x-e.pos.x,0,P.pos.z-e.pos.z).setLength(9))}
}
function tankFire(e){
  const side=(e.side=(e.side||0)^1)?1:-1;
  const m=localToWorld(e,1.35*side,1.9,1.8,_o);
  fireBurst(m,10,5,.8,.3,[5,1.6,.3]);smoke(m,2,.8,[.1,.07,.06],1,.6);
  if(e.pattern==='fan'){for(let i=-3;i<=3;i++)shootAt(m,12+diff,0,10,.3,e,i*.13)}
  else if(e.pattern==='green'){shootAt(m,11.5,1,18,.46,e,0,.2)}
  else{const fx=Math.sin(e.face),fz=Math.cos(e.face),gap=(Math.random()*9|0)-4;
    for(let i=-5;i<=5;i++){if(i===gap||i===gap+1)continue;_t.set(e.pos.x+fz*i*1.1+fx*1.5,1.2,e.pos.z-fx*i*1.1+fz*1.5);spawnProj(_t,_d.set(fx,0,fz).multiplyScalar(10),0,12,.32,e)}}
}
function bossFire(e,ph2){
  const m=localToWorld(e,0,3.35,1,_o);
  if(e.pattern==='ring'){const n=ph2?26:20;e.spinA+=.12;for(let i=0;i<n;i++){const a=e.spinA+i/n*TAU;spawnProj(m,_d.set(Math.sin(a),0,Math.cos(a)).multiplyScalar(10),i%7===0?1:0,12,.36,e)}}
  else if(e.pattern==='spiral'){for(let k=0;k<3;k++){const a=e.spinA+k*TAU/3;spawnProj(m,_d.set(Math.sin(a),-.02,Math.cos(a)).multiplyScalar(13),0,10,.3,e)}e.spinA+=.27}
  else if(e.pattern==='green'){shootAt(m,12,1,22,.55,e,rand(-.08,.08),.3)}
}
function bossSlam(e,d){
  sfx('slam');shake=Math.max(shake,.8);vib(60);
  const p=localToWorld(e,.4,0,3.2,_o).clone();
  waves.push({x:p.x,z:p.z,r:1,sp:15,max:32,hit:false,mesh:waveMesh()});
  explosion(p.setY(.3),1.3);
  if(d<4.5)hurt(25);
}
const waveGeo=new THREE.RingGeometry(.86,1,48);waveGeo.rotateX(-Math.PI/2);
function waveMesh(){const m=new THREE.Mesh(waveGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.2,.2),transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));m.position.y=.25;scene.add(m);return m}
function parryFx(){sfx('parry');pflashV=1;slowT=Math.max(slowT,.18);P.melee=Math.min(3,P.melee+1);score+=50*mult;showPop('ПАРИРОВАНО');vib(30)}

function updateEnemies(dt){
  for(const e of enemies){
    if(e.dead)continue;
    const T=e.T;e.t+=dt;
    if(e.spawnT>0){e.spawnT-=dt;const k=Math.max(0,e.spawnT/.9);
      if(T.fly)e.g.scale.setScalar(Math.max(.01,1-k));else e.pos.y=-T.h*k*k;
      e.face+=angDiff(e.face,Math.atan2(P.pos.x-e.pos.x,P.pos.z-e.pos.z))*.1;e.g.rotation.y=e.face;
      if(e.spawnT<=0){e.pos.y=T.fly?2.4:0;e.g.scale.setScalar(T.scale||1)}continue}
    const dx=P.pos.x-e.pos.x,dz=P.pos.z-e.pos.z,d=Math.hypot(dx,dz)||.001,nx=dx/d,nz=dz/d;
    e.flash=Math.max(0,e.flash-dt*7);
    let gr=0,gg=0,gb=0;
    if(e.stagger>0){e.stagger-=dt;e.dvx=e.dvz=0;const p=.5+.5*Math.sin(e.t*13);gr=.1+p*.15;gg=.3+p*.3;gb=.8+p*.6;e.pose=4}
    else if(e.stun>0){e.stun-=dt;e.dvx=e.dvz=0;e.pose=0}
    else{
      if(!e.aggro)idleEnemy(e,dt,d);if(e.aggro)enemyAI(e,dt,d,nx,nz);if(e.dead)continue;
      const w=e.wind>0?1-e.wind/.7:0;
      if(e.wind>0||e.burstN>0){if(e.parryable){gg=.6*w+.25;gr=.05}else{gr=.7*w+.15;gg=.2*w}}
      const spd=Math.hypot(e.dvx,e.dvz);
      if(spd>.1&&!T.fly)for(const p of WORLD.circles){if(Math.abs(p.x-e.pos.x)>8||Math.abs(p.z-e.pos.z)>8)continue;const px=p.x-e.pos.x,pz=p.z-e.pos.z,pd=Math.hypot(px,pz),reach=p.r+T.radius+2.2;
        if(pd<reach&&(px*e.dvx+pz*e.dvz)/(pd*spd)>.2){let tx=-pz/pd,tz=px/pd;if(tx*e.dvx+tz*e.dvz<0){tx=-tx;tz=-tz}const k=(1-pd/reach)*2.2*spd;e.dvx+=tx*k;e.dvz+=tz*k}}
      e.growl-=dt;if(e.growl<=0){e.growl=rand(4,9);if(d<20&&e.type!=='skull')sfx('growl')}
    }
    const fl=e.flash*.5;e.mat.emissive.setRGB(gr+fl,gg+fl*.8,gb+fl*.7);
    const acc=1-Math.exp(-(T.fly?4:7)*dt);
    e.vel.x+=(e.dvx-e.vel.x)*acc;e.vel.z+=(e.dvz-e.vel.z)*acc;
    e.pos.x+=(e.vel.x+e.knock.x)*dt;e.pos.z+=(e.vel.z+e.knock.z)*dt;
    e.knock.multiplyScalar(Math.exp(-5*dt));
    if(!T.fly||e.pos.y<6)worldPush(e.pos,T.radius);else WORLD.clamp(e.pos,T.radius);
    for(const o of enemies){if(o===e||o.dead||o.spawnT>0||(o.T.fly!==T.fly))continue;const px=e.pos.x-o.pos.x,pz=e.pos.z-o.pos.z,pd=Math.hypot(px,pz),mr=T.radius+o.T.radius;
      if(pd<mr&&pd>0){const push=(mr-pd)*.5;e.pos.x+=px/pd*push;e.pos.z+=pz/pd*push}}
    if(e.mode!=='charge'&&!T.static){const tf=e.aggro?Math.atan2(nx,nz):(Math.hypot(e.dvx,e.dvz)>.1?Math.atan2(e.dvx,e.dvz):e.face);e.face+=angDiff(e.face,tf)*(1-Math.exp(-(e.pose===2?2:(e.aggro?8:3))*dt))}
    e.g.rotation.y=e.face;
    animateEnemy(e,dt);
  }
  enemies=enemies.filter(e=>!e.dead);
}
function animateEnemy(e,dt){
  const T=e.T,mv=Math.hypot(e.vel.x,e.vel.z),b=e.body;
  if(T.static){b.rotation.y+=dt*.4;const p=.75+.25*Math.sin(e.t*3);e.glow.scale.set(1,p,1);if(Math.random()<.4){const m=localToWorld(e,0,7.3,0,_o);FX.emit(m.x,m.y,m.z,rand(-.4,.4),rand(.5,1.5),rand(-.4,.4),.5,.9,.2,5,1.5,.3,1,-1,1)}return}
  if(T.fly){
    e.g.rotation.z=e.spin;e.g.rotation.x=e.mode==='charge'?.35:Math.sin(e.t*2)*.08;
    if(e.sh){e.sh.position.y=-e.pos.y+.03;e.sh.scale.setScalar(T.radius*(1.5-Math.min(1,e.pos.y/6)*.6))}
    const back=localToWorld(e,0,.05,-.35,_o),hot=e.mode==='aim'||e.mode==='charge';
    for(let i=0;i<(hot?3:2);i++)FX.emit(back.x+rand(-.12,.12),back.y+rand(-.1,.15),back.z+rand(-.12,.12),-Math.sin(e.face)*2+rand(-.4,.4),rand(.8,1.6),-Math.cos(e.face)*2+rand(-.4,.4),rand(.25,.45),hot?.8:.6,.15,4.5,hot?1.2:1.6,.3,1,-2,1.5);
    return;
  }
  const amp=Math.min(1,mv/(T.speed*.7));
  e.phase+=dt*mv*TAU/(T.stride*2);
  const s=Math.sin(e.phase),c=Math.cos(e.phase);
  b.position.y=Math.abs(c)*.06*amp*(T.h/2.5);
  let lean=.08*amp,roll=s*.04*amp;
  if(e.pose===4){lean=.35;roll=Math.sin(e.t*5)*.1}
  if(e.pose===1&&e.type==='brute')lean=-.18;
  if(e.pose===2)lean=.3;
  b.rotation.x=lerp(b.rotation.x,lean,1-Math.exp(-10*dt));b.rotation.z=roll;
  b.scale.y=1+Math.sin(e.t*2.2)*.012;
  if(e.legL){const la=s*.55*amp;e.legL.rotation.x=e.pose===4?.25:la;e.legR.rotation.x=e.pose===4?-.15:-la}
  if(e.armL){
    let al=-s*.5*amp,ar=s*.5*amp;
    if(e.type==='tank'){al=ar=e.pose===1?-.12:Math.sin(e.t*1.5)*.05}
    if(e.base==='boss'&&e.pose===0)ar=-.9+ar*.3;
    if(e.type==='brute'&&e.pose===0)ar=-.35+ar*.5;
    if(e.pose===1&&e.type==='imp'){ar=-2.7;al=-.4}
    if(e.pose===1&&e.type==='brute'){ar=al=-2.8}
    if(e.pose===2){const k=1-e.swing/.28;ar=al=lerp(-2.8,-.2,Math.min(1,k*1.6))}
    if(e.base==='boss'){if(e.pose===1){ar=-2.9;al=-.6}else if(e.pose===3){al=-1.4;ar=-.4}}
    if(e.pose===4){al=.4;ar=e.base==='boss'?-.6:.5}
    e.armL.rotation.x=lerp(e.armL.rotation.x,al,1-Math.exp(-16*dt));e.armR.rotation.x=lerp(e.armR.rotation.x,ar,1-Math.exp(-16*dt));
  }
  if(e.hand){const on=e.pose===1;e.hand.scale.setScalar(lerp(e.hand.scale.x,on?1.6:.01,1-Math.exp(-10*dt)));
    if(on&&Math.random()<.5){const hp=e.hand.getWorldPosition(_o);FX.emit(hp.x,hp.y,hp.z,rand(-.3,.3),rand(.5,1.5),rand(-.3,.3),.3,.35,.1,5,1.6,.3,1,-1,1)}}
}

