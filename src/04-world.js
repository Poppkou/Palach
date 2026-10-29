/* ================= WORLD: shared sky + collision API ================= */
// A world is {group, circles:[{x,z,r,h}], segs:[{ax,az,bx,bz,r,h,off}], fireSpots, lava:[{x,z,r}],
//             inside(x,z), clamp(pos,r), rayBound(o,d,t)->t, fog, shadowExt, follow, spawn, yaw}
const R=36,PLAY_R=R-1.3;
const WORLDS={};let WORLD=null;
let BUILD=scene;
let skyMat,lavaMat,fogMat,sun;
const SUN_DIR=new V3(-.42,.48,-.77).normalize();
const stoneMat=MAT({vertexColors:true,map:TEX.brick.map,normalMap:TEX.brick.normal,roughness:.88,metalness:0});
const floorStoneMat=MAT({vertexColors:true,map:TEX.floor.map,normalMap:TEX.floor.normal,roughness:.9,metalness:0});
const ironMat=MAT({vertexColors:true,map:TEX.metal.map,normalMap:TEX.metal.normal,roughness:.5,metalness:.55});
const woodMat=MAT({vertexColors:true,map:TEX.wood.map,normalMap:TEX.wood.normal,roughness:.85,metalness:0});
const boneMat=MAT({vertexColors:true,roughness:.7,map:TEX.flesh.map});
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
function meshOf(geo,mat,cast,recv){const m=new THREE.Mesh(geo,mat);m.castShadow=!!cast&&!!QP.shadow;m.receiveShadow=!!recv&&!!QP.shadow;BUILD.add(m);return m}
function tint(hex,k){_c.set(hex);return[_c.r*k,_c.g*k,_c.b*k]}

