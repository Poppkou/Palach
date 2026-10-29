/* ================= HUD ================= */
function updateHUD(dt){
  txt(H.score,score.toLocaleString('ru-RU'));
  txt(H.combo,'×'+mult+' СЕРИЯ');sty(H.combo,'opacity',mult>1?'1':'0');
  txt(H.hpNum,Math.ceil(P.hp)+'');sty(H.hpFill,'transform',`scaleX(${(P.hp/P.maxHp).toFixed(3)})`);
  sty(H.arFill,'transform',`scaleX(${(P.armor/P.maxArmor).toFixed(3)})`);
  txt(H.ammo,P.ammo[P.weapon]+'');txt(H.wname,WEAP[P.weapon].name);
  sty(H.ammo,'color',P.ammo[P.weapon]<=(P.weapon?2:15)?'#ff5a3a':'');
  H.pips.forEach((p,i)=>{const on=i<P.melee;if(p._on!==on){p._on=on;p.classList.toggle('on',on)}});
  const ex=!!execTarget();if(H.bMelee._ex!==ex){H.bMelee._ex=ex;H.bMelee.classList.toggle('exec',ex);txt(H.mLabel,ex?'КАЗНЬ':'ЦЕП')}
  const cdv=(P.dashCd/1.25*100).toFixed(0)+'%';if(H.dashCd._cd!==cdv){H.dashCd._cd=cdv;H.dashCd.style.setProperty('--cd',cdv)}
  pflashV=Math.max(0,pflashV-dt*3);
  const low=P.hp<35?(.5+.5*Math.sin(time*6)):0;
  if(post){const u=post.comp.uniforms;u.uHurt.value=P.vig;u.uParry.value=pflashV;u.uLow.value=low}
  else{sty(H.vig,'opacity',P.vig.toFixed(2));sty(H.pflash,'opacity',pflashV.toFixed(2))}
  sty(H.lowhp,'opacity',(low*(post?.5:1)).toFixed(2));
  if(msgT>0){msgT-=dt;if(msgT<=0){sty(H.msg,'opacity','0');sty(H.sub,'opacity','0')}}
  if(tipT>0){tipT-=dt;if(tipT<=0)sty(H.tip,'opacity','0')}
  if(popT>0){popT-=dt;if(popT<=0)sty(H.pop,'opacity','0')}
  if(crossT>0){crossT-=dt;if(crossT<=0)H.cross.classList.remove('hit','kill')}
  if(radioT>0){radioT-=dt;if(radioT<=0)sty(H.radio,'opacity','0')}
  if(mode==='story')storyHUD(dt);
}

