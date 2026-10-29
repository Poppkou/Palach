/* ================= STORY MODE: «Пепел Ордена», глава I ================= */
const STORY={q:0,shards:[0,0,0],spires:[0,0,0],shrine:false,gateOpen:false,deaths:0,done:false,t:0,cp:'start',kills:0};
const CP={start:[0,112,0],village:[0,104,0],forest:[-40,20,Math.PI/2],rift:[40,8,-Math.PI/2],shrine:[0,34,0],gate:[0,-44,0],court:[0,-70,0]};
const WHO_COL={'Летопись Ордена':'#b8a898','Брат Ольгерд':'#ffc43d','Князь Пепла':'#ff4a3a'};
const D={
  intro:[['Летопись Ордена','Семь веков Железный Палач спал в склепе под Пепельным Бродом, закованный в собственные доспехи.'],
    ['Летопись Ордена','Когда Печать Цитадели треснула, Преисподняя хлынула в долину. Князь Пепла поднял над крепостью чёрное знамя.'],
    ['Летопись Ордена','Последний монах Ордена разбил оковы. Палач открыл глаза.']],
  monk1:[['Брат Ольгерд','Ты слышишь меня? Хвала Свету… Я брат Ольгерд, последний, кто помнит клятву Ордена.'],
    ['Брат Ольгерд','Бесы заполонили деревню. Люди ушли в холмы, но демоны идут по их следу.'],
    ['Брат Ольгерд','Возьми Кромсатель и щит. Очисти Брод, и я расскажу, как сломать Врата Цитадели.']],
  monk2:[['Брат Ольгерд','Ты сражаешься, как в старых песнях. Теперь слушай.'],
    ['Брат Ольгерд','Князь запечатал Цитадель тремя печатями: в Мёртвом лесу на западе, в Огненном разломе на востоке и у древнего Святилища на дороге.'],
    ['Брат Ольгерд','Собери три осколка реликвии в лесу, сокруши адские шпили в разломе и удержи круг Святилища. Тогда Врата падут.'],
    ['Брат Ольгерд','Я буду говорить с тобой через этот амулет. Ищи золотой знак, он ведёт к цели. Иди, Палач.']],
  prince:[['Князь Пепла','Палач Ордена… Я помню вкус твоего клинка. Семь веков я ждал, чтобы вернуть долг.'],
    ['Князь Пепла','Эта долина уже принадлежит пеплу. Ты станешь его частью.'],
    ['Брат Ольгерд','Не слушай его! Отбивай зелёное пламя щитом: оно ранит Князя сильнее любого клинка!']],
  end:[['Брат Ольгерд','Он пал… Князь Пепла пал! Огонь над Цитаделью гаснет.'],
    ['Брат Ольгерд','Люди вернутся в долину. А ты отдохни, Палач. Ты заслужил.'],
    ['Летопись Ордена','Но в глубинах под Цитаделью что-то шевельнулось. Преисподняя не забывает своих долгов.']]
};
let QS=null,ENC=[],monk=null,DLG=null,prince=null,villageE=null,courtE=null,storyMusicT=0,mmFrame=0,objKey='';
const near=(p,r)=>{const dx=P.pos.x-p.x,dz=P.pos.z-p.z;return dx*dx+dz*dz<r*r};
function storySave(){store.set('palach-story',{q:STORY.q,shards:STORY.shards,spires:STORY.spires,shrine:STORY.shrine,gateOpen:STORY.gateOpen,deaths:STORY.deaths,done:STORY.done,t:STORY.t,cp:STORY.cp,kills:STORY.kills})}
function setCP(k){STORY.cp=k;storySave()}

/* ---- dialogue ---- */
function dialog(lines,cb){DLG={lines,i:0,c:0,cb};state='dialog';resetInput();gameEl.classList.add('dlg');$('dialog').hidden=false;setLine()}
function setLine(){const L=DLG.lines[DLG.i];$('dWho').textContent=L[0];$('dWho').style.color=WHO_COL[L[0]]||'';DLG.c=0;$('dText').textContent=''}
function dialogTick(dt){if(!DLG)return;const L=DLG.lines[DLG.i][1];if(DLG.c<L.length){DLG.c=Math.min(L.length,DLG.c+dt*60);$('dText').textContent=L.slice(0,DLG.c|0)}}
function dialogNext(){if(!DLG)return;const L=DLG.lines[DLG.i][1];if(DLG.c<L.length){DLG.c=L.length;$('dText').textContent=L;return}
  if(++DLG.i>=DLG.lines.length)dialogEnd();else setLine()}
