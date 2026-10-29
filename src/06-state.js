/* ================= STATE ================= */
let state='title',mode='arena';
let time=0,timeScale=1,slowT=0,hitStop=0,shake=0,ft=0;
const P={pos:new V3(0,0,10),vel:new V3(),yaw:0,pitch:0};
const W={n:0,queue:[],spawnT:0,breakT:0,active:false};
let enemies=[],projs=[],tracers=[],pickups=[],waves=[],corpses=[],portals=[];
let score=0,kills=0,chain=0,chainT=0,mult=1;
const tipsShown={};
const EYE=1.62,PARRY_WIN=0.42;
function resetPlayer(at,yaw){
  P.pos.copy(at||(WORLD?WORLD.spawn:new V3(0,0,8.5)));P.vel.set(0,0,0);P.yaw=yaw!=null?yaw:(WORLD?WORLD.yaw:0);P.pitch=-0.04;
  P.hp=100;P.maxHp=100;P.armor=25;P.maxArmor=100;
  P.weapon=0;P.ammo=[180,20];P.maxAmmo=[300,50];
  P.fireCd=0;P.shield=false;P.shieldRaise=-9;P.shieldK=0;
  P.dashT=0;P.dashCd=0;P.dashDir=new V3();P.dashTarget=null;P.dashHits=new Set();
  P.melee=3;P.meleeRe=0;P.meleeAnim=0;P.meleePending=-1;P.lunge=null;
  P.invuln=0;P.vig=0;P.recoil=0;P.flash=0;P.bob=0;P.swapT=0;P.dead=false;P.deadT=0;P.lavaT=0;
}
