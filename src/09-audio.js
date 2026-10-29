/* ================= AUDIO ================= */
const AU={ctx:null,tracks:{},cur:'',lvl:-1};
const TRACKS={battle:{src:'music/battle.mp3',vol:.55},boss:{src:'music/boss.mp3',vol:.62,restart:true},
  explore:{src:'music/explore.mp3',vol:.7},fight:{src:'music/fight.mp3',vol:.5},prince:{src:'music/prince.mp3',vol:.6,restart:true}};
// Tracks are created on first use so the arena never downloads the story soundtrack and vice versa.
function getTrack(k){
  if(AU.tracks[k])return AU.tracks[k];
  const a=new Audio();a.loop=true;a.preload='auto';a.src=TRACKS[k].src;const tr={a,g:null,want:0};
  try{const node=AU.ctx.createMediaElementSource(a);tr.g=AU.ctx.createGain();tr.g.gain.value=0;node.connect(tr.g);tr.g.connect(AU.mus)}catch(e){}
  a.addEventListener('error',()=>{tr.failed=true;if(Object.values(AU.tracks).every(t=>t.failed))synthStart()});
  return AU.tracks[k]=tr;
}
function audioInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const ctx=new C();AU.ctx=ctx;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=4;comp.connect(ctx.destination);
    AU.master=ctx.createGain();AU.master.gain.value=.9;AU.master.connect(comp);
    AU.sfx=ctx.createGain();AU.sfx.gain.value=.85;AU.sfx.connect(AU.master);
    AU.mus=ctx.createGain();AU.mus.gain.value=settings.music?1:0;AU.mus.connect(AU.master);
    const len=ctx.sampleRate*2,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.noise=buf;
  }catch(e){AU.ctx=null}
}
let musIntense=0;
function musicTo(name,level){
  if(!AU.ctx||(AU.cur===name&&AU.lvl===level))return;AU.cur=name;AU.lvl=level;
  if(AU.synth){musIntense=name==='boss'||level>.8?1:0;return}
  const now=AU.ctx.currentTime;getTrack(name);
  for(const k in AU.tracks){const tr=AU.tracks[k],v=k===name?TRACKS[k].vol*level:0;tr.want=v;
    if(tr.g)tr.g.gain.setTargetAtTime(v,now,.5);else tr.a.volume=v;
    if(v>0&&tr.a.paused){if(TRACKS[k].restart)tr.a.currentTime=0;const pr=tr.a.play();if(pr&&pr.catch)pr.catch(()=>{})}
    if(v===0&&!tr.a.paused)setTimeout(()=>{if(tr.want===0)tr.a.pause()},2500)}
}
function nz(t,dur,o){
  const c=AU.ctx;if(!c)return;
  const s=c.createBufferSource();s.buffer=AU.noise;
  const f=c.createBiquadFilter();f.type=o.type||'bandpass';f.frequency.setValueAtTime(o.f||1000,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);f.Q.value=o.q||1;
  const g=c.createGain();g.gain.setValueAtTime(o.g||.4,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(o.dest||AU.sfx);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);
}
function osc(t,dur,o){
  const c=AU.ctx;if(!c)return;
  const s=c.createOscillator();s.type=o.type||'sine';s.frequency.setValueAtTime(o.f||440,t);if(o.f2)s.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
  const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(o.g||.3,t+(o.a||.004));g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(g);g.connect(o.dest||AU.sfx);s.start(t);s.stop(t+dur+.05);
}
const thr={};
function can(k,ms){const n=performance.now();if(thr[k]&&n-thr[k]<ms)return false;thr[k]=n;return true}
const SFX={
  shred(){const t=AU.ctx.currentTime;nz(t,.08,{type:'bandpass',f:2400,q:.8,g:.36});osc(t,.07,{type:'square',f:200,f2:60,g:.14});nz(t,.04,{type:'highpass',f:6000,g:.12})},
  shotgun(){const t=AU.ctx.currentTime;nz(t,.45,{type:'lowpass',f:3600,f2:200,g:1.1});osc(t,.32,{type:'sine',f:120,f2:34,g:.9});nz(t,.06,{type:'highpass',f:5000,g:.4});nz(t+.5,.05,{type:'highpass',f:2500,g:.18});nz(t+.64,.05,{type:'highpass',f:2000,g:.2})},
  hit(){if(!can('hit',45))return;const t=AU.ctx.currentTime;nz(t,.06,{type:'lowpass',f:900,g:.3});osc(t,.05,{type:'square',f:900,f2:380,g:.04})},
  kill(){const t=AU.ctx.currentTime;nz(t,.5,{type:'lowpass',f:1300,f2:80,g:.7});osc(t,.35,{type:'sawtooth',f:160,f2:38,g:.2});nz(t+.05,.2,{type:'bandpass',f:400,q:3,g:.3})},
  parry(){const t=AU.ctx.currentTime;[1250,1880,2710,3950].forEach((f,i)=>osc(t,.8,{type:'sine',f,g:.22/(i+1)}));nz(t,.15,{type:'highpass',f:4500,g:.35});osc(t,.25,{type:'triangle',f:300,f2:120,g:.3})},
  block(){const t=AU.ctx.currentTime;osc(t,.15,{type:'triangle',f:230,f2:90,g:.4});nz(t,.1,{type:'bandpass',f:900,g:.3})},
  dash(){const t=AU.ctx.currentTime;nz(t,.32,{type:'bandpass',f:380,f2:2200,q:2,g:.55})},
  flail(){const t=AU.ctx.currentTime;nz(t,.25,{type:'lowpass',f:700,f2:80,g:.9});osc(t,.32,{type:'sine',f:95,f2:30,g:.85})},
  swish(){const t=AU.ctx.currentTime;nz(t,.18,{type:'bandpass',f:1600,f2:500,q:1.5,g:.3})},
  execute(){const t=AU.ctx.currentTime;osc(t,.6,{type:'sine',f:70,f2:25,g:1});nz(t,.5,{type:'lowpass',f:2000,f2:60,g:.9});osc(t+.02,.4,{type:'sawtooth',f:110,f2:35,g:.3})},
  hurt(){if(!can('hurt',120))return;const t=AU.ctx.currentTime;osc(t,.22,{type:'sawtooth',f:150,f2:70,g:.28});nz(t,.12,{type:'lowpass',f:900,g:.3})},
  pickup(){if(!can('pk',50))return;const t=AU.ctx.currentTime;osc(t,.07,{type:'square',f:660,g:.06});osc(t+.05,.1,{type:'square',f:990,g:.06})},
  eshot(){if(!can('es',70))return;const t=AU.ctx.currentTime;nz(t,.25,{type:'bandpass',f:600,f2:180,g:.18})},
  boom(){if(!can('bm',60))return;const t=AU.ctx.currentTime;nz(t,.35,{type:'lowpass',f:1200,f2:120,g:.35})},
  portal(){if(!can('pt',150))return;const t=AU.ctx.currentTime;osc(t,.8,{type:'sawtooth',f:50,f2:220,g:.1});nz(t,.8,{type:'bandpass',f:200,f2:900,g:.15})},
  click(){const t=AU.ctx.currentTime;nz(t,.03,{type:'highpass',f:3000,g:.2})},
  wave(){const t=AU.ctx.currentTime;osc(t,1.4,{type:'sawtooth',f:73.4,g:.16,a:.1});osc(t,1.4,{type:'sawtooth',f:110,g:.1,a:.1});osc(t,1.4,{type:'sawtooth',f:146.8,g:.07,a:.1})},
  screech(){if(!can('sc',200))return;const t=AU.ctx.currentTime;osc(t,.35,{type:'sawtooth',f:500,f2:1300,g:.07})},
  growl(){if(!can('gr',400))return;const t=AU.ctx.currentTime;osc(t,.5,{type:'sawtooth',f:rand(70,95),f2:50,g:.12});nz(t,.5,{type:'bandpass',f:300,q:4,g:.15})},
  slam(){const t=AU.ctx.currentTime;osc(t,.9,{type:'sine',f:55,f2:22,g:1});nz(t,.7,{type:'lowpass',f:500,f2:50,g:.9})},
  stagger(){const t=AU.ctx.currentTime;osc(t,.3,{type:'triangle',f:600,f2:300,g:.15})}
};
function sfx(n){if(AU.ctx)try{SFX[n]()}catch(e){}}
// procedural fallback if the music files cannot load
const STEP=60/160/4;
const RIFF=[0,0,-1,0,0,-1,0,3,0,0,-1,0,6,-1,5,3,0,0,-1,0,0,-1,0,3,0,0,-1,0,8,-1,7,6];
function synthStart(){
  if(AU.synth||!AU.ctx)return;AU.synth=true;const ctx=AU.ctx;let musT=ctx.currentTime+.1,musStep=0;
  const curve=new Float32Array(1024);for(let i=0;i<1024;i++)curve[i]=Math.tanh((i/512-1)*9);
  AU.gtr=ctx.createGain();AU.gtr.gain.value=.15;const sh=ctx.createWaveShaper();sh.curve=curve;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;
  AU.gtr.connect(sh);sh.connect(lp);lp.connect(AU.mus);
  setInterval(()=>{const c=AU.ctx;if(c.state!=='running')return;while(musT<c.currentTime+.12){const s=musStep%32,b=s%16,t=musT;
    if(musIntense>0){if(b%4===0||b===6||b===11)osc(t,.13,{type:'sine',f:150,f2:42,g:.25,dest:AU.mus});if(b===4||b===12)nz(t,.16,{type:'bandpass',f:1900,g:.15,dest:AU.mus});
      const n=RIFF[s];if(n>=0){const f=82.41*Math.pow(2,n/12);osc(t,STEP*.85,{type:'sawtooth',f,g:.3,dest:AU.gtr});osc(t,STEP*.85,{type:'sawtooth',f:f*1.498,g:.2,dest:AU.gtr})}}
    musT+=STEP;musStep++}},25);
  const c=AU.lvl;AU.lvl=-1;musicTo(AU.cur||'battle',c<0?.5:c);
}
function setMusicVol(){if(AU.mus)AU.mus.gain.setTargetAtTime(settings.music?1:0,AU.ctx.currentTime,.1)}

