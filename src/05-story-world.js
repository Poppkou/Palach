/* ================= STORY MAP: the valley of Ashen Ford ================= */
// Layout (x east, z south; the player walks north, toward -z):
//   village z 70..120 · shrine (0,15) · dead forest west · fire rift east · citadel wall z=-62 · courtyard z<-62
const SB=125;
const STORY_POI={
  start:new V3(0,0,112),monk:new V3(6.5,0,109),village:new V3(0,0,90),
  shards:[new V3(-92,0,42),new V3(-68,0,-28),new V3(-106,0,-6)],
  spires:[new V3(86,0,16),new V3(70,0,-14),new V3(104,0,-26)],rift:new V3(82,0,0),
  shrine:new V3(0,0,15),gate:new V3(0,0,-62),court:new V3(0,0,-95),
  camps:{forest:new V3(-40,0,20),rift:new V3(40,0,8),shrine:new V3(0,0,34),village:new V3(0,0,104),gate:new V3(0,0,-46),court:new V3(0,0,-72)}
};
function buildStory(){
  const W={name:'story',group:new THREE.Group(),circles:[],segs:[],fireSpots:[],lava:[],fog:.02,shadowExt:34,follow:true,spawn:STORY_POI.start.clone(),yaw:0,
    inside:(x,z)=>x>-SB&&x<SB&&z>-SB&&z<SB,
    clamp(p,r){const l=SB-1-r;if(p.x<-l)p.x=-l;if(p.x>l)p.x=l;if(p.z<-l)p.z=-l;if(p.z>l)p.z=l},
    rayBound(o,d,t){for(const [oc,dc] of [[o.x,d.x],[o.z,d.z]]){if(dc>1e-6){const tt=(SB-oc)/dc;if(tt<t)t=tt}else if(dc<-1e-6){const tt=(-SB-oc)/dc;if(tt<t)t=tt}}return t},
    caches:[],shards:[],gate:null,shrineRing:null};
  BUILD=W.group;scene.add(W.group);W.group.visible=false;
  const r=rng(901);
  const seg=(ax,az,bx,bz,rad,h)=>{const s={ax,az,bx,bz,r:rad||.4,h:h||5};W.segs.push(s);return s};
  const circ=(x,z,rad,h)=>W.circles.push({x,z,r:rad,h:h||6});
  // ground: ash plain, a flagstone road and the paved courtyard
  const gg=new THREE.PlaneGeometry(SB*2+60,SB*2+60);gg.rotateX(-Math.PI/2);
  const ground=new THREE.Mesh(gg,MAT({map:TEX.ash.map,normalMap:TEX.ash.normal,roughness:.95,metalness:0,color:0xb09888}));ground.receiveShadow=!!QP.shadow;BUILD.add(ground);
  const pave=(x,z,w,d,col)=>{const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*w/7.5,u.getY(i)*d/7.5);
    const m=new THREE.Mesh(g,MAT({map:TEX.floor.map.clone(),normalMap:TEX.floor.normal,roughness:.9,color:col||0x9a8476,polygonOffset:true,polygonOffsetFactor:-1}));
    m.material.map.repeat.set(1,1);m.material.map.needsUpdate=true;m.position.set(x,.012,z);m.receiveShadow=!!QP.shadow;BUILD.add(m)};
  pave(0,25,5.5,176);pave(0,-94,80,62,0x8a7466);pave(0,92,26,26,0x8a7668);
  // rift ground is scorched darker
  {const g=new THREE.CircleGeometry(46,32);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,MAT({map:TEX.ash.map,normalMap:TEX.ash.normal,roughness:.9,color:0x5a3028,polygonOffset:true,polygonOffsetFactor:-1}));m.position.set(82,.008,0);m.receiveShadow=!!QP.shadow;BUILD.add(m)}

  // ---- village of Ashen Ford ----
  const st=[],wd=[],ir=[],gl=[];
  const house=(x,z,w,d,rot,burnt)=>{
    const c=Math.cos(rot),s=Math.sin(rot),L=(lx,lz)=>[x+lx*c+lz*s,z-lx*s+lz*c];
    const wall=(lx1,lz1,lx2,lz2,h)=>{const [ax,az]=L(lx1,lz1),[bx,bz]=L(lx2,lz2),len=Math.hypot(bx-ax,bz-az);
      st.push(part(Box(len+.4,h,.45),tint(0x8a7464,rand(.75,1)),[(ax+bx)/2,h/2,(az+bz)/2],[0,-Math.atan2(bz-az,bx-ax),0],null,{uv:[len/3,h/3]}));seg(ax,az,bx,bz,.32,h+1)};
    const hw=w/2,hd=d/2,hb=burnt?2.2:3.2;
    wall(-hw,-hd,hw,-hd,hb+r()*.8);wall(-hw,-hd,-hw,hd,hb+r());wall(hw,-hd,hw,hd,hb+r()*.6);
    wall(-hw,hd,-.9,hd,hb);wall(.9,hd,hw,hd,hb*.8);
    if(!burnt){for(const sd of [-1,1]){const [px,pz]=L(0,sd*hd*.48);const g=new THREE.BoxGeometry(w+.6,.14,hd*1.25);g.rotateX(sd*.62);g.rotateY(rot);wd.push(part(g,0x4a3020,[px,hb+.75,pz],null,null,{uv:[2,1]}))}}
    else{const [px,pz]=L(r()-.5,r()-.5);wd.push(part(Box(w*.7,.15,.25),0x1a120c,[px,.1,pz],[0,r()*3,0]));W.fireSpots.push({p:new V3(px,.3,pz),k:.8})}
    for(let k=0;k<3;k++){const [px,pz]=L((r()-.5)*w*.6,(r()-.5)*d*.6);st.push(part(blob(.4,.25,.35,6,.3,k),0x5a4a40,[px,.15,pz],null,null,{flat:true}))}
  };
  [[-14,98,8,6,.1,0],[-15,83,7,7,-.1,1],[14,99,8,6,-.05,0],[17,85,6,8,.15,1],[-8,70,6,5,.3,1],[11,71,7,5,-.2,0],[-25,91,6,6,.5,0],[25,93,6,7,-.4,1]].forEach(h=>house(...h));
  // chapel with a bell tower where Olgerd waits
  {const x=13,z=114;
    st.push(part(Box(.6,6,10),0x8a7464,[x-3.5,3,z],null,null,{uv:[3,2]}),part(Box(.6,6,10),0x8a7464,[x+3.5,3,z],null,null,{uv:[3,2]}),part(Box(7.6,6,.6),0x8a7464,[x,3,z+5],null,null,{uv:[2.5,2]}),
      part(Box(2.6,6,.6),0x8a7464,[x-2.5,3,z-5],null,null,{uv:[1,2]}),part(Box(2.6,6,.6),0x8a7464,[x+2.5,3,z-5],null,null,{uv:[1,2]}),
      part(Cyl(1.6,1.8,13,8),0x7a6658,[x+3.5,6.5,z+5],null,null,{uv:[2,4]}));
    ir.push(part(Cone(2.2,4,8),0x241c1a,[x+3.5,15,z+5]),part(Cyl(.05,.05,2,4),0x241c1a,[x+3.5,17.8,z+5]));
    wd.push(part(Box(5,.18,10.6),0x3a2618,[x-2,7.4,z],[0,0,.68]),part(Box(5,.18,10.6),0x3a2618,[x+2,7.4,z],[0,0,-.68]));
    gl.push(part(Box(1.2,2,.05),HOT(2.5,1,.6,.2),[x,2.5,z+4.65]));
    seg(x-3.5,z-5,x-3.5,z+5,.4,7);seg(x+3.5,z-5,x+3.5,z+5,.4,7);seg(x-3.8,z+5,x+3.8,z+5,.4,7);seg(x-3.8,z-5,x-1.3,z-5,.4,7);seg(x+1.3,z-5,x+3.8,z-5,.4,7);circ(x+3.5,z+5,1.9,14);
    W.fireSpots.push({p:new V3(x-1.4,2.2,z-5.6),k:.45,light:true},{p:new V3(x+1.4,2.2,z-5.6),k:.45});
  }
  // carts, crates, fences, a well
  for(const [x,z,a] of [[-5,86,.4],[6,96,-.8],[-20,104,1.2],[20,78,.2]]){
    wd.push(part(Box(2.6,.25,1.4),0x4a3020,[x,.9,z],[0,a,0]),part(Box(2.6,.6,.08),0x3a2618,[x+Math.sin(a)*.7,1.25,z+Math.cos(a)*.7],[0,a,0]));
    for(const s of [-1,1])ir.push(part(Cyl(.55,.55,.1,10),0x2a1e14,[x+Math.sin(a)*s*.75,.55,z+Math.cos(a)*s*.75],[Math.PI/2,a,0]));circ(x,z,1.4,2)}
  for(let i=0;i<14;i++){const x=(r()-.5)*44,z=72+r()*40;if(Math.abs(x)<3.5)continue;wd.push(part(Box(.9,.9,.9),tint(0x5a3c24,.8+r()*.3),[x,.45,z],[0,r()*3,0]));circ(x,z,.7,1.2)}
  st.push(part(latheG([[1.1,0],[1.3,0],[1.3,1],[1.1,1]],14),0x6a5a4e,[-4,0,96]));circ(-4,96,1.4,1.2);
  for(const [x,z] of [[-3.6,78],[3.6,78],[-6,64],[6,64]]){ir.push(part(Cyl(.07,.1,2,5),0x2a2220,[x,1,z]),part(Cyl(.25,.12,.3,6),0x2a2220,[x,2.05,z]));W.fireSpots.push({p:new V3(x,2.15,z),k:.45,light:true})}
  meshOf(merge(st),stoneMat,true,true);meshOf(merge(wd),woodMat,true,true);

  // ---- road-side ruins, torches and skull piles ----
  const ru=[],bn=[];
  for(let z=56;z>-56;z-=22){for(const s of [-1,1]){const x=s*4.2;ir.push(part(Cyl(.07,.1,2.2,5),0x2a2220,[x,1.1,z]),part(Cyl(.25,.12,.3,6),0x2a2220,[x,2.25,z]));W.fireSpots.push({p:new V3(x,2.35,z),k:.45,light:true})}}
  for(const [x,z,a] of [[-9,48,.2],[10,-28,-.3],[-12,-40,.6]]){
    ru.push(part(Box(1.6,7,1.6),0x7a6658,[x,3.5,z],[0,a,0],null,{uv:[.6,2.2]}),part(Box(1.6,4.5,1.6),0x7a6658,[x+Math.cos(a)*6,2.25,z-Math.sin(a)*6],[0,a,.05],null,{uv:[.6,1.5]}),
      part(Box(7.6,1.3,1.6),0x6a584a,[x+Math.cos(a)*3,7.4,z-Math.sin(a)*3],[0,a,.12],null,{uv:[2.5,.5]}));circ(x,z,1.2,8);circ(x+Math.cos(a)*6,z-Math.sin(a)*6,1.2,5)}
  for(let i=0;i<10;i++){const x=(r()<.5?-1:1)*(7+r()*30),z=-50+r()*110;for(let k=0;k<6;k++)bn.push(part(blob(.16,.15,.18,8,.05,k),0xd2c4a2,[x+(r()-.5)*1.1,.12+r()*.3,z+(r()-.5)*1.1],[r(),r()*6,0]))}
  for(let i=0;i<70;i++){const x=(r()-.5)*230,z=(r()-.5)*230;if(z<-60||Math.abs(x)<5)continue;const s=.15+r()*r()*.7;ru.push(part(blob(s*1.2,s*.7,s,6,.3,i),tint(0x6a5a50,.7+r()*.4),[x,s*.3,z],[r(),r()*3,r()],null,{flat:true}))}
  meshOf(merge(ru),floorStoneMat,true,true);meshOf(merge(bn),boneMat,true,false);

  // ---- the dead forest: four chunks so the frustum can cull them ----
  const clear=[...STORY_POI.shards,STORY_POI.camps.forest];
  for(let cx=0;cx<2;cx++)for(let cz=0;cz<2;cz++){
    const tr=[];
    for(let i=0;i<32;i++){const x=-120+cx*40+r()*40,z=-45+cz*54+r()*54;if(clear.some(p=>Math.hypot(p.x-x,p.z-z)<9))continue;
      const h=6+r()*5,lean=(r()-.5)*.25,la=r()*TAU;let px=x,py=0,pz=z,rad=.32+r()*.15;
      for(let s=0;s<3;s++){const nx=px+Math.cos(la)*lean*h/3*(s+1)*.4,ny=py+h/3,nz=pz+Math.sin(la)*lean*h/3*(s+1)*.4;tr.push(limb([px,py,pz],[nx,ny,nz],rad,rad*.7,tint(0x2a201a,.8+r()*.4),7));
        if(s>0)for(let b=0;b<2;b++){const ba=r()*TAU,bl=1+r()*2.2;tr.push(limb([nx,ny-.3,nz],[nx+Math.cos(ba)*bl,ny+.4+r()*1.2,nz+Math.sin(ba)*bl],rad*.35,.03,0x241a14,5))}
        px=nx;py=ny;pz=nz;rad*=.7}
      circ(x,z,.55,10)}
    meshOf(merge(tr),woodMat,true,false);
  }
  // relic shard pedestals
  for(const p of STORY_POI.shards){
    st.length=0;st.push(part(latheG([[0,0],[1.4,0],[1.2,.5],[.7,.7],[.6,1.1],[0,1.1]],10),0x6a5a4e,[p.x,0,p.z]));for(let k=0;k<5;k++){const a=k/5*TAU;st.push(part(Box(.7,2.4+r(),.5),0x5a4a40,[p.x+Math.cos(a)*4,1.2,p.z+Math.sin(a)*4],[r()*.2,a,r()*.2]));circ(p.x+Math.cos(a)*4,p.z+Math.sin(a)*4,.5,3)}
    meshOf(merge(st),floorStoneMat,true,true);circ(p.x,p.z,1.3,1.1);
    const sh=new THREE.Mesh(merge([part(Cone(.22,.9,5),HOT(1.6,.4,1,2.4),[0,.45,0],null,null,{flat:true}),part(Cone(.22,.5,5),HOT(1.6,.4,1,2.4),[0,-.25,0],[Math.PI,0,0],null,{flat:true})]),glowMat);
    sh.position.set(p.x,1.9,p.z);BUILD.add(sh);W.shards.push({p,mesh:sh,taken:false});
  }

  // ---- the fire rift ----
  const rk=[],lv=[];
  for(const [x,z,rad] of [[66,22,8],[96,-4,11],[80,-26,7],[108,28,7],[56,-8,5],[92,34,5]]){
    lv.push(lavaDisk(x,z,rad));W.lava.push({x,z,r:rad*.92});
    for(let k=0;k<Math.round(rad*2.2);k++){const a=k/(rad*2.2)*TAU+r()*.2,s=.5+r()*.9;rk.push(part(blob(s*1.3,s*.7,s,6,.3,k),tint(0x241818,.8+r()*.4),[x+Math.cos(a)*(rad+.3),s*.25,z+Math.sin(a)*(rad+.3)],[r(),r()*3,r()],null,{flat:true}))}
  }
  for(const [a,b] of [[[66,22],[56,-8]],[[56,-8],[80,-26]],[[80,-26],[96,-4]],[[96,-4],[108,28]],[[92,34],[66,22]]]){
    let [x,z]=a;for(let s=0;s<6;s++){const nx=lerp(a[0],b[0],(s+1)/6)+(r()-.5)*3,nz=lerp(a[1],b[1],(s+1)/6)+(r()-.5)*3;lv.push(lavaStrip(x,z,nx,nz,1.1));x=nx;z=nz}}
  for(let i=0;i<46;i++){const x=42+r()*80,z=-44+r()*88;if(W.lava.some(l=>Math.hypot(l.x-x,l.z-z)<l.r+2)||STORY_POI.spires.some(p=>Math.hypot(p.x-x,p.z-z)<6))continue;
    const h=1.5+r()*5;rk.push(part(Cone(.4+h*.12,h,5),tint(0x1a1214,.8+r()*.5),[x,h/2,z],[(r()-.5)*.4,r()*3,(r()-.5)*.4],null,{flat:true}));if(h>3)circ(x,z,.5+h*.08,h)}
  meshOf(merge(rk),ironMat,true,true);
  {const m=new THREE.Mesh(merge(lv),lavaMat);BUILD.add(m)}
  for(const l of W.lava)W.fireSpots.push({p:new V3(l.x,.6,l.z),k:0,light:true,lava:true});

  // ---- the old shrine: a ring of standing stones around the seal ----
  {const S=STORY_POI.shrine,ss=[];
    for(let i=0;i<12;i++){const a=i/12*TAU;if(Math.abs(Math.cos(a))<.3)continue;const x=S.x+Math.cos(a)*12,z=S.z+Math.sin(a)*12;
      ss.push(part(Box(1.3,4.5,.9),tint(0x6a5a50,.8+r()*.3),[x,2.25,z],[(r()-.5)*.1,-a,(r()-.5)*.1],null,{flat:true,uv:[.5,1.5]}));circ(x,z,.9,5);
      if(i%2===0){const b=a+TAU/12;ss.push(part(Box(3.8,.8,.9),0x5a4a40,[S.x+Math.cos(a+TAU/24)*12,4.8,S.z+Math.sin(a+TAU/24)*12],[0,-(a+TAU/24)+Math.PI/2,0]))}}
    ss.push(part(Cyl(2.4,2.7,.6,16),0x5a4a40,[S.x,.3,S.z],null,null,{uv:[3,.3]}));circ(S.x,S.z,2.6,.7);
    meshOf(merge(ss),floorStoneMat,true,true);
    const rg=new THREE.RingGeometry(5.6,6,48);rg.rotateX(-Math.PI/2);const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:new THREE.Color(.6,.2,.05),toneMapped:false}));ring.position.set(S.x,.05,S.z);BUILD.add(ring);W.shrineRing=ring;
    W.fireSpots.push({p:new V3(S.x,1.2,S.z),k:.7,light:true});
  }

  // ---- citadel wall and gate ----
  {const wl=[],wg=[],iron=[],GZ=STORY_POI.gate.z;
    const wallRun=(x1,x2)=>{for(let x=x1;x<x2;x+=6){const w=Math.min(6,x2-x);wl.push(part(Box(w+.2,14,3),tint(0x7a6658,rand(.8,1.05)),[x+w/2,7,GZ],null,null,{uv:[w/3,4.5]}));
        for(let k=0;k<2;k++)wl.push(part(Box(1.4,1.5,3),0x7a6658,[x+w*(k+.5)/2,14.7,GZ],null,null,{uv:[.5,.5]}))}
      seg(x1,GZ,x2,GZ,1.6,16)};
    wallRun(-SB-2,-8);wallRun(8,SB+2);
    for(let x=-110;x<=110;x+=27.5){if(Math.abs(x)<10)continue;wl.push(part(Cyl(3.4,3.8,22,12),0x6a584a,[x,11,GZ],null,null,{uv:[4,6]}));iron.push(part(Cone(4,8,12),0x221a18,[x,26,GZ]));
      for(let k=0;k<3;k++)wg.push(part(Box(.35,1.4,.2),HOT(4,1,.35,.08),[x,7+k*5,GZ+3.45]))}
    for(const s of [-1,1]){wl.push(part(Box(5,20,6),0x6a584a,[s*10.5,10,GZ],null,null,{uv:[1.5,6]}));iron.push(part(Cone(4.2,7,4),0x221a18,[s*10.5,23.5,GZ],[0,Math.PI/4,0]));circ(s*10.5,GZ,3.4,22);W.fireSpots.push({p:new V3(s*7.6,4.5,GZ+3.6),k:.6,light:true})}
    wl.push(part(Box(16,4,6),0x6a584a,[0,17,GZ],null,null,{uv:[5,1.3]}));
    wg.push(part(Box(15,13,.1),HOT(3,1,.25,.05),[0,6.5,GZ-3.2]));
    meshOf(merge(wl),stoneMat,true,true);meshOf(merge(wg),glowMat);meshOf(merge(iron),ironMat,true,false);
    const bars=[];for(let k=-6;k<=6;k++)bars.push(part(Cyl(.13,.13,15,6),0x1a1614,[k*1.15,7.5,0]));for(let k=0;k<5;k++)bars.push(part(Box(15,.2,.24),0x1a1614,[0,1.5+k*3,0]));for(let k=-6;k<=6;k++)bars.push(part(Cone(.16,.6,4),0x1a1614,[k*1.15,-.2,0],[Math.PI,0,0]));
    const bm=meshOf(merge(bars),ironMat,true,false);bm.position.set(0,0,GZ);
    W.gate={seg:seg(-8,GZ,8,GZ,1,16),mesh:bm,open:false,t:0};
    // courtyard: inner walls, braziers, statues, the keep
    const cw=[];seg(-40,GZ,-40,-SB,1.4,14);seg(40,GZ,40,-SB,1.4,14);
    for(const s of [-1,1])for(let z=GZ;z>-SB;z-=8)cw.push(part(Box(2.6,12,8.2),tint(0x7a6658,rand(.8,1)),[s*41.3,6,z-4],null,null,{uv:[2.7,4]}));
    cw.push(part(Box(46,26,10),0x5a4a40,[0,13,-SB+3],null,null,{uv:[15,8]}),part(Box(12,10,4),0x1a1210,[0,5,-SB+7.9]));
    for(const x of [-20,-8,8,20])cw.push(part(Cyl(2.6,3,34,10),0x6a584a,[x,17,-SB+6],null,null,{uv:[3,9]}));
    meshOf(merge(cw),stoneMat,true,true);
    for(const x of [-20,-8,8,20]){const m=meshOf(merge([part(Cone(3.2,12,10),0x1c1414,[x,40,-SB+6])]),ironMat,false,false)}
    meshOf(merge([part(Box(10,8,.1),HOT(3,1,.25,.05),[0,4.5,-SB+8])]),glowMat);
    const pl=[],pIron=[];const C=STORY_POI.court;
    for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;brazierPillar(pl,pIron,C.x+Math.cos(a)*16,C.z+Math.sin(a)*16,a,W)}
    meshOf(merge(pl),floorStoneMat,true,true);meshOf(merge(pIron),ironMat,true,false);
    for(const s of [-1,1])statue(s*7,GZ-6,s*-.3+Math.PI,W,1.6);
  }

  // ---- valley edges: jagged cliffs beyond the playable square ----
  for(let side=0;side<4;side++){const cl=[];
    for(let i=-SB-6;i<=SB+6;i+=5){if(side===0)continue;const h=8+r()*16,w=4+r()*4;let x,z;
      if(side===1){x=i;z=SB+3+r()*3}else if(side===2){x=-SB-3-r()*3;z=i}else{x=SB+3+r()*3;z=i}
      if(z<STORY_POI.gate.z-2&&side!==1)continue;
      cl.push(part(blob(w,h,w*.8,6,.35,i+side*100),tint(0x2a2020,.7+r()*.4),[x,h*.35,z],[r()*.3,r()*3,r()*.3],null,{flat:true}))}
    if(cl.length)meshOf(merge(cl),floorStoneMat,false,true)}

  // ---- supply caches ----
  for(const [x,z] of [[-30,108],[22,64],[-50,-10],[-84,10],[58,30],[116,-40],[-18,0],[30,-48],[0,-110]]){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=r()*TAU;
    const m=new THREE.Mesh(merge([part(Box(1.2,.7,.8),0x4a3020,[0,.35,0]),part(Box(1.24,.08,.84),0x2a2422,[0,.5,0]),part(Box(1.24,.08,.84),0x2a2422,[0,.15,0])]),woodMat);m.castShadow=!!QP.shadow;g.add(m);
    const gm=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.05),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2,.5),toneMapped:false}));gm.position.set(0,.45,.42);g.add(gm);
    BUILD.add(g);circ(x,z,.8,1);W.caches.push({x,z,g,glow:gm,open:false});
  }
  meshOf(merge(ir),ironMat,true,false);meshOf(merge(gl),glowMat);
  if(fogMat){const fgm=new THREE.Mesh(new THREE.PlaneGeometry(SB*2,SB*2),fogMat);fgm.rotation.x=-Math.PI/2;fgm.position.y=.45;fgm.renderOrder=2;BUILD.add(fgm)}
  BUILD=scene;
  return W;
}
