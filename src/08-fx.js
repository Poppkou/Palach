/* ================= PARTICLES ================= */
const PF_KEYS=['px','py','pz','vx','vy','vz','l','ml','s0','s1','cr','cg','cb','a','gr','dr'];
class PointFX{
  constructor(cap,blend,smoke){
    this.cap=cap;this.n=0;this._t=[];const F=k=>new Float32Array(cap*k);
    for(const k of PF_KEYS)this[k]=F(1);
    this.pos=F(3);this.col=F(3);this.siz=F(1);this.alp=F(1);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol',new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize',new THREE.BufferAttribute(this.siz,1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA',new THREE.BufferAttribute(this.alp,1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0,0);this.g=g;
    this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:blend,uniforms:{uScale:{value:400}},defines:TMDEF,
      vertexShader:'attribute vec3 aCol;attribute float aSize;attribute float aA;uniform float uScale;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float s=aSize*uScale/max(.1,-mv.z);gl_PointSize=clamp(s,2.,256.);gl_Position=projectionMatrix*mv;vC=aCol;vA=aA*min(1.,s*.5);}',
      fragmentShader:smoke?'varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float f=smoothstep(1.,.15,r);gl_FragColor=vec4(vC,f*vA);}'
        :'varying vec3 vC;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float f=pow(max(0.,1.-r),1.8);vec3 c=vC*f*vA;\n#ifdef TM\nc=c/(1.+c*.35);\n#endif\ngl_FragColor=vec4(c,1.);}'});
    this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=smoke?3:4;scene.add(this.pts);this.smoke=smoke;
  }
  emit(x,y,z,vx,vy,vz,life,s0,s1,r,g,b,a,grav,drag){
    let i=this.n;if(i>=this.cap)i=(Math.random()*this.cap)|0;else this.n++;
    this.px[i]=x;this.py[i]=y;this.pz[i]=z;this.vx[i]=vx;this.vy[i]=vy;this.vz[i]=vz;this.l[i]=this.ml[i]=life;this.s0[i]=s0;this.s1[i]=s1;this.cr[i]=r;this.cg[i]=g;this.cb[i]=b;this.a[i]=a;this.gr[i]=grav||0;this.dr[i]=drag||0;
  }
  once(x,y,z,s,r,g,b,a){this._t.push(x,y,z,s,r,g,b,a)}
  clear(){this.n=0;this._t.length=0}
  update(dt){
    let n=this.n;
    for(let i=0;i<n;i++){
      const l=this.l[i]-dt;
      if(l<=0){n--;if(i!==n){for(const k of PF_KEYS)this[k][i]=this[k][n]}i--;continue}
      this.l[i]=l;const dr=Math.exp(-this.dr[i]*dt);this.vx[i]*=dr;this.vz[i]*=dr;this.vy[i]=this.vy[i]*dr-this.gr[i]*dt;
      this.px[i]+=this.vx[i]*dt;this.py[i]+=this.vy[i]*dt;this.pz[i]+=this.vz[i]*dt;if(this.py[i]<.03){this.py[i]=.03;this.vy[i]*=-.3}
    }
    this.n=n;let w=0;
    for(let i=0;i<n;i++){const t=1-this.l[i]/this.ml[i];
      this.pos[w*3]=this.px[i];this.pos[w*3+1]=this.py[i];this.pos[w*3+2]=this.pz[i];
      this.siz[w]=this.s0[i]+(this.s1[i]-this.s0[i])*t;
      if(this.smoke){this.alp[w]=this.a[i]*Math.min(1,t*5)*(1-t);this.col[w*3]=this.cr[i];this.col[w*3+1]=this.cg[i];this.col[w*3+2]=this.cb[i]}
      else{this.alp[w]=this.a[i]*(1-t);this.col[w*3]=this.cr[i];this.col[w*3+1]=this.cg[i]*(1-t*.75);this.col[w*3+2]=this.cb[i]*(1-t)}
      w++}
    const T=this._t;
    for(let j=0;j<T.length&&w<this.cap;j+=8){this.pos[w*3]=T[j];this.pos[w*3+1]=T[j+1];this.pos[w*3+2]=T[j+2];this.siz[w]=T[j+3];this.col[w*3]=T[j+4];this.col[w*3+1]=T[j+5];this.col[w*3+2]=T[j+6];this.alp[w]=T[j+7];w++}
    T.length=0;
    this.g.setDrawRange(0,w);
    for(const k of ['position','aCol','aSize','aA'])this.g.attributes[k].needsUpdate=true;
  }
}
const FX=new PointFX(Math.round(2600*QP.parts),THREE.AdditiveBlending,false);
const SMK=new PointFX(Math.round(1000*QP.parts),THREE.NormalBlending,true);
function fireBurst(p,n,spd,size,life,hot){for(let i=0;i<n;i++){const a=Math.random()*TAU,u=Math.random()*2-1,s=spd*(.3+Math.random()*.7),c=Math.sqrt(1-u*u);
  FX.emit(p.x,p.y,p.z,Math.cos(a)*c*s,u*s+spd*.3,Math.sin(a)*c*s,life*(.5+Math.random()*.6),size*(.6+Math.random()*.6),size*.2,hot[0],hot[1],hot[2],1,-1.5,2.5)}}
