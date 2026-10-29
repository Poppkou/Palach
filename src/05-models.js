/* ================= MONSTER MODELS ================= */
const BONE=0xc9b48e,BONE2=0xd8c8a4;
function buildImp(){
  const skin=0x7a3a26,dark=0x4e2016,mouth=0x1a0604;
  const body=[
    part(blob(.2,.15,.16,10,.08,1),dark,[0,1.0,0]),
    part(blob(.21,.2,.17,12,.1,2),skin,[0,1.17,.04]),
    part(blob(.3,.26,.22,14,.12,3),skin,[0,1.42,.08],[.35,0,0]),
    part(blob(.25,.13,.15,10,.15,4),skin,[0,1.34,.2],[.3,0,0]),
    part(blob(.12,.11,.11,8,.1,5),skin,[-.28,1.55,.05]),part(blob(.12,.11,.11,8,.1,6),skin,[.28,1.55,.05]),
    limb([0,1.56,.12],[0,1.7,.2],.085,.07,skin),
    part(blob(.15,.15,.18,12,.08,7),skin,[0,1.78,.25]),
    part(blob(.16,.05,.07,8,.12,8),dark,[0,1.85,.37]),
    part(blob(.11,.05,.11,8,.1,9),skin,[0,1.68,.32],[.25,0,0]),
    part(Box(.17,.035,.05),mouth,[0,1.71,.41]),
    horn([[-.08,1.88,.25],[-.17,1.98,.17],[-.21,2.03,.01],[-.17,1.99,-.16]],.045,BONE),
    horn([[.08,1.88,.25],[.17,1.98,.17],[.21,2.03,.01],[.17,1.99,-.16]],.045,BONE),
  ];
  for(let i=-3;i<=3;i++)body.push(part(Cone(.012,.05,3),BONE2,[i*.024,1.69,.405],[Math.PI,0,0]));
  for(let i=0;i<6;i++)body.push(part(Cone(.035,.17,5),BONE,[0,1.1+i*.1,-.13-.05*Math.sin(i/5*Math.PI)],[-2.2,0,0]));
  for(let i=0;i<3;i++)body.push(limb([-.2,1.42-i*.08,.2],[.2,1.42-i*.08,.2],.016,.016,dark,5));
  const glow=[part(Ico(.028,1),HOT(7,1,.38,.07),[-.065,1.8,.39]),part(Ico(.028,1),HOT(7,1,.38,.07),[.065,1.8,.39]),part(Box(.13,.012,.02),HOT(3,1,.3,.05),[0,1.705,.43])];
  const arm=s=>[part(blob(.07,.07,.07,8,.1,8),skin,[0,0,0]),limb([0,0,0],[s*.04,-.3,.02],.065,.05,skin),part(blob(.05,.05,.05,6,.1,9),dark,[s*.04,-.3,.02]),
    limb([s*.04,-.3,.02],[s*.03,-.55,.12],.05,.04,dark),part(blob(.06,.05,.07,8,.1,10),dark,[s*.03,-.6,.14]),
    ...[-1,0,1].map(k=>part(Cone(.013,.12,4),BONE,[s*.03+k*.03,-.67,.2],[2.4,0,0]))];
  const leg=()=>[limb([0,0,0],[0,-.42,.16],.09,.06,dark),part(blob(.065,.06,.06,6,.1,11),dark,[0,-.42,.16]),limb([0,-.42,.16],[0,-.82,-.06],.055,.04,dark),
    limb([0,-.82,-.06],[0,-.96,.06],.04,.035,dark),part(blob(.06,.03,.11,6,.1,12),dark,[0,-.98,.13]),...[-1,0,1].map(k=>part(Cone(.012,.08,4),BONE,[k*.03,-.99,.25],[Math.PI/2,0,0]))];
  return {body:shadeY(merge(body),.9,2,.55),glow:merge(glow),
    armL:{g:merge(arm(-1)),p:[-.3,1.55,.05]},armR:{g:merge(arm(1)),p:[.3,1.55,.05],hand:[.03,-.62,.18]},
    legL:{g:shadeY(merge(leg()),-1,0,.6),p:[-.13,1.0,0]},legR:{g:shadeY(merge(leg()),-1,0,.6),p:[.13,1.0,0]}};
}
function buildBrute(){
  const meat=0x8e3020,dark=0x3e2420,plate=0x2e2a28,steel=0x8a8580;
  const body=[
    part(blob(.38,.24,.28,12,.06,1),dark,[0,1.22,0]),part(Box(.55,.45,.07),plate,[0,1.05,.3],[-.1,0,0],null,{flat:true}),
    part(blob(.4,.3,.3,14,.1,2),meat,[0,1.5,.06]),part(blob(.6,.45,.42,16,.1,3),meat,[0,1.9,0]),
    part(blob(.27,.2,.16,12,.08,4),meat,[-.23,1.95,.25]),part(blob(.27,.2,.16,12,.08,5),meat,[.23,1.95,.25]),
    part(blob(.5,.32,.32,12,.1,6),meat,[0,2.12,-.18]),
    part(blob(.32,.22,.32,12,.05,7),plate,[-.66,2.15,0]),part(blob(.32,.22,.32,12,.05,8),plate,[.66,2.15,0]),
    part(Cone(.07,.4,5),BONE,[-.75,2.4,0],[0,0,.5]),part(Cone(.07,.4,5),BONE,[.75,2.4,0],[0,0,-.5]),part(Cone(.06,.3,5),BONE,[-.55,2.38,-.1],[0,0,.3]),part(Cone(.06,.3,5),BONE,[.55,2.38,-.1],[0,0,-.3]),
    limb([0,2.25,.15],[0,2.4,.25],.17,.15,meat),
    part(blob(.19,.2,.22,12,.06,9),meat,[0,2.46,.32]),part(blob(.21,.07,.11,10,.1,10),plate,[0,2.55,.43]),
    part(blob(.16,.08,.13,10,.1,11),meat,[0,2.34,.43],[.2,0,0]),
    part(Cone(.03,.14,4),BONE2,[-.09,2.41,.53],[-.2,0,0]),part(Cone(.03,.14,4),BONE2,[.09,2.41,.53],[-.2,0,0]),
    horn([[-.14,2.57,.3],[-.35,2.66,.24],[-.5,2.86,.37],[-.45,3.06,.6]],.065,BONE),horn([[.14,2.57,.3],[.35,2.66,.24],[.5,2.86,.37],[.45,3.06,.6]],.065,BONE),
  ];
  for(let i=0;i<5;i++)body.push(part(Cone(.05,.25,5),BONE,[0,1.75+i*.12,-.42-.05*Math.sin(i)],[-2.0,0,0]));
  const glow=[part(Ico(.032,1),HOT(7,1,.15,.05),[-.075,2.49,.53]),part(Ico(.032,1),HOT(7,1,.15,.05),[.075,2.49,.53])];
  for(let i=0;i<5;i++){const x=rand(-.3,.3),y=rand(1.6,2.05);glow.push(part(Box(.012,rand(.1,.22),.012),HOT(1.6,1,.3,.05),[x,y,.4+(.05-Math.abs(x)*.2)],[0,0,rand(-1,1)]))}
  const arm=s=>{const a=[part(blob(.16,.16,.16,8,.08,12),meat,[0,0,0]),limb([0,0,0],[s*.06,-.5,.03],.17,.14,meat),part(blob(.13,.12,.13,8,.1,13),plate,[s*.06,-.5,.03]),
    limb([s*.06,-.5,.03],[s*.04,-.95,.12],.15,.12,meat),limb([s*.055,-.62,.06],[s*.045,-.88,.11],.165,.15,plate,8),part(blob(.13,.12,.13,8,.1,14),dark,[s*.04,-1.02,.14])];
    if(s>0)a.push(limb([.04,-1.0,.14],[.04,-1.12,.28],.04,.04,0x2a1a10,6),part(Box(.06,1.0,.46),steel,[.04,-1.5,.32],[.25,0,0],null,{flat:true}));
    return a};
  const leg=()=>[limb([0,0,0],[0,-.58,.1],.17,.13,dark),part(blob(.13,.12,.13,8,.08,15),plate,[0,-.58,.14]),part(Cone(.05,.22,5),BONE,[0,-.56,.27],[Math.PI/2,0,0]),
    limb([0,-.58,.1],[0,-1.06,-.04],.12,.09,dark),part(blob(.13,.07,.19,8,.1,16),plate,[0,-1.12,.06])];
  return {body:shadeY(merge(body),1,2.7,.55),glow:merge(glow),
    armL:{g:merge(arm(-1)),p:[-.78,2.08,0]},armR:{g:merge(arm(1)),p:[.78,2.08,0],glow:merge([part(Box(.02,1.0,.04),HOT(4,1,.3,.05),[.04,-1.5,.56],[.25,0,0])])},
    legL:{g:shadeY(merge(leg()),-1.2,0,.6),p:[-.28,1.2,0]},legR:{g:shadeY(merge(leg()),-1.2,0,.6),p:[.28,1.2,0]}};
}
function buildSkull(){
  const b=[part(blob(.33,.3,.36,16,.05,1),BONE2,[0,0,0]),part(blob(.1,.08,.09,8,.1,2),BONE2,[-.2,-.08,.2]),part(blob(.1,.08,.09,8,.1,3),BONE2,[.2,-.08,.2]),
    part(blob(.16,.1,.11,10,.08,4),BONE2,[0,-.12,.27]),part(blob(.09,.08,.06,8,.05,5),0x120404,[-.12,.04,.28]),part(blob(.09,.08,.06,8,.05,6),0x120404,[.12,.04,.28]),
    part(blob(.04,.05,.03,6,.05,7),0x120404,[0,-.06,.35]),part(blob(.2,.07,.2,10,.08,8),BONE,[0,-.3,.12],[.35,0,0]),
    horn([[-.18,.2,.05],[-.28,.32,-.02],[-.3,.42,-.15]],.04,BONE),horn([[.18,.2,.05],[.28,.32,-.02],[.3,.42,-.15]],.04,BONE)];
  for(let i=-3;i<=3;i++)b.push(part(Box(.032,.05,.03),0xe8dcc0,[i*.035,-.21,.34-Math.abs(i)*.012]));
  for(let i=-2;i<=2;i++)b.push(part(Box(.03,.04,.03),0xe8dcc0,[i*.035,-.27,.29-Math.abs(i)*.012]));
  return {body:merge(b),glow:merge([part(Ico(.045,1),HOT(8,1,.4,.1),[-.12,.04,.3]),part(Ico(.045,1),HOT(8,1,.4,.1),[.12,.04,.3])])};
}
function buildTank(){
  const fat=0xa47258,dark=0x5a3a2a,metal=0x3a3632;
  const body=[
    part(blob(1.15,1.0,1.05,18,.06,1),fat,[0,1.65,.12]),part(blob(.9,.35,.62,14,.08,2),0x8a5a44,[0,1.05,.42]),part(blob(.95,.55,.75,16,.08,3),fat,[0,2.4,0]),
    part(Box(1.7,1.2,.25),metal,[0,2.3,-.78],[.1,0,0],null,{flat:true}),limb([-.45,2.4,-.85],[-.45,3.4,-.85],.14,.14,metal,8),limb([.45,2.4,-.85],[.45,3.4,-.85],.14,.14,metal,8),
    limb([-.85,2.65,.5],[.75,1.25,1.0],.06,.06,0x2a1810,6),
    part(blob(.32,.28,.3,12,.06,4),fat,[0,2.92,.5]),part(blob(.17,.15,.14,10,.08,5),fat,[-.22,2.77,.62]),part(blob(.17,.15,.14,10,.08,6),fat,[.22,2.77,.62]),
    part(blob(.25,.07,.1,10,.1,7),dark,[0,3.04,.68]),part(Box(.24,.05,.05),0x1a0604,[0,2.76,.79]),
    part(Cone(.04,.16,4),BONE2,[-.1,2.82,.78],[-.3,0,0]),part(Cone(.04,.16,4),BONE2,[.1,2.82,.78],[-.3,0,0]),
  ];
  for(let i=0;i<6;i++)body.push(part(Ico(.045),0x555555,[-.7+i*.28,2.75,-.92]));
  const glow=[part(Ico(.035,1),HOT(6,1,.4,.07),[-.12,2.98,.77]),part(Ico(.035,1),HOT(6,1,.4,.07),[.12,2.98,.77]),part(Ico(.1,1),HOT(4,1,.3,.05),[-.45,3.44,-.85]),part(Ico(.1,1),HOT(4,1,.3,.05),[.45,3.44,-.85])];
  const arm=s=>[part(blob(.32,.32,.32,10,.06,9),fat,[0,0,0]),limb([0,0,0],[s*.1,-.3,.4],.26,.24,fat),limb([s*.1,-.25,.3],[s*.1,-.25,1.6],.3,.28,metal,12),
    limb([s*.1,-.25,.62],[s*.1,-.25,.72],.33,.33,dark,12),limb([s*.1,-.25,1.1],[s*.1,-.25,1.2],.33,.33,dark,12),limb([s*.1,-.25,1.52],[s*.1,-.25,1.68],.35,.35,0x1a1614,12)];
  const armGlow=s=>merge([part(Cyl(.2,.2,.02,12),HOT(6,1,.35,.06),[s*.1,-.25,1.69],[Math.PI/2,0,0])]);
  const leg=()=>[part(blob(.32,.35,.32,10,.06,10),fat,[0,-.2,0]),limb([0,-.4,0],[0,-.95,.05],.24,.2,dark),part(Box(.42,.15,.62),dark,[0,-.98,.12],null,null,{flat:true})];
  return {body:shadeY(merge(body),.8,3.2,.55),glow:merge(glow),
    armL:{g:merge(arm(-1)),p:[-1.25,2.15,.1],glow:armGlow(-1)},armR:{g:merge(arm(1)),p:[1.25,2.15,.1],glow:armGlow(1)},
    legL:{g:shadeY(merge(leg()),-1.1,0,.6),p:[-.6,1.05,0]},legR:{g:shadeY(merge(leg()),-1.1,0,.6),p:[.6,1.05,0]}};
}
function buildBoss(){
  const armor=0x2a2625,trim=0x6a4a24,meat=0x6a1a10,cape=0x3a0808;
  const body=[
    part(blob(.75,.35,.5,14,.04,1),armor,[0,2.25,0]),part(Box(.5,.75,.08),trim,[-.35,1.9,.46],[-.15,0,0],null,{flat:true}),part(Box(.5,.75,.08),trim,[.35,1.9,.46],[-.15,0,0],null,{flat:true}),
    part(blob(.85,.6,.55,16,.08,2),meat,[0,2.95,.05]),part(blob(1.0,.62,.48,16,.03,3),armor,[0,3.35,.18]),
    part(blob(.55,.38,.55,14,.04,4),armor,[-1.3,3.85,0]),part(blob(.55,.38,.55,14,.04,5),armor,[1.3,3.85,0]),
    part(blob(.45,.2,.4,12,.04,6),trim,[0,4.0,.15]),
    part(blob(.36,.4,.4,14,.03,7),armor,[0,4.35,.3]),part(blob(.28,.25,.12,12,.04,8),0x1a1615,[0,4.25,.62]),
    horn([[-.25,4.65,.3],[-.6,4.9,.2],[-.85,5.3,.35],[-.8,5.75,.65]],.1,BONE),horn([[.25,4.65,.3],[.6,4.9,.2],[.85,5.3,.35],[.8,5.75,.65]],.1,BONE),
    part(Cone(.06,.5,5),BONE,[-.15,4.85,.25],[0,0,.2]),part(Cone(.06,.5,5),BONE,[.15,4.85,.25],[0,0,-.2]),
    part(new THREE.PlaneGeometry(2,3.2,1,6),cape,[0,2.55,-.62],[.12,Math.PI,0]),
  ];
  for(const s of [-1,1])for(let k=0;k<3;k++)body.push(part(Cone(.09,.6,5),BONE,[s*(1.1+k*.22),4.25-k*.05,-.1+k*.08],[0,0,-s*(.3+k*.25)]));
  for(let k=0;k<4;k++)body.push(limb([-.9,3.0+k*.18,.55],[.9,3.0+k*.18,.55],.03,.03,trim,6));
  const glow=[part(Box(.15,.03,.03),HOT(8,1,.18,.05),[-.12,4.32,.73]),part(Box(.15,.03,.03),HOT(8,1,.18,.05),[.12,4.32,.73]),part(Ico(.18,1),HOT(6,1,.3,.05),[0,3.35,.64])];
  for(let i=0;i<6;i++){const a=i/6*TAU;glow.push(part(Box(.02,.35,.02),HOT(4,1,.3,.05),[Math.cos(a)*.3,3.35+Math.sin(a)*.3,.6],[0,0,a+Math.PI/2]))}
  const arm=s=>{const a=[part(blob(.3,.3,.3,10,.04,9),armor,[0,0,0]),limb([0,0,0],[s*.08,-.95,.05],.3,.26,armor),part(blob(.22,.2,.22,10,.04,10),trim,[s*.08,-.95,.1]),
    limb([s*.08,-.95,.05],[s*.05,-1.85,.2],.28,.24,armor),part(blob(.25,.22,.25,10,.04,11),armor,[s*.05,-1.98,.24])];
    if(s>0)a.push(part(Box(.9,.12,.22),trim,[.05,-2.2,.24],null,null,{flat:true}),part(Box(.13,3.1,.46),0x6a6260,[.05,-3.8,.24],null,null,{flat:true}),part(Ico(.1),trim,[.05,-1.75,.24]));
    return a};
  const leg=()=>[limb([0,0,0],[0,-1.05,.12],.34,.28,armor),part(blob(.22,.2,.22,10,.04,12),trim,[0,-1.05,.2]),part(Cone(.07,.35,5),BONE,[0,-1.05,.42],[Math.PI/2,0,0]),
    limb([0,-1.05,.12],[0,-2.0,-.02],.27,.22,armor),part(blob(.26,.12,.38,10,.04,13),armor,[0,-2.1,.15])];
  return {body:shadeY(merge(body),2,5.5,.6),glow:merge(glow),
    armL:{g:merge(arm(-1)),p:[-1.35,3.75,0]},armR:{g:merge(arm(1)),p:[1.35,3.75,0],glow:merge([part(Box(.035,2.9,.06),HOT(5,1,.3,.05),[.05,-3.8,.48]),part(Box(.035,2.9,.06),HOT(5,1,.3,.05),[.05,-3.8,0])])},
    legL:{g:shadeY(merge(leg()),-2.2,0,.6),p:[-.62,2.2,0]},legR:{g:shadeY(merge(leg()),-2.2,0,.6),p:[.62,2.2,0]}};
}
// Brother Olgerd: a hooded monk leaning on a lantern staff
function buildMonk(){
  const robe=0x3a2a1e,rope=0x8a6a3a,skin=0xb88a6a,beard=0x9a9088;
  const body=[
    part(latheG([[0,0],[.42,0],[.38,.4],[.3,1.0],[.24,1.35],[.3,1.5],[0,1.55]],14),robe,[0,0,0]),
    part(Cyl(.27,.29,.06,12),rope,[0,1.0,0]),
    part(blob(.17,.19,.18,12,.04,1),skin,[0,1.68,.03]),part(blob(.13,.14,.08,10,.12,2),beard,[0,1.56,.13]),
    part(blob(.25,.28,.25,12,.05,3),robe,[0,1.72,-.04]),
    limb([-.3,1.42,0],[-.25,1.1,.25],.09,.07,robe),limb([.3,1.42,0],[.32,1.12,.25],.09,.07,robe),
    part(blob(.06,.06,.06,6,.05,4),skin,[-.25,1.08,.28]),part(blob(.06,.06,.06,6,.05,5),skin,[.32,1.1,.28]),
    limb([.34,0,.32],[.34,2.0,.28],.03,.03,0x3a2414,6),part(Box(.16,.2,.16),0x2a2422,[.34,2.08,.28]),
    part(Box(.14,.06,.02),0x2a1810,[0,1.15,.3])];
  return {body:shadeY(merge(body),0,1.8,.6),glow:merge([part(Box(.1,.14,.1),HOT(5,1,.6,.2),[.34,2.08,.28]),part(Box(.06,.06,.01),HOT(2,1,.8,.3),[0,1.15,.31])])};
}
// Hell spire: an obsidian obelisk that pours out demons until it is broken
function buildSpire(){
  const ob=0x1c1416,ob2=0x2a1e20;
  const body=[part(Cone(1.1,7.5,6),ob,[0,3.75,0],[0,.3,0],[1,1,.85],{flat:true}),part(Cone(.6,3,5),ob2,[.9,1.5,.3],[.2,0,-.3],null,{flat:true}),part(Cone(.5,2.6,5),ob2,[-.8,1.3,-.4],[-.2,0,.35],null,{flat:true}),
    part(latheG([[0,0],[1.8,0],[1.6,.4],[1.1,.6],[0,.6]],8),0x2a2220,[0,0,0],null,null,{flat:true})];
  for(let i=0;i<5;i++){const a=i/5*TAU;body.push(part(Ico(.35,0),ob2,[Math.cos(a)*2.2,4+Math.sin(i*2)*.8,Math.sin(a)*2.2],[i,i*2,0],null,{flat:true}))}
  const glow=[];for(let i=0;i<7;i++)glow.push(part(Box(.05,.5,.05),HOT(4,1,.25,.05),[Math.cos(i*2.3)*.55*(1-i/9),1.2+i*.8,Math.sin(i*2.3)*.55*(1-i/9)],[0,0,(i%2-.5)*.6]));
  glow.push(part(Ico(.35,1),HOT(6,1,.35,.08),[0,7.3,0]));
  return {body:merge(body),glow:merge(glow)};
}
const MODELS={imp:buildImp(),brute:buildBrute(),skull:buildSkull(),tank:buildTank(),boss:buildBoss(),monk:buildMonk(),spire:buildSpire()};
MODELS.prince=MODELS.boss;
buildGlobal();
WORLDS.arena=buildArena();