function worldPush(pos,r){
  const W=WORLD;
  for(const c of W.circles){const dx=pos.x-c.x,dz=pos.z-c.z,mr=c.r+r;if(dx>mr||dx<-mr||dz>mr||dz<-mr)continue;const d=Math.hypot(dx,dz);if(d<mr&&d>1e-4){pos.x=c.x+dx/d*mr;pos.z=c.z+dz/d*mr}}
  for(const s of W.segs){if(s.off)continue;const ex=s.bx-s.ax,ez=s.bz-s.az,L2=ex*ex+ez*ez;let t=((pos.x-s.ax)*ex+(pos.z-s.az)*ez)/L2;t=t<0?0:t>1?1:t;
    const cx=s.ax+ex*t,cz=s.az+ez*t,dx=pos.x-cx,dz=pos.z-cz,mr=s.r+r;if(dx>mr||dx<-mr||dz>mr||dz<-mr)continue;const d=Math.hypot(dx,dz);
    if(d<mr){if(d<1e-4){const l=Math.sqrt(L2);pos.x=cx-ez/l*mr;pos.z=cz+ex/l*mr}else{pos.x=cx+dx/d*mr;pos.z=cz+dz/d*mr}}}
  W.clamp(pos,r);
}
function segDist(s,x,z){const ex=s.bx-s.ax,ez=s.bz-s.az,L2=ex*ex+ez*ez;let t=((x-s.ax)*ex+(z-s.az)*ez)/L2;t=t<0?0:t>1?1:t;return Math.hypot(x-s.ax-ex*t,z-s.az-ez*t)}
function worldSolid(x,y,z){
  const W=WORLD;if(!W.inside(x,z))return true;
  for(const c of W.circles){const dx=x-c.x,dz=z-c.z;if(dx*dx+dz*dz<c.r*c.r*.8&&y<c.h)return true}
  for(const s of W.segs)if(!s.off&&y<s.h&&segDist(s,x,z)<s.r)return true;
  return false;
}
function worldRay(o,d,t){
  if(d.y<-1e-4){const tf=-o.y/d.y;if(tf<t)t=tf}
  const a=d.x*d.x+d.z*d.z;if(a<1e-6)return t;
  t=WORLD.rayBound(o,d,t,a);
  for(const p of WORLD.circles){const ox=o.x-p.x,oz=o.z-p.z,b=2*(ox*d.x+oz*d.z),c=ox*ox+oz*oz-p.r*p.r*.8,disc=b*b-4*a*c;
    if(disc>0){const t1=(-b-Math.sqrt(disc))/(2*a);if(t1>0&&t1<t&&o.y+d.y*t1<p.h)t=t1}}
  const lr=Math.sqrt(a);
  for(const s of WORLD.segs){if(s.off)continue;const sx=s.bx-s.ax,sz=s.bz-s.az,den=d.x*sz-d.z*sx;if(Math.abs(den)<1e-6)continue;
    const qx=s.ax-o.x,qz=s.az-o.z,tt=(qx*sz-qz*sx)/den,u=(qx*d.z-qz*d.x)/den;
    if(tt>0&&u>=0&&u<=1){const th=Math.max(.01,tt-s.r/lr);if(th<t&&o.y+d.y*th<s.h)t=th}}
  return t;
}
function setWorld(w){
  for(const k in WORLDS)if(WORLDS[k].group)WORLDS[k].group.visible=WORLDS[k]===w;
  WORLD=w;scene.fog.density=w.fog;
  if(sun&&QP.shadow){const sc=sun.shadow.camera;sc.left=sc.bottom=-w.shadowExt;sc.right=sc.top=w.shadowExt;sc.updateProjectionMatrix()}
  updateSun(w.spawn,true);lightT=0;
}
// Keep the shadow frustum on the player, snapped to whole shadow texels so edges do not crawl while moving.
const _sr=new V3(),_su=new V3(),_sc=new V3();
function updateSun(center,force){
  if(!sun)return;
  if(!WORLD.follow&&!force)return;
  const c=WORLD.follow?center:_sc.set(0,0,0);
  if(QP.shadow){
    const texel=2*WORLD.shadowExt/QP.shadow;
    _sr.crossVectors(_up,SUN_DIR).normalize();_su.crossVectors(SUN_DIR,_sr);
    const u=Math.round(c.dot(_sr)/texel)*texel,v=Math.round(c.dot(_su)/texel)*texel,w=c.dot(SUN_DIR);
    _sc.copy(_sr).multiplyScalar(u).addScaledVector(_su,v).addScaledVector(SUN_DIR,w);
  }else _sc.copy(c);
  sun.target.position.copy(_sc);sun.position.copy(_sc).addScaledVector(SUN_DIR,80);sun.target.updateMatrixWorld();
}
function lavaAt(x,z){for(const l of WORLD.lava){const dx=x-l.x,dz=z-l.z;if(dx*dx+dz*dz<l.r*l.r)return true}return false}

