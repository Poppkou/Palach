/* ================= GAME FLOW ================= */
function clearWorld(){
  for(const e of enemies){scene.remove(e.g);e.mat.dispose()}enemies=[];
  for(const c of corpses){scene.remove(c.e.g);c.e.mat.dispose()}corpses=[];
  projs=[];tracers=[];portals=[];gores.length=0;FX.clear();SMK.clear();decals.length=0;decI=0;
  for(const q of pickups)scene.remove(q.m);pickups=[];for(const w of waves){scene.remove(w.mesh);w.mesh.material.dispose()}waves=[];
}
function goFull(){
  if(!IS_APP)try{const el=document.documentElement;if(isTouch&&el.requestFullscreen&&!document.fullscreenElement){el.requestFullscreen({navigationUI:'hide'}).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}}catch(e){}
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}
}
function enterMode(m){
  mode=m;setWorld(WORLDS[m]);
  H.mmap.hidden=m!=='story';txt(H.wave,m==='story'?'':'ВОЛНА 1');gameEl.classList.remove('dlg');H.score.style.display=m==='story'?'none':'';txt(H.obj,'');H.obj.innerHTML='';sty(H.mark,'opacity','0');
}
function beginPlay(){
  resetInput();hideScreens();state='playing';gameEl.classList.remove('menu');H.joyHint.style.opacity='';
  showTip('start','Тяни <b>левым</b> пальцем, чтобы идти, <b>правым</b>, чтобы смотреть');
}
function startGame(){
  audioInit();goFull();enterMode('arena');
  clearWorld();resetPlayer();score=0;kills=0;chain=0;mult=1;time=0;diff=1;
  W.n=0;W.active=false;W.breakT=1.2;
  beginPlay();musicTo('battle',.5);
}
function startStory(fresh){
  audioInit();goFull();
  const go=()=>{enterMode('story');clearWorld();score=0;kills=0;chain=0;mult=1;time=0;diff=1.08;storyBegin(fresh);
    const l=$('loading');if(l)l.remove()};
  if(!WORLDS.story){const l=document.createElement('div');l.id='loading';l.textContent='Долина Пепла пробуждается…';document.body.append(l);hideScreens();setTimeout(()=>{WORLDS.story=buildStory();const prev=WORLD;setWorld(WORLDS.story);try{renderer.compile(scene,camera)}catch(e){}setWorld(prev);go()},40)}
  else go();
}
function hideScreens(){for(const id of ['title','pause','over','settings'])$(id).hidden=true}
function pauseGame(){if(state!=='playing')return;state='paused';$('pause').hidden=false;resetInput();try{document.exitPointerLock&&document.exitPointerLock()}catch(e){}}
function resumeGame(){hideScreens();state='playing';audioInit()}
function showOver(o){
  $('overTag').textContent=o.tag;$('overTitle').textContent=o.title;
  $('oWaveL').textContent=o.l1;$('oWave').textContent=o.v1;$('oKills').textContent=kills;$('oScoreL').textContent=o.l3;$('oScore').textContent=o.v3;
  $('oBest').textContent=o.best||'';$('againBtn').textContent=o.again;$('over').hidden=false;
}
function die(){
  P.dead=true;P.deadT=0;state='dying';slowT=1.2;sfx('slam');vib(200);resetInput();
  if(mode==='arena'&&score>best){best=score;store.set('palach-best',best)}
  if(mode==='story')STORY.deaths++;
  setTimeout(()=>{state='dead';
    if(mode==='story')showOver({tag:'Палач пал',title:'Долина ещё ждёт',l1:'ЗАДАНИЕ',v1:(STORY.q+1)+'/'+QUESTS.length,l3:'СМЕРТЕЙ',v3:STORY.deaths,again:'С ТОЧКИ СОХРАНЕНИЯ'});
    else showOver({tag:'Палач пал',title:W.n>=10?'Ад запомнит тебя':W.n>=5?'Достойная смерть':'Ад торжествует',l1:'ВОЛНА',v1:W.n,l3:'ОЧКИ',v3:score.toLocaleString('ru-RU'),best:'РЕКОРД '+best.toLocaleString('ru-RU'),again:'ЕЩЁ РАЗ'});
    musicTo(mode==='story'?'explore':'battle',.3)},1600);
}
function toMenu(){
  clearWorld();hideScreens();resetInput();$('dialog').hidden=true;
  if(mode==='story')storyLeave();
  enterMode('arena');state='title';gameEl.classList.add('menu');$('title').hidden=false;updBest();demoScene();musicTo('battle',.3);
}
function updBest(){
  $('bestT').textContent=best?'РЕКОРД АРЕНЫ '+best.toLocaleString('ru-RU'):'';
  const sv=store.get('palach-story',null);$('storyBtn').textContent=sv&&!sv.done?'ПРОДОЛЖИТЬ ИСТОРИЮ':'ИСТОРИЯ';$('newStoryBtn').hidden=!(sv&&!sv.done);
}
let setFrom='title';
$('playBtn').onclick=startGame;$('storyBtn').onclick=()=>startStory(false);$('newStoryBtn').onclick=()=>startStory(true);
$('againBtn').onclick=()=>{if(mode==='story'){$('over').hidden=true;if(STORY.done)startStory(true);else storyRespawn()}else startGame()};
$('menuBtn').onclick=toMenu;$('quitBtn').onclick=toMenu;$('resumeBtn').onclick=resumeGame;
function openSet(from){setFrom=from;$(from).hidden=true;$('settings').hidden=false;
  $('sSens').value=settings.sens;$('sAssist').checked=settings.assist;$('sMusic').checked=settings.music;$('sQuality').value=settings.quality;$('sShake').checked=settings.shake;$('sFps').checked=settings.fps30;
  $('qInfo').textContent='Сейчас: '+{low:'низкая',med:'средняя',high:'высокая'}[QUAL]+(degradeStep?' (снижена автоматически)':'')+'. Смена графики перезапускает игру.'}
$('setBtn').onclick=()=>openSet('title');$('pSetBtn').onclick=()=>openSet('pause');
$('setBack').onclick=()=>{settings.sens=+$('sSens').value;settings.assist=$('sAssist').checked;settings.music=$('sMusic').checked;settings.shake=$('sShake').checked;settings.fps30=$('sFps').checked;
  const q=$('sQuality').value,changed=q!==settings.quality;settings.quality=q;
  store.set('palach-settings',settings);setMusicVol();if(changed){location.reload();return}$('settings').hidden=true;$(setFrom).hidden=false};
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseGame();for(const k in AU.tracks)AU.tracks[k].a.pause();AU.cur=''}});
function checkRotate(){$('rotate').hidden=!(isTouch&&innerHeight>innerWidth*1.05)}
checkRotate();
// Android back button inside the APK: pause in battle, close dialogs, leave from the title.
try{const App=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
  if(App)App.addListener('backButton',()=>{if(state==='playing')pauseGame();else if(state==='paused')resumeGame();else if(state==='dialog')dialogSkip();else if(!$('settings').hidden)$('setBack').click();else if(state==='title')App.exitApp();else toMenu()})}catch(e){}

/* ================= TITLE DEMO ================= */
function demoScene(){
  for(const [t,x,z] of [['brute',-2.6,-3],['imp',2.4,-1.5],['tank',5.5,-8],['imp',-6,-7]]){const e=makeEnemy(t,x,z);e.pos.y=0;e.face=Math.atan2(-x,10-z);e.g.rotation.y=e.face}
}
