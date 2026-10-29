/* ================= GEOMETRY HELPERS ================= */
const Box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const Cone=(r,h,s)=>new THREE.ConeGeometry(r,h,s||6);
const Cyl=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s||10);
const Ico=(r,d)=>new THREE.IcosahedronGeometry(r,d||0);
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_c=new THREE.Color();
function part(geo,color,pos,rot,scl,o){
  o=o||{};let g=geo.clone();
  if(o.q)_q.copy(o.q);else{_e.set(rot?rot[0]:0,rot?rot[1]:0,rot?rot[2]:0);_q.setFromEuler(_e)}
  _m4.compose(new V3(...(pos||[0,0,0])),_q,new V3(...(scl||[1,1,1])));
  g.applyMatrix4(_m4);
  if(g.index)g=g.toNonIndexed();
  if(o.flat)g.computeVertexNormals();
  const n=g.attributes.position.count;
  if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));
  else if(o.uv){const u=g.attributes.uv;for(let i=0;i<n;i++)u.setXY(i,u.getX(i)*o.uv[0],u.getY(i)*o.uv[1])}
  let r,gg,b;
  if(Array.isArray(color)){[r,gg,b]=color}else{_c.set(color);r=_c.r;gg=_c.g;b=_c.b}
  const c=new Float32Array(n*3),jit=o.jit==null?.06:o.jit;
  for(let i=0;i<n;i+=3){const k=1-jit+Math.random()*jit*2;for(let v=i;v<i+3&&v<n;v++){c[v*3]=r*k;c[v*3+1]=gg*k;c[v*3+2]=b*k}}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  return g;
}
function merge(list){
  let n=0;for(const g of list)n+=g.attributes.position.count;
  const p=new Float32Array(n*3),no=new Float32Array(n*3),co=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0,ou=0;
  for(const g of list){p.set(g.attributes.position.array,o);no.set(g.attributes.normal.array,o);co.set(g.attributes.color.array,o);uv.set(g.attributes.uv.array,ou);o+=g.attributes.position.count*3;ou+=g.attributes.position.count*2;g.dispose()}
  const m=new THREE.BufferGeometry();
  m.setAttribute('position',new THREE.BufferAttribute(p,3));m.setAttribute('normal',new THREE.BufferAttribute(no,3));
  m.setAttribute('color',new THREE.BufferAttribute(co,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  m.computeBoundingSphere();return m;
}
function shadeY(geo,y0,y1,lo){const p=geo.attributes.position,c=geo.attributes.color;for(let i=0;i<p.count;i++){const k=lo+(1-lo)*clamp((p.getY(i)-y0)/(y1-y0),0,1);c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k)}return geo}
function blob(rx,ry,rz,seg,amp,seed){
  const g=new THREE.SphereGeometry(1,seg,Math.max(6,(seg*.75)|0)),p=g.attributes.position;seed=seed||0;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=Math.sin(x*3.1+seed)*Math.sin(y*2.7+seed*1.7)*Math.sin(z*3.3+seed*.9)+.5*Math.sin(x*6.3+y*5.1+z*4.7+seed*2.1);
    const k=1+(amp||0)*n;p.setXYZ(i,x*k*rx,y*k*ry,z*k*rz)}
  g.computeVertexNormals();return g;
}
const _up=new V3(0,1,0);
function limb(a,b,r1,r2,color,seg){
  const A=new V3(...a),B=new V3(...b),dir=B.clone().sub(A),len=dir.length();
  const g=new THREE.CylinderGeometry(r2,r1,len,seg||9,2);
  return part(g,color,A.clone().add(B).multiplyScalar(.5).toArray(),null,null,{q:new THREE.Quaternion().setFromUnitVectors(_up,dir.normalize())});
}
function horn(pts,r,color){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p))),T=10,RS=7;
  const g=new THREE.TubeGeometry(curve,T,r,RS,false),p=g.attributes.position,cp=new V3();
  for(let j=0;j<=T;j++){curve.getPointAt(j/T,cp);const k=1-.88*(j/T);for(let s=0;s<=RS;s++){const i=j*(RS+1)+s;p.setXYZ(i,cp.x+(p.getX(i)-cp.x)*k,cp.y+(p.getY(i)-cp.y)*k,cp.z+(p.getZ(i)-cp.z)*k)}}
  g.computeVertexNormals();return part(g,color);
}
const HOT=(k,r,g,b)=>[r*k,g*k,b*k];

