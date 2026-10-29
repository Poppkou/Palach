'use strict';
const $=id=>document.getElementById(id);
const V3=THREE.Vector3;
const TAU=Math.PI*2;
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const settings=Object.assign({sens:1,assist:true,music:true,quality:'auto',shake:true,fps30:false},store.get('palach-settings',{}));
let best=store.get('palach-best',0);
const isTouch=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)||('ontouchstart' in window);
const IS_APP=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};

// Budget phones get the low preset: no post, no shadows, Lambert shading, MSAA from the default framebuffer.
function detectQuality(){
  if(!isTouch)return 'high';
  const mem=navigator.deviceMemory||4,cores=navigator.hardwareConcurrency||4;
  let gpu='';
  try{const gl=document.createElement('canvas').getContext('webgl');const ext=gl&&gl.getExtension('WEBGL_debug_renderer_info');gpu=gl?String(gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)||''):'';const lose=gl&&gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext()}catch(e){}
  if(mem<=3||cores<=4)return 'low';
  if(/Mali-(T|G3|G5[0-9]|G6[0-9]|G7[0-2])|Adreno \(TM\) ([1-5]\d\d|6[0-3]\d)|PowerVR|SGX|Vivante|Tegra/i.test(gpu))return 'low';
  return 'med';
}
const QUAL=settings.quality==='auto'?detectQuality():settings.quality;
const QP={
  low:{shadow:0,pl:0,post:false,fog:false,res:.8,lambert:true,parts:.45,maxEnemies:8,env:false,dpr:1.3},
  med:{shadow:1024,pl:2,post:true,fog:true,res:.75,lambert:false,parts:.8,maxEnemies:11,env:true,dpr:1.6},
  high:{shadow:2048,pl:4,post:true,fog:true,res:1,lambert:false,parts:1,maxEnemies:12,env:true,dpr:2}
}[QUAL]||{shadow:1024,pl:2,post:true,fog:true,res:.75,lambert:false,parts:.8,maxEnemies:11,env:true,dpr:1.6};
// Material factory: Standard (PBR) normally, Lambert on the low preset.
function MAT(o){
  if(QP.lambert){const l={};for(const k of ['vertexColors','map','color','transparent','depthWrite','side','polygonOffset','polygonOffsetFactor','emissive'])if(o[k]!==undefined)l[k]=o[k];return new THREE.MeshLambertMaterial(l)}
  return new THREE.MeshStandardMaterial(o);
}

/* ================= RENDERER ================= */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!QP.post,powerPreference:'high-performance'});
renderer.autoClear=false;
renderer.shadowMap.enabled=!!QP.shadow;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
if(!QP.post){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3}
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x2a0e08,.013);
const camera=new THREE.PerspectiveCamera(80,innerWidth/innerHeight,0.05,400);
camera.rotation.order='YXZ';
scene.add(camera);
const vmScene=new THREE.Scene();
const vmCam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.01,10);
const baseDpr=Math.min(window.devicePixelRatio||1,isTouch?QP.dpr:2);
let resScale=QP.res;
const _dbs=new THREE.Vector2();
let post=null;
function applyRes(){
  renderer.setPixelRatio(baseDpr*resScale);
  renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=vmCam.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();vmCam.updateProjectionMatrix();
  renderer.getDrawingBufferSize(_dbs);
  if(post)post.size(_dbs.x,_dbs.y);
}
const TMDEF=QP.post?{}:{TM:1};
const GLSL_COMMON=`
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vnoise(p);p=p*2.03+17.1;a*=.5;}return v;}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
`;

