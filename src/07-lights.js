/* ================= LIGHTS ================= */
const camLight=new THREE.PointLight(0xffa040,0,16,2);camera.add(camLight);camLight.position.set(.3,-.2,-1.2);
const fireLights=[];for(let i=0;i<QP.pl;i++){const l=new THREE.PointLight(0xff7a30,0,24,2);l.userData={base:0,fade:0};scene.add(l);fireLights.push(l)}
const lavaLight=QP.pl?new THREE.PointLight(0xff3a10,1.2,14,2):null;if(lavaLight){lavaLight.position.set(0,1.5,0);scene.add(lavaLight)}
let lightT=0;
// The few real lights hop to the fires nearest the player; they fade in after a hop and flicker smoothly (no per-frame noise).
function updateLights(dt){
  lightT-=dt;
  if(lightT<=0&&fireLights.length){lightT=.4;const c=WORLD.fireSpots.filter(f=>f.light||f.k<1).map(f=>({f,d:f.p.distanceToSquared(P.pos)})).sort((a,b)=>a.d-b.d);
    fireLights.forEach((l,i)=>{const f=c[i]&&c[i].f;if(f&&l.userData.spot!==f){l.userData.spot=f;l.position.copy(f.p);l.position.y+=.4;l.userData.base=f.k>1?3.2:f.k===0?2.6:1.7;l.userData.fade=0;l.color.set(f.lava?0xff4a12:0xff7a30)}})}
  for(const l of fireLights){const u=l.userData;u.fade=Math.min(1,u.fade+dt*2.5);l.intensity=u.base*u.fade*(.86+Math.sin(ft*11+l.position.x)*.07+Math.sin(ft*23.7+l.position.z)*.05)}
  if(lavaLight){lavaLight.visible=WORLD.name==='arena';lavaLight.intensity=1.1+Math.sin(ft*2)*.25}
}
