/* ================= HUD REFS ================= */
const H={wave:$('wave'),score:$('score'),combo:$('combo'),hpNum:$('hpNum'),hpFill:$('hpFill'),arFill:$('arFill'),ammo:$('ammo'),wname:$('wname'),
  cross:$('cross'),msg:$('msg'),sub:$('sub'),tip:$('tip'),pop:$('pop'),vig:$('vig'),pflash:$('pflash'),lowhp:$('lowhp'),
  pips:[...$('pips').children],mLabel:$('mLabel'),bMelee:$('bMelee'),dashCd:$('dashCd'),touch:$('touch'),joy:$('joy'),knob:$('knob'),joyHint:$('joyHint'),
  obj:$('obj'),mark:$('mark'),markD:$('markD'),mmap:$('mmap'),radio:$('radio')};
const txt=(el,v)=>{if(el._v!==v){el._v=v;el.textContent=v}};
const sty=(el,p,v)=>{const k='_'+p;if(el[k]!==v){el[k]=v;el.style[p]=v}};
let msgT=0,tipT=0,popT=0,crossT=0,pflashV=0,radioT=0;
function showMsg(m,s,dur){txt(H.msg,m);txt(H.sub,s||'');msgT=dur||2.2;sty(H.msg,'opacity','1');sty(H.sub,'opacity',s?'1':'0')}
function showTip(key,html){if(tipsShown[key])return;tipsShown[key]=1;showTipForce(html)}
function showTipForce(html){H.tip.innerHTML=html;tipT=4.5;sty(H.tip,'opacity','1')}
function showPop(t){txt(H.pop,t);popT=.9;sty(H.pop,'opacity','1')}
function crossHit(kill){H.cross.classList.add('hit');if(kill)H.cross.classList.add('kill');crossT=kill?.18:.08}
// Olgerd speaks through the amulet without stopping the fight.
function radio(who,text,dur){H.radio.innerHTML='';const b=document.createElement('b');b.textContent=who;H.radio.append(b,document.createTextNode(text));radioT=dur||5;sty(H.radio,'opacity','1')}