function dialogSkip(){if(DLG)dialogEnd()}
function dialogEnd(){$('dialog').hidden=true;gameEl.classList.remove('dlg');const cb=DLG.cb;DLG=null;state='playing';resetInput();if(cb)cb()}
$('dBox').addEventListener('click',dialogNext);
$('dSkip').addEventListener('click',e=>{e.stopPropagation();dialogSkip()});

/* ---- encounters: groups that wait at their post and spawn when the player comes near ---- */
function enc(list,o){const E={list,spawned:false,enemies:[],alive:0,trigger:o&&o.trigger||55,done:false,onClear:o&&o.onClear,when:o&&o.when,cx:0,cz:0};
  for(const l of list){E.cx+=l[1]/list.length;E.cz+=l[2]/list.length}ENC.push(E);return E}
function spawnEnc(E){
  E.spawned=true;
  for(const [t,x,z,aggro] of E.list){const e=makeEnemy(t,x,z);e.pos.y=TYPES[t].fly?2.4:0;e.spawnT=0;e.face=rand(0,TAU);e.g.rotation.y=e.face;if(aggro)e.aggro=true;E.enemies.push(e);E.alive++;
    const prev=e.onDeath;e.onDeath=k=>{if(prev)prev(k);STORY.kills++;E.alive--;if(E.alive<=0&&!E.done){E.done=true;if(E.onClear)E.onClear(E)}}}
}
function updateEncounters(){for(const E of ENC){if(E.spawned||(E.when&&!E.when()))continue;const dx=P.pos.x-E.cx,dz=P.pos.z-E.cz;if(dx*dx+dz*dz<E.trigger*E.trigger)spawnEnc(E)}}

/* ---- world state that must be rebuilt after a respawn ---- */
function placeMonk(){
  if(monk)return;const M=MODELS.monk,g=new THREE.Group();
  const mm=new THREE.Mesh(M.body,MAT({vertexColors:true,map:TEX.flesh.map,roughness:.85}));mm.castShadow=!!QP.shadow;g.add(mm,new THREE.Mesh(M.glow,glowMat));
  g.position.copy(STORY_POI.monk);g.rotation.y=Math.PI*.82;WORLDS.story.group.add(g);monk={g};WORLDS.story.circles.push({x:g.position.x,z:g.position.z,r:.6,h:2});
}
function storyRuntime(){
  const SW=WORLDS.story;ENC=[];prince=null;villageE=null;courtE=null;placeMonk();
  SW.shards.forEach((s,i)=>{s.taken=!!STORY.shards[i];s.mesh.visible=!s.taken});
  const G=SW.gate;G.open=STORY.gateOpen;G.seg.off=G.open;G.mesh.position.y=G.open?14:0;G.t=0;
  SW.shrineRing.material.color.setRGB(STORY.shrine?.2:.6,STORY.shrine?.6:.2,STORY.shrine?1:.05);
  const later=()=>STORY.q>=2;
  enc([['imp',-6,52],['imp',6,50],['skull',0,46]],{when:later});
  enc([['imp',-55,30],['imp',-58,26],['brute',-62,5]],{when:later});
  enc([['imp',50,20],['skull',52,-10],['imp',47,-4]],{when:later});
  enc([['brute',-7,-12],['imp',6,-14],['skull',0,-20]],{when:later});
  STORY_POI.shards.forEach((p,i)=>{if(STORY.shards[i])return;const g=[['imp',p.x+3,p.z+2],['imp',p.x-3,p.z+1.5],['skull',p.x,p.z-3]];if(i===1)g.push(['brute',p.x+1,p.z+5]);if(i===2)g.push(['imp',p.x+5,p.z-2],['skull',p.x-4,p.z-4]);enc(g,{trigger:34,when:later})});
  STORY_POI.spires.forEach((p,i)=>{if(STORY.spires[i])return;const E=enc([['spire',p.x,p.z],[i===1?'tank':'brute',p.x+4,p.z+4],['imp',p.x-4,p.z+2],['imp',p.x+2,p.z-5]],{trigger:46,when:later});
    const sp=E.list[0];sp.spireIndex=i});
}

