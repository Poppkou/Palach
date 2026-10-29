/* ================= PROCEDURAL TEXTURES ================= */
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function noise2(size,period,oct,seed){
  const out=new Float32Array(size*size),r=rng(seed);let amp=1,tot=0;
  for(let o=0;o<oct;o++){const P=period<<o,g=new Float32Array(P*P);for(let i=0;i<g.length;i++)g[i]=r();const s=P/size;
    for(let y=0;y<size;y++){const fy=y*s,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty),y0=iy%P,y1=(iy+1)%P;
      for(let x=0;x<size;x++){const fx=x*s,ix=fx|0,tx=fx-ix,sx=tx*tx*(3-2*tx),x0=ix%P,x1=(ix+1)%P;
        const a=g[y0*P+x0]+(g[y0*P+x1]-g[y0*P+x0])*sx,b=g[y1*P+x0]+(g[y1*P+x1]-g[y1*P+x0])*sx;out[y*size+x]+=(a+(b-a)*sy)*amp}}
    tot+=amp;amp*=.5}
  for(let i=0;i<out.length;i++)out[i]/=tot;return out;
}
function normalMap(h,size,str){
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),im=g.createImageData(size,size),d=im.data;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const l=h[y*size+((x-1+size)%size)],r=h[y*size+((x+1)%size)],u=h[((y-1+size)%size)*size+x],dn=h[((y+1)%size)*size+x];
    let nx=(l-r)*str,ny=(dn-u)*str,nz=1;const il=1/Math.hypot(nx,ny,nz);const i=(y*size+x)*4;
    d[i]=(nx*il*.5+.5)*255;d[i+1]=(ny*il*.5+.5)*255;d[i+2]=(nz*il*.5+.5)*255;d[i+3]=255}
  g.putImageData(im,0,0);return c;
}
function toTex(c,rep){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
function canvasFrom(size,fn){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),im=g.createImageData(size,size);fn(im.data);g.putImageData(im,0,0);return c}
function flagstones(){
  const S=512,N=5,cs=S/N,r=rng(7),pts=[];
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)pts.push([(i+.2+r()*.6)*cs,(j+.2+r()*.6)*cs,r()]);
  const det=noise2(S,16,4,3),low=noise2(S,4,3,5),hgt=new Float32Array(S*S),edgeA=new Float32Array(S*S),idA=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const ci=Math.floor(x/cs),cj=Math.floor(y/cs);let d1=1e9,d2=1e9,id=0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){let ii=ci+di,jj=cj+dj,ox=0,oy=0;if(ii<0){ii+=N;ox=-S}if(ii>=N){ii-=N;ox=S}if(jj<0){jj+=N;oy=-S}if(jj>=N){jj-=N;oy=S}
      const p=pts[jj*N+ii],dx=p[0]+ox-x,dy=p[1]+oy-y,dd=Math.sqrt(dx*dx+dy*dy);if(dd<d1){d2=d1;d1=dd;id=p[2]}else if(dd<d2)d2=dd}
    const e=d2-d1,i=y*S+x;edgeA[i]=e;idA[i]=id;
    hgt[i]=Math.min(1,e/14)*(.75+.25*det[i])+det[i]*.15;
  }
  const alb=canvasFrom(S,d=>{for(let i=0;i<S*S;i++){const e=edgeA[i],m=Math.min(1,e/5),id=idA[i],dn=det[i],lw=low[i];
    let k=(.62+id*.4)*(.72+dn*.5)*(.75+lw*.4);let R=96*k,G=84*k,B=74*k;
    if(id>.7){R*=1.06;G*=.96}if(lw>.62){R*=.82;G*=.72;B*=.68}
    R=R*m+28*(1-m);G=G*m+22*(1-m);B=B*m+18*(1-m);d[i*4]=R;d[i*4+1]=G;d[i*4+2]=B;d[i*4+3]=255}});
  const rough=canvasFrom(S,d=>{for(let i=0;i<S*S;i++){const wet=low[i]>.6?.45:.9;const v=(Math.min(1,edgeA[i]/5)*wet+(1-Math.min(1,edgeA[i]/5))*.95)*255;d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255}});
  return {map:toTex(alb,11),normal:toTex(normalMap(hgt,S,4),11),rough:toTex(rough,11)};
}
function bricks(){
  const S=256,rows=6,bw=S/3,bh=S/rows,det=noise2(S,16,4,11),hgt=new Float32Array(S*S),r=rng(9),tone=[];for(let i=0;i<64;i++)tone.push(r());
  const alb=canvasFrom(S,d=>{for(let y=0;y<S;y++){const row=Math.floor(y/bh),off=(row%2)*bw*.5;for(let x=0;x<S;x++){
    const xx=(x+off)%S,col=Math.floor(xx/bw),lx=xx-col*bw,ly=y-row*bh,e=Math.min(lx,bw-lx,ly,bh-ly),m=Math.min(1,e/3),i=y*S+x,dn=det[i];
    hgt[i]=m*(.8+dn*.3);const k=(.6+tone[(row*3+col)%64]*.45)*(.7+dn*.5);
    d[i*4]=(74*k)*m+24*(1-m);d[i*4+1]=(62*k)*m+19*(1-m);d[i*4+2]=(56*k)*m+16*(1-m);d[i*4+3]=255}}});
  return {map:toTex(alb),normal:toTex(normalMap(hgt,S,5))};
}
function fleshTex(){
  const S=256,n1=noise2(S,8,4,21),n2=noise2(S,16,3,23),hgt=new Float32Array(S*S);
  const alb=canvasFrom(S,d=>{for(let i=0;i<S*S;i++){const vein=Math.pow(1-Math.abs(n1[i]*2-1),9),pore=n2[i];hgt[i]=vein*.6+pore*.5;
    const k=.78+pore*.35-vein*.35;d[i*4]=255*Math.min(1,k*1.02);d[i*4+1]=255*Math.min(1,k*(1-vein*.45));d[i*4+2]=255*Math.min(1,k*(1-vein*.5));d[i*4+3]=255}});
  return {map:toTex(alb,2),normal:toTex(normalMap(hgt,S,4),2)};
}
function metalTex(){
  const S=256,n=noise2(S,8,5,31),hgt=new Float32Array(S*S),r=rng(33);
  const c=canvasFrom(S,d=>{for(let i=0;i<S*S;i++){const v=150+n[i]*80;hgt[i]=n[i]*.3;d[i*4]=v;d[i*4+1]=v*.95;d[i*4+2]=v*.9;d[i*4+3]=255}});
  const g=c.getContext('2d');g.strokeStyle='rgba(255,240,220,.18)';for(let i=0;i<70;i++){g.lineWidth=r()*1.2+.3;g.beginPath();const x=r()*S,y=r()*S,a=r()*TAU,l=r()*40+5;g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  return {map:toTex(c),normal:toTex(normalMap(hgt,S,3))};
}
function bloodTex(){
  const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),r=rng(41);
  g.fillStyle='#fff';
  for(let i=0;i<7;i++){g.globalAlpha=.85;g.beginPath();g.arc(64+(r()-.5)*40,64+(r()-.5)*40,10+r()*20,0,TAU);g.fill()}
  for(let i=0;i<26;i++){const a=r()*TAU,d=30+r()*30;g.globalAlpha=.9;g.beginPath();g.arc(64+Math.cos(a)*d,64+Math.sin(a)*d,1+r()*4,0,TAU);g.fill()}
  const t=new THREE.CanvasTexture(c);return t;
}
// environment light: a blurred hellish sky so metal and wet stone have something to reflect
function makeEnv(){
  try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene(),g=new THREE.SphereGeometry(10,32,16),p=g.attributes.position,c=[];
    for(let i=0;i<p.count;i++){const y=p.getY(i)/10;let r,gg,b;if(y>0){const k=Math.pow(1-y,4);r=.05+1.1*k;gg=.015+.35*k;b=.012+.1*k}else{r=.18;gg=.06;b=.03}c.push(r,gg,b)}
    g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));es.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
    for(let i=0;i<7;i++){const a=i/7*TAU,m=new THREE.Mesh(new THREE.SphereGeometry(.7,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(5,2.2,.6)}));m.position.set(Math.cos(a)*8,1+Math.random()*2,Math.sin(a)*8);es.add(m)}
    const t=pm.fromScene(es,.03).texture;pm.dispose();return t}catch(e){return null}
}
// scorched wasteland soil for the story map: ash, cracks and pebbles
function ashGround(){
  const S=512,n1=noise2(S,8,5,51),n2=noise2(S,32,3,53),n3=noise2(S,4,2,55),hgt=new Float32Array(S*S);
  const alb=canvasFrom(S,d=>{for(let i=0;i<S*S;i++){const crack=Math.pow(1-Math.abs(n1[i]*2-1),14),peb=n2[i]>.68?(n2[i]-.68)*3:0,big=n3[i];
    hgt[i]=n1[i]*.4+peb*.8-crack*.7;
    let k=(.55+n2[i]*.3)*(.7+big*.5);let R=70*k,G=56*k,B=48*k;
    if(big<.38){R*=.75;G*=.7;B*=.7}
    R+=peb*40;G+=peb*34;B+=peb*30;R=R*(1-crack*.8)+crack*30;G*=1-crack*.85;B*=1-crack*.9;
    d[i*4]=R;d[i*4+1]=G;d[i*4+2]=B;d[i*4+3]=255}});
  return {map:toTex(alb,34),normal:toTex(normalMap(hgt,S,3),34)};
}
function woodTex(){
  const S=256,n=noise2(S,4,4,61),f=noise2(S,32,2,63),hgt=new Float32Array(S*S);
  const alb=canvasFrom(S,d=>{for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x,plank=Math.floor(x/(S/5)),edge=Math.min(x%(S/5),S/5-x%(S/5)),m=Math.min(1,edge/2);
    const grain=.5+.5*Math.sin(y*.15+n[i]*14+plank*3);hgt[i]=m*(.6+grain*.2);const k=(.55+grain*.25+f[i]*.2)*(.8+plank%3*.08);
    d[i*4]=(58*k)*m+14*(1-m);d[i*4+1]=(40*k)*m+10*(1-m);d[i*4+2]=(28*k)*m+8*(1-m);d[i*4+3]=255}});
  return {map:toTex(alb),normal:toTex(normalMap(hgt,S,3))};
}
const ENV=QP.env?makeEnv():null;
if(ENV){scene.environment=ENV;vmScene.environment=ENV}
const TEX={floor:flagstones(),brick:bricks(),flesh:fleshTex(),metal:metalTex(),blood:bloodTex(),ash:ashGround(),wood:woodTex()};

