/* ================= WAVES ================= */
function composeWave(n){
  if(n%5===0){const q=['boss'];for(let i=0;i<Math.min(6,2+n/5);i++)q.push(i%3===2?'skull':'imp');return q}
  if(n===1)return['imp','imp','imp','imp','imp','imp'];
  let budget=5+n*2.3;const q=[];
  const pool=[['imp',1,1]];if(n>=2)pool.push(['skull',1,.8],['brute',2,.9]);if(n>=3)pool.push(['tank',4,.45+n*.03]);
  while(budget>0){let tot=0;for(const p of pool)tot+=p[2];let r=Math.random()*tot,pick=pool[0];for(const p of pool){r-=p[2];if(r<=0){pick=p;break}}q.push(pick[0]);budget-=pick[1]}
  for(let i=q.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[q[i],q[j]]=[q[j],q[i]]}
  return q;
}
function startWave(n){
  W.n=n;W.queue=composeWave(n);W.active=true;W.spawnT=.6;diff=1+(n-1)*.06;
  const boss=n%5===0;
  showMsg(boss?'ТИРАН ИДЁТ':'ВОЛНА '+n,boss?'парируй зелёное, проходи волны рывком':n===1?'убей всех бесов':'',2.6);
  txt(H.wave,'ВОЛНА '+n);sfx('wave');
  if(boss&&W.queue[0]==='boss'){W.queue.shift();spawnPortal('boss',0,-16)}
}
function updateWaves(dt){
  if(W.active){
    W.spawnT-=dt;const alive=enemies.length,maxA=QP.maxEnemies;
    if(W.queue.length&&W.spawnT<=0&&alive<maxA){spawnPortal(W.queue.shift());W.spawnT=rand(.45,1.2)*(W.n<3?1.4:1)}
    if(!W.queue.length&&!enemies.length){W.active=false;W.breakT=3.6;const bonus=W.n*250;score+=bonus;showMsg('ВОЛНА ЗАЧИЩЕНА','+'+bonus,2.4);P.melee=3}
  }else{W.breakT-=dt;if(W.breakT<=0)startWave(W.n+1)}
  const boss=enemies.some(e=>e.T.boss);
  musicTo(boss?'boss':'battle',boss||W.active?1:.5);
}