/* ---- quests ---- */
function seals(){return STORY.shards.reduce((a,b)=>a+b,0)===3&&STORY.spires.reduce((a,b)=>a+b,0)===3&&STORY.shrine}
const QUESTS=[
  {title:'Пробуждение',setup(){setCP('start')},
    obj:()=>['Найди брата Ольгерда у часовни'],marks:()=>[STORY_POI.monk],
    update(){if(near(STORY_POI.monk,4.2)){P.yaw=Math.atan2(-(STORY_POI.monk.x-P.pos.x),-(STORY_POI.monk.z-P.pos.z));dialog(D.monk1,advance)}}},
  {title:'Пепельный Брод',setup(){setCP('village');
      villageE=enc([['imp',-12,94],['imp',12,95],['imp',-14,80],['imp',15,82],['imp',-6,74],['imp',9,74],['imp',-22,90],['brute',0,80]],{trigger:999,onClear:()=>{radio('Брат Ольгерд','Деревня свободна! Вернись ко мне, Палач.');QS.cleared=true}});
      spawnEnc(villageE);radio('Брат Ольгерд','Они среди домов. Будь осторожен.')},
    obj:()=>QS.cleared?['Вернись к брату Ольгерду']:['Очисти деревню: осталось демонов '+villageE.alive],
    marks:()=>QS.cleared?[STORY_POI.monk]:villageE.enemies.filter(e=>!e.dead).slice(0,1).map(e=>e.pos),
    update(){if(QS.cleared&&near(STORY_POI.monk,4.5)){QS.cleared=false;dialog(D.monk2,advance)}}},
  {title:'Три печати',setup(){if(STORY.cp==='village')setCP('village');QS.def=null},
    obj:()=>{const s=STORY.shards.reduce((a,b)=>a+b,0),p=STORY.spires.reduce((a,b)=>a+b,0);
      return [{t:'Мёртвый лес: осколки реликвии '+s+'/3',done:s===3},{t:'Огненный разлом: адские шпили '+p+'/3',done:p===3},
        {t:QS.def?'Святилище: держи круг '+Math.ceil(QS.def.t)+' с':'Святилище: удержи круг',done:STORY.shrine}]},
    marks(){const m=[];STORY_POI.shards.forEach((p,i)=>{if(!STORY.shards[i])m.push(p)});
      const sp=enemies.filter(e=>e.type==='spire'&&!e.dead).map(e=>e.pos);STORY_POI.spires.forEach((p,i)=>{if(!STORY.spires[i]&&!sp.length)m.push(p)});m.push(...sp);
      if(!STORY.shrine)m.push(STORY_POI.shrine);return m},
    update(dt){
      WORLDS.story.shards.forEach((s,i)=>{if(s.taken)return;s.mesh.rotation.y+=dt*1.5;s.mesh.position.y=1.9+Math.sin(ft*2+i)*.12;
        if(Math.random()<.3)FX.emit(s.p.x+rand(-.3,.3),2,s.p.z+rand(-.3,.3),0,rand(1,2.5),0,1,.5,.1,.6,1.5,3.5,1,0,.5);
        if(near(s.p,2.3)){s.taken=true;s.mesh.visible=false;STORY.shards[i]=1;sfx('parry');pflashV=.6;fireBurst(_t.set(s.p.x,2,s.p.z),30,6,.8,.6,[1,2.5,6]);
          const n=3-STORY.shards.reduce((a,b)=>a+b,0);P.hp=Math.min(P.maxHp,P.hp+25);setCP('forest');
          radio('Брат Ольгерд',n?'Осколок поёт в твоей руке. Осталось '+n+'.':'Лесная печать сломлена! Реликвия снова цела.')}});
      for(const e of enemies)if(e.type==='spire'&&!e.onSpire){e.onSpire=true;const i=STORY_POI.spires.findIndex(p=>Math.hypot(p.x-e.home.x,p.z-e.home.z)<1);const prev=e.onDeath;
        e.onDeath=k=>{if(prev)prev(k);if(i>=0)STORY.spires[i]=1;setCP('rift');const n=3-STORY.spires.reduce((a,b)=>a+b,0);radio('Брат Ольгерд',n?'Шпиль рухнул! Осталось '+n+'.':'Разлом остывает. Печать огня пала!')}}
      shrineDefense(dt);
      if(seals()&&!QS.finished){QS.finished=true;setTimeout(()=>{radio('Брат Ольгерд','Все три печати сломаны! Врата Цитадели ослабли. Иди на север, Палач.',6);advance()},1500)}
    }},
  {title:'Врата Цитадели',setup(){enc([['tank',0,-50],['imp',-10,-47],['imp',10,-47],['brute',-4,-54]],{trigger:42})},
    obj:()=>['Подойди к вратам Цитадели'],marks:()=>[STORY_POI.gate],
    update(){if(near(STORY_POI.gate,15)){openGate();advance()}}},
  {title:'Двор Цитадели',setup(){setCP('gate');if(!STORY.gateOpen)openGate(true);
      courtE=enc([['brute',-8,-88],['brute',8,-88],['tank',0,-104],['imp',-14,-80],['imp',14,-80],['imp',-6,-98],['imp',6,-98],['skull',-10,-100],['skull',10,-100]],{trigger:40,onClear:()=>setTimeout(()=>dialog(D.prince,()=>{spawnPrince();advance()}),900)})},
    obj:()=>courtE&&courtE.spawned?['Перебей стражу двора: осталось '+courtE.alive]:['Войди во двор Цитадели'],
    marks:()=>courtE&&courtE.spawned?courtE.enemies.filter(e=>!e.dead).slice(0,1).map(e=>e.pos):[STORY_POI.court],update(){}},
  {title:'Князь Пепла',setup(){setCP('court');if(!prince)spawnPrince()},
    obj:()=>['Убей Князя Пепла'],marks:()=>prince&&!prince.dead?[prince.pos]:[],update(){}}
];
function advance(){STORY.q++;startQuest(STORY.q)}
function startQuest(i,restore){QS=QUESTS[i];if(!QS)return;QS.cleared=false;QS.finished=false;QS.setup(restore);objKey='';if(!restore)showMsg(QS.title.toUpperCase(),'НОВОЕ ЗАДАНИЕ',2.8);storySave()}
function openGate(instant){
  const G=WORLDS.story.gate;STORY.gateOpen=true;G.open=true;G.seg.off=true;storySave();
  if(instant){G.mesh.position.y=14;return}
  G.t=.001;sfx('slam');shake=Math.max(shake,.6);vib(80);showMsg('ВРАТА ОТКРЫТЫ','',2.4);
}
function spawnPrince(){
  const C=STORY_POI.court;prince=spawnPortal('prince',C.x,C.z-10);prince.aggro=true;
  prince.onDeath=()=>{setTimeout(()=>{if(mode==='story')dialog(D.end,storyVictory)},2600)};
}
function shrineDefense(dt){
  if(STORY.shrine)return;const S=STORY_POI.shrine,inside=near(S,6.5);
  if(!QS.def){if(inside){QS.def={t:40,spawnT:1,tank:false,kids:[]};radio('Брат Ольгерд','Стой в круге и не покидай его! Они придут со всех сторон.');sfx('wave')}return}
  const d=QS.def,alive=d.kids.filter(e=>!e.dead).length;
  if(inside)d.t-=dt;else if(!d.warned||ft-d.warned>4){d.warned=ft;showTipForce('Вернись в круг Святилища, иначе печать не сломать')}
  const k=1-d.t/40;WORLDS.story.shrineRing.material.color.setRGB(.6+k*1.6,.2+k*.9,.05+k*.3);
  d.spawnT-=dt;
  if(d.spawnT<=0&&alive<(QP.maxEnemies-3)){d.spawnT=rand(2.2,3.4);const a=rand(0,TAU);_o.set(S.x+Math.cos(a)*20,0,S.z+Math.sin(a)*20);worldPush(_o,1.2);
    const r=Math.random(),t=!d.tank&&d.t<22?'tank':r<.45?'imp':r<.68?'skull':'brute';if(t==='tank')d.tank=true;const e=spawnPortal(t,_o.x,_o.z);e.aggro=true;d.kids.push(e);
    const prev=e.onDeath;e.onDeath=x=>{if(prev)prev(x);STORY.kills++}}
  if(d.t<=0){STORY.shrine=true;QS.def=null;setCP('shrine');sfx('parry');pflashV=1;WORLDS.story.shrineRing.material.color.setRGB(.2,.6,1);
    radio('Брат Ольгерд','Святилище очищено. Печать дороги сломана!');fireBurst(_t.set(S.x,1,S.z),50,10,1.2,.8,[1.5,3,6])}
}