function buildGlobal(){
  scene.add(new THREE.HemisphereLight(0xff9a70,0x1c0806,ENV?.32:.6));
  sun=new THREE.DirectionalLight(0xffa36a,1.7);
  sun.position.copy(SUN_DIR).multiplyScalar(80);scene.add(sun,sun.target);
  if(QP.shadow){sun.castShadow=true;sun.shadow.mapSize.set(QP.shadow,QP.shadow);const sc=sun.shadow.camera;sc.near=10;sc.far=180;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04}
  skyMat=new THREE.ShaderMaterial({defines:TMDEF,depthWrite:false,side:THREE.BackSide,fog:false,uniforms:{uT:{value:0},uSun:{value:SUN_DIR}},
    vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader:GLSL_COMMON+`uniform float uT;uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;
      vec3 top=vec3(.025,.006,.01),mid=vec3(.3,.065,.035),hor=vec3(1.25,.36,.09);
      vec3 col=mix(mid,top,smoothstep(.0,.6,h));col=mix(hor,col,smoothstep(-.03,.25,h));if(h<0.)col=mix(hor*.6,vec3(.08,.02,.01),smoothstep(0.,-.2,h));
      vec2 uv=d.xz/(max(h,0.)+.14)*.8+vec2(uT*.008,uT*.003);float c=fbm(uv);float c2=fbm(uv*2.3-uT*.01);c=smoothstep(.42,.82,c*.7+c2*.3);
      vec3 cc=mix(vec3(.05,.012,.012),vec3(1.1,.3,.08),pow(1.-clamp(h,0.,1.),4.)*.85+c2*.15);col=mix(col,cc,c*smoothstep(-.03,.1,h)*.9);
      float s=max(dot(d,uSun),0.);col+=vec3(5.,2.,.7)*pow(s,600.)*1.6+vec3(1.1,.35,.1)*pow(s,12.)*.35*(1.-c*.6);
      #ifdef TM
      col=aces(col*1.35);
      #endif
      gl_FragColor=vec4(col,1.);}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(300,24,16),skyMat);sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);WORLDS._sky=sky;
  // far mountains and burning castles follow the camera horizontally so they stay on the horizon on any map
  const far=new THREE.Group();scene.add(far);
  for(const [rad,hk,col,seed] of [[240,1,[.025,.008,.008],1],[200,.6,[.04,.012,.01],2]]){
    const N=140,pos=[],cl=[],r=rng(seed);let prev=0;
    for(let i=0;i<=N;i++){const a=i/N*TAU;let hh=(14+Math.sin(a*3+seed)*8+Math.sin(a*7.3)*6+r()*7)*hk;if(r()<.05)hh+=25*hk;prev=lerp(prev,hh,.6);
      pos.push(Math.cos(a)*rad,-6,Math.sin(a)*rad,Math.cos(a)*rad,prev,Math.sin(a)*rad);cl.push(.5,.1,.03,col[0],col[1],col[2])}
    const idx=[];for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.setIndex(idx);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));m.frustumCulled=false;far.add(m);
  }
  const sil=[],silG=[];const r=rng(5);
  for(let i=0;i<46;i++){const a=i/46*TAU+r()*.05,rr=150+r()*30,h=12+r()*40,w=5+r()*9;
    sil.push(part(Box(w,h,w),0x100406,[Math.cos(a)*rr,h/2-3,Math.sin(a)*rr],[0,-a,0]));
    sil.push(part(Cone(w*.75,h*.4,6),0x100406,[Math.cos(a)*rr,h+h*.2-3,Math.sin(a)*rr]));
    if(r()<.7)for(let k=0;k<3;k++)silG.push(part(Box(.9,1.6,.9),HOT(4,1,.35,.08),[Math.cos(a)*(rr-w*.55),4+r()*(h-6),Math.sin(a)*(rr-w*.55)],[0,-a,0]));}
  const s1=new THREE.Mesh(merge(sil),new THREE.MeshBasicMaterial({vertexColors:true,fog:false})),s2=new THREE.Mesh(merge(silG),new THREE.MeshBasicMaterial({vertexColors:true,fog:false,toneMapped:false}));
  s1.frustumCulled=s2.frustumCulled=false;far.add(s1,s2);
  WORLDS._far=far;
  lavaMat=new THREE.ShaderMaterial({defines:TMDEF,uniforms:{uT:{value:0}},
    vertexShader:'varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:GLSL_COMMON+`uniform float uT;varying vec2 vU;varying vec3 vW;void main(){vec2 p=vW.xz*.9;
      float v=fbm(p+vec2(uT*.25,uT*.1))*.65+fbm(p*2.7-uT*.18)*.35;float c=smoothstep(.3,.8,v);
      vec3 col=mix(vec3(.25,.02,0.),vec3(2.2,.5,.07),c)+vec3(2.,1.1,.35)*pow(c,5.);
      float e=smoothstep(0.,.35,min(vU.y,1.-vU.y));col=mix(vec3(.04,.01,0.),col,e);
      #ifdef TM
      col=aces(col);
      #endif
      gl_FragColor=vec4(col,1.);}`});
  if(QP.fog)fogMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0}},
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:GLSL_COMMON+`uniform float uT;varying vec3 vW;void main(){float n=fbm(vW.xz*.07+vec2(uT*.03,uT*.017));float a=smoothstep(.35,.75,n)*.3;gl_FragColor=vec4(vec3(.55,.16,.08),a);}`});
}
function lavaStrip(x1,z1,x2,z2,w){const len=Math.hypot(x2-x1,z2-z1),g=new THREE.PlaneGeometry(len,w);g.rotateX(-Math.PI/2);return part(g,0xffffff,[(x1+x2)/2,.03,(z1+z2)/2],[0,-Math.atan2(z2-z1,x2-x1),0])}
function lavaDisk(x,z,r){const g=new THREE.CircleGeometry(r,24);g.rotateX(-Math.PI/2);const u=g.attributes.uv,p=g.attributes.position;for(let i=0;i<u.count;i++)u.setY(i,.5-.5*Math.hypot(p.getX(i),p.getZ(i))/r);return part(g,0xffffff,[x,.04,z])}
const latheG=(prof,seg)=>new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[0],q[1])),seg||16);
const fluteG=(r1,r2,h)=>{const g=new THREE.CylinderGeometry(r1,r2,h,24,6);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),k=1-.06*Math.pow(Math.abs(Math.cos(a*6)),.5);p.setX(i,x*k);p.setZ(i,z*k)}g.computeVertexNormals();return g};
function brazierPillar(pl,pIron,x,z,a,W){
  pl.push(part(latheG([[0,0],[1.75,0],[1.75,.35],[1.5,.5],[1.5,.75],[1.3,.95],[0,.95]]),0x6a584a,[x,0,z],null,null,{uv:[3,.5]}));
  pl.push(part(fluteG(1.1,1.25,7.6),tint(0x8a7666,rand(.9,1.05)),[x,4.75,z],null,null,{uv:[3,3]}));
  pl.push(part(latheG([[0,0],[1.15,0],[1.45,.35],[1.75,.55],[1.75,.85],[0,.85]]),0x6a584a,[x,8.55,z],null,null,{uv:[3,.5]}));
  pIron.push(part(latheG([[0,0],[.5,0],[.7,.15],[1.15,.45],[1.25,.75],[1.1,.8],[0,.6]],12),0x2a2422,[x,9.4,z]));
  for(let k=0;k<6;k++){const sa=a+k*TAU/6;pIron.push(part(Cone(.07,.6,4),0x2a2422,[x+Math.cos(sa)*1.25,10.35,z+Math.sin(sa)*1.25]))}
  W.circles.push({x,z,r:1.65,h:12});W.fireSpots.push({p:new V3(x,10.2,z),k:1.4,light:true});
}
function statue(x,z,rotY,W,scale){
  const M=MODELS.brute,parts=[M.body.clone()];
  for(const k of ['armL','armR','legL','legR']){const g=M[k].g.clone();g.translate(...M[k].p);parts.push(g)}
  const sg=merge(parts);sg.scale(scale||1.9,scale||1.9,scale||1.9);
  const m=new THREE.Mesh(sg,MAT({color:0x8a7a6e,map:TEX.floor.map,normalMap:TEX.floor.normal,roughness:.85}));
  m.position.set(x,1.6,z);m.rotation.y=rotY;m.castShadow=m.receiveShadow=!!QP.shadow;BUILD.add(m);
  meshOf(merge([part(Box(3.2,1.6,3.2),0x5a4a40,[x,.8,z],null,null,{uv:[1,.5]})]),stoneMat,true,true);
  W.circles.push({x,z,r:2.1,h:8});
}

/* ================= ARENA ================= */
function buildArena(){
  const W={name:'arena',group:new THREE.Group(),circles:[],segs:[],fireSpots:[],lava:[],fog:.013,shadowExt:42,follow:false,spawn:new V3(0,0,8.5),yaw:0,
    inside:(x,z)=>x*x+z*z<R*R,
    clamp(p,r){const rr=Math.hypot(p.x,p.z),lim=R-.8-r;if(rr>lim){p.x*=lim/rr;p.z*=lim/rr}},
    rayBound(o,d,t,a){const b=2*(o.x*d.x+o.z*d.z),c=o.x*o.x+o.z*o.z-R*R,disc=b*b-4*a*c;if(disc>0){const tw=(-b+Math.sqrt(disc))/(2*a);if(tw>0&&tw<t)return tw}return t}};
  BUILD=W.group;scene.add(W.group);
  const fg=new THREE.CircleGeometry(R+4,72);fg.rotateX(-Math.PI/2);
  const floor=new THREE.Mesh(fg,MAT({map:TEX.floor.map,normalMap:TEX.floor.normal,roughnessMap:TEX.floor.rough,roughness:1,metalness:0,color:0xa89282}));
  floor.receiveShadow=!!QP.shadow;BUILD.add(floor);
  // lava channels: central ritual circle, five rivers, stray cracks
  const lv=[],rr2=rng(12);
  for(let i=0;i<5;i++){let a=i/5*TAU+.3,x=Math.cos(a)*5.2,z=Math.sin(a)*5.2;
    for(let s=0;s<6;s++){const na=a+(rr2()-.5)*.6,len=1.6+rr2()*1.8,nx=x+Math.cos(na)*len,nz=z+Math.sin(na)*len;
      lv.push(lavaStrip(x,z,nx,nz,.7-s*.08));x=nx;z=nz;a=na*.7+a*.3;if(Math.hypot(x,z)>11)break}}
  for(let i=0;i<9;i++){let a=rr2()*TAU,rad=16+rr2()*14,x=Math.cos(a)*rad,z=Math.sin(a)*rad;for(let s=0;s<4;s++){const na=a+(rr2()-.5)*1.6,len=1+rr2()*2,nx=x+Math.cos(na)*len,nz=z+Math.sin(na)*len;lv.push(lavaStrip(x,z,nx,nz,.22));x=nx;z=nz;a=na}}
  const ring=new THREE.RingGeometry(4.8,5.15,64);ring.rotateX(-Math.PI/2);{const u=ring.attributes.uv,p=ring.attributes.position;for(let i=0;i<u.count;i++)u.setY(i,(Math.hypot(p.getX(i),p.getZ(i))-4.8)/.35)}lv.push(part(ring,0xffffff,[0,.031,0]));
  for(let i=0;i<5;i++){const a=i/5*TAU+.3,b=(i+2)/5*TAU+.3;lv.push(lavaStrip(Math.cos(a)*4.8,Math.sin(a)*4.8,Math.cos(b)*4.8,Math.sin(b)*4.8,.28))}
  const lavaMesh=new THREE.Mesh(merge(lv),lavaMat);lavaMesh.position.y=.005;BUILD.add(lavaMesh);
  meshOf(merge([part(Cyl(1.3,1.6,.5,8),0x4a3c36,[0,.25,0],null,null,{uv:[3,.5]}),part(Cone(.55,3.6,5),0x2a2220,[0,2.2,0],[0,.4,0],[1,1,.8])]),stoneMat,true,true);
  meshOf(merge([part(Box(.08,1.6,.02),HOT(5,1,.3,.05),[0,2.1,.33],[0,.4,0]),part(Box(.02,1.2,.08),HOT(5,1,.3,.05),[.3,1.9,0],[0,.4,0])]),glowMat);
  W.circles.push({x:0,z:0,r:1.6,h:4});
  // walls with arched niches, pilasters, towers and a gate
  const wl=[],wg=[],iron=[];const N=36,WR=R+1.2,gateA=-Math.PI/2;
  for(let i=0;i<N;i++){const a=i/N*TAU,ca=Math.cos(a),sa=Math.sin(a),yaw=-a+Math.PI/2,w=TAU*WR/N+.25;
    if(Math.abs(angDiff(a,gateA))<.2)continue;
    const at=(d,y,lat)=>[ca*(WR+d)+(-sa)*(lat||0),y,sa*(WR+d)+ca*(lat||0)];
    wl.push(part(Box(w,9.5,2.6),tint(0x8a7666,rand(.8,1.05)),at(0,4.75),[0,yaw,0],null,{uv:[w/3,3]}));
    wl.push(part(Box(w,1.1,3.2),0x5a4a40,at(-.2,.55),[0,yaw,0],null,{uv:[w/3,.4]}));
    wl.push(part(Box(1.1,10.4,3.4),0x7a685a,at(-.3,5.2,w/2),[0,yaw,0],null,{uv:[.4,3.5]}));
    wl.push(part(Box(w,.6,3.4),0x5a4a40,at(-.2,9.8),[0,yaw,0],null,{uv:[w/3,.2]}));
    for(let k=-1;k<=1;k++)wl.push(part(Box(1.1,1.3,2.6),0x7a685a,at(0,10.75,k*w/3),[0,yaw,0],null,{uv:[.4,.4]}));
    if(i%2===0){
      wl.push(part(Box(2.4,4.4,.5),0x1a1210,at(-1.2,3.8),[0,yaw,0]));
      const arch=new THREE.CylinderGeometry(1.45,1.45,.7,12,1,false,0,Math.PI);arch.rotateZ(Math.PI/2);arch.rotateY(Math.PI/2);
      wl.push(part(arch,0x7a685a,at(-1.25,6,0),[0,yaw,0],null,{uv:[2,1]}));
      if(i%4===0)wg.push(part(Box(1.6,3.2,.1),HOT(2.6,1,.3,.07),at(-1.1,3.9),[0,yaw,0]));
      else{wl.push(part(Box(.12,3.6,.12),0x111111,at(-1.4,3.8,-.4),[0,yaw,0]));wl.push(part(Box(.12,3.6,.12),0x111111,at(-1.4,3.8,.4),[0,yaw,0]))}
    }else{
      const tp=at(-1.5,4.3);iron.push(part(Cyl(.12,.2,.5,6),0x2a2624,tp));iron.push(part(Box(.12,.12,.9),0x2a2624,at(-1.1,3.9),[0,yaw,0]));
      W.fireSpots.push({p:new V3(tp[0],4.65,tp[2]),k:.5});
      if(i%4===1){const bn=new THREE.PlaneGeometry(2.2,5,1,8);const bp=bn.attributes.position;for(let v=0;v<bp.count;v++)bp.setZ(v,Math.sin(bp.getY(v)*2.2)*.08);bn.computeVertexNormals();
        wl.push(part(bn,0x5a0808,at(-1.4,6.8,1.6),[0,yaw+Math.PI,0]));wl.push(part(Box(.5,.5,.05),HOT(1.2,1,.6,.2),at(-1.45,7.4,1.6),[0,yaw,Math.PI/4]))}
    }
    if(i%6===3){
      const tp=[ca*(WR+1.5),0,sa*(WR+1.5)];
      wl.push(part(Cyl(3,3.4,17,14),tint(0x7a685a,rand(.85,1)),[tp[0],8.5,tp[2]],null,null,{uv:[4,5]}));
      wl.push(part(Cyl(3.5,3.5,.8,14),0x5a4a40,[tp[0],17.2,tp[2]],null,null,{uv:[4,.3]}));
      iron.push(part(Cone(3.6,7,14),0x241c1a,[tp[0],21,tp[2]]));iron.push(part(Cyl(.06,.06,4,4),0x241c1a,[tp[0],26,tp[2]]));
      for(let k=0;k<3;k++)wg.push(part(Box(.3,1.3,.2),HOT(4,1,.35,.08),[tp[0]-ca*3.05,6+k*4,tp[2]-sa*3.05],[0,yaw,0]));
    }
  }
  {const gz=-WR;
    wl.push(part(Box(2.4,13,4),0x7a685a,[-5,6.5,gz],null,null,{uv:[1,4]}),part(Box(2.4,13,4),0x7a685a,[5,6.5,gz],null,null,{uv:[1,4]}),part(Box(12.4,2.4,4),0x6a584a,[0,12.2,gz],null,null,{uv:[4,1]}));
    wl.push(part(Box(1.6,4.5,1.6),0x6a584a,[-2.6,10.2,gz+.3],[0,0,-.75]),part(Box(1.6,4.5,1.6),0x6a584a,[2.6,10.2,gz+.3],[0,0,.75]));
    for(let k=-3;k<=3;k++)iron.push(part(Cyl(.11,.11,9.8,6),0x1a1614,[k*1.15,4.9,gz-.2]));
    for(let k=0;k<4;k++)iron.push(part(Box(8.4,.16,.2),0x1a1614,[0,1.4+k*2.4,gz-.2]));
    wg.push(part(Box(8.4,10,.1),HOT(3.2,1,.25,.05),[0,5,gz-1.6]));
    W.fireSpots.push({p:new V3(0,3,gz+.8),k:0,light:true});
    for(const s of [-1,1])statue(s*8.2,gz+4.6,s*-.25,W);
  }
  meshOf(merge(wl),stoneMat,true,true);meshOf(merge(wg),glowMat);meshOf(merge(iron),ironMat,true,false);
  const pl=[],pIron=[];
  for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6;brazierPillar(pl,pIron,Math.cos(a)*13.5,Math.sin(a)*13.5,a,W);
    const x=Math.cos(a)*13.5,z=Math.sin(a)*13.5;for(let k=0;k<3;k++){const sa=a+k*TAU/3+.4;pl.push(part(blob(.22,.25,.24,8,.05,k),0xcfc2a0,[x+Math.cos(sa)*1.55,1.12,z+Math.sin(sa)*1.55]))}}
  for(let i=0;i<8;i++){const a=i/8*TAU+rand(-.15,.15),rad=rand(24,28),x=Math.cos(a)*rad,z=Math.sin(a)*rad,h=rand(2.2,5);
    pl.push(part(latheG([[0,0],[1.4,0],[1.4,.3],[1.15,.5],[0,.5]]),0x6a584a,[x,0,z],null,null,{uv:[3,.5]}));
    const sh=fluteG(.9,1,h);{const p=sh.attributes.position;for(let k=0;k<p.count;k++)if(p.getY(k)>h/2-.01)p.setY(k,p.getY(k)+Math.sin(p.getX(k)*4+p.getZ(k)*3)*.35);sh.computeVertexNormals()}
    pl.push(part(sh,tint(0x8a7666,rand(.85,1)),[x,h/2+.5,z],[rand(-.05,.05),0,rand(-.05,.05)],null,{uv:[2.5,2]}));
    const fa=a+rand(-1,1);pl.push(part(fluteG(.9,.9,2.2),0x7a6a5e,[x+Math.cos(fa)*2.7,.85,z+Math.sin(fa)*2.7],[Math.PI/2,fa,0],null,{uv:[2.5,1]}));
    W.circles.push({x,z,r:1.25,h:h+.5});
  }
  const rb=[];const r3=rng(77);
  for(let i=0;i<90;i++){const a=r3()*TAU,rad=6+r3()*29,s=.12+r3()*r3()*.6;rb.push(part(blob(s*1.2,s*.7,s,6,.3,i),tint(0x7a6a5e,.7+r3()*.4),[Math.cos(a)*rad,s*.35,Math.sin(a)*rad],[r3(),r3()*3,r3()],null,{flat:true}))}
  const bones=[];
  for(let i=0;i<14;i++){const a=r3()*TAU,rad=R-2.5-r3()*2,x=Math.cos(a)*rad,z=Math.sin(a)*rad;
    for(let k=0;k<7;k++)bones.push(part(blob(.16,.15,.18,8,.05,k),0xd2c4a2,[x+(r3()-.5)*1.2,.12+r3()*.35,z+(r3()-.5)*1.2],[r3(),r3()*6,0]));
    for(let k=0;k<4;k++)bones.push(limb([x+(r3()-.5)*1.5,.05,z+(r3()-.5)*1.5],[x+(r3()-.5)*1.5,.08,z+(r3()-.5)*1.5],.035,.035,0xcab894,5))}
  for(let i=0;i<14;i++){const a=i/14*TAU+.1;if(Math.abs(angDiff(a,gateA))<.35)continue;const x=Math.cos(a)*(R-1.4),z=Math.sin(a)*(R-1.4);
    pIron.push(part(Cyl(.04,.07,2.4,5),0x2a2220,[x,1.2,z]));bones.push(part(blob(.2,.22,.24,10,.05,i),0xd8ccb0,[x,2.5,z]))}
  meshOf(merge(pl),floorStoneMat,true,true);meshOf(merge(pIron),ironMat,true,false);meshOf(merge(rb),floorStoneMat,true,true);meshOf(merge(bones),boneMat,true,false);
  if(fogMat){const fgm=new THREE.Mesh(new THREE.CircleGeometry(R+1,40),fogMat);fgm.rotation.x=-Math.PI/2;fgm.position.y=.45;fgm.renderOrder=2;BUILD.add(fgm)}
  BUILD=scene;
  return W;
}