function sparks(p,n,spd,col){for(let i=0;i<n;i++){const a=Math.random()*TAU,u=Math.random()*1.6-.4,c=Math.sqrt(Math.max(0,1-u*u)),s=spd*(.4+Math.random()*.8);
  FX.emit(p.x,p.y,p.z,Math.cos(a)*c*s,u*s,Math.sin(a)*c*s,.25+Math.random()*.35,.09,.03,col[0],col[1],col[2],1,14,1)}}
function smoke(p,n,size,col,life,rise){for(let i=0;i<n;i++)SMK.emit(p.x+rand(-.3,.3),p.y+rand(-.2,.2),p.z+rand(-.3,.3),rand(-.6,.6),rand(.3,1)*(rise||1),rand(-.6,.6),life*rand(.7,1.2),size*.5,size*rand(1,1.6),col[0],col[1],col[2],.55,0,1.2)}
function bloodSpray(p,dir,n){
  for(let i=0;i<n;i++)SMK.emit(p.x,p.y,p.z,(dir?dir.x*3:0)+rand(-2,2),rand(0,2.5),(dir?dir.z*3:0)+rand(-2,2),rand(.35,.7),.15,rand(.5,.9),.32,.02,.02,.8,4,2);
  for(let i=0;i<Math.ceil(n/2);i++)gore(p,(dir?dir.x*4:0)+rand(-3,3),rand(1,4),(dir?dir.z*4:0)+rand(-3,3),rand(.03,.07),0x5a0606);
}
function explosion(p,scale){
  fireBurst(p,Math.round(26*scale),7*scale,1.4*scale,.55,[5,1.6,.3]);
  sparks(p,Math.round(18*scale),14*scale,[6,2.5,.6]);
  smoke(p,Math.round(8*scale),1.6*scale,[.08,.05,.04],1.6,1.2);
  FX.emit(p.x,p.y,p.z,0,0,0,.18,4*scale,6*scale,6,2.4,.8,1,0,0);
  decal(p.x,p.z,1.2*scale,true);
}
const dummy=new THREE.Object3D();
// gore chunks (lit, wet)
const GORE_CAP=Math.round(420*QP.parts);const goreMesh=new THREE.InstancedMesh(Ico(1,1),MAT({roughness:.28,metalness:.05}),GORE_CAP);
goreMesh.frustumCulled=false;goreMesh.count=0;for(let i=0;i<GORE_CAP;i++)goreMesh.setColorAt(i,_c.set(0xffffff));scene.add(goreMesh);
const gores=[];
function gore(p,vx,vy,vz,s,col){if(gores.length>=GORE_CAP)gores.shift();_c.set(col);gores.push({x:p.x,y:p.y,z:p.z,vx,vy,vz,s,l:rand(3,6),r:_c.r*rand(.8,1.2),g:_c.g,b:_c.b,rx:rand(0,6),ry:rand(0,6),land:false,sx:rand(.7,1.4),sy:rand(.5,1)})}
function updateGore(dt){
  let n=0;
  for(let i=gores.length-1;i>=0;i--){const q=gores[i];q.l-=dt;if(q.l<=0){gores.splice(i,1);continue}
    if(!q.land){q.vy-=20*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.rx+=dt*8;q.ry+=dt*6;
      if(q.y<q.s*.6){q.y=q.s*.6;if(Math.abs(q.vy)<2.5){q.land=true;if(Math.random()<.25)decal(q.x,q.z,q.s*rand(5,9))}q.vy*=-.25;q.vx*=.5;q.vz*=.5}}
    const sk=q.l<1?q.l:1;
    dummy.position.set(q.x,q.y-(1-sk)*q.s,q.z);dummy.rotation.set(q.rx,q.ry,0);dummy.scale.set(q.s*q.sx,q.s*q.sy,q.s);dummy.updateMatrix();
    goreMesh.setMatrixAt(n,dummy.matrix);goreMesh.setColorAt(n,_c.setRGB(q.r,q.g,q.b));n++}
  goreMesh.count=n;goreMesh.instanceMatrix.needsUpdate=true;if(goreMesh.instanceColor)goreMesh.instanceColor.needsUpdate=true;
}
// floor decals: blood pools and scorch marks
const DEC_CAP=90;
const decMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),MAT({map:TEX.blood,transparent:true,depthWrite:false,roughness:.22,metalness:0,polygonOffset:true,polygonOffsetFactor:-2}),DEC_CAP);
decMesh.frustumCulled=false;decMesh.count=0;decMesh.renderOrder=1;for(let i=0;i<DEC_CAP;i++)decMesh.setColorAt(i,_c.set(0xffffff));scene.add(decMesh);
const decals=[];let decI=0;
function decal(x,z,s,scorch){const d={x,z,s:0,ts:s,rot:Math.random()*TAU,scorch};if(decals.length<DEC_CAP)decals.push(d);else{decals[decI]=d;decI=(decI+1)%DEC_CAP}}
function updateDecals(dt){
  decals.forEach((d,i)=>{if(d.s<d.ts)d.s=Math.min(d.ts,d.s+dt*d.ts*(d.scorch?8:1.5));dummy.position.set(d.x,.02+i*.0003,d.z);dummy.rotation.set(0,d.rot,0);dummy.scale.set(d.s,1,d.s);dummy.updateMatrix();decMesh.setMatrixAt(i,dummy.matrix);
    decMesh.setColorAt(i,d.scorch?_c.setRGB(.04,.03,.025):_c.setRGB(.3,.015,.01))});
  decMesh.count=decals.length;decMesh.instanceMatrix.needsUpdate=true;if(decMesh.instanceColor)decMesh.instanceColor.needsUpdate=true;
}
// projectiles + tracers
function instPool(geo,mat,cap){const m=new THREE.InstancedMesh(geo,mat,cap);m.frustumCulled=false;m.count=0;scene.add(m);return m}
const PROJ_HOT=[[5,1.6,.3],[1,5,1.3],[1.4,3.4,6]];
const projCore=PROJ_HOT.map(c=>instPool(Ico(1,2),new THREE.MeshBasicMaterial({color:new THREE.Color(c[0]*.6,c[1]*.6,c[2]*.6),toneMapped:false}),220));
const tracerMesh=instPool(Box(.035,.035,1),new THREE.MeshBasicMaterial({color:new THREE.Color(4,2.4,.9),toneMapped:false}),80);