/* ---- lifecycle ---- */
function storyBegin(fresh){
  const sv=store.get('palach-story',null),isNew=fresh||!sv||sv.done;
  if(isNew){Object.assign(STORY,{q:0,shards:[0,0,0],spires:[0,0,0],shrine:false,gateOpen:false,deaths:0,done:false,t:0,cp:'start',kills:0});store.del('palach-story')}
  else Object.assign(STORY,sv);
  storyRuntime();
  const c=CP[STORY.cp]||CP.start;resetPlayer(new V3(c[0],0,c[1]),c[2]);
  beginPlay();
  if(isNew)dialog(D.intro,()=>startQuest(0));else{startQuest(STORY.q,true);showMsg(QS.title.toUpperCase(),'ПРОДОЛЖЕНИЕ',2.4)}
  musicTo('explore',.8);
}
function storyRespawn(){
  clearWorld();storyRuntime();const c=CP[STORY.cp]||CP.start;resetPlayer(new V3(c[0],0,c[1]),c[2]);beginPlay();startQuest(STORY.q,true);
  showMsg(QS.title.toUpperCase(),'ТОЧКА СОХРАНЕНИЯ',2.4);
}
function storyLeave(){storySave();QS=null;DLG=null}
function storySkipTo(q){
  for(let i=0;i<q;i++){if(i===2){STORY.shards=[1,1,1];STORY.spires=[1,1,1];STORY.shrine=true}if(i===3)STORY.gateOpen=true}
  STORY.q=q;STORY.cp=['start','village','village','shrine','gate','court'][q]||'start';storySave();storyRespawn();
}
function storyVictory(){
  STORY.done=true;storySave();state='dead';resetInput();musicTo('explore',.5);
  const m=Math.floor(STORY.t/60),s=Math.floor(STORY.t%60);
  showOver({tag:'Глава I завершена',title:'Князь Пепла повержен',l1:'ВРЕМЯ',v1:m+':'+String(s).padStart(2,'0'),l3:'СМЕРТЕЙ',v3:STORY.deaths,again:'НАЧАТЬ ЗАНОВО'});
}
function updateStory(dt){
  STORY.t+=dt;updateEncounters();if(QS)QS.update(dt);
  // the gate grinds open over a few seconds
  const G=WORLDS.story.gate;if(G.t>0){G.t+=dt;G.mesh.position.y=Math.min(14,G.t*G.t*1.6);if(Math.random()<.5)smoke(_t.set(rand(-7,7),.3,STORY_POI.gate.z+1),1,1.6,[.2,.15,.12],1.6,.6);if(G.mesh.position.y>=14)G.t=0}
  for(const c of WORLDS.story.caches){if(c.open)continue;if(near(c,2.2)){c.open=true;c.glow.visible=false;sfx('pickup');for(let i=0;i<2;i++)spawnPickup('hp',c);for(let i=0;i<3;i++)spawnPickup('am',c);spawnPickup('ar',c);showPop('ТАЙНИК')}}
  if(monk)monk.g.children[0].position.y=Math.sin(ft*1.4)*.015;
  // music: explore, fight while demons hunt you, the prince's theme for the finale
  let hot=false;for(const e of enemies)if(e.aggro&&!e.dead&&Math.abs(e.pos.x-P.pos.x)<45&&Math.abs(e.pos.z-P.pos.z)<45){hot=true;break}
  if(hot)storyMusicT=5;else storyMusicT-=dt;
  musicTo(prince&&!prince.dead?'prince':storyMusicT>0?'fight':'explore',prince&&!prince.dead||storyMusicT>0?1:.8);
}

