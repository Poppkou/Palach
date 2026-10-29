/* ================= LOOP ================= */
let last=performance.now(),fpsAcc=0,fpsN=0,fpsLast=60,lowStreak=0,highStreak=0;
// Dynamic resolution with hysteresis: small, rare steps so the picture does not visibly pump.
function tuneResolution(){
  if(settings.quality!=='auto'||state!=='playing')return;
  const target=settings.fps30?28:46,mx=isTouch?Math.max(QP.res,.9):1,mn=.55;
  if(fpsLast<target){highStreak=0;if(resScale>mn){resScale=Math.max(mn,resScale-.07);applyRes()}else if(++lowStreak>=2){lowStreak=0;degrade()}}
  else if(fpsLast>(settings.fps30?29.5:57)){lowStreak=0;if(++highStreak>=2&&resScale<mx){highStreak=0;resScale=Math.min(mx,resScale+.03);applyRes()}}
  else{lowStreak=0;highStreak=0}
}
function frame(now){
  requestAnimationFrame(frame);
  if(settings.fps30&&now-last<31)return;
  const rdt=Math.min(.05,(now-last)/1000);last=now;
  fpsAcc+=rdt;fpsN++;
  if(fpsAcc>3){fpsLast=fpsN/fpsAcc;fpsAcc=0;fpsN=0;tuneResolution()}
  ft+=rdt;
  skyMat.uniforms.uT.value=ft;lavaMat.uniforms.uT.value=ft;if(fogMat)fogMat.uniforms.uT.value=ft;
  const uScale=_dbs.y/(2*Math.tan(camera.fov*Math.PI/360));FX.mat.uniforms.uScale.value=uScale;SMK.mat.uniforms.uScale.value=uScale;
  if(window.__freeze){}else if(state==='playing'||state==='dying'){
    if(slowT>0){slowT-=rdt;timeScale=lerp(timeScale,.3,1-Math.exp(-20*rdt))}else timeScale=lerp(timeScale,1,1-Math.exp(-8*rdt));
    let dt=rdt*timeScale;if(hitStop>0){hitStop-=rdt;dt*=.08}
    time+=dt;
    if(state==='dying')P.deadT+=rdt;
    updatePlayer(dt,rdt);
    if(state==='playing'){if(mode==='arena')updateWaves(dt);else updateStory(dt)}
    updateEnemies(dt);updateCorpses(dt);updateProjs(dt);updateFX(dt);updatePickups(dt);updateViewmodel(rdt);updateLights(dt);updateHUD(rdt);
  }else if(state==='dialog'){
    updateFX(rdt*.3);updateLights(rdt);dialogTick(rdt);
  }else if(state==='title'){
    const a=ft*.05;camera.position.set(Math.sin(a)*3,2.1+Math.sin(ft*.3)*.25,9+Math.cos(a)*1.5);camera.lookAt(0,1.8,-4);
    for(const e of enemies){e.t+=rdt;animateEnemy(e,rdt)}
    vm.shred.visible=vm.shot.visible=vm.shield.visible=vm.flail.visible=vm.mf.visible=false;
    P.pos.set(0,0,9);updateFX(rdt);updateLights(rdt);
  }
  WORLDS._sky.position.copy(camera.position);WORLDS._far.position.set(camera.position.x,0,camera.position.z);
  const vmOn=state!=='title';
  if(post)post.render(vmOn);
  else{renderer.setRenderTarget(null);renderer.clear();renderer.render(scene,camera);if(vmOn){renderer.clearDepth();renderer.render(vmScene,vmCam)}}
}
setWorld(WORLDS.arena);resetPlayer();
demoScene();updBest();
$('loading').remove();$('title').hidden=false;
requestAnimationFrame(frame);
if(location.hash==='#autoplay')startGame();
if(location.hash==='#story')startStory(true);
window.__palach={get state(){return state},get mode(){return mode},P,W,get STORY(){return STORY},enemies:()=>enemies,startGame,startStory,spawnPortal,get fps(){return fpsLast},get quality(){return QUAL},get res(){return resScale},
  get music(){return Object.keys(AU.tracks).map(k=>k+':'+AU.tracks[k].a.readyState+(AU.tracks[k].failed?'F':'')+(AU.tracks[k].a.paused?'p':'P'))},skipTo:q=>storySkipTo(q),kill:e=>damageEnemy(e,99999,'gun',null)};
