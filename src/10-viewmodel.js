/* ================= VIEWMODEL ================= */
vmScene.add(new THREE.HemisphereLight(0xffb090,0x2a0a06,.45));
const vmKey=new THREE.DirectionalLight(0xffa070,1.15);vmKey.position.set(-1,2,1.5);vmScene.add(vmKey);
const vmFill=new THREE.DirectionalLight(0xff3a18,.8);vmFill.position.set(.5,-1,.6);vmScene.add(vmFill);
const vmFlashL=new THREE.PointLight(0xffa040,0,3);vmFlashL.position.set(.3,-.15,-1);vmScene.add(vmFlashL);
const vmMetal=new THREE.MeshStandardMaterial({vertexColors:true,map:TEX.metal.map,normalMap:TEX.metal.normal,roughness:.36,metalness:.7,envMapIntensity:.45});
const vmGlow=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const vm={};
(function(){
  const iron=0x3a3532,dark=0x1c1918,brass=0x9a7430,wood=0x4a2e1a,leather=0x2e1c12,bone=0xd8ccb0,G=HOT(4,1,.35,.07);
  const gauntlet=()=>[limb([.1,-.42,.45],[0,-.17,.1],.075,.06,dark,10),part(Box(.15,.07,.2),iron,[.05,-.25,.22],[-.4,0,0]),part(Box(.12,.06,.12),iron,[0,-.15,.07],[-.2,0,0]),
    ...[-1,0,1].map(k=>part(Cone(.012,.05,4),bone,[k*.03,-.1,.06],[-.8,0,0]))];
  const sh=new THREE.Group();
  sh.add(new THREE.Mesh(merge([
    part(Box(.17,.19,.5),iron,[0,0,-.12]),part(Box(.19,.06,.46),dark,[0,-.11,-.12]),part(Box(.09,.05,.44),brass,[0,.12,-.12]),
    part(Box(.2,.22,.14),dark,[0,0,.18]),part(Box(.09,.22,.11),leather,[0,-.17,.1],[.3,0,0]),
    part(blob(.05,.045,.05,8,.05,1),bone,[0,.15,-.31]),part(Cone(.015,.07,4),bone,[-.03,.19,-.3],[-.6,0,.3]),part(Cone(.015,.07,4),bone,[.03,.19,-.3],[-.6,0,-.3]),
    ...[0,1,2,3].map(i=>part(Box(.01,.12,.03),0x111111,[.091,0,-.25+i*.09])),...[0,1,2,3].map(i=>part(Box(.01,.12,.03),0x111111,[-.091,0,-.25+i*.09])),
    ...gauntlet()]),vmMetal));
  sh.add(new THREE.Mesh(merge([...[0,1,2,3].map(i=>part(Box(.012,.09,.02),G,[.093,0,-.25+i*.09])),...[0,1,2,3].map(i=>part(Box(.012,.09,.02),G,[-.093,0,-.25+i*.09]))]),vmGlow));
  const drum=new THREE.Mesh(merge([
    part(Cyl(.105,.105,.3,12),dark,[0,0,0],[Math.PI/2,0,0]),part(Cyl(.12,.12,.04,12),brass,[0,0,.12],[Math.PI/2,0,0]),
    ...[0,1,2,3,4,5].map(i=>limb([Math.cos(i/6*TAU)*.08,Math.sin(i/6*TAU)*.08,.15],[Math.cos(i/6*TAU)*.08,Math.sin(i/6*TAU)*.08,-.24],.022,.022,i%2?iron:dark,8)),
    ...[0,1,2].map(i=>part(Cone(.025,.16,5),bone,[Math.cos(i/3*TAU+.5)*.06,Math.sin(i/3*TAU+.5)*.06,-.3],[-Math.PI/2,0,0]))]),vmMetal);
  drum.position.set(0,0,-.5);sh.add(drum);
  vm.shred=sh;vm.drum=drum;
  const sg=new THREE.Group();
  sg.add(new THREE.Mesh(merge([
    limb([-.042,.02,.05],[-.042,.02,-.75],.04,.038,iron,12),limb([.042,.02,.05],[.042,.02,-.75],.04,.038,iron,12),
    part(Box(.17,.05,.08),brass,[0,.02,-.68]),part(Box(.17,.05,.06),brass,[0,.02,-.3]),part(Box(.19,.13,.26),dark,[0,-.01,.1]),
    part(Box(.14,.09,.44),wood,[0,-.06,-.18]),part(Box(.12,.2,.34),wood,[0,-.13,.32],[.35,0,0]),limb([0,-.06,-.02],[0,-.06,-.1],.065,.065,leather,8),
    ...gauntlet()]),vmMetal));
  sg.add(new THREE.Mesh(merge([part(Box(.02,.02,.3),G,[0,.075,-.2])]),vmGlow));
  vm.shot=sg;
  const shield=new THREE.Group();
  shield.add(new THREE.Mesh(merge([
    part(Cyl(.46,.46,.05,28),iron,[0,0,0],[Math.PI/2,0,0]),part(new THREE.TorusGeometry(.48,.035,6,28),brass,[0,0,-.01]),
    part(blob(.13,.15,.08,12,.08,3),bone,[0,0,-.06]),part(Cone(.03,.16,5),bone,[-.08,.13,-.06],[0,0,.5]),part(Cone(.03,.16,5),bone,[.08,.13,-.06],[0,0,-.5]),
    ...[...Array(12)].map((_,i)=>part(Ico(.018),brass,[Math.cos(i/12*TAU)*.38,Math.sin(i/12*TAU)*.38,-.03])),
    part(Box(.7,.05,.03),dark,[0,0,-.03]),part(Box(.05,.7,.03),dark,[0,0,-.03]),limb([.05,-.45,.45],[0,-.05,.06],.075,.06,dark,10)]),vmMetal));
  shield.add(new THREE.Mesh(merge([part(Ico(.02,1),HOT(6,1,.2,.05),[-.04,.02,-.13]),part(Ico(.02,1),HOT(6,1,.2,.05),[.04,.02,-.13])]),vmGlow));
  const teeth=new THREE.Mesh(merge([...Array(18)].map((_,i)=>{const a=i/18*TAU;return part(Cone(.05,.15,3),0xc8c0b8,[Math.cos(a)*.55,Math.sin(a)*.55,0],[0,0,a-Math.PI/2])})),vmMetal);
  shield.add(teeth);vm.shield=shield;vm.teeth=teeth;
  const flail=new THREE.Group();
  flail.add(new THREE.Mesh(merge([
    part(Box(.07,.07,.4),wood,[0,0,0]),part(Box(.1,.1,.08),brass,[0,0,-.22]),
    ...[0,1,2,3].map(i=>part(new THREE.TorusGeometry(.04,.012,5,8),iron,[0,0,-.3-i*.09],[0,i%2?Math.PI/2:0,0])),
    part(blob(.16,.16,.16,12,.06,5),dark,[0,0,-.78]),
    ...[...Array(10)].map((_,i)=>{const a=i/10*TAU,b=(i%2?.5:-.5);return part(Cone(.04,.16,5),bone,[Math.cos(a)*.15,Math.sin(a)*.15,-.78+b*.1],[0,0,a-Math.PI/2])}),
    part(Cone(.04,.16,5),bone,[0,0,-.95],[-Math.PI/2,0,0])]),vmMetal));
  vm.flail=flail;
  const fc=document.createElement('canvas');fc.width=fc.height=64;const g=fc.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,240,200,1)');gr.addColorStop(.3,'rgba(255,160,40,.9)');gr.addColorStop(1,'rgba(255,60,0,0)');
  g.fillStyle=gr;g.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,r=i%2?12:32;g.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r)}g.fill();
  vm.mf=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(fc),color:new THREE.Color(3,2,1.2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  vmScene.add(sh,sg,shield,flail,vm.mf);
})();