/* ================= POST PROCESSING (bloom + FXAA + grade) ================= */
function makePost(){
  let type=THREE.UnsignedByteType;
  const ex=renderer.extensions;
  if(renderer.capabilities.isWebGL2?(ex.has('EXT_color_buffer_float')||ex.has('EXT_color_buffer_half_float')):(ex.has('OES_texture_half_float')&&ex.has('EXT_color_buffer_half_float')))type=THREE.HalfFloatType;
  const o={type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false};
  const main=new THREE.WebGLRenderTarget(4,4,Object.assign({},o,{depthBuffer:true}));
  const a=new THREE.WebGLRenderTarget(4,4,o),b=new THREE.WebGLRenderTarget(4,4,o),c=new THREE.WebGLRenderTarget(4,4,o),d=new THREE.WebGLRenderTarget(4,4,o);
  const cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1),scn=new THREE.Scene();
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;scn.add(quad);
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const SM=(fs,u)=>new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms:u,depthTest:false,depthWrite:false});
  const bright=SM(`uniform sampler2D t;uniform vec2 px;varying vec2 vUv;void main(){vec3 c=(texture2D(t,vUv+px*vec2(-1,-1)).rgb+texture2D(t,vUv+px*vec2(1,-1)).rgb+texture2D(t,vUv+px*vec2(-1,1)).rgb+texture2D(t,vUv+px*vec2(1,1)).rgb)*.25;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(1.05,2.2,l),1.);}`,{t:{value:null},px:{value:new THREE.Vector2()}});
  const blur=SM(`uniform sampler2D t;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*.227;c+=texture2D(t,vUv+dir*1.385).rgb*.316;c+=texture2D(t,vUv-dir*1.385).rgb*.316;c+=texture2D(t,vUv+dir*3.231).rgb*.07;c+=texture2D(t,vUv-dir*3.231).rgb*.07;gl_FragColor=vec4(c,1.);}`,{t:{value:null},dir:{value:new THREE.Vector2()}});
  // FXAA runs on a Reinhard-compressed copy so bright HDR edges are smoothed too, then the compression is undone.
  const comp=SM(GLSL_COMMON+`uniform sampler2D tS,tA,tB;uniform float uHurt,uParry,uLow,uExp;uniform vec2 uPx;varying vec2 vUv;
  float lu(vec3 c){return dot(c,vec3(.299,.587,.114));}
  vec3 S(vec2 uv){vec3 c=texture2D(tS,uv).rgb;return c/(1.+c);}
  void main(){
    vec3 M=S(vUv),NW=S(vUv+vec2(-1.,-1.)*uPx),NE=S(vUv+vec2(1.,-1.)*uPx),SW=S(vUv+vec2(-1.,1.)*uPx),SE=S(vUv+vec2(1.,1.)*uPx);
    float lM=lu(M),lNW=lu(NW),lNE=lu(NE),lSW=lu(SW),lSE=lu(SE);
    float mn=min(lM,min(min(lNW,lNE),min(lSW,lSE))),mx=max(lM,max(max(lNW,lNE),max(lSW,lSE)));
    vec3 base=M;
    if(mx-mn>max(.03,mx*.1)){
      vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),((lNW+lSW)-(lNE+lSE)));
      float red=max((lNW+lNE+lSW+lSE)*.03125,1./128.);float rcp=1./(min(abs(dir.x),abs(dir.y))+red);
      dir=clamp(dir*rcp,-6.,6.)*uPx;
      vec3 A=.5*(S(vUv-dir*.1667)+S(vUv+dir*.1667));
      vec3 B=A*.5+.25*(S(vUv-dir*.5)+S(vUv+dir*.5));float lB=lu(B);
      base=(lB<mn||lB>mx)?A:B;
    }
    vec3 c=base/max(vec3(1e-3),1.-base);
    vec3 bl=texture2D(tA,vUv).rgb*.8+texture2D(tB,vUv).rgb*.9;c+=bl*.6;
    c*=uExp;c=aces(c);
    float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.08-uLow*.6);
    c=pow(c,vec3(1.04,1.,.96));
    vec2 q=vUv-.5;float v=dot(q,q);c*=1.-v*.9;
    c=mix(c,c*vec3(1.4,.45,.4)+vec3(.12,0.,0.),clamp(uHurt*(.4+v*2.5),0.,.8));
    c+=vec3(.15,.9,.3)*uParry*v*2.5;
    gl_FragColor=vec4(c,1.);}`,{tS:{value:main.texture},tA:{value:a.texture},tB:{value:d.texture},uHurt:{value:0},uParry:{value:0},uLow:{value:0},uExp:{value:1.2},uPx:{value:new THREE.Vector2()}});
  function pass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(scn,cam)}
  return {main,comp,
    size(w,h){main.setSize(w,h);const w4=Math.max(2,w>>2),h4=Math.max(2,h>>2),w8=Math.max(2,w>>3),h8=Math.max(2,h>>3);a.setSize(w4,h4);b.setSize(w4,h4);c.setSize(w8,h8);d.setSize(w8,h8);comp.uniforms.uPx.value.set(1/w,1/h);this.w4=w4;this.h4=h4;this.w8=w8;this.h8=h8;this.w=w;this.h=h},
    render(withVM){
      renderer.setRenderTarget(main);renderer.clear();renderer.render(scene,camera);
      if(withVM){renderer.clearDepth();renderer.render(vmScene,vmCam)}
      bright.uniforms.t.value=main.texture;bright.uniforms.px.value.set(1/this.w,1/this.h);pass(bright,a);
      blur.uniforms.t.value=a.texture;blur.uniforms.dir.value.set(1/this.w4,0);pass(blur,b);
      blur.uniforms.t.value=b.texture;blur.uniforms.dir.value.set(0,1/this.h4);pass(blur,a);
      blur.uniforms.t.value=a.texture;blur.uniforms.dir.value.set(1.5/this.w8,0);pass(blur,c);
      blur.uniforms.t.value=c.texture;blur.uniforms.dir.value.set(0,1.5/this.h8);pass(blur,d);
      pass(comp,null);
    },
    dispose(){for(const t of [main,a,b,c,d])t.dispose()}};
}
if(QP.post){try{post=makePost()}catch(e){post=null}}
function syncOverlays(){$('vig').style.display=post?'none':'';$('pflash').style.display=post?'none':''}
syncOverlays();
applyRes();
addEventListener('resize',()=>{applyRes();checkRotate()});
// Live downgrade when a phone cannot hold the frame rate even at the lowest resolution.
let degradeStep=0;
function degrade(){
  if(post){post.dispose();post=null;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;syncOverlays();scene.traverse(o=>{if(o.material)o.material.needsUpdate=true});vmScene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}
  else if(renderer.shadowMap.enabled){renderer.shadowMap.enabled=false;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}
  else return false;
  degradeStep++;showTipForce('Графика снижена для плавной игры');return true;
}