/* ---- HUD: quest title, objectives, the golden marker and the minimap ---- */
function storyHUD(dt){
  if(!QS)return;
  txt(H.wave,QS.title.toUpperCase());
  const ob=QS.obj(),key=JSON.stringify(ob);
  if(key!==objKey){objKey=key;H.obj.innerHTML='';for(const o of ob){const d=document.createElement('div');d.textContent=typeof o==='string'?o:o.t;if(o.done)d.className='done';H.obj.append(d)}}
  const ms=QS.marks();let best=null,bd=1e9;for(const m of ms){const d=Math.hypot(m.x-P.pos.x,m.z-P.pos.z);if(d<bd){bd=d;best=m}}
  if(best&&bd>3){
    _t.set(best.x,(best.y||0)+2.2,best.z).project(camera);let x=_t.x,y=_t.y;const behind=_t.z>1;if(behind){x=-x;y=-y}
    const e=.86,m=Math.max(Math.abs(x)/e,Math.abs(y)/(e*.92));if(behind||m>1){const k=1/Math.max(m,1e-3);x*=k;y*=k;if(behind&&Math.abs(y)<e*.9)y=-e*.9}
    sty(H.mark,'transform',`translate(${((x*.5+.5)*innerWidth).toFixed(0)}px,${((1-(y*.5+.5))*innerHeight).toFixed(0)}px)`);sty(H.mark,'opacity','1');txt(H.markD,Math.round(bd)+' м');
  }else sty(H.mark,'opacity','0');
  if(++mmFrame%4)return;
  const c=H.mmap.getContext('2d'),S=112,C=56,K=C/60;
  c.clearRect(0,0,S,S);c.save();c.beginPath();c.arc(C,C,C-1,0,TAU);c.clip();c.fillStyle='rgba(12,7,6,.72)';c.fillRect(0,0,S,S);
  c.translate(C,C);c.rotate(P.yaw);const px=P.pos.x,pz=P.pos.z,toX=x=>(x-px)*K,toZ=z=>(z-pz)*K;
  c.strokeStyle='rgba(210,180,150,.55)';c.lineWidth=2;c.beginPath();
  for(const s of WORLD.segs){if(s.off)continue;if(Math.min(Math.abs(s.ax-px),Math.abs(s.bx-px))>90&&Math.abs(s.az-pz)>90)continue;c.moveTo(toX(s.ax),toZ(s.az));c.lineTo(toX(s.bx),toZ(s.bz))}c.stroke();
  c.fillStyle='rgba(255,110,30,.7)';for(const l of WORLD.lava){c.beginPath();c.arc(toX(l.x),toZ(l.z),l.r*K,0,TAU);c.fill()}
  c.strokeStyle='rgba(120,160,255,.6)';c.lineWidth=1.5;c.beginPath();c.arc(toX(STORY_POI.shrine.x),toZ(STORY_POI.shrine.z),6*K,0,TAU);c.stroke();
  c.fillStyle='#c9a24a';for(const k of WORLDS.story.caches)if(!k.open)c.fillRect(toX(k.x)-1.5,toZ(k.z)-1.5,3,3);
  for(const e of enemies){if(e.dead)continue;const ex=toX(e.pos.x),ez=toZ(e.pos.z);if(ex*ex+ez*ez>C*C)continue;c.fillStyle=e.aggro?'#ff3a2a':'rgba(200,60,40,.55)';c.beginPath();c.arc(ex,ez,e.T.boss||e.type==='spire'?4:2.4,0,TAU);c.fill()}
  if(monk){c.fillStyle='#7fc8ff';c.beginPath();c.arc(toX(STORY_POI.monk.x),toZ(STORY_POI.monk.z),3,0,TAU);c.fill()}
  c.fillStyle='#ffc43d';for(const m of ms){let mx=toX(m.x),mz=toZ(m.z);const l=Math.hypot(mx,mz);if(l>C-7){mx*=(C-7)/l;mz*=(C-7)/l}c.save();c.translate(mx,mz);c.rotate(Math.PI/4);c.fillRect(-3.5,-3.5,7,7);c.restore()}
  c.restore();
  c.fillStyle='#eadfc8';c.beginPath();c.moveTo(C,C-7);c.lineTo(C+5,C+5);c.lineTo(C,C+2);c.lineTo(C-5,C+5);c.closePath();c.fill();
}
