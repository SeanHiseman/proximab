// Dependency-free, metre-based geometry for a reference-informed design model; speculative mission hardware remains conceptual.
// Two decks per disc. Outer deck: four two-cell shared rooms between four berth bays. Inner deck: four three-cell rooms up to the hub.
export const sharedRooms = [
  ['Galley and hygiene', 'Medical and exercise', 'Lounge and control', 'Airlock and recovery'],
  ['Garden and water', 'Air and thermal plant', 'Power and workshop', 'Stores']
].map((names,deck)=>names.map((name,i)=>({name,cell:i*3+(deck===0?1:0)})));
export const CABINS_PER_DISC=4;
export function surfaceRoomName(name,habitat){
  if(habitat==='A'){
    if(name==='Medical and exercise')return 'Airlock and recovery';
    if(name==='Airlock and recovery')return 'Medical and exercise';
  }
  return name;
}
export const COLORS = {structure:'#a4b2b1',habitat:'#b8d8c8',cabin:'#d9e0c9',propulsion:'#df946b',tanks:'#b3c4cc',shield:'#beb8a4',radiators:'#536c73',power:'#d5ad68',farm:'#87ae86',rover:'#e1c7a0',exploration:'#afbdde',inflatable:'#d8cfb4'};
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,k)=>a.map(v=>v*k);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>mul(a,1/(Math.hypot(...a)||1));
// Face normal by Newell's method over every corner, so faces whose first corners coincide (discs, cones) still shade.
export function faceNormal(v,f){let x=0,y=0,z=0;for(let i=0;i<f.length;i++){const p=v[f[i]],q=v[f[(i+1)%f.length]];x+=(p[1]-q[1])*(p[2]+q[2]);y+=(p[2]-q[2])*(p[0]+q[0]);z+=(p[0]-q[0])*(p[1]+q[1]);}return norm([x,y,z]);}
export function spinSign(id){if(id==='habA'||id.startsWith('bay-A-'))return -1;if(id==='habB'||id.startsWith('bay-B-'))return 1;if(id.startsWith('cabin-'))return +id.slice(6)<=CABINS_PER_DISC?-1:1;return 0;}
export function spinPoint(p,id,angle,centres,vector=false,flat=false){if(flat){const q=rotate(p,[-Math.PI/2,0,0]);return rotate(spinPoint(q,id,angle,centres,vector),[Math.PI/2,0,0]);}const sign=spinSign(id);if(!sign||!angle)return [...p];const origin=vector?[0,0,0]:[centres[sign<0?0:1],0,0];return add(rotate(sub(p,origin),[0,0,angle*sign]),origin);}
export function poseScene(scene,angle){if(!angle||!scene.spinCentres)return scene;return {...scene,meshes:scene.meshes.map(m=>({...m,vertices:m.vertices.map(p=>spinPoint(p,m.id,angle,scene.spinCentres,false,scene.flat)),...(m.normals?{normals:m.normals.map(n=>spinPoint(n,m.id,angle,scene.spinCentres,true,scene.flat))}:{})})),lines:scene.lines.map(l=>({...l,a:spinPoint(l.a,l.id,angle,scene.spinCentres,false,scene.flat),b:spinPoint(l.b,l.id,angle,scene.spinCentres,false,scene.flat)}))};}
export function rotate(p,r=[0,0,0]){let [x,y,z]=p;let c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(r[1]);s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(r[2]);s=Math.sin(r[2]);return [x*c-y*s,x*s+y*c,z];}
export function scenarioMass(landedTonnes,exhaustFraction,thermalKmS,rapidity){const thermalRatio=Math.exp(thermalKmS*1000/(1800*9.80665));const interstellarRatio=Math.exp(2*rapidity/exhaustFraction);return {departureTonnes:landedTonnes*thermalRatio*interstellarRatio,hydrogenTonnes:landedTonnes*(thermalRatio-1),thermalRatio,interstellarRatio};}
// ---- Mission timeline (reports/tandem-redesign.json, S8; S7 trajectories with the resized crew shield). Each ship flies two equal Earth-frame burns at constant
// proper acceleration either side of a coast; each burn is split into eight equal-rapidity tank stages. Years are Earth years
// from cargo departure; distances are light years from the Sun; A is proper acceleration in c per year.
export function missionTimeline(data){
  const spec=data.selected_specification,arch=data.architecture,out={};
  for(const kind of ['crew','cargo']){
    const p=spec.ships[kind].propulsion,t=p.trajectory,beta=t.beta,gamma=1/Math.sqrt(1-beta*beta),phi=Math.atanh(beta),A=gamma*beta/t.burn_years;
    const depart=arch[kind+'_departure_year'],arrive=depart+t.years,coast=t.years-2*t.burn_years,burnLy=(gamma-1)/A;
    const drops=p.segments.map(s=>{const f=(s.index+1)/p.stages_per_burn;return {...s,year:s.phase?arrive-Math.sinh(phi*(1-f))/A:depart+Math.sinh(phi*f)/A};});
    out[kind]={kind,depart,arrive,opsEnd:depart+arch[kind+'_flight_earth_years'],burnYears:t.burn_years,coastYears:coast,beta,gamma,phi,A,burnLy,
      distanceLy:2*burnLy+beta*coast,properYears:2*phi/A+coast/gamma,accelerationG:t.acceleration_m_s2/9.80665,stagesPerBurn:p.stages_per_burn,drops,departureT:p.departure_t,retainedT:p.retained_core_t};
  }
  return out;
}
// Arrival order inside the shared 0.1-year window: cargo descends first; crew waits in orbit for surface confirmation.
// Only the order is specified; these sub-intervals are display choices, not allocated durations.
const ENTRY_START={cargo:.5,crew:1};
export function shipStateAt(s,year){
  const u=year-s.depart,B=s.burnYears,end=s.arrive-s.depart,{A,beta,gamma,phi}=s;
  let x=0,b=0,tau=0,phase='departure';
  if(u>=0&&u<B){const w=A*u;x=(Math.sqrt(1+w*w)-1)/A;b=w/Math.sqrt(1+w*w);tau=Math.asinh(w)/A;phase='accel';}
  else if(u>=B&&u<end-B){x=s.burnLy+beta*(u-B);b=beta;tau=phi/A+(u-B)/gamma;phase='coast';}
  else if(u>=end-B&&u<end){const w=A*(end-u);x=s.distanceLy-(Math.sqrt(1+w*w)-1)/A;b=w/Math.sqrt(1+w*w);tau=s.properYears-Math.asinh(w)/A;phase='braking';}
  else if(u>=end){x=s.distanceLy;tau=s.properYears+(u-end);phase=(year-s.arrive)>=ENTRY_START[s.kind]*(s.opsEnd-s.arrive)-1e-9?'entry':'orbit';}
  const dropped=u>0?s.drops.filter(d=>d.year<=year+1e-12).length:0;
  // Mass falls within each stage as its propellant burns (exponential in rapidity), then steps down at each tank drop.
  let massT=dropped?s.drops[dropped-1].after_drop_t:s.departureT;
  if((phase==='accel'||phase==='braking')&&dropped<s.drops.length){const seg=s.drops[dropped],step=phi/s.stagesPerBurn,done=phase==='accel'?Math.asinh(A*u):phi-Math.asinh(A*(end-u));
    const f=Math.min(1,Math.max(0,(done-seg.index*step)/step));massT=seg.before_t*Math.pow(seg.after_burn_t/seg.before_t,f);}
  // The towed engine leads, with the dust shield in front of it, through acceleration and the whole coast; the ship is
  // flipped once, at the start of braking, re-rigging the engine behind and moving the shield to the crew end.
  const engineAhead=!(phase==='braking'||phase==='orbit'||phase==='entry');
  // Distance still to go, computed without cancellation during braking so the final approach stays smooth to the metre.
  const remainingLy=phase==='braking'?(w=>w*w/(A*(Math.sqrt(1+w*w)+1)))(A*(end-u)):Math.max(0,s.distanceLy-x);
  return {phase,dropped,tanksAttached:2*s.stagesPerBurn-dropped,distanceLy:x,remainingLy,beta:b,properYears:tau,massT,burning:phase==='accel'||phase==='braking',engineAhead,accelerationG:s.accelerationG};
}
// Year at the middle of the interval sharing this year's phase and stage count: the 3D scene depends only on that pair.
export function stageYear(s,year){
  const cuts=[0,s.depart,s.depart+s.burnYears,s.depart+s.burnYears+s.coastYears/2,s.arrive-s.burnYears,s.arrive,s.arrive+ENTRY_START.cargo*(s.opsEnd-s.arrive),s.opsEnd,...s.drops.map(d=>d.year)].filter(c=>c>=0&&c<=s.opsEnd).sort((a,b)=>a-b);
  if(year>=s.opsEnd-1e-9)return s.opsEnd;
  let lo=0,hi=s.opsEnd;for(const c of cuts){if(c<=year+1e-12)lo=c;else{hi=c;break;}}
  return (lo+hi)/2;
}
// ---- Slider scale. The slider runs over the selected ship's own journey (the map: the whole mission) and is not linear
// in time: burns, the final approach and arrival get room, the long coast is compressed. The last month before arrival
// is logarithmic in time-to-go, so the approach slows smoothly down to the final hour.
const HOUR_YEARS=1/(365.25*24),MONTH_YEARS=30/365.25;
export function missionScale(T,view){
  const s=view==='map'?T.crew:T[view],a=s.arrive,B=s.burnYears;
  const knots=view==='map'?[[0,0],[s.depart,.22],[s.depart+B,.3],[a-B,.48],[a-MONTH_YEARS,.62],[a-HOUR_YEARS,.84,'log'],[a,.88],[s.opsEnd,1]]
    :[[s.depart,0],[s.depart+B,.16],[a-B,.42],[a-MONTH_YEARS,.62],[a-HOUR_YEARS,.94,'log'],[a,1]];
  const y0=knots[0][0],y1=knots[knots.length-1][0];
  const toU=year=>{year=Math.min(y1,Math.max(y0,year));for(let i=1;i<knots.length;i++){const [ya,ua]=knots[i-1],[yb,ub,kind]=knots[i];if(year<=yb||i===knots.length-1){
    const f=kind==='log'?Math.log((a-ya)/Math.max(a-year,a-yb))/Math.log((a-ya)/(a-yb)):(year-ya)/(yb-ya);return ua+(ub-ua)*Math.min(1,Math.max(0,f));}}return 1;};
  const toYear=u=>{u=Math.min(1,Math.max(0,u));for(let i=1;i<knots.length;i++){const [ya,ua]=knots[i-1],[yb,ub,kind]=knots[i];if(u<=ub||i===knots.length-1){
    const f=Math.min(1,Math.max(0,(u-ua)/(ub-ua)));return kind==='log'?a-(a-ya)*Math.pow((a-yb)/(a-ya),f):ya+(yb-ya)*f;}}return y1;};
  // Milestones: departures, end of acceleration, the mid-coast engine re-rig, braking, Proxima b filling the view
  // (angular diameter 1 degree at the assumed radius), orbit arrival and the descents.
  const ships=view==='map'?['cargo','crew']:[view],ms=[];
  for(const k of ships){const t=T[k],name=view==='map'?(k==='crew'?'Crew ':'Cargo '):'',cap=w=>name?w:w[0].toUpperCase()+w.slice(1);
    ms.push({year:t.depart,label:name+cap('departs')});
    if(view!=='map')ms.push({year:t.depart+t.burnYears,label:`Cruise ${t.beta.toFixed(2)}c`},{year:t.arrive-t.burnYears,label:'Flip and braking'},
      {year:t.arrive-approachYears(t,PLANET.radius_km/Math.tan(.5*Math.PI/180)),label:'Proxima b 1° wide'});
    if(view==='map')ms.push({year:t.arrive+ENTRY_START[k]*(t.opsEnd-t.arrive),label:name+cap(k==='crew'?'descends':'lands')});}
  ms.push({year:a,label:'Arrive in orbit'});
  return {view,start:y0,end:y1,toU,toYear,milestones:ms.filter(m=>m.year>=y0&&m.year<=y1).map(m=>({...m,u:toU(m.year)})).sort((p,q)=>p.u-q.u)};
}
// Proxima b mock-up: radius and parking orbit are assumptions (radius unmeasured; minimum mass 1.07 Earth masses).
export const PLANET={radius_km:7000,orbit_altitude_km:400,entry_altitude_km:120,orbit_au:.04857};
const LY_KM=63241.077*149597870.7,AU_KM=149597870.7;
// Earth years before arrival at which the braking ship is `km` from the end of its trajectory (constant proper deceleration).
function approachYears(t,km){const d=km/LY_KM;return Math.sqrt(Math.pow(1+t.A*d,2)-1)/t.A;}

// ---- Flight sky: drawn every frame (not part of the cached ship scene) so the view changes smoothly with the year.
// Stars sit at their catalogue directions and distances: the ship's position along the route gives parallax for the
// nearby stars, the Sun recedes behind, Alpha Centauri A/B and Proxima brighten ahead, and the ship's speed adds
// relativistic aberration and Doppler brightening. Native frame: the route to Proxima b points along -x. Vertices are
// camera-relative (material -2).
// Approximate Hipparcos parallaxes (milliarcseconds) for brightStars, in order; 0 marks Alpha Centauri (drawn separately).
const brightParallax=[379.2,10.55,0,88.83,130.23,76.2,3.78,284.56,6.55,23.39,8.32,194.95,10.13,48.94,13.06,5.89,96.54,129.81,2.31,11.71,41.13,8.05,64.12,36.83,5.71,12.92,24.36,28.82,1.65,32.29,4.43,2.92,39.51,22.76,6.44,26.54,1.82,31.38,10.86,5.39,40.21,8.35,40.49,29.84,18.24,7.54,6.62,18.09,25.07,49.56];
const celestial=(ra,dec)=>{const a=ra*Math.PI/12,d=dec*Math.PI/180;return [Math.cos(d)*Math.cos(a),Math.sin(d),Math.cos(d)*Math.sin(a)];};
const PROXIMA={dir:celestial(14.4953,-62.6795),ly:4.2465,V:11.13,radius_km:.1542*695700};
const ALPHA_CEN={dir:celestial(14.6601,-60.834),ly:4.367,A:.01,B:1.33,separation_au:23.4};
const hex=c=>'#'+c.map(v=>Math.round(Math.min(1,Math.max(0,v))*255).toString(16).padStart(2,'0')).join('');
// Proxima b surface (mock-up, tidally locked assumption): coherent zones by angle from the substellar point, with edges
// warped by low-frequency noise. A bright ochre dune desert around the substellar point; rust plains with dark basalt
// maria and craters; grey-brown highlands toward the terminator, frosting over; an ice sheet across the night side and
// polar caps; thin cloud bands near the terminator. Not a surface map.
const hash3=(x,y,z)=>{let h=(x*374761393+y*668265263+z*1274126177)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
function valueNoise(p){const i=p.map(Math.floor),f=p.map((v,k)=>v-i[k]),u=f.map(t=>t*t*(3-2*t));let n=0;
  for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)for(let dz=0;dz<2;dz++)n+=hash3(i[0]+dx,i[1]+dy,i[2]+dz)*(dx?u[0]:1-u[0])*(dy?u[1]:1-u[1])*(dz?u[2]:1-u[2]);return n;}
const fbm=(p,o=5)=>{let n=0,a=.5,q=p;for(let k=0;k<o;k++){n+=a*valueNoise(q);q=q.map(v=>v*2.03+17.1);a*=.5;}return n;};
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);},mix3=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
const CRATERS=Array.from({length:14},(_,i)=>{const u=hash3(i,7,3)*2-1,ph=hash3(i,11,5)*2*Math.PI,q=Math.sqrt(1-u*u);return {c:[q*Math.cos(ph),q*Math.sin(ph),u],r:.04+.07*hash3(i,3,9)};});
// Proxima d (0.029 AU, hot, airless-looking with a faint haze): dark basalt and grey regolith, bright crater rays.
export function proximaDColor(n){const g=fbm(n.map(v=>v*3+4)),fine=fbm(n.map(v=>v*11+2),4),lava=smoothstep(.55,.62,fbm(n.map(v=>v*2+9)));
  let c=mix3([.46,.43,.4],[.2,.18,.17],lava);c=mix3(c,[.62,.58,.54],smoothstep(.62,.7,g));
  for(const k of CRATERS){const d=Math.acos(Math.max(-1,Math.min(1,dot(n,k.c))));if(d<k.r*1.6){const t=d/k.r;c=t<1?c.map(v=>v*(.8+.2*t)):mix3(c,[.75,.72,.68],.5*(1-(t-1)/.6));}}
  return c.map(v=>v*(.85+.3*fine));}
// Proxima c (candidate, 1.5 AU, cold; if real, likely a mini-Neptune): banded blue-grey cloud deck with storms.
export function proximaCColor(n){const lat=Math.asin(Math.max(-1,Math.min(1,n[2]))),turb=fbm(n.map(v=>v*4+1),4),band=.5+.5*Math.sin(lat*9+3*(turb-.5));
  let c=mix3([.48,.6,.7],[.7,.78,.82],band);const storm=smoothstep(.68,.74,fbm(n.map(v=>v*6+7),3));c=mix3(c,[.86,.9,.92],storm*.6);
  return c.map(v=>v*(.9+.2*fbm(n.map(v=>v*14),3)));}
export function proximaBColor(n){
  const warp=(fbm(n.map(v=>v*1.4+3))-.5)*.5,psi=Math.acos(Math.max(-1,Math.min(1,n[0])))*180/Math.PI+warp*40;
  const grain=fbm(n.map(v=>v*9+1),4),maria=smoothstep(.56,.63,fbm(n.map(v=>v*2.4+5),5));
  const dunes=.5+.5*Math.sin(60*n[2]+8*fbm(n.map(v=>v*3+2),3));
  let c=mix3([.8,.55,.33],[.7,.48,.28],dunes*.5);                                 // substellar dune desert
  c=mix3(c,mix3([.64,.35,.2],[.27,.19,.15],maria),smoothstep(30,44,psi));            // rust plains and basalt maria
  c=mix3(c,[.5,.44,.4],smoothstep(66,80,psi));                                        // highlands toward the terminator
  c=mix3(c,[.78,.8,.84],smoothstep(84,98,psi));                                       // frost and the night-side ice sheet
  c=mix3(c,[.86,.88,.92],smoothstep(.86,.93,Math.abs(n[2])+warp*.1));                 // polar caps
  for(const k of CRATERS){const d=Math.acos(Math.max(-1,Math.min(1,dot(n,k.c))));if(d<k.r*1.3){const t=d/k.r;c=t<1?mix3(c,c.map(v=>v*.72),1-t*t):mix3(c,c.map(v=>Math.min(1,v*1.25)),1-(t-1)/.3);}}
  c=c.map(v=>v*(.88+.24*grain));
  const cloud=smoothstep(.6,.72,fbm([n[0]*2,n[1]*6+1,n[2]*2],4))*smoothstep(50,70,psi)*(1-smoothstep(92,104,psi));
  return mix3(c,[.9,.88,.86],.55*cloud);}
let planetAlbedo=new Map();
function proximaBAlbedo(rings,segs,key='b'){const id=key+rings;if(planetAlbedo.has(id))return planetAlbedo.get(id);const cols=[],fn={b:proximaBColor,d:proximaDColor,c:proximaCColor}[key];
  for(let j=0;j<=rings;j++)for(let i=0;i<segs;i++){const lat=Math.PI/2-j/rings*Math.PI,lon=i/segs*2*Math.PI;cols.push(fn([Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)]));}
  const A={rings,segs,cols};planetAlbedo.set(id,A);return A;}
// Atmosphere: haze builds toward the limb (aerial perspective), warm on the day side, dusky on the night side.
const ATMOSPHERE={b:{day:[.93,.72,.56],night:[.12,.13,.24],depth:.75},d:{day:[.7,.68,.66],night:[.08,.08,.1],depth:.25},c:{day:[.7,.84,.95],night:[.1,.14,.25],depth:1}};
function hazed(c,key,mu,lit){const A=ATMOSPHERE[key];if(!A)return c;const h=A.depth*Math.pow(1-Math.max(0,Math.min(1,mu)),2.2),tint=mix3(A.night,A.day,smoothstep(-.15,.25,lit));return mix3(c,tint,Math.min(.85,h));}
export function flightSky(data,view,year,opts={}){
  const T=missionTimeline(data),s=T[view==='cargo'?'cargo':'crew'],f=shipStateAt(s,year),meshes=[];
  const beta=opts.classical?0:f.beta,gamma=1/Math.sqrt(1-beta*beta),ahead=[-1,0,0],R=5000;
  // Proxima b's position (mock-up choice): at its orbit radius, 60 degrees round from the far side of Proxima.
  const side=norm(cross(PROXIMA.dir,[0,1,0])),orbitLy=PLANET.orbit_au*AU_KM/LY_KM;
  const planetPos=add(mul(PROXIMA.dir,PROXIMA.ly),add(mul(PROXIMA.dir,orbitLy*Math.cos(Math.PI/3)),mul(side,orbitLy*Math.sin(Math.PI/3)))),route=norm(planetPos);
  // The ship brakes to a parking orbit beside the planet, not into its centre: its end point is offset from the planet
  // centre by radius + altitude, on the side facing Proxima (so it parks over the day side).
  const toProx=norm(sub(mul(PROXIMA.dir,PROXIMA.ly),planetPos)),up=norm(sub(toProx,mul(route,dot(toProx,route))));
  const remainingLy=f.remainingLy,altitude=f.phase==='entry'?PLANET.entry_altitude_km:PLANET.orbit_altitude_km,park=(PLANET.radius_km+altitude)/LY_KM;
  // The route length is the mission's 4.24 ly; positions scale it onto the catalogue distance to Proxima b.
  const shipPos=add(sub(mul(planetPos,1-remainingLy/s.distanceLy),mul(route,0)),mul(up,park));
  const toPlanet=sub(planetPos,shipPos),toPlanetKm=Math.hypot(...toPlanet)*LY_KM;
  // World to sky frame: the route points dead ahead (-x), rolled so that the parking side is up (+y): the planet ends
  // below the ship.
  const k=norm(cross(route,ahead)),cosA=dot(route,ahead),sinA=Math.hypot(...cross(route,ahead));
  const rot=n=>add(add(mul(n,cosA),mul(cross(k,n),sinA)),mul(k,dot(k,n)*(1-cosA))),u0=rot(up),roll=Math.atan2(u0[2],u0[1]);
  const toShip=n=>{const q=rot(n),c=Math.cos(roll),sn=Math.sin(roll);return [q[0],q[1]*c+q[2]*sn,-q[1]*sn+q[2]*c];};
  const observe=n=>{const ct=dot(n,ahead),ctp=(ct+beta)/(1+beta*ct),perp=sub(n,mul(ahead,ct)),pl=Math.hypot(...perp);
    const dir=pl<1e-12?(ct>0?ahead:mul(ahead,-1)):add(mul(ahead,ctp),mul(perp,Math.sqrt(Math.max(0,1-ctp*ctp))/pl));return {dir,dmag:-10*Math.log10(gamma*(1+beta*ct))};};
  const disc=(dir,r,color,opacity=1,n=4,dist=R)=>{const c=mul(dir,dist),u=norm(cross(dir,Math.abs(dir[1])<.9?[0,1,0]:[1,0,0])),w=cross(dir,u);
    const m={id:'sky',vertices:Array.from({length:n},(_,i)=>add(c,add(mul(u,r*Math.cos(i/n*2*Math.PI)),mul(w,r*Math.sin(i/n*2*Math.PI))))),faces:[Array.from({length:n},(_,i)=>i)],color,opacity,material:-2};meshes.push(m);return m;};
  // Point size for ordinary stars; very bright bodies get their true disc plus a glare halo that shrinks smoothly as they
  // dim, so a receding Sun visibly shrinks.
  const size=mag=>Math.min(8,6*Math.pow(10,-mag*.1)),glare=mag=>20*Math.pow(10,-.045*(mag+3));
  const body=(p,mag0,ly0)=>{const rel=sub(p,shipPos),d=Math.hypot(...rel),o=observe(toShip(mul(rel,1/d)));return {dir:o.dir,mag:mag0+5*Math.log10(d/ly0)+o.dmag,ly:d};};
  const star=(b,color='#e4eaf0',role='star',angularRadius=0)=>{if(b.mag>6.5)return null;const bright=b.mag<-3,r=bright?Math.max(R*Math.tan(angularRadius),3):Math.max(size(b.mag),R*Math.tan(angularRadius)),m=disc(b.dir,r,color,1,angularRadius||bright?32:4);m.role=role;m.apparentMagnitude=b.mag;
    if(b.mag<-1){const g=bright?glare(b.mag):r*2.5;for(const [k2,a] of [[.45,.28],[1,.08]])disc(b.dir,Math.max(r*1.2,g*k2),color,a,24,R+1).role=role+'-glow';}return m;};
  brightStars.forEach(([ra,dec,mag],i)=>{const plx=brightParallax[i];if(!plx)return;const ly=3261.56/plx;star(body(mul(celestial(ra,dec),ly),mag,ly));});
  // The Sun behind (from 1 AU at departure; true 0.53 degree disc there), Alpha Centauri A and B, and Proxima.
  const fromSun=Math.hypot(...shipPos),sunLy=Math.max(fromSun,AU_KM/LY_KM),sunDir=observe(toShip(fromSun>1e-9?mul(shipPos,-1/fromSun):mul(route,-1)));
  const sun=star({dir:sunDir.dir,mag:4.83+5*Math.log10(sunLy/32.6156)+sunDir.dmag},'#fff3b5','sun',695700/(sunLy*LY_KM));
  if(sun){
    sun.distanceAU=sunLy*LY_KM/AU_KM;
    if(sun.distanceAU<25){
      const centre=mul(sunDir.dir,R),rim=sun.vertices,n=rim.length;
      sun.vertices=[centre,...rim.map(p=>add(centre,mul(sub(p,centre),.82))),...rim];
      sun.colors=['#fffdf0',...rim.map(()=>'#fff2b6'),...rim.map(()=>'#ffc573')];
      sun.faces=[];
      for(let i=0;i<n;i++){
        const a=i+1,b=(i+1)%n+1;
        sun.faces.push([0,a,b],[a,a+n,b+n,b]);
      }
    }
  }
  const ab=mul(ALPHA_CEN.dir,ALPHA_CEN.ly),abSide=norm(cross(ALPHA_CEN.dir,PROXIMA.dir));
  for(const [name,mag,offset] of [['A',ALPHA_CEN.A,0],['B',ALPHA_CEN.B,ALPHA_CEN.separation_au*AU_KM/LY_KM]]){const b=body(add(ab,mul(abSide,offset)),mag,ALPHA_CEN.ly);const m=star(b,'#fff1d8','alpha-centauri-'+name);if(m)m.distanceLy=b.ly;}
  const px=body(mul(PROXIMA.dir,PROXIMA.ly),PROXIMA.V,PROXIMA.ly),pxRadius=PROXIMA.radius_km/(px.ly*LY_KM);
  const prox=star(px,'#ff9257','proxima',pxRadius);if(prox){prox.distanceAU=px.ly*LY_KM/AU_KM;prox.angularDiameterDeg=2*pxRadius*180/Math.PI;}
  // Faint background field (directions only; too far for parallax), aberrated like the bright stars.
  let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(const [count,sz,color] of [[900,6,'#7d8790'],[300,9,'#b9c3cc']]){const v=[],fc=[];
    for(let i=0;i<count;i++){const y=2*random()-1,phi=2*Math.PI*random(),q=Math.sqrt(1-y*y),n=observe([q*Math.cos(phi),y,q*Math.sin(phi)]).dir,cc=mul(n,R),u=norm(cross(n,Math.abs(n[1])<.9?[0,1,0]:[1,0,0])),w=cross(n,u),b=v.length;
      v.push(add(cc,mul(u,-sz)),add(cc,mul(w,sz)),add(cc,mul(u,sz)),add(cc,mul(w,-sz)));fc.push([b,b+1,b+2,b+3]);}
    meshes.push({id:'sky',vertices:v,faces:fc,color,opacity:1,material:-2,role:'star-field'});}
  // Proxima b mock-up sphere once it is more than a few pixels across, lit by Proxima, with a thin hazy limb.
  const planetRadius=Math.asin(Math.min(.999,PLANET.radius_km/toPlanetKm));
  if(planetRadius>2e-4&&!opts.noPlanet){const dir=observe(toShip(mul(toPlanet,1/Math.hypot(...toPlanet)))).dir,L=2600,rho=L*Math.sin(planetRadius),centre=mul(dir,L),light=px.dir;
    // Planet-fixed frame: x toward Proxima (substellar point), z the orbit pole.
    const e1s=norm(toShip(sub(planetPos,mul(PROXIMA.dir,PROXIMA.ly)))),px0=mul(e1s,-1),pz0=norm(cross(e1s,toShip(route))),py0=cross(pz0,px0);
    const rings=planetRadius>.05?64:32,segs=2*rings,A=proximaBAlbedo(rings,segs),v=[],fc=[],colors=[];
    for(let j=0;j<=rings;j++)for(let i=0;i<segs;i++){const lat=Math.PI/2-j/rings*Math.PI,lon=i/segs*2*Math.PI,ln=[Math.cos(lat)*Math.cos(lon),Math.cos(lat)*Math.sin(lon),Math.sin(lat)];
      const n=add(add(mul(px0,ln[0]),mul(py0,ln[1])),mul(pz0,ln[2]));v.push(add(centre,mul(n,rho)));
      const lit=dot(n,light),day=lit>0?Math.pow(lit,.6):0,term=Math.max(0,Math.min(1,(lit+.06)/.12)),c=A.cols[j*segs+i];
      colors.push(hex(hazed(c.map((x,q)=>x*(.06+.94*day*term)+[.01,.012,.02][q]),'b',-dot(n,dir),lit)));}
    for(let j=0;j<rings;j++)for(let i=0;i<segs;i++){const a0=j*segs+i,a1=j*segs+(i+1)%segs;fc.push([a0,a1,a1+segs,a0+segs]);}
    const planet={id:'sky',vertices:v,faces:fc,colors,color:'#9a5a38',opacity:1,material:-2,role:'proxima-b'};planet.angularDiameterDeg=2*planetRadius*180/Math.PI;meshes.push(planet);
    for(let q=1;q<=14;q++){const t2=q/14,h=disc(dir,rho*(1+.11*t2),t2<.45?'#f6dfcd':t2<.8?'#dcc9d9':'#a9bde6',.16*(1-t2)**1.6,96,L+rho*.05);h.role='proxima-b-haze';}
    // Close to the planet the atmosphere is a translucent shell a little above the surface (about 80 km), tinting the view
    // down and thickening toward the horizon.
    if(planetRadius>.3){const sh=1+80/PLANET.radius_km,rr=24,v2=[],f2=[];for(let j=0;j<=rr;j++)for(let i=0;i<2*rr;i++){const la=Math.PI/2-j/rr*Math.PI,lo=i/(2*rr)*2*Math.PI;v2.push(add(centre,mul([Math.cos(la)*Math.cos(lo),Math.sin(la),Math.cos(la)*Math.sin(lo)],rho*sh)));}
      for(let j=0;j<rr;j++)for(let i=0;i<2*rr;i++){const a0=j*2*rr+i,a1=j*2*rr+(i+1)%(2*rr);f2.push([a0,a1,a1+2*rr,a0+2*rr]);}
      meshes.push({id:'sky',vertices:v2,faces:f2,color:'#f4ddcc',opacity:.16,material:-2,role:'proxima-b-atmosphere-shell'});}}
  return {meshes,lines:[],flight:f,toPlanetKm,frame:{toShip,planetPos,proximaPos:mul(PROXIMA.dir,PROXIMA.ly),route,up}};
}
// ---- Proxima system view: to scale, built every frame relative to the camera in double precision so it can zoom from
// the whole system to a few kilometres above the settlement. Distances in km. Proxima b and d are confirmed; c is a
// disputed candidate. Radii of b, d and c are not measured: b uses the mock-up radius, d and c are illustrative.
export const SYSTEM={
  planets:[
    {key:'d',name:'Proxima d',a_au:.02885,period_days:5.122,radius_km:4100,color:[.62,.52,.44]},
    {key:'b',name:'Proxima b',a_au:PLANET.orbit_au,period_days:11.186,radius_km:PLANET.radius_km},
    {key:'c',name:'Proxima c (candidate)',a_au:1.49,period_days:1928,radius_km:12700,color:[.55,.62,.72]}],
  // Settlement site on Proxima b (mock-up choice): in the rust plains of the day side, 10 degrees north and 45 degrees
  // from the substellar point.
  settlement:{lat_deg:10,lon_deg:45},
  parking_orbits_km:{crew:PLANET.orbit_altitude_km,cargo:PLANET.orbit_altitude_km+150}};
let focusCache=null;
export function systemFocusPoints(data){
  if(focusCache?.data===data)return focusCache.out;
  // Positions in the arrival sky frame (km, relative to Proxima). Planets at the arrival epoch.
  const F=flightSky(data,'crew',missionTimeline(data).crew.arrive+.01,{noPlanet:true}).frame,AU=AU_KM;
  const bRel=mul(F.toShip(sub(F.planetPos,F.proximaPos)),LY_KM),e1=norm(bRel),pole=norm(cross(e1,F.toShip(F.route))),e2=cross(pole,e1);
  const out={proxima:{p:[0,0,0],r:PROXIMA.radius_km,name:'Proxima Centauri'}};
  for(const pl of SYSTEM.planets){const ang=pl.key==='b'?0:{d:2.1,c:-1.2}[pl.key],p=add(mul(e1,pl.a_au*AU*Math.cos(ang)),mul(e2,pl.a_au*AU*Math.sin(ang)));out[pl.key]={p,r:pl.radius_km,name:pl.name,orbit:{a:pl.a_au*AU,e1,e2}};}
  // Settlement site and the parking orbits around b (in the plane of the arrival 'up' and route directions).
  const b=out.b.p,toStar=norm(mul(b,-1)),north=pole,east=norm(cross(north,toStar)),la=SYSTEM.settlement.lat_deg*Math.PI/180,lo=SYSTEM.settlement.lon_deg*Math.PI/180;
  const n=add(add(mul(toStar,Math.cos(la)*Math.cos(lo)),mul(east,Math.cos(la)*Math.sin(lo))),mul(north,Math.sin(la)));
  out.settlement={p:add(b,mul(n,PLANET.radius_km)),r:.5,name:'Settlement',normal:n};
  // Parking orbits run directly over the settlement: their plane holds the arrival point (up) and the site's zenith.
  const up=F.toShip(F.up),fwd=norm(sub(n,mul(up,dot(n,up))));
  for(const [k,ph] of [['crew',0],['cargo',2.2]])out[k]={p:add(b,mul(add(mul(up,Math.cos(ph)),mul(fwd,Math.sin(ph))),PLANET.radius_km+SYSTEM.parking_orbits_km[k])),r:.05,name:k==='crew'?'Crew ship':'Cargo ship',orbit:{a:PLANET.radius_km+SYSTEM.parking_orbits_km[k],e1:up,e2:fwd,centre:b}};
  focusCache={data,out};return out;}
// Local metres at the settlement and system kilometres share the same tangent frame.
export function settlementFrame(data){
  const points=systemFocusPoints(data),{p,normal:up}=points.settlement;
  const light=norm(mul(points.b.p,-1)),h=norm(sub(light,mul(up,dot(light,up)))),side=cross(h,up);
  const [sx,,sz]=PROXIMA_SKY_DIR,length=Math.hypot(sx,sz);
  const x=mul(sub(mul(h,sx),mul(side,sz)),1/length),z=mul(add(mul(h,sz),mul(side,sx)),1/length);
  const vector=v=>add(add(mul(x,v[0]),mul(up,v[1])),mul(z,v[2]));
  const local=v=>[dot(v,x),dot(v,up),dot(v,z)];
  const offset=[SETTLEMENT_CENTRE[0],0,SETTLEMENT_CENTRE[1]];
  return {vector,local,position:v=>add(p,mul(vector(sub(v,offset)),.001)),metres:v=>add(offset,mul(local(sub(v,p)),1000)),origin:p};
}
let starCache=null;
export function systemSky(data,cam){
  // cam: {focus, km (distance from focus), forward (unit view direction, sky frame)}. Returns camera-relative meshes,
  // orbit lines and labels in sky units (the focus sits 1000 units ahead); far objects are pulled in to 4500 units with
  // their size scaled alike, which keeps every angle exact.
  const pts=systemFocusPoints(data),focus=cam.focusPoint??add(pts[cam.focus]?.p??[0,0,0],cam.offset??[0,0,0]),k=1000/cam.km,meshes=[],lines=[],labels=[];
  const eye=cam.eye??sub(focus,mul(cam.forward,cam.km));
  const place=p=>{const q=mul(sub(p,eye),k),d=Math.hypot(...q);return d>4500?{q:mul(q,4500/d),f:4500/d}:{q,f:1};};
  const sphere=(centre,radius,colorAt,role,n=48,basis=[[1,0,0],[0,1,0],[0,0,1]])=>{const P=place(centre),r=radius*k*P.f,distance=Math.hypot(...P.q);
    if(r<.4||dot(P.q,cam.forward)+r<=0)return null;
    const v=[],fc=[],colors=[],m2=Math.max(8,Math.min(n,cam.rings??48,Math.ceil(2*Math.sqrt(450*r/Math.max(r,distance)))));
    for(let j=0;j<=m2;j++)for(let i=0;i<2*m2;i++){const la=Math.PI/2-j/m2*Math.PI,lo=i/(2*m2)*2*Math.PI,l=[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)],nn=add(add(mul(basis[0],l[0]),mul(basis[1],l[1])),mul(basis[2],l[2]));v.push(add(P.q,mul(nn,r)));colors.push(colorAt(nn,j,i,m2));}
    for(let j=0;j<m2;j++)for(let i=0;i<2*m2;i++){const a0=j*2*m2+i,a1=j*2*m2+(i+1)%(2*m2);fc.push([a0,a1,a1+2*m2,a0+2*m2]);}
    const m={id:'sky',vertices:v,faces:fc,colors,color:'#ffffff',opacity:1,material:-2,role};meshes.push(m);return m;};
  const dot2=(p,size0,color,role,bodyRadius=0)=>{const P=place(p),size=size0*.0018*Math.hypot(...P.q);if(bodyRadius*k*P.f>size)return;const nn=16,u=norm(cross(P.q,Math.abs(P.q[1])<.9*Math.hypot(...P.q)?[0,1,0]:[1,0,0])),w=norm(cross(P.q,u));meshes.push({id:'sky',vertices:Array.from({length:nn},(_,i)=>add(P.q,add(mul(u,size*Math.cos(i/nn*2*Math.PI)),mul(w,size*Math.sin(i/nn*2*Math.PI))))),faces:[Array.from({length:nn},(_,i)=>i)],color,opacity:1,material:-2,role});};
  // Labels only where they separate from their parent on screen (planets from Proxima; ships and the site from b).
  const label=(p,text,parent)=>{const q=place(p).q;if(parent&&Math.hypot(...sub(q,place(parent).q))<25*Math.hypot(...q)/1000)return;labels.push({p:q,text});};
  // Background stars as seen from Proxima (directions only).
  if(starCache?.data!==data)starCache={data,meshes:flightSky(data,'crew',missionTimeline(data).crew.arrive+.01,{noPlanet:true}).meshes.filter(m=>/^(star|alpha-centauri|sun)/.test(m.role??''))};meshes.push(...starCache.meshes);
  // Proxima: true-size red dwarf with a glow.
  const light=p=>norm(sub([0,0,0],p));
  sphere([0,0,0],PROXIMA.radius_km,()=> '#ff8a4a','proxima',40);dot2([0,0,0],6,'#ff9257','proxima-marker',PROXIMA.radius_km);label([0,0,0],'Proxima Centauri');
  // Planets: orbits as lines, spheres lit by Proxima; b uses the mock-up surface with its day side toward the star.
  for(const pl of SYSTEM.planets){const P=pts[pl.key],o=P.orbit;let prev=null;
    for(let i=0;i<=256;i++){const a=i/256*2*Math.PI,q=place(add(mul(o.e1,o.a*Math.cos(a)),mul(o.e2,o.a*Math.sin(a)))).q;if(prev)lines.push({id:'sky',a:prev,b:q,color:pl.key==='c'?'#5b6878':'#6d7f86',material:-2});prev=q;}
    const L=light(P.p),pole=norm(cross(o.e1,o.e2)),sx=L,sz=pole,sy=cross(sz,sx);
    // Every planet textured on its planet-fixed grid, hazed toward the limb, with a glow beyond the limb.
    const A=proximaBAlbedo(64,128,pl.key),toCam0=norm(mul(place(P.p).q,-1)),AT=ATMOSPHERE[pl.key];
    if(pl.key==='b'&&cam.omitSurfacePlanet)continue;
    if(pl.key==='b'&&Math.hypot(...sub(eye,pts.settlement.p))<3000){
      const frame=settlementFrame(data);
      for(const part of settlementPlanet(data))meshes.push({...part,id:'sky',material:-2,vertices:part.vertices.map(v=>mul(sub(frame.position(v),eye),k))});
    }else sphere(P.p,P.r,(n,j,i,m2)=>{const lit=dot(n,L),day=lit>0?Math.pow(lit,.6):0,c=A.cols[Math.round(j*64/m2)*128+Math.round(i*64/m2)%128];
      return hex(hazed(c.map(v=>v*(.07+.93*day)),pl.key,dot(n,toCam0),lit));},'planet-'+pl.key,64,[sx,sy,sz]);
    {const P2=place(P.p),r=P.r*k*P2.f,toCam=norm(mul(P2.q,-1)),hc=hex(AT.day),hn=hex(mix3(AT.day,AT.night,.5));if(r>2&&Math.hypot(...sub(eye,P.p))>P.r*1.04)for(const [f,a,col] of [[1.03,.55*AT.depth,hc],[1.07,.3*AT.depth,hc],[1.13,.12*AT.depth,hn]]){const u=norm(cross(toCam,Math.abs(toCam[1])<.9?[0,1,0]:[1,0,0])),w=cross(toCam,u),c0=P2.q,nn=96;
      meshes.push({id:'sky',vertices:Array.from({length:nn},(_,i)=>add(c0,add(mul(u,r*f*Math.cos(i/nn*2*Math.PI)),mul(w,r*f*Math.sin(i/nn*2*Math.PI))))),faces:[Array.from({length:nn},(_,i)=>i)],color:col,opacity:a,material:-2,role:'planet-atmosphere-'+pl.key});}}
    dot2(P.p,3,pl.key==='c'?'#9fb0c4':'#d0c0b0','planet-marker',P.r);label(P.p,pl.name,cam.focus==='proxima'?[0,0,0]:null);}
  // Ships' parking orbits around b and the settlement site on its surface.
  for(const k2 of ['crew','cargo']){const S=pts[k2],o=S.orbit;let prev=null;
    for(let i=0;i<=128;i++){const a=i/128*2*Math.PI,q=place(add(o.centre,add(mul(o.e1,o.a*Math.cos(a)),mul(o.e2,o.a*Math.sin(a))))).q;if(prev)lines.push({id:'sky',a:prev,b:q,color:k2==='crew'?'#3987e5':'#d95926',material:-2});prev=q;}
    dot2(S.p,2.5,k2==='crew'?'#3987e5':'#d95926','ship-marker');label(S.p,`${S.name} parking orbit`,pts.b.p);}
  const st=pts.settlement;dot2(add(st.p,mul(st.normal,.02)),2.5,'#ffe08a','settlement-marker');label(st.p,'Settlement',pts.b.p);
  // Scout probes (exploration manifest): a CubeSat-class orbiter at each planet; the three microlanders all on d (people
  // are already on b); an atmosphere-entry probe for c (if real, it has no solid surface). A primitive relay: three small
  // satellites spaced round a high orbit of b, keeping the settlement in contact with the probes and the long-range link.
  const ring=(c,u,w,a,color,n=96)=>{let prev=null;for(let i=0;i<=n;i++){const t2=i/n*2*Math.PI,q=place(add(c,add(mul(u,a*Math.cos(t2)),mul(w,a*Math.sin(t2))))).q;if(prev)lines.push({id:'sky',a:prev,b:q,color,material:-2});prev=q;}};
  for(const pl of SYSTEM.planets){const P=pts[pl.key],o=P.orbit,pole=norm(cross(o.e1,o.e2)),u=norm(cross(pole,[0,0,1])),w=cross(pole,u),a=P.r*1.6;
    // Polar orbit: the plane contains the pole.
    ring(P.p,pole,u,a,'#8fd0a0');const op=add(P.p,mul(pole,a));dot2(op,2,'#8fd0a0','scout-orbiter');label(op,'Scout orbiter',P.p);
    if(pl.key==='d')for(const [la,lo] of [[.35,.5],[-.2,1.1],[.6,-.4]]){const n=norm(add(add(mul(norm(mul(P.p,-1)),Math.cos(la)*Math.cos(lo)),mul(cross(pole,norm(mul(P.p,-1))),Math.cos(la)*Math.sin(lo))),mul(pole,Math.sin(la)))),lp=add(P.p,mul(n,P.r));dot2(add(lp,mul(n,.05)),2,'#f0a070','scout-lander');label(lp,'Scout lander',P.p);}
    if(pl.key==='c'){const n=norm(add(mul(norm(mul(P.p,-1)),.8),mul(pole,.6))),ap=add(P.p,mul(n,P.r*1.02));dot2(ap,2,'#f0c070','atmosphere-probe');label(ap,'Atmosphere probe',P.p);}}
  {const B=pts.b,pole=norm(cross(B.orbit.e1,B.orbit.e2)),u=norm(cross(pole,[0,0,1])),w=cross(pole,u),a=B.r*6;ring(B.p,u,w,a,'#c7a0f0');
    for(let k=0;k<3;k++){const t2=k*2*Math.PI/3,rp=add(B.p,add(mul(u,a*Math.cos(t2)),mul(w,a*Math.sin(t2))));dot2(rp,2,'#c7a0f0','relay-satellite');if(!k)label(rp,'Relay satellites',B.p);}}
  return {meshes,lines,labels,focusPoints:pts,eye};
}
// Bright-star reference: AstroPixels / Hipparcos summary, J2000 RA hours, declination degrees, V magnitude.
const brightStars=[[6.75,-16.7,-1.44],[6.4,-52.7,-.62],[14.6667,-60.8,-.28],[14.2667,19.2,-.05],[18.6167,38.8,.03],[5.2833,46,.08],[5.25,-8.2,.18],[7.65,5.2,.4],[5.9167,7.4,.45],[1.6333,-57.2,.45],[14.0667,-60.4,.61],[19.85,8.9,.76],[12.45,-63.1,.77],[4.6,16.5,.87],[13.4167,-11.2,.98],[16.4833,-26.4,1.06],[7.75,28,1.16],[22.9667,-29.6,1.17],[20.6833,45.3,1.25],[12.8,-59.7,1.25],[10.1333,12,1.36],[6.9833,-29,1.5],[7.5833,31.9,1.58],[12.5167,-57.1,1.59],[17.5667,-37.1,1.62],[5.4167,6.3,1.64],[5.4333,28.6,1.65],[9.2167,-69.7,1.67],[5.6,-1.2,1.69],[22.1333,-47,1.73],[5.6833,-1.9,1.74],[8.1667,-47.3,1.75],[12.9,56,1.76],[18.4,-34.4,1.79],[3.4,49.9,1.79],[11.0667,61.8,1.81],[7.1333,-26.4,1.83],[13.8,49.3,1.85],[17.6167,-43,1.86],[8.3833,-59.5,1.86],[6,44.9,1.9],[16.8167,-69,1.91],[8.75,-54.7,1.93],[6.6333,16.4,1.93],[20.4333,-56.7,1.94],[2.5333,89.3,1.97],[6.3833,-18,1.98],[9.4667,-8.7,1.99],[10.3333,19.8,2.01],[2.1167,23.5,2.01]];
const boxV=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const boxF=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]];

// Settlement terrain (metres): a graded pad under the base, dunes and low hills, rising to distant ridges.
export const SETTLEMENT_CENTRE=[50,-20];
// Proxima's fixed direction in the settlement sky (tidally locked): 45 degrees up, the site's distance from the substellar point.
export const PROXIMA_SKY_DIR=norm([-.449,.707,.546]);
export const SOLAR_PAD={x:35,z:150,r:135};
export function settlementTerrain(x,z){const [cx,cz]=SETTLEMENT_CENTRE,d=Math.hypot(x-cx,z-cz),d2=Math.hypot(x-SOLAR_PAD.x,z-SOLAR_PAD.z),b=Math.min(Math.min(1,Math.max(0,(d-260)/180)),Math.min(1,Math.max(0,(d2-SOLAR_PAD.r)/150))),s=b*b*(3-2*b);
  const dunes=1.3*Math.sin(x*.031+z*.017)*Math.sin(z*.023-x*.011)+.7*Math.sin(x*.07+1.3)*Math.cos(z*.05);
  const hills=9*Math.sin(x*.004+.5)*Math.cos(z*.0033-.2)+6*Math.sin((x+z)*.0061);
  const far=Math.min(1,Math.max(0,(d-1700)/900)),ang=Math.atan2(z-cz,x-cx);
  const radius=PLANET.radius_km*1000;
  const curvature=-d*d/(radius+Math.sqrt(Math.max(0,radius*radius-d*d)));
  const relief=-.05+s*(dunes+hills+9)+far*far*(140+60*Math.sin(ang*5+.7)+35*Math.sin(ang*13));
  // Keep the built and graded site flat, then ease its apron onto the planet.
  return curvature*smoothstep(350,1500,d)+relief*(1-smoothstep(3100,4500,d));}
const TERRAIN_RADII=[0,40,80,120,160,200,240,280,320,360,400,450,500,560,620,700,800,900,1000,1150,1300,1450,1600,1800,2000,2250,2500,2800,3100,3500,4000,4500];
const TERRAIN_SECTORS=96;

let settlementPlanetCache;
function settlementPlanet(data){
  if(settlementPlanetCache?.data===data)return settlementPlanetCache.meshes;
  const frame=settlementFrame(data),planet=systemFocusPoints(data).b;
  const light=norm(mul(planet.p,-1)),pole=norm(cross(planet.orbit.e1,planet.orbit.e2)),east=cross(pole,light);
  const radius=PLANET.radius_km*1000,[cx,cz]=SETTLEMENT_CENTRE,seam=TERRAIN_RADII.at(-1);
  const angles=Array.from({length:TERRAIN_SECTORS},(_,i)=>i*2*Math.PI/TERRAIN_SECTORS);
  const color=n=>{
    const w=frame.vector(n),lit=dot(w,light),day=Math.max(0,lit)**.6;
    return proximaBColor([lit,dot(w,east),dot(w,pole)]).map(v=>v*(.07+.93*day));
  };
  const ground={id:'ground',vertices:[[cx,settlementTerrain(cx,cz),cz]],faces:[],colors:[],color:'#8b5d42',opacity:1,material:-1,role:'regolith'};
  for(const r of TERRAIN_RADII.slice(1))for(const a of angles){
    const x=cx+r*Math.cos(a),z=cz+r*Math.sin(a);ground.vertices.push([x,settlementTerrain(x,z),z]);
  }
  const rings=(faces,start,count)=>{
    for(let j=0;j<count-1;j++)for(let i=0;i<angles.length;i++){
      const a=start+j*angles.length,b=a+angles.length,k=(i+1)%angles.length;
      faces.push([a+i,a+k,b+k,b+i]);
    }
  };
  for(let i=0;i<angles.length;i++)ground.faces.push([0,1+(i+1)%angles.length,1+i]);
  rings(ground.faces,1,TERRAIN_RADII.length-1);
  ground.colors=ground.vertices.map(([x,y,z])=>{
    const dx=x-cx,dz=z-cz,r=Math.hypot(dx,dz);
    const texture=Math.max(0,Math.min(1,.5+.35*Math.sin(x*.011+Math.cos(z*.009)*2)+.15*Math.sin(z*.05-x*.02)-.004*Math.max(0,y-9)));
    const close=mix3([.41,.27,.18],[.65,.42,.26],texture),n=[dx/radius,Math.sqrt(1-(r/radius)**2),dz/radius];
    return hex(mix3(close,color(n),smoothstep(2600,seam,r)));
  });
  const globe={id:'ground',vertices:[],faces:[],colors:[],color:'#8b5d42',opacity:1,material:-1,role:'planet-regolith'};
  const polar=[Math.asin(seam/radius),.0009,.0013,.002,.0035,.006,.01,.017,.027,.044,.064,...Array.from({length:49},(_,i)=>(i+1)*Math.PI/49).filter(a=>a>.064)];
  for(const [j,t] of polar.entries())for(const a of angles){
    const n=[Math.sin(t)*Math.cos(a),Math.cos(t),Math.sin(t)*Math.sin(a)];
    globe.vertices.push(j===0?ground.vertices[ground.vertices.length-angles.length+globe.vertices.length]:[cx+radius*n[0],radius*(n[1]-1),cz+radius*n[2]]);
    globe.colors.push(j===0?ground.colors[ground.colors.length-angles.length+globe.colors.length]:hex(color(n)));
  }
  rings(globe.faces,0,polar.length);
  settlementPlanetCache={data,meshes:[ground,globe]};return settlementPlanetCache.meshes;
}
// Sample the same triangles used to draw the regolith, including the coarse ridges.
export function settlementCameraFloor(x,z){
  const [cx,cz]=SETTLEMENT_CENTRE,u=x-cx,v=z-cz,step=2*Math.PI/TERRAIN_SECTORS;
  const a=Math.floor(Math.atan2(v,u)/step)*step,mid=a+step/2;
  const r=(u*Math.cos(mid)+v*Math.sin(mid))/Math.cos(step/2);
  const inner=TERRAIN_RADII.findIndex(radius=>radius>=r)-1;
  const terrain=settlementTerrain(x,z);
  if(inner<0)return terrain;
  const at=(radius,angle)=>{const X=radius*Math.cos(angle),Z=radius*Math.sin(angle);return [X,Z,settlementTerrain(cx+X,cz+Z)];};
  const sample=(A,B,C)=>{
    const [ax,az,ay]=A,[bx,bz,by]=B,[qx,qz,qy]=C;
    const det=(bx-ax)*(qz-az)-(bz-az)*(qx-ax);
    if(!det)return -Infinity;
    const b=((u-ax)*(qz-az)-(v-az)*(qx-ax))/det;
    const c=((bx-ax)*(v-az)-(bz-az)*(u-ax))/det;
    return b>=-1e-7&&c>=-1e-7&&b+c<=1+1e-7?ay+b*(by-ay)+c*(qy-ay):-Infinity;
  };
  const r0=TERRAIN_RADII[inner],r1=TERRAIN_RADII[inner+1];
  const A=at(r0,a),B=at(r0,a+step),C=at(r1,a+step),D=at(r1,a);
  return Math.max(terrain,sample(A,B,C),sample(A,C,D));
}
// Concept surface vehicle: 3 m/s forward, 1 m/s reverse; controlled acceleration and braking.
export function placeRover(r){
  const c=Math.cos(r.heading),s=Math.sin(r.heading),slope=(dx,dz)=>(settlementTerrain(r.x+dx,r.z+dz)-settlementTerrain(r.x-dx,r.z-dz))/2;
  r.forward=norm([c,slope(c,-s),-s]);const side=norm([s,slope(s,c),c]);r.up=norm(cross(side,r.forward));r.side=cross(r.forward,r.up);r.position=[r.x,settlementTerrain(r.x,r.z)-.15,r.z];return r;
}
export function createRoverState(){return placeRover({x:90,z:-42,heading:0,speed:0,parked:true});}
export function roverPoint(p,r,vector=false,inverse=false){
  if(!r)return [...p];if(inverse){const q=vector?p:sub(p,r.position);const v=[dot(q,r.forward),dot(q,r.up),dot(q,r.side)];return vector?v:add(v,[90,0,-42]);}
  const q=vector?p:sub(p,[90,0,-42]),v=add(add(mul(r.forward,q[0]),mul(r.up,q[1])),mul(r.side,q[2]));return vector?v:add(r.position,v);
}
export function stepRover(r,keys,dt,obstacles=[]){
  const before=[r.x,r.z,r.speed,r.heading],n=Math.max(1,Math.ceil(Math.min(dt,1)/.02)),h=Math.min(dt,1)/n,approach=(v,target,d)=>v<target?Math.min(target,v+d):Math.max(target,v-d);
  for(let i=0;i<n;i++){
    const throttle=Number(keys.has('w'))-Number(keys.has('s')),brake=r.parked||keys.has(' ')||(throttle&&r.speed*throttle<-.02);
    if(brake)r.speed=approach(r.speed,0,2.5*h);
    else{const c=Math.cos(r.heading),s=Math.sin(r.heading),grade=(settlementTerrain(r.x+c,r.z-s)-settlementTerrain(r.x-c,r.z+s))/2,gravity=9.80665*grade;
      if(throttle){const force=Math.max(-3,Math.min(3,throttle*1.2+gravity));r.speed+=(force-gravity)*h;}
      else{r.speed=approach(r.speed,0,(.15+.01*r.speed*r.speed)*h);r.speed-=gravity*h;}
      r.speed=Math.max(-2,Math.min(8,r.speed));
    }
    const steer=Number(keys.has('a'))-Number(keys.has('d')),angle=Math.min(.5,Math.atan(.8*6/Math.max(.1,r.speed*r.speed))),heading=r.heading+steer*r.speed/6*Math.tan(angle)*h,x=r.x+Math.cos(heading)*r.speed*h,z=r.z-Math.sin(heading)*r.speed*h;
    const blocked=obstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r:x>o.x0&&x<o.x1&&z>o.z0&&z<o.z1);
    if(blocked)r.speed=0;else{r.x=x;r.z=z;r.heading=heading;}
  }
  placeRover(r);return before.some((v,i)=>Math.abs(v-[r.x,r.z,r.speed,r.heading][i])>1e-9);
}
export function createScene(state,data,time=0){
  if(state.mode==='descent'){
    // Separate descent view: the crew's two disc landers and the cargo lander, side by side, each on its heat shield.
    const crew=createScene({...state,mode:'cruise',year:40,cutaway:false,interiorHabitat:'none'},data,time),cargo=createScene({...state,mode:'cargo',year:40,cutaway:false},data,time),dy=60;
    const shift=p=>[p[0]+8,p[1]+dy,p[2]];
    for(const m of cargo.meshes)m.vertices=m.vertices.map(shift);
    for(const l of cargo.lines){l.a=shift(l.a);l.b=shift(l.b);}for(const l of cargo.labels)l.p=shift(l.p);
    return {...crew,meshes:[...crew.meshes,...cargo.meshes],lines:[...crew.lines,...cargo.lines],labels:[...crew.labels,...cargo.labels],rooms:[],spinCentres:null,descent:true};}
  // Flight scenes: the crew ship ('cruise') and the cargo ship ('cargo'), each shown at its state in the S8 timeline (state.year,
  // Earth years from cargo departure). The scene depends only on the phase and the number of tank stages dropped.
  const cargoShip=state.mode==='cargo',crewShip=state.mode==='cruise',ship=crewShip||cargoShip;
  const timeline=ship?missionTimeline(data)[cargoShip?'cargo':'crew']:null,flight=ship?shipStateAt(timeline,stageYear(timeline,state.year??30)):null;
  // Discs spin except during the axial-thrust burns and entry; the burn interior for axial thrust is not designed.
  const spinning=crewShip&&!flight.burning&&flight.phase!=='entry';
  // Burns thrust in the plane of the edge-on discs: they lock and each room re-sets its floors toward the engine ('engine').
  // For braking the engine is ahead, so the discs lock half a turn round and the same layout faces it.
  const engine=crewShip&&flight.burning,brakingLock=engine&&flight.phase==='braking';
  const scene={grid:false,meshes:[],lines:[],labels:[],dimensions:[],zones:[],spinCentres:spinning?data.layout.disc_centres_x_m:null,flight};
  const surface=state.mode==='settlement';
  const body=p=>add(p,[0,surface?25:0,0]);
  function mesh(id,v,f,color,opacity=1,transform=p=>p){const item={id,vertices:v.map(transform),faces:f,color,opacity};scene.meshes.push(item);return item;}
  function smooth(item){if(!item.vertices)return item;const normals=item.vertices.map(()=>[0,0,0]);for(const f of item.faces){const n=faceNormal(item.vertices,f);for(const i of f)normals[i]=add(normals[i],n);}item.normals=normals.map(norm);return item;}
  function box(id,p,size,color,rotation=[0,0,0],opacity=1,transform=body){if(state.detail==='overview'&&Math.max(...size)<.45)return {};return mesh(id,boxV.map(v=>add(p,rotate(v.map((x,i)=>x*size[i]/2),rotation))),boxF,color,opacity,transform);}
  function line(id,a,b,color=COLORS.structure,transform=body,width=1,dashed=false){scene.lines.push({id,a:transform(a),b:transform(b),color,width,dashed});}
  function sphere(id,p,r,color,opacity=1,transform=body){if(state.detail==='overview'&&Math.max(...r)<.3)return {};const v=[],f=[],ns=[],n=state.detail==='high'?32:state.detail==='overview'?8:16,m=state.detail==='high'?16:state.detail==='overview'?4:8;for(let j=0;j<=m;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=j/m*Math.PI;v.push(add(p,[r[0]*Math.sin(b)*Math.cos(a),r[1]*Math.cos(b),r[2]*Math.sin(b)*Math.sin(a)]));ns.push(norm([Math.sin(b)*Math.cos(a)/r[0],Math.cos(b)/r[1],Math.sin(b)*Math.sin(a)/r[2]]));}for(let j=0;j<m;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);const obj=mesh(id,v,f,color,opacity,transform);const origin=transform(p);obj.normals=ns.map(n=>norm(sub(transform(add(p,n)),origin)));return obj;}
  function cylinder(id,p,r,length,color,axis='x',opacity=1,transform=body,topRadius=r){if(state.detail==='overview'&&Math.max(r,topRadius)<.18)return {};const v=[],f=[],n=state.detail==='high'?48:state.detail==='overview'?12:Math.max(r,topRadius)<.5?10:24;for(let k=0;k<2;k++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=k?topRadius:r;const q=axis==='x'?[(k-.5)*length,rr*Math.cos(a),rr*Math.sin(a)]:axis==='y'?[rr*Math.cos(a),(k-.5)*length,rr*Math.sin(a)]:[rr*Math.cos(a),rr*Math.sin(a),(k-.5)*length];v.push(add(p,q));}for(let i=0;i<n;i++)f.push([i,(i+1)%n,(i+1)%n+n,i+n]);f.push(Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i));return mesh(id,v,f,color,opacity,transform);}
  function sector(id,r0,r1,a0,a1,depth,color,opacity,transform,n=8){const v=[],f=[];for(let z of [-depth/2,depth/2])for(let r of [r0,r1])for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;v.push([r*Math.cos(a),r*Math.sin(a),z]);}const row=n+1;for(let i=0;i<n;i++){f.push([i,i+1,row+i+1,row+i],[2*row+i,3*row+i,3*row+i+1,2*row+i+1],[i,2*row+i,2*row+i+1,i+1],[row+i,row+i+1,3*row+i+1,3*row+i]);}f.push([0,row,3*row,2*row],[n,2*row-1,4*row-1,3*row-1]);return mesh(id,v,f,color,opacity,transform);}
  // Folding floor panel pierced by ladder hatches: pierced top/bottom faces plus edge caps.
  function floorSlab(id,r0,r1,a0,a1,depth,color,transform,n,holes){
    const vertices=[],faces=[],half=depth/2;
    curvedPanel(vertices,faces,r0,a0,a1,-half,half,n,holes);curvedPanel(vertices,faces,r1,a0,a1,-half,half,n,holes,true);
    const p=(r,a,z)=>vertices.push([r*Math.cos(a),r*Math.sin(a),z])-1;
    for(const a of [a0,a1])faces.push([p(r0,a,-half),p(r1,a,-half),p(r1,a,half),p(r0,a,half)]);
    for(const z of [-half,half])for(let i=0;i<n;i++){const b0=a0+(a1-a0)*i/n,b1=a0+(a1-a0)*(i+1)/n;faces.push([p(r0,b0,z),p(r0,b1,z),p(r1,b1,z),p(r1,b0,z)]);}
    return mesh(id,vertices,faces,color,1,transform);
  }
  function pipe(id,a,b,r,color,transform=body){if(state.detail==='overview'&&r<.06)return {};const direction=norm(sub(b,a)),u=norm(cross(direction,Math.abs(direction[2])<.9?[0,0,1]:[0,1,0])),v=cross(direction,u),vertices=[],faces=[],n=state.detail==='medium'&&r<.2?4:8;for(const p of [a,b])for(let i=0;i<n;i++)vertices.push(add(p,add(mul(u,r*Math.cos(i*2*Math.PI/n)),mul(v,r*Math.sin(i*2*Math.PI/n)))));for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);return mesh(id,vertices,faces,color,1,transform);}
  function torus(id,p,major,minor,color,axis='x',transform=body){if(state.detail==='overview'&&minor<.08&&major<1.8)return {};const vertices=[],faces=[],n=major>3.5?(state.detail==='overview'?32:Math.min(72,Math.round(major*9))):state.detail==='high'?(major>2?40:16):state.detail==='overview'?8:major<.5?8:12,m=state.detail==='overview'?3:state.detail==='medium'&&minor<.15?3:minor>.15?8:4;for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i/n*2*Math.PI,b=j/m*2*Math.PI,R=major+minor*Math.cos(b);const q=axis==='x'?[minor*Math.sin(b),R*Math.cos(a),R*Math.sin(a)]:[R*Math.cos(a),R*Math.sin(a),minor*Math.sin(b)];vertices.push(add(p,q));}for(let i=0;i<n;i++)for(let j=0;j<m;j++)faces.push([i*m+j,((i+1)%n)*m+j,((i+1)%n)*m+(j+1)%m,i*m+(j+1)%m]);return smooth(mesh(id,vertices,faces,color,1,transform));}
  // Curved surface at radius r over [a0,a1]x[z0,z1], pierced by any rectangular openings {a0,a1,z0,z1}.
  function curvedPanel(vertices,faces,r,a0,a1,z0,z1,n,holes=[],flip=false,zSteps=1){
    const as=[...new Set([...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...holes.flatMap(h=>[h.a0,h.a1]).filter(a=>a>a0&&a<a1)])].sort((x,y)=>x-y);
    const zs=[...new Set([...Array.from({length:zSteps+1},(_,i)=>z0+(z1-z0)*i/zSteps),...holes.flatMap(h=>[h.z0,h.z1]).filter(z=>z>z0&&z<z1)])].sort((x,y)=>x-y);
    const base=vertices.length,row=as.length;for(const z of zs)for(const a of as)vertices.push([r*Math.cos(a),r*Math.sin(a),z]);
    for(let j=0;j<zs.length-1;j++)for(let i=0;i<row-1;i++){
      const am=(as[i]+as[i+1])/2,zm=(zs[j]+zs[j+1])/2;
      if(holes.some(h=>am>h.a0&&am<h.a1&&zm>h.z0&&zm<h.z1))continue;
      const q=[base+j*row+i,base+j*row+i+1,base+(j+1)*row+i+1,base+(j+1)*row+i];faces.push(flip?q.reverse():q);
    }
  }
  // Tube along axis from origin; u/w span the cross-section. Cells whose centre satisfies cut(p) are left open.
  function tube(id,origin,axis,u,w,radius,ss,n,color,transform,cut=()=>false,endShift=null){
    const phis=Array.from({length:n+1},(_,i)=>-Math.PI+2*Math.PI*i/n),vertices=[],faces=[],row=phis.length;
    const at=(s,p)=>add(origin,add(mul(axis,s),add(mul(u,radius*Math.cos(p)),mul(w,radius*Math.sin(p)))));
    ss.forEach((s,j)=>{for(const p of phis){const q=at(s,p);vertices.push(endShift&&j===ss.length-1?add(q,mul(axis,endShift(q))):q);}});
    for(let j=0;j<ss.length-1;j++)for(let i=0;i<row-1;i++){if(cut(at((ss[j]+ss[j+1])/2,(phis[i]+phis[i+1])/2)))continue;faces.push([j*row+i,j*row+i+1,(j+1)*row+i+1,(j+1)*row+i]);}
    return mesh(id,vertices,faces,color,1,transform);
  }
  function pressureOutline(p,depth){
    const r=Math.hypot(p[0],p[1]),outer=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+(surface?.65:.02),bulge=Math.abs(r-outer)<1e-5?.75*Math.sqrt(Math.max(0,1-(p[2]/(depth/2))**2)):0;
    return [p[0]*(1+bulge/r),p[1]*(1+bulge/r),p[2]];
  }
  function pressureCell(id,r0,r1,a0,a1,depth,color,transform,span=1,{windows=[(a0+a1)/2],innerHoles=[],outerHoles=[],hatchAngle=null,outerWall=true,innerWall=true}={}){
    const half=depth/2,rm=(r0+r1)/2,n=(state.detail==='overview'?6:state.detail==='medium'?12:16)*span,vertices=[],faces=[];
    if(innerWall)curvedPanel(vertices,faces,r0,a0,a1,-half,half,n,innerHoles,false,state.detail==='overview'?2:8);
    if(outerWall)curvedPanel(vertices,faces,r1,a0,a1,-half,half,n,outerHoles,true,state.detail==='overview'?2:8);
    // Both axial covers are removed in cutaway so the radial decks can be inspected from either side.
    if(!state.cutaway){
      const angles=[...new Set([...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...(hatchAngle!==null&&!surface?[hatchAngle-.75/rm,hatchAngle+.75/rm]:[])])].filter(a=>a>=a0&&a<=a1).sort((a,b)=>a-b),rs=hatchAngle!==null&&!surface?[r0,r1-.13-2.3,r1-.13,r1]:[r0,r1];
      for(let j=0;j<rs.length-1;j++)for(let i=0;i<angles.length-1;i++){
        const a=(angles[i]+angles[i+1])/2,r=(rs[j]+rs[j+1])/2;
        if(hatchAngle!==null&&!surface&&Math.abs(a-hatchAngle)<.75/rm&&r>r1-.13-2.3&&r<r1-.13)continue;
        const b=vertices.length;for(const [r,a] of [[rs[j],angles[i]],[rs[j+1],angles[i]],[rs[j+1],angles[i+1]],[rs[j],angles[i+1]]])vertices.push([r*Math.cos(a),r*Math.sin(a),half]);faces.push([b,b+1,b+2,b+3]);
      }
    }
    // Internal deck edges remain flush with the common covers.
    const rounded=p=>transform(pressureOutline(p,depth));
    const shell=vertices.length?mesh(id,vertices,faces,color,1,rounded):{vertices:[],faces:[]};shell.material=2;
    const visibleWindow=!state.cutaway,height=(r1-r0)/2;
    // The window-side cover is split between portholes; each porthole is centred on its own window angle.
    const ws=[...windows].sort((x,y)=>x-y);
    if(visibleWindow)ws.forEach((w,k)=>{
      const b0=k?(ws[k-1]+w)/2:a0,b1=k<ws.length-1?(w+ws[k+1])/2:a1,xl=(b0-w)*rm,xr=(b1-w)*rm;
      const point=(x,y)=>{const r=rm+y,a=w+x/rm;return [r*Math.cos(a),r*Math.sin(a),-half];};
      const v=[],f=[],count=32,edge=extra=>[...new Set([b0,b1,...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...extra])].filter(a=>a>=b0&&a<=b1).sort((x,y)=>x-y).map(a=>(a-w)*rm);
      const bottom=edge(innerHoles.flatMap(h=>[h.a0,h.a1])),top=edge(outerHoles.flatMap(h=>[h.a0,h.a1])).reverse(),sides=[-.5,0,.5].map(k=>k*2*height);
      const boundary=[...bottom.map(x=>[x,-height]),...sides.map(y=>[xr,y]),...top.map(x=>[x,height]),...[...sides].reverse().map(y=>[xl,y])];
      for(const [x,y] of boundary){const a=Math.atan2(y,x);v.push(point(x,y),point(.36*Math.cos(a),.36*Math.sin(a)));}
      for(let i=0;i<boundary.length;i++){const j=(i+1)%boundary.length;f.push([2*i,2*j,2*j+1,2*i+1]);}
      mesh(id,v,f,color,1,rounded).role='window-wall';
      mesh(id,Array.from({length:count},(_,i)=>point(.36*Math.cos(i/count*2*Math.PI),.36*Math.sin(i/count*2*Math.PI))),[Array.from({length:count},(_,i)=>i)],'#8fb3c0',.4,transform).role='porthole-glass';
      for(const [a,b] of [[[-.36,0],[.36,0]],[[0,-.36],[0,.36]]])pipe(id,point(...a),point(...b),.012,'#cad2ce',transform).role='window-mullion';
      torus(id,point(0,0),.39,.045,'#cad2ce','z',transform).role='porthole-frame';
    });
    return shell;
  }
  function pressureCaps(id,p,r,halfLength,capLength,color,opacity,transform,port=.7){
    const n=state.detail==='overview'?12:24,m=8;
    for(const sign of [-1,1]){const v=[],f=[],end=Math.acos(port/r);for(let j=0;j<=m;j++)for(let i=0;i<n;i++){const t=end*j/m,a=i/n*2*Math.PI;v.push(add(p,[sign*(halfLength+capLength*Math.sin(t)),r*Math.cos(t)*Math.cos(a),r*Math.cos(t)*Math.sin(a)]));}for(let j=0;j<m;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);smooth(mesh(id,v,f,color,opacity,transform)).role=id==='refuge'?'refuge-end-dome':'pressure-end-dome';}
    return halfLength+capLength*Math.sqrt(1-(port/r)**2);
  }
  function roverCabin(p,transform,through=false){
    const t=q=>transform(add(p,q));
    const windowAt=p=>p[0]>-.5&&p[0]<3&&p[1]>.15&&Math.abs(p[2])>1.7,ss=[0,3,3.5,4.5,5.5,6.5,7],n=state.detail==='overview'?24:48;
    const roverHull=tube('rover',[-3.5,0,0],[1,0,0],[0,1,0],[0,0,1],2.3,ss,n,COLORS.rover,t,windowAt);roverHull.role='rover-pressure-hull';
    const sideGlass=tube('rover',[-3.5,0,0],[1,0,0],[0,1,0],[0,0,1],2.3,ss,n,'#8fb3c0',t,p=>!windowAt(p));sideGlass.role='rover-window';sideGlass.opacity=.4;
    for(const sz of [-1,1]){for(const x of [-.5,.5,1.5,2.5,3])pipe('rover',[x,2.3*Math.sin(.07),sz*2.3*Math.cos(.07)],[x,2.3*Math.sin(.75),sz*2.3*Math.cos(.75)],.02,'#cad2ce',t).role='window-mullion';}
    if(through)pressureCaps('rover',[0,0,0],2.3,3.5,.35,COLORS.rover,state.cutaway?.18:1,t);
    else{
      cylinder('rover',[-3.49,0,0],2.3,.02,COLORS.rover,'x',1,t).role='hull-boundary';
      const v=[],f=[],centre=.55;for(let i=0;i<64;i++){const a=i/64*2*Math.PI,c=Math.cos(a),sn=Math.sin(a),outer=-centre*c+Math.sqrt(2.3**2-centre**2*sn**2),inner=Math.min(.65/Math.max(1e-9,Math.abs(c)),1.4/Math.max(1e-9,Math.abs(sn)));v.push([3.5,centre+outer*c,outer*sn],[3.5,centre+inner*c,inner*sn]);}for(let i=0;i<64;i++){const j=(i+1)%64;f.push([2*i,2*j,2*j+1,2*i+1]);}mesh('rover',v,f,COLORS.rover,1,t).role='hull-boundary';
      mesh('rover',[[3.51,-.1,-1.4],[3.51,1.2,-1.4],[3.51,1.2,1.4],[3.51,-.1,1.4]],[[0,1,2,3]],'#8fb3c0',.4,t).role='rover-window';for(const z of [-.7,.7])pipe('rover',[3.52,-.1,z],[3.52,1.2,z],.025,'#cad2ce',t).role='window-mullion';
    }
    for(const x of [-3.3,3.3])torus('rover',[x,0,0],2.32,.07,'#a6b4ad','x',t);
    if(!through)cylinder('rover',[-3.55,0,0],1.1,.12,'#afbdaf','x',1,t);if(!through)torus('rover',[-3.65,0,0],1.12,.1,'#778e8d','x',t);
    box('rover',[0,-1.55,0],[6.6,.12,3],'#b8c2b2',[0,0,0],1,t);
    // Interior is always fitted; the opaque hull hides it unless cut away or entered.
    {
      for(const z of [-.85,.85]){box('rover',[1.6,-.9,z],[.8,.65,.8],'#8ba79c',[0,0,0],1,t).role='rover-seat';box('rover',[1.25,-.2,z],[.15,1.1,.8],'#9eb3a6',[0,0,0],1,t);box('rover',[1.25,.45,z],[.12,.3,.5],'#9eb3a6',[0,0,0],1,t);
        box('rover',[2.5,-.5,z],[.55,.2,.9],'#6d929b',[0,0,0],1,t).role='rover-console';pipe('rover',[2.3,-.4,z*.7],[2.3,-.15,z*.7],.03,'#3e4a4c',t).role='rover-hand-controller';
        box('rover',[-1.4,-1.1,z],[2.1,.4,.85],'#c4ae8b',[0,0,0],1,t).role='rover-bunk';box('rover',[-1.4,.3,z*1.05],[2.1,.12,.75],'#c4ae8b',[0,0,0],1,t).role='rover-bunk';box('rover',[-2.1,-.85,z],[.45,.1,.7],'#d9d7bd',[0,0,0],1,t);
        for(const x of [-2.3,-1.4,-.5])box('rover',[x,1.3,z*1.75],[.8,.5,.45],'#a6b1a2',[0,0,0],1,t).role='rover-locker';
        pipe('rover',[-3,1.75,z*.55],[3,1.75,z*.55],.03,'#d7c27a',t).role='handrail';box('rover',[0,1.95,z*.35],[5.5,.03,.18],'#f1ecd2',[0,0,0],1,t).role='light-strip';}
      // Dashboard with screens under the windscreen, and the galley and toilet amidships.
      box('rover',[2.95,-.35,0],[.5,.5,2.2],'#5c6e70',[0,0,0],1,t).role='rover-console';for(const z of [-.7,0,.7])box('rover',[2.72,-.05,z],[.04,.32,.5],'#2b3e48',[0,-.4,0],1,t).role='rover-screen';
      box('rover',[-.3,0,-1.8],[1.2,2.1,.7],'#8baba4',[0,0,0],1,t).role='rover-galley';box('rover',[-.3,-.2,-1.4],[1.1,.06,.3],'#b9bba6',[0,0,0],1,t);cylinder('rover',[-.55,-.1,-1.45],.12,.06,'#9aa8a0','y',1,t);box('rover',[0,.5,-1.55],[.45,.3,.35],'#3e4a4c',[0,0,0],1,t);
      box('rover',[-.3,-.2,1.8],[1.1,2.4,.75],'#b8c9be',[0,0,0],1,t).role='waste-management-toilet';
      // Suitports on the rear bulkhead: suits stay outside, docked to the hull.
      for(const z of [-.75,.75]){torus('rover',[-3.42,-.2,z],.38,.05,'#778e8d','x',t).role='rover-suitport';cylinder('rover',[-3.45,-.2,z],.35,.04,'#9aa8a0','x',1,t).role='rover-suitport';}
    }
  }
  function assembly(name,fn){fn();}
  function seat(id,p,t,color='#688e92'){
    const tr=q=>t(add(p,q));box(id,[0,0,0],[.48,.12,.48],color,[0,0,0],1,tr).role='seat';box(id,[0,-.3,-.23],[.48,.55,.1],color,[0,0,0],1,tr).role='seat-back';
    for(const x of [-.2,.2])pipe(id,[x,.05,-.2],[x,.48,.2],.025,'#b5beb1',tr);
  }
  function table(id,p,width,t){const tr=q=>t(add(p,q));box(id,[0,0,0],[width,.07,.85],'#d6d3be',[0,0,0],1,tr).role='shared-table';for(const x of [-width*.35,width*.35])pipe(id,[x,0,0],[x,.75,0],.045,'#8faaa7',tr);}
  function rack(id,purpose,x,z,t){
    const tr=q=>t(add([x,0,z],q)),front=z<0?1:-1,face=q=>tr([q[0],q[1],q[2]*front]);
    // ISS rack proportions, front service access and a clear central aisle.
    for(const xx of [-.5,.5])pipe(id,[xx,-.88,-.4],[xx,1.12,-.4],.028,'#b4c0bc',face);
    for(const y of [-.88,1.12])box(id,[0,y,0],[1.05,.06,.82],'#b7c3bd',[0,0,0],1,face);
    box(id,[0,.1,-.405],[1.05,2,.045],'#e0dfd0',[0,0,0],1,face).role='rack-backplane';
    if(state.detail!=='overview'){
      for(const xx of [-.46,.46]){
        pipe(id,[xx,-.78,.39],[xx,1.02,.39],.022,'#6c8387',face);
        pipe(id,[xx,-.2,.45],[xx,.15,.45],.025,'#d6d7c5',face);
      }
      for(const y of [-.75,.98])for(const xx of [-.43,.43])
        cylinder(id,[xx,y,.42],.025,.025,'#586e73','z',1,face);
      box(id,[-.15,.97,.43],[.4,.08,.015],'#cbb789',[0,0,0],1,face);
    }
    const water=/Water|water|Pump|Plumbing|plumbing/.test(purpose),air=/Life support|Oxygen|CO2|Pressure|Filter|Heat|Thermal/.test(purpose),science=/Science|Medical|Seed|Optical/.test(purpose);
    if(water||air){
      for(const xx of [-.27,.27]){cylinder(id,[xx,.12,-.1],.17,1.25,air?'#b9c6bc':'#9cb5bf','y',1,face).role=air?'air-treatment-canister':'filter-column';for(const y of [-.5,.74])cylinder(id,[xx,y,-.1],.2,.07,'#b9ac8d','y',1,face);}
      cylinder(id,[0,.94,.12],.12,.55,'#738e93','x',1,face).role='pump-motor';
      for(const xx of [-.27,.27]){pipe(id,[xx,.65,.1],[xx,.65,.32],.025,'#a1b1b1',face);torus(id,[xx,.65,.32],.075,.014,'#b97861','z',face);pipe(id,[xx,.85,.15],[xx,-.72,.15],.022,'#c0b18d',face);}
      for(const y of [-.65,.85])pipe(id,[-.4,y,.1],[.4,y,.1],.03,'#9baead',face);
      box(id,[0,-.73,.36],[.9,.22,.05],'#d3d9cf',[0,0,0],1,face);box(id,[.23,-.73,.4],[.28,.1,.02],'#507c8a',[0,0,0],1,face);
    }else if(science){
      box(id,[0,0,0],[.92,.85,.67],'#c7cfca',[0,0,0],1,face).role='science-glovebox';box(id,[0,-.18,.35],[.8,.35,.035],'#81abb1',[0,0,0],.7,face);
      for(const xx of [-.22,.22]){torus(id,[xx,.18,.36],.12,.025,'#708c91','z',face);cylinder(id,[xx,.18,.25],.08,.23,'#b0b6a9','z',1,face);}
      box(id,[0,.65,.08],[.9,.35,.55],'#d9d9ca',[0,0,0],1,face);for(const xx of [-.32,0,.32])box(id,[xx,.65,.37],[.05,.08,.02],'#769397',[0,0,0],1,face);
    }else{
      const food=/Food|food|Bulk|stock|stores|reserves|consumables|textiles|envelopes/i.test(purpose);
      for(let j=0;j<4;j++){const y=-.6+j*.45;box(id,[0,y,.0],[.92,.39,.7],food?'#dbd8c1':'#d4dad1',[0,0,0],1,face).role=food?'cargo-transfer-bag':'avionics-unit';
        if(food){for(const xx of [-.3,.3])pipe(id,[xx,y-.17,.36],[xx,y+.17,.36],.015,'#9da791',face);pipe(id,[-.1,y,.38],[.1,y,.38],.018,'#7b918c',face);box(id,[.25,y,.365],[.22,.1,.015],'#f0edda',[0,0,0],1,face);}
        else{for(let k=0;k<4;k++)box(id,[-.3+k*.2,y,.365],[.11,.035,.015],'#6b8c8b',[0,0,0],1,face);cylinder(id,[.36,y,.38],.025,.025,'#c5a16c','z',1,face);}}
    }
    for(const y of [-.8,.95])pipe(id,[-.36,y,.46],[.36,y,.46],.025,'#78a6b0',face);
    pipe(id,[.43,-.75,-.23],[.43,.95,-.23],.035,'#baa879',face);
  }
  function machine(id,purpose,x,z,t){
    const tr=q=>t(add([x,0,z],q));
    if(/workshop|Fabrication tools|Precision tools|Clean workshop/i.test(purpose)){
      box(id,[0,.85,0],[1.2,.13,.85],'#d0d3c7',[0,0,0],1,tr).role='fabrication-bed';for(const xx of [-.52,.52])for(const zz of [-.34,.34])pipe(id,[xx,-.8,zz],[xx,1.1,zz],.035,'#a9bbb8',tr);
      for(const xx of [-.5,.5])pipe(id,[xx,-.45,-.34],[xx,-.45,.34],.035,'#c9c5ab',tr);pipe(id,[-.5,-.45,0],[.5,-.45,0],.035,'#a9bbb8',tr);cylinder(id,[.05,-.25,0],.06,.3,'#c6a26c','y',1,tr);torus(id,[.43,-.5,-.3],.21,.05,'#8eaca9','x',tr);box(id,[0,1.05,0],[1.15,.2,.8],'#667f7e',[0,0,0],1,tr);
    }else rack(id,purpose,x,z,t);
  }
  function communal(id,purpose,width,t){
    if(purpose==='Fresh-food garden'){
      for(const y of [1.05,.05]){const tray=box(id,[0,y,0],[3.75,.12,2],'#879e7b',[0,0,0],1,t);tray.role='fresh-food-tray';tray.cropAreaM2=7.5;box(id,[0,y-.75,0],[3.75,.05,1.8],'#dae5c4',[0,0,0],1,t);for(const x of [-1.4,-.7,0,.7,1.4])for(const z of [-.6,.6])sphere(id,[x,y-.3,z],[.25,.23,.25],'#649365',1,t);}
    }else if(/Galley|dining/.test(purpose)){
      const seats=purpose==='Second dining room'?6:10,columns=seats/2,pitch=Math.min(1.1,(width-3)/columns);
      for(let i=0;i<columns;i++){const x=(i-(columns-1)/2)*pitch;assembly('dining-'+i,()=>{table(id,[x,.5,0],1.02,t);for(const z of [-.95,.95])seat(id,[0,0,0],q=>t(add([x,.75,z],rotate(q,[0,z>0?Math.PI:0,0]))));});}
      for(const x of [-width*.37,width*.37])assembly('galley-'+x,()=>{const tr=q=>t(add([x,0,-1.15],q));box(id,[0,.3,0],[1.1,1.5,.65],'#dde0d2',[0,0,0],1,tr).role='galley-unit';box(id,[0,-.48,0],[1.15,.08,.7],'#b9bba6',[0,0,0],1,tr);cylinder(id,[.25,-.4,.37],.11,.035,'#8fa7a8','z',1,tr);for(const yy of [0,.4,.8]){box(id,[0,yy,.34],[.9,.27,.04],'#9bada6',[0,0,0],1,tr);pipe(id,[-.12,yy,.39],[.12,yy,.39],.018,'#6d8585',tr);}});
    }else if(/lounge|recreation|Arts|Quiet|telepresence|Counselling|Training/.test(purpose)){
      const quiet=/Quiet|telepresence|Counselling/.test(purpose);
      for(const x of [-1.7,1.7])assembly('social-'+x,()=>{for(const xx of [-.55,0,.55])seat(id,[x+xx,.78,-.85],t,quiet?'#8a9f9e':'#6e9d96');table(id,[x,.65,.3],1.7,t);});
      if(/Training/.test(purpose))box(id,[0,-.2,-1.55],[2.7,1.4,.08],'#4c7783',[0,0,0],1,t).role='conference-display';
      else if(/Arts/.test(purpose)){box(id,[0,.8,.8],[1.4,.12,.5],'#bcc7bc',[0,0,0],1,t).role='music-keyboard';for(let k=0;k<12;k++)box(id,[-.63+k*.115,.71,.82],[.09,.04,.35],k%3?'#e1e1cf':'#526966',[0,0,0],1,t);}
      else{box(id,[0,-.1,-1.55],[2.8,1.3,.08],'#648d93',[0,0,0],1,t).role='virtual-window';for(const x of [-Math.min(2.7,width/2-.7),Math.min(2.7,width/2-.7)])machine(id,'Books and personal equipment',x,1.1,t);}
    }else if(/Exercise/.test(purpose)){
      assembly('treadmill',()=>{const tr=q=>t(add([-2.2,0,0],q));box(id,[0,1,0],[2,.2,.85],'#6f8a8d',[0,0,0],1,tr).role='treadmill';for(let j=0;j<10;j++)box(id,[-.8+j*.18,.88,0],[.04,.025,.72],'#b3b8ab',[0,0,0],1,tr);for(const z of [-.38,.38])pipe(id,[-.75,.85,z],[-.75,-.45,z],.035,'#d0d4c4',tr);box(id,[-.75,-.5,0],[.15,.3,.65],'#577c89',[0,0,0],1,tr);});
      assembly('resistive-device',()=>{const tr=q=>t(add([.5,0,0],q));box(id,[0,1.05,0],[1.4,.15,1.1],'#a6b5b0',[0,0,0],1,tr).role='resistive-exercise-device';for(const x of [-.55,.55]){pipe(id,[x,1,-.3],[x,-.9,-.3],.05,'#76a1ae',tr);cylinder(id,[x,.3,-.3],.14,.9,'#c1ac79','y',1,tr);pipe(id,[x,-.2,-.3],[x,-.5,.4],.04,'#b9c4bc',tr);}pipe(id,[-.7,-.5,.4],[.7,-.5,.4],.045,'#c6c9b7',tr);});
      assembly('cycle-ergometer',()=>{const tr=q=>t(add([2.8,0,0],q));cylinder(id,[0,.7,0],.28,.2,'#9dafa6','z',1,tr).role='cycle-ergometer';pipe(id,[0,.6,0],[-.2,-.05,0],.04,'#b4c6bd',tr);box(id,[-.2,-.1,0],[.45,.12,.35],'#67878a',[0,0,0],1,tr);for(const side of [-1,1])pipe(id,[0,.7,side*.12],[side*.23,.6,side*.28],.035,'#bdc6b9',tr);pipe(id,[.3,.8,0],[.5,-.1,0],.04,'#b4c6bd',tr);pipe(id,[.5,-.1,-.3],[.5,-.1,.3],.035,'#779b9e',tr);});
    }else if(/Hygiene|Sanitation/.test(purpose)){
      for(const x of [-1.6,1.6])assembly('hygiene-'+x,()=>{const tr=q=>t(add([x,0,0],q));cylinder(id,[0,.65,-.5],.32,.6,'#d4d9cf','y',1,tr).role='waste-management-toilet';torus(id,[0,.3,-.5],.24,.06,'#9aafa9','z',q=>tr(add([0,.3,-.5],rotate(sub(q,[0,.3,-.5]),[Math.PI/2,0,0]))));box(id,[0,.1,.85],[.9,.1,.5],'#c4cdc4',[0,0,0],1,tr);pipe(id,[.25,.05,.85],[.25,-.15,.7],.035,'#9badad',tr);for(const side of [-1,1])box(id,[side*.65,.05,0],[.04,2,2.8],'#b8c9be',[0,0,0],1,tr);});
    }else return false;
    return true;
  }
  // Fittings for one cell's function in a room frame (cruise cell, settlement ring or burn level).
  // Five-column lettering is real wall geometry, visible with labels disabled.
  const glyphs={'1':[0,66,127,64,0],'2':[98,81,73,73,70],'3':[34,65,73,73,54],'4':[24,20,18,127,16],'5':[39,69,69,69,57],'6':[62,73,73,73,50],'7':[1,113,9,5,3],'8':[54,73,73,73,54],'9':[38,73,73,73,62],A:[126,9,9,9,126],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[65,65,127,65,65],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,48,64,63],X:[99,20,8,20,99],Y:[3,4,120,4,3],Z:[97,81,73,69,67]};
  function wallSign(id,text,p,t,width=1.0){
    if(state.detail==='overview')return;
    const o=t(p),a=sub(t(add(p,[1,0,0])),o),b=sub(t(add(p,[0,1,0])),o),c=sub(t(add(p,[0,0,1])),o),hand=Math.sign(dot(cross(a,b),c))||1,tr=q=>t(add(p,[-hand*q[0],q[1],q[2]])),size=Math.min(.015,(width-.08)/(text.length*6));
    box(id,[0,0,0],[width,.18,.012],'#173b41',[0,0,0],1,tr).role='room-sign-panel';
    const v=[],f=[];
    [...text.toUpperCase()].forEach((c,k)=>(glyphs[c]??[]).forEach((bits,x)=>{for(let y=0;y<7;y++)if(bits&(1<<y)){const first=y;while(y<6&&(bits&(1<<(y+1))))y++;const xx=(k*6+x-text.length*3)*size,yy=(first-3)*size,h=(y-first+.85)*size,b=v.length;v.push([xx,yy,.009],[xx+size*.85,yy,.009],[xx+size*.85,yy+h,.009],[xx,yy+h,.009]);f.push([b,b+1,b+2,b+3]);}}));
    const letters=mesh(id,v,f,'#edf2cf',1,tr);letters.role='room-sign';letters.text=text;
  }
  function furnishCell(room,purpose,arcWidth,t){
    if(/Airlock/i.test(purpose))return;
    const inset=Math.min(1,Math.max(.25,(arcWidth-1.4)/7));
    const fit=t;t=q=>fit([q[0]*inset,q[1],q[2]*.65]);
    if(/Medical and/.test(purpose)){
      for(let side of [-1,1]){box(room,[side*1.5,.8,0],[2.2,.5,1],'#d7d8c5',[0,0,0],1,t);box(room,[side*1.5,.45,-.25],[.5,.08,.6],'#b6d5cf',[0,0,0],1,t);box(room,[side*2.7,0,-.8],[.25,.6,.8],'#739eaa',[0,0,0],1,t);}
    }else if(!communal(room,purpose,arcWidth,t)){
      const count=Math.max(1,Math.min(5,Math.floor(arcWidth/1.6)));
      for(let j=0;j<count;j++)for(const side of [-1,1])machine(room,purpose,(j-(count-1)/2)*1.4,side*1.08,t);
    }
  }
  // Small local antimatter store for the touchdown heaters: a cryostat vacuum vessel around a trap coil stack, with
  // cryocooler heads, a dense shield plate toward the crew, support saddles and a feed line.
  function antimatterStore(p,s,role,transform=body){
    const t=q=>transform(add(p,mul(q,s))),k=v=>v*s;
    const vessel=cylinder('propulsion',[0,0,0],k(2),k(4),'#c8ced0','x',1,t);vessel.role=role;
    for(const x of [-2,2])sphere('propulsion',[x,0,0],[k(.9),k(2),k(2)],'#bcc4c6',1,t).role='store-end-dome';
    for(const x of [-1.5,-.75,0,.75,1.5])torus('propulsion',[x,0,0],k(2.04),k(.13),'#b37a48','x',t).role='trap-coil';
    for(const x of [-1,1]){cylinder('propulsion',[x,0,2.35],k(.32),k(.9),'#8e9ea2','z',1,t).role='cryocooler';box('propulsion',[x,0,2.9],[k(.7),k(.7),k(.3)],'#6f8085',[0,0,0],1,t);}
    box('propulsion',[-3.05,0,0],[k(.35),k(4.2),k(4.2)],'#5d6466',[0,0,0],1,t).role='gamma-shield-plate';
    for(const x of [-1.3,1.3])box('propulsion',[x,0,-2.15],[k(.5),k(3.2),k(.4)],'#8d9a97',[0,0,0],1,t).role='store-saddle';
    pipe('propulsion',[2.9,0,0],[4.2,0,0],k(.12),'#b5c9c6',t).role='antimatter-feed';box('propulsion',[0,2.1,.6],[k(1.2),k(.3),k(.8)],'#9aa5a0',[0,0,0],1,t).role='trap-electronics';
  }
  // Exploration package (exploration_manifest.json): shared antimatter scout carrier, four CubeSat-class daughter probes,
  // three microlanders, two robotic micro-rovers and shared deployment/relay hardware, held in an open carrier frame.
  function microRover(p,transform){
    const t=q=>transform(add(p,q));
    box('exploration',[0,0,.17],[.62,.4,.16],'#c9c2a8',[0,0,0],1,t).role='micro-rover';box('exploration',[0,0,.27],[.58,.36,.02],'#2f4a63',[0,0,0],1,t).role='micro-rover-solar';
    for(const x of [-.24,0,.24])for(const y of [-.25,.25])cylinder('exploration',[x,y,.09],.09,.06,'#3e4648','y',1,t);
    pipe('exploration',[.2,0,.25],[.2,0,.55],.015,'#9aa5a0',t);box('exploration',[.2,0,.58],[.08,.12,.06],'#5b6467',[0,0,0],1,t);
  }
  function scoutBay(p,transform){
    const t=q=>transform(add(p,q));
    const mount=(a,b)=>{b=[b[0],b[1]*1.25,b[2]*1.25];pipe('exploration',a,b,.075,'#9fb0ad',t).role='scout-frame-mount';box('exploration',b,[.28,.28,.28],'#bdc8bb',[0,0,0],1,t).role='scout-mount-clamp';};
    for(const side of [-1,1])mount([0,side*.35,1.4],[0,side*2,2]);
    for(let i=0;i<4;i++)mount([-1.8+i*1.2,1.6,-1.9],[-1.8+i*1.2,2,-2]);
    for(let i=0;i<3;i++)mount([-1.5+i*1.5,-1.3,-1.7],[-1.5+i*1.5,-2,-2]);
    for(const x of [-1.2,1.2])mount([x,-1.2,.55],[x,-2,2]);
    mount([1.8,1.4,1.6],[1.8,2,2]);
    // Antimatter scout carrier (150 kg): bus, micro-containment sphere, magnetic nozzle, radiator fins, high-gain dish.
    {const c=q=>t(add([0,0,1.4],q));box('exploration',[0,0,0],[1,.8,.8],'#c9c2a8',[0,0,0],1,c).role='scout-carrier';sphere('exploration',[-.62,0,0],[.3,.3,.3],'#b8c0c3',1,c).role='scout-containment';
     cylinder('exploration',[.85,0,0],.15,.6,'#8f9c9a','x',1,c,.45).role='scout-nozzle';torus('exploration',[.95,0,0],.42,.04,'#b37a48','x',c);for(const y of [-.62,.62])box('exploration',[0,y,0],[.8,.03,.6],'#354c53',[0,0,0],1,c).role='scout-radiator';
     cylinder('exploration',[0,0,.55],.45,.05,'#d6d8cc','z',1,c).role='scout-dish';pipe('exploration',[0,0,.4],[0,0,.75],.02,'#9aa5a0',c);}
    // Four CubeSat-class daughter probes (8 kg) in spring dispensers.
    for(let i=0;i<4;i++){const c=q=>t(add([-1.8+i*1.2,1.6,-1.9],q));box('exploration',[0,0,0],[.42,.3,.3],'#7f8d8e',[0,0,0],1,c).role='cubesat-dispenser';box('exploration',[.02,0,0],[.34,.22,.11],'#d2c9a6',[0,0,0],1,c).role='cubesat-probe';}
    // Three microlanders (25 kg): six-sided body, three legs, small engine, solar top.
    for(let i=0;i<3;i++){const c=q=>t(add([-1.5+i*1.5,-1.3,-2.2],q));cylinder('exploration',[0,0,.5],.34,.32,'#b8b39a','z',1,c).role='microlander';box('exploration',[0,0,.68],[.55,.55,.03],'#2f4a63',[0,0,0],1,c);
     cylinder('exploration',[0,0,.27],.07,.16,'#6d7779','z',1,c,.14);for(let k=0;k<3;k++){const a=k*2*Math.PI/3;pipe('exploration',[.25*Math.cos(a),.25*Math.sin(a),.4],[.48*Math.cos(a),.48*Math.sin(a),0],.02,'#c7c9bd',c).role='microlander-leg';}}
    // Two robotic micro-rovers (15 kg) on their release cradles.
    for(const x of [-1.2,1.2]){microRover([x,-1.2,.6],t);box('exploration',[x,-1.2,.55],[.8,.6,.06],'#8d9a97',[0,0,0],1,t).role='rover-cradle';}
    // Shared deployment, relay and support hardware.
    box('exploration',[1.8,1.4,1.6],[.6,.5,.5],'#9aa5a0',[0,0,0],1,t).role='relay-transceiver';cylinder('exploration',[1.8,1.4,2.05],.25,.04,'#d6d8cc','z',1,t);
  }
  function cargoModule(p,transform,vented=false,surfaceDock=false){
    if(vented){const t=q=>transform(add(p,q));box('cargo',[0,-3.25,0],[10.4,.15,6.4],'#8f9f9b',[0,0,0],1,t).role='cargo-container';for(const x of [-5.2,5.2])for(const y of [-3.2,3.2])pipe('cargo',[x,y,-3.2],[x,y,3.2],.1,'#a8b9b0',t);for(const x of [-5.2,5.2])for(const z of [-3.2,3.2])pipe('cargo',[x,-3.2,z],[x,3.2,z],.1,'#a8b9b0',t);for(const y of [-3.2,3.2])for(const z of [-3.2,3.2])pipe('cargo',[-5.2,y,z],[5.2,y,z],.1,'#a8b9b0',t);for(const x of [-3.5,-1.2,1.2,3.5])for(const z of [-1.6,1.6])box('cargo',[x,-.5,z],[1.9,5,2.8],'#a3ada0',[0,0,0],1,t).role='unpressurised-cargo';return;}
    // Logistics carrier: ribbed cylindrical pressure hull with end domes, berthing ring and hatch, MMOD panel stringers,
    // trunnion pins into the carrying frame, a grapple fixture and EVA handrails.
    const t=q=>transform(add(p,q)),skin=state.cutaway?.12:1;
    const hull=surfaceDock
      ? tube('cargo',[-5.2,0,0],[1,0,0],[0,1,0],[0,0,1],3.6,[0,4.15,6.25,10.4],48,'#b9bcad',t,
        ([x,y,z])=>Math.abs(x)<1.05&&Math.abs(z)>2.5&&y>-2.25&&y<.05)
      : cylinder('cargo',[0,0,0],3.6,10.4,'#b9bcad','x',skin,t);
    hull.role='cargo-container';hull.opacity=skin;
    if(!surfaceDock)hull.faces?.splice(-2);
    for(const x of [-5.2,5.2])sphere('cargo',[x,0,0],[.9,3.6,3.6],'#adb1a2',skin,t).role='cargo-end-dome';
    for(let x=-4.5;x<=4.6;x+=1.5)torus('cargo',[x,0,0],3.63,.07,'#8f9586','x',t).role='cargo-rib';
    for(let k=0;k<8;k++){const a=k*Math.PI/4;pipe('cargo',[-5.2,3.64*Math.cos(a),3.64*Math.sin(a)],[5.2,3.64*Math.cos(a),3.64*Math.sin(a)],.04,'#9ca192',t);}
    torus('cargo',[6.05,0,0],1.1,.16,'#8a9391','x',t).role='berthing-ring';cylinder('cargo',[6.1,0,0],.9,.12,'#6f7d7f','x',1,t).role='cargo-hatch';
    for(const x of [-3,3])for(const y of [-1,1])cylinder('cargo',[x,y*3.85,0],.22,.6,'#c7c9bd','y',1,t).role='trunnion-pin';
    box('cargo',[0,0,3.78],[.6,.6,.3],'#59666a',[0,0,0],1,t).role='grapple-fixture';cylinder('cargo',[0,0,4.05],.08,.4,'#c7c9bd','z',1,t);
    for(const y of [-.7,.7]){pipe('cargo',[-4,y,3.85],[4,y,3.85],.03,'#d4b77a',t).role='eva-handrail';for(const x of [-4,0,4])pipe('cargo',[x,y,3.6],[x,y,3.85],.025,'#d4b77a',t);}
    if(surfaceDock){
      for(const side of [-1,1]){
        for(const x of [-1.08,1.08])box('cargo',[x,-1.10,side*3.36],[.14,2.3,.72],'#8e9c95',[0,0,0],1,t).role='hull-boundary';
        box('cargo',[0,.05,side*3.43],[2.3,.12,.72],'#8e9c95',[0,0,0],1,t).role='hull-boundary';
      }
      box('cargo',[0,-2.31,0],[9,.12,6.5],'#a7b2aa',[0,0,0],1,t).role='cargo-floor';
    }
    for(const x of [-2.5,2.5])box('cargo',[x,-3.62,-1.2],[1.6,.04,1],'#d8d5c0',[0,0,0],1,t).role='cargo-manifest-plate';
    if(state.cutaway){
      for(const x of [-3,0,3]){const tr=q=>t(add([x,-1.6,0],q));machine('cargo','Clean workshop',0,0,tr);for(const z of [-1.8,1.8])machine('cargo','Precision tools',0,z,tr);}
      for(const x of [-4,0,4])for(const z of [-1.6,1.6]){cylinder('cargo',[x,1.4,z],.6,2.2,'#9aaeb1','y',1,t);for(const y of [.5,2.3])cylinder('cargo',[x,y,z],.64,.09,'#c5b594','y',1,t);}
    }
  }
  // Half-cylinder on the ground along local z (length) with semicircular end walls.
  function vault(id,length,radius,color,opacity,transform,n=18,caps=[1,1]){const v=[],f=[];for(let i=0;i<=n;i++){const a=Math.PI*i/n;for(const s of [-length/2,length/2])v.push([radius*Math.cos(a),radius*Math.sin(a),s]);}for(let i=0;i<n;i++)f.push([2*i,2*i+1,2*i+3,2*i+2]);for(const k of [0,1])if(caps[k])f.push(Array.from({length:n+1},(_,i)=>2*i+k));return mesh(id,v,f,color,opacity,transform);}
  function farmBay(p,transform,bayIndex,hall=false){
    const farm=data.settlement.cruise_agriculture,t=q=>transform(add(p,q));
    if(!hall){const shell=sphere('farm',[0,0,0],farm.bay_semi_axes_m,COLORS.farm,state.cutaway?.14:1,t);shell.role='farm-pressure-envelope';shell.farmBay=bayIndex;shell.builtLocally=surface;}
    const length=farm.tray_length_m,width=farm.tray_width_m*(hall?.5:1);
    for(let tier=0;tier<farm.tiers;tier++){
      const y=(tier-(farm.tiers-1)/2)*farm.tier_pitch_m;
      const tray=box('farm',[0,y,0],[length,.12,width],'#879e7b',[0,0,0],1,t);tray.role='crop-tray';tray.cropAreaM2=length*width;tray.farmBay=bayIndex;
      for(const z of [-width/4,width/4]){
        box('farm',[0,y+.1,z],[length-.1,.13,width/2-.1],'#766d4f',[0,0,0],1,t);
        pipe('farm',[-length/2,y+.2,z+width/4],[length/2,y+.2,z+width/4],.035,'#93b5ae',t);
        box('farm',[0,y+.95,z],[length-.1,.06,.18],'#d9e5c2',[0,0,0],1,t);
        for(let j=0;j<7;j++){const x=-length/2+.7+j*(length-1.4)/6;mesh('farm',[[x-.45,y+.2,z],[x,y+.7,z],[x+.45,y+.2,z],[x,y+.3,z-.45],[x,y+.75,z],[x,y+.3,z+.45]],[[0,1,2],[3,4,5]],tier%2?'#84a873':'#649365',1,t);}
      }
    }
    for(const x of [-length/2+.1,0,length/2-.1])for(const z of [-width/2+.1,width/2-.1])pipe('farm',[x,-2,z],[x,2,z],.055,'#b6c4b1',t);
    for(const x of [-6.8,6.8]){cylinder('farm',[x,-.5,0],.3,2.6,'#91aaa4','y',1,t);pipe('farm',[x,-1.5,0],[x,2,0],.05,'#b8b08d',t);}
  }
  const L=data.layout,GEO=data.design.geometry,HAB=data.design.habitat,crewModules=[];
  const SPIN_RATE=Math.sqrt(L.spin_gravity_g*9.80665/L.cabin_floor_radius_m);
  // Cruise and burn use the flight layout; the settlement lays the discs flat on the surface.
  const C=ship,DISC_X=C?(crewShip&&flight.phase==='entry'?[0,data.final_model_inputs.landing.crew_aeroshell_diameter_m/Math.SQRT2+6]:L.disc_centres_x_m):L.surface_disc_centres_x_m,DISC_Z=C?L.disc_centres_z_m:[0,0],SPINE=L.service_spine_z_offset_m_study;
  // Habitat-local point to ship coordinates (no spin). Both discs face the same way, hubs open toward the corridor (+z).
  const place=(d,q)=>[q[0]+DISC_X[d],q[1],q[2]+DISC_Z[d]];
  if(ship){
    // ---- S8 flight hardware (reports/tandem-redesign.json). Native frame: flight along x with Proxima toward -x; y is the
    // frontal width and z the frontal height (display -y). The crew discs sit edge-on in tandem (spin axes along z).
    // Every tank volume is fusion mass at liquid storage density (no ullage, insulation or walls: optimistic).
    const S8=data.selected_specification,IN=data.final_model_inputs,LD=IN.landing,P7=S8.ships[cargoShip?'cargo':'crew'],PR=P7.propulsion,ST=S8.inputs.storage;
    const E=S8.envelope,SH=S8.shell,FR=S8.frontal,M=S8.inputs.forward_shield.margin_beyond_envelope_m;
    const ax=(r,a,x,zc=0)=>[x,r*Math.cos(a),zc+r*Math.sin(a)],quad=k=>Math.PI/4+k*Math.PI/2;
    const slab=(id,q,thick,color,transform=body,opacity=1)=>{const n=mul(norm(cross(sub(q[1],q[0]),sub(q[3],q[0]))),thick/2);return mesh(id,[...q.map(p=>sub(p,n)),...q.map(p=>add(p,n))],boxF,color,opacity,transform);};
    // Radiator panel with heat pipes across it, root and tip manifolds and a frame; hot fins glow (unlit) while burning.
    const radiator=(id,q,thick,color,t=body,hot=false)=>{const m=slab(id,q,thick,color,t);m.role=hot?'hot-radiator-fin':'service-radiator';if(hot&&color!=='#5f4138')m.material=-1;
      const n=Math.max(3,Math.round(Math.hypot(...sub(q[1],q[0]))/(hot?1.4:.5)));
      for(let i=0;i<=n;i++){const a=add(q[0],mul(sub(q[1],q[0]),i/n)),b=add(q[3],mul(sub(q[2],q[3]),i/n));pipe(id,a,b,hot?.13:.06,hot?'#8c3c22':'#b8c9cc',t).role='radiator-heat-pipe';}
      for(const [a,b] of [[q[0],q[1]],[q[3],q[2]],[q[0],q[3]],[q[1],q[2]]])pipe(id,a,b,hot?.2:.08,hot?'#6e6a62':'#8aa1a7',t).role='radiator-manifold';
      return m;};
    const phase=flight.phase,ORB=[0,0,0],orb=p=>body(add(p,ORB)),labels=[],label=(p,text,t=body)=>labels.push({p:t(p),text});
    const tag=(m,s,role)=>{if(m.vertices){m.role=role;m.stage={phase:s.phase?'braking':'acceleration',index:s.index,fusion_t:s.fusion_t,antimatter_t:s.antimatter_t,ordinary_annihilation_t:s.antimatter_t,tank_and_separation_t:s.tank_and_separation_t};}return m;};
    const attached=new Set(PR.segments.slice(flight.dropped).map(s=>`${s.phase}-${s.index}`)),has=s=>attached.has(`${s.phase}-${s.index}`),seg=(p,i)=>PR.segments.find(s=>s.phase===p&&s.index===i);
    // One staged module from the report's tank layout: a grid of domed cylindrical tanks (deuterium, then helium-3) in
    // multilayer insulation, with insulation bands, a feed manifold, corner longerons and end frames. Tank volumes equal
    // the liquid volumes exactly. frame: {W,H,zc} rectangular (crew) or {R} round (cargo). Returns the module length.
    const tankModule=(x,s,mod,frame)=>{const k=mod.tanks,ny=k.tanks_y,nz=k.tanks_z,cells=[];
      for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++)cells.push(frame.R?[0,0]:[(iy+.5)*frame.W/ny-frame.W/2,frame.zc+(iz+.5)*frame.H/nz-frame.H/2]);
      let x0=x;for(const [name,color,band,role] of [['deuterium','#c5d3da','#8fa6b1','deuterium-module'],['helium3','#dcc78f','#a98f55','helium3-module']]){const tk=k[name],r=tk.radius_m,c=tk.cylinder_m;
        for(const [y,z] of cells){
          if(c>0){const m=cylinder('tanks',[x0+r+c/2,y,z],r,c,color,'x');m.faces?.splice(-2);tag(m,s,role).volumeM3=Math.PI*r*r*c+4/3*Math.PI*r**3;
            for(const xe of [x0+r,x0+r+c])tag(smooth(sphere('tanks',[xe,y,z],[r,r,r],color)),s,role+'-dome');
            for(const f of [0,.5,1])tag(torus('tanks',[x0+r+c*f,y,z],r+.03,.05,band,'x'),s,'insulation-band');}
          else tag(smooth(sphere('tanks',[x0+r,y,z],[r,r,r],color)),s,role).volumeM3=4/3*Math.PI*r**3;}
        x0+=tk.length_m+.6;}
      const len=mod.length_m,y0=frame.R?-frame.R:-frame.W/2,y1=-y0,z0=frame.R?-frame.R:frame.zc-frame.H/2,z1=frame.R?frame.R:frame.zc+frame.H/2,zm=(z0+z1)/2;
      if(frame.R){for(const xe of [x+.1,x+len-.9])tag(torus('tanks',[xe,0,0],frame.R-.04,.08,'#7d8b8c','x'),s,'stage-separation-frame');
        for(let j=0;j<4;j++){const a=quad(j);tag(pipe('tanks',ax(frame.R-.04,a,x+.1),ax(frame.R-.04,a,x+len-.9),.06,'#7d8b8c'),s,'module-longeron');}}
      else{for(const xe of [x+.1,x+len-.9])for(const [a,b] of [[[y0,z0],[y1,z0]],[[y1,z0],[y1,z1]],[[y1,z1],[y0,z1]],[[y0,z1],[y0,z0]]])tag(pipe('tanks',[xe,...a],[xe,...b],.12,'#7d8b8c'),s,'stage-separation-frame');
        for(const [y,z] of [[y0,z0],[y1,z0],[y1,z1],[y0,z1]])tag(pipe('tanks',[x+.1,y,z],[x+len-.9,y,z],.08,'#7d8b8c'),s,'module-longeron');}
      // Feed manifold between the tank rows, toward the engine end.
      for(const [dy,color,role] of [[.3,'#9fc0d2','deuterium-feed'],[-.3,'#d8c79c','helium3-feed']])tag(pipe('tanks',[x+.1,dy,zm],[x+len-.9,dy,zm],.06,color),s,role);
      return len;};

    // ---- Crew: fuel-walled habitat discs, food trains, forward bay and shield, aft containment and landing bays, tank stack.
    let xFront,xRear,xShield,xStack,xEndStack,xTail,W,H,ZC,R;
    const centre=cargoShip?0:(DISC_X[0]+DISC_X[1])/2;
    if(!cargoShip){
      const LY=S8.layout;ZC=LY.z_centre_m;const zt=LY.top_m,RD=E.radius_m,DH=E.depth_m/2,T=SH.thickness_m;
      W=S8.frame.width_m;H=S8.frame.height_m;xFront=DISC_X[0]-(RD+T);xRear=DISC_X[1]+RD+T;
      // Fuel walls: each disc's rim and both faces are tank layers built around its pressure hull, turning with it (mesh id
      // habA/habB). The last-consumed module is innermost, so each braking stage empties the outermost layer first. Holes:
      // the corridor bearing through the top walls, and the service hub that bulges 0.5 m below the inner bottom wall.
      // They read as the habitat's own thick wall: a liner bonds them to the pressure hull, an outer skin with stiffeners
      // closes them, and in cutaway the wall facing the viewer is left out so the fuel layers show in section.
      const op=1,n=state.detail==='overview'?24:state.detail==='high'?96:48;
      let outer=0;
      for(const [d,cx] of DISC_X.entries()){const id=d?'habB':'habA',at=dz=>q=>body([q[0]+cx,q[1],q[2]+dz]);
        for(const L7 of SH.layers){const s=seg(1,L7.index);if(!has(s))continue;outer=Math.max(outer,L7.outer_offset_m);
          for(const [a,b,color,role] of [[L7.inner_offset_m,L7.deuterium_outer_offset_m,'#9fc0d2','shell-deuterium'],[L7.deuterium_outer_offset_m,L7.outer_offset_m,'#d8c79c','shell-helium3']]){
            tag(sector(id,RD+a,RD+b,0,2*Math.PI,E.depth_m+2*a,color,op,at(0),n),s,role);
            tag(sector(id,1.7,RD+b,0,2*Math.PI,b-a,color,op,at(DH+(a+b)/2),n),s,role);
            if(!state.cutaway)tag(sector(id,a<.5?3.45:0,RD+b,0,2*Math.PI,b-a,color,op,at(-DH-(a+b)/2),n),s,role);
          }}
        // Liner between the pressure hull and the first fuel layer, and the outer skin over the last attached layer.
        if(outer>0){sector(id,9.27,RD,0,2*Math.PI,E.depth_m,'#a9b8b0',1,at(0),n).role='fuel-wall-liner';
          sector(id,RD+outer,RD+outer+.06,0,2*Math.PI,E.depth_m+2*outer,'#b8c4b8',1,at(0),n).role='fuel-wall-skin';
          sector(id,1.7,RD+outer+.06,0,2*Math.PI,.06,'#b8c4b8',1,at(DH+outer+.03),n).role='fuel-wall-skin';
          if(!state.cutaway)sector(id,3.45,RD+outer+.06,0,2*Math.PI,.06,'#b8c4b8',1,at(-DH-outer-.03),n).role='fuel-wall-skin';}
        // Tank structure on the outermost attached layer: radial bulkheads (slosh baffles while spinning) and rim stiffeners.
        if(outer>0){const r1=RD+outer+.06,z1=DH+outer+.06;
          for(let k=0;k<12;k++){const a=k*Math.PI/6,c=Math.cos(a),sn=Math.sin(a);
            pipe(id,[cx+1.8*c,1.8*sn,z1+.04],[cx+r1*c,r1*sn,z1+.04],.07,'#b9b39a').role='fuel-wall-bulkhead';
            pipe(id,[cx+(r1+.04)*c,(r1+.04)*sn,-z1],[cx+(r1+.04)*c,(r1+.04)*sn,z1],.07,'#b9b39a').role='fuel-wall-bulkhead';}
          for(const z of [-z1+.3,0,z1-.3])torus(id,[cx,0,z],r1+.05,.06,'#b9b39a','z').role='fuel-wall-stiffener';}
      }
      // Despun gap between the discs: two food-production trains (axes across the ship) and the 8 t working water. For entry
      // each disc lands separately, so one train and half the water ride on top of each disc inside its heat shield's wake.
      const landing=phase==='entry';
      for(const [train,p0] of L.food_factory_modules_study.cruise_centres_m.entries()){
        const p=landing?[DISC_X[train],0,-DH-1.9]:p0;
        const t=q=>body(add(p,rotate(q,[0,0,Math.PI/2]))),hull=cylinder('farm',[0,0,0],1.5,6,COLORS.farm,'x',state.cutaway?.12:1,t);hull.role='food-factory-hull';hull.trainIndex=train;hull.faces.splice(-2);
        const half=pressureCaps('farm',[0,0,0],1.5,3,.35,COLORS.farm,state.cutaway?.12:1,t),side=Math.sign(p0[1]);
        if(!landing)crewModules.push({id:`food-factory-${train+1}`,select:'farm',name:`Food factory ${train+1}`,centre:p,r:1.5,y0:p[1]-half,y1:p[1]+half,side});
        for(const x of [-2,2])pipe('farm',[x,0,landing?1.45:1.45],[x,0,landing?1.9:zt-p[2]-.05],.08,'#9aaea4',t).role='food-factory-mount';
        for(const x of [-3,0,3])torus('farm',[x,0,0],1.51,.05,'#afc3b2','x',t);
        if(state.cutaway){for(const x of [-1.9,-.6,.7]){cylinder('farm',[x,0,-1],.3,1.2,'#b9c8bc','y',1,t).role='food-bioreactor';for(const y of [-.55,.55])torus('farm',[x,y,-1],.31,.035,'#8da9a1','z',t);pipe('farm',[x,-.8,-1],[x,-.8,.65],.04,'#7ea7ad',t);}for(const y of [-.55,.55])box('farm',[2,y,.95],[.8,.6,.55],'#a6b9af',[0,0,0],1,t).role='food-processing-unit';}
        label(add(p,[0,0,2.2]),'Food factory');
      }
      const water=IN.crew_inventories.find(r=>/water/i.test(r[0]))[1],wr=Math.cbrt(3*water/2/(4*Math.PI));
      for(const [k,y] of [-8.6,8.6].entries()){const p=landing?[DISC_X[k],6,-DH-wr]:[centre,y,0],w=sphere('tanks',p,[wr,wr,wr],'#7fb2c9');w.role='working-water';w.massT=water/2;if(!landing)pipe('structure',[centre,y,wr],[centre,y,zt],.1,'#a4b2b1').role='water-mount';label(add(p,[0,0,wr+.6]),'Water tank');}
      // Braking antimatter: isolated containment bay behind the habitats; one trap per braking module, dropped with its layer.
      const xa=xRear+.8,amR=Math.max(...S8.crew_braking_antimatter.map(a=>Math.cbrt(3*a.volume_m3/(4*Math.PI))));
      S8.crew_braking_antimatter.forEach((a,k)=>{const s=seg(1,a.index);if(!has(s))return;const r=Math.cbrt(3*a.volume_m3/(4*Math.PI)),p=[xa+amR,(k%4-1.5)*(W/4),ZC+(k<4?-1:1)*H/4];
        tag(sphere('tanks',p,[r,r,r],'#c9b06e'),s,'antimatter-containment');for(const dx of [-.5,.5])tag(torus('tanks',add(p,[dx*r,0,0]),r*Math.sqrt(1-dx*dx)+.06,.08,'#b37a48','x'),s,'containment-coil');});
      if(S8.crew_braking_antimatter.some(a=>has(seg(1,a.index))))label([xa+amR,0,ZC+H/2+1],'Antimatter containment');
      const xl0=xa+2*amR+.8,LB=12,xl1=xl0+LB,xm=(xl0+xl1)/2,lnd=P7.ledger.landing;
      if(!landing){
        // Landing bay (lands with the habitats; split between the two disc landers at entry): cradle frame, 4 x 3 MN
        // chemical engines, propellant at liquid densities, the landing service reactor, and the two folded aeroshells.
        for(const x of [xl0,xl1])for(const [a,b] of [[[-W/2,ZC-H/2],[W/2,ZC-H/2]],[[W/2,ZC-H/2],[W/2,ZC+H/2]],[[W/2,ZC+H/2],[-W/2,ZC+H/2]],[[-W/2,ZC+H/2],[-W/2,ZC-H/2]]])pipe('structure',[x,a[0],a[1]],[x,b[0],b[1]],.18,'#9aa8a0').role='landing-cradle';
        for(const y of [-W/2,W/2])for(const z of [ZC-H/2,ZC+H/2])pipe('structure',[xl0,y,z],[xl1,y,z],.16,'#a4b2b1').role='landing-cradle';
        for(let k=0;k<LD.crew_engines;k++){const p=[xl1-2.6,(k%2?1:-1)*W/4,ZC+(k<2?-1:1)*H/4];cylinder('structure',p,.6,1.4,'#718582','x').role='landing-engine';cylinder('structure',add(p,[1.9,0,0]),.45,2.4,'#a89372','x',1,body,1.3).role='landing-engine-bell';}
        for(const [mass,rho,color,role,ys] of [[lnd.oxygen_t,1.141,'#c7d3d6','landing-oxygen',[-W/2+3,W/2-3]],[lnd.hydrogen_t,.0708,'#e3e7e4','landing-hydrogen',[-W/6,W/6]]]){
          const r=Math.cbrt(3*mass/ys.length/rho/(4*Math.PI));for(const y of ys){const tk=sphere('structure',[xl0+3.2,y,ZC],[r,r,r],color);tk.role=role;tk.massT=mass/ys.length;tk.densityTm3=rho;}}
        cylinder('power',[xm,0,ZC+H/2-2],1,3,'#d5ad68','x').role='habitat-service-reactor';
        if(state.showRadiators!==false)for(const s of [-1,1])radiator('radiators',[[xm-1.5,s*1.4,ZC+H/2-1],[xm+1.5,s*1.4,ZC+H/2-1],[xm+1.5,s*5.4,ZC+H/2-1],[xm-1.5,s*5.4,ZC+H/2-1]],.08,'#4e666d');
        for(let k=0;k<12;k++){const y=-W/2+.5+(k%6)*(W-1)/5,z=k<6?ZC-H/2+.4:ZC+H/2-.4;box('structure',[xm,y,z],[LB-1.5,.9,.35],'#c9a27a').role='stowed-aeroshell';}
        for(const [a,b] of [[[-W/2,ZC-H/2],[W/2,ZC-H/2]],[[W/2,ZC+H/2],[-W/2,ZC+H/2]]])pipe('structure',[xl1+.3,a[0],a[1]],[xl1+.3,b[0],b[1]],.14,'#d0b07d').role='arrival-separation';
        label([xm,0,ZC+H/2+3],'Landing bay');
      }else{
        // Two disc landers. Each disc descends belly-first on its own inflatable heat shield (HIAD): a 70 degree
        // sphere-cone of stacked, touching inflated tori under a flexible TPS skin, with a rigid nose and a short adapter to
        // the disc; the 50 m allocation is split into two shields of equal total area. The display turns the ship so that
        // native +z points down: the shield is on the +z side, facing the flow, and the payload rides above it in its wake
        // (the food train, water, landing propellant and, on disc A, the service reactor on the upper face). Two landing
        // engines and four legs per disc stay folded between the disc and the shield until the shield is released.
        const D=LD.crew_aeroshell_diameter_m/Math.SQRT2,Rr=D/2,nose=2.6,half=20*Math.PI/180;
        for(const [d,cx] of DISC_X.entries()){const zr=DH+.45,deep=(Rr-nose)*Math.tan(half),slant=(Rr-nose)/Math.cos(half),nT=9,rho=slant/nT/2;
          // Tori from the rim (largest, nearest the disc) to the nose, each touching the next; the disc rests on them.
          for(let k=0;k<nT;k++){const f=(k+.5)/nT,r=Rr-(Rr-nose)*f,z=zr+deep*f;torus('structure',[cx,0,z],r,rho,'#c79a69','z').role='aeroshell-ring';}
          // Offset the flight surface along the cone normal so the support tori stay beneath it.
          const standOff=rho+.25,dr=standOff*Math.sin(half),dz=standOff*Math.cos(half);
          const tipZ=zr+dz+deep,tipR=nose+dr;
          const skin=cylinder('structure',[cx,0,zr+dz+deep/2],Rr+dr,deep,'#9b7349','z',1,body,tipR);
          const [,lip]=skin.faces.splice(-2),cap=[...lip.map(i=>skin.vertices[i]),[cx,0,tipZ+1]];
          skin.role='deployed-aeroshell';skin.diameterM=D;
          mesh('structure',cap,lip.map((_,i)=>[i,(i+1)%lip.length,lip.length]),'#876140').role='aeroshell-nose';
          // Cradle: radial ribs from the disc's lower rim down onto the shield rings, plus a separation ring at the rim.
          torus('structure',[cx,0,DH+.1],RD-.3,.14,'#d0b07d','z').role='arrival-separation';
          for(let k=0;k<12;k++){const a2=k*Math.PI/6,c=Math.cos(a2),sn=Math.sin(a2),r1=RD-.3;pipe('structure',[cx+r1*c,r1*sn,DH+.1],[cx+(RD+1.5)*c,(RD+1.5)*sn,zr+deep*(1-(RD+1.5-nose)/(Rr-nose))-rho*.8],.12,'#9aa8a0').role='landing-cradle';}
          // Landing engines in pods on the rim, nozzles down (+z), and folded legs; both clear of the shield until release.
          for(let k=0;k<LD.crew_engines/2;k++){const a2=k*Math.PI+Math.PI/2,p=[cx+(RD+.9)*Math.cos(a2),(RD+.9)*Math.sin(a2),DH-1];
            box('structure',p,[1.6,1.6,2],'#8d9a97').role='landing-engine-pod';pipe('structure',add(p,[-(RD+.9)*Math.cos(a2)*.08,-(RD+.9)*Math.sin(a2)*.08,0]),[cx+(RD-.2)*Math.cos(a2),(RD-.2)*Math.sin(a2),DH-1],.25,'#9aa8a0').role='engine-mount';
            cylinder('structure',add(p,[0,0,1.2]),.38,1.1,'#a89372','z',1,body,.75).role='landing-engine-bell';cylinder('structure',add(p,[0,0,.4]),.45,.5,'#718582','z').role='landing-engine';}
          for(let k=0;k<4;k++){const a2=Math.PI/4+k*Math.PI/2,c=Math.cos(a2),sn=Math.sin(a2);pipe('structure',[cx+(RD-.2)*c,(RD-.2)*sn,-DH+.4],[cx+(RD+.5)*c,(RD+.5)*sn,DH-.2],.16,'#8d9a97').role='landing-leg';box('structure',[cx+(RD+.5)*c,(RD+.5)*sn,DH-.1],[.8,.8,.15],'#8d9a97').role='landing-foot';}
          for(const [mass,rho2,color,role,off] of [[lnd.oxygen_t/2,1.141,'#c7d3d6','landing-oxygen',-4],[lnd.hydrogen_t/2,.0708,'#e3e7e4','landing-hydrogen',4]]){const r=Math.cbrt(3*mass/rho2/(4*Math.PI)),tk=sphere('structure',[cx+off,-5,-DH-r],[r,r,r],color);tk.role=role;tk.massT=mass;tk.densityTm3=rho2;
            for(const dx of [-.6*r,.6*r])pipe('structure',[cx+off+dx,-5,-DH-r*.3],[cx+off+dx,-5,-DH],.08,'#9aa8a0').role='tank-mount';}
          for(const a2 of [0,2.1,4.2]){const p=[cx+6.5*Math.cos(a2),6.5*Math.sin(a2),-DH-.55];cylinder('structure',p,.55,1.1,'#d8d2c0','z').role='parachute-pack';}
          label([cx,0,zr+deep+3],'Heat shield');label([cx+RD+2,0,DH+1],'Landing engine');label([cx+6.5,0,-DH-2],'Parachutes');
        }
        cylinder('power',[DISC_X[0]-5,5,-DH-1.5],1,3,'#d5ad68','z').role='habitat-service-reactor';
        for(const dz of [-.1,-.4])pipe('structure',[DISC_X[0]-5,5,-DH-dz-.05],[DISC_X[0]-5,5,-DH],.15,'#9aa8a0').role='reactor-mount';
      }
      // Acceleration modules hang between the forward shield and the habitats (the crew hangs at the bottom), first-dropped
      // at the top; as modules are released sideways between the straps, the shield and forward bay are winched down onto
      // the remaining stack. Each module feeds a trunk line that runs up the straps to the tow frame and the engine.
      const attachedMods=S8.crew_stack.filter(m=>m.phase===0&&has(seg(0,m.index)));
      xEndStack=xFront-1.5;xStack=xEndStack-attachedMods.reduce((n,m)=>n+m.length_m,0);xTail=xl1+.3;
      let x=xStack;for(const mod of attachedMods){const s=seg(0,mod.index),len=mod.length_m;tankModule(x,s,mod,{W,H,zc:ZC});
        const r=Math.max(.3,Math.cbrt(3*s.antimatter_t/ST.antihydrogen_solid_density_t_m3/(4*Math.PI)));tag(sphere('tanks',[x+len-.45,W/2-r-.2,ZC+H/2-r-.2],[r,r,r],'#c9b06e'),s,'antimatter-containment');
        x+=len;}
      if(attachedMods.length){for(const [dy,color,role] of [[.3,'#9fc0d2','deuterium-feed'],[-.3,'#d8c79c','helium3-feed']])pipe('tanks',[xStack,dy,ZC+H/2+.05],[xEndStack,dy,ZC+H/2+.05],.07,color).role=role;
        label([(xStack+xEndStack)/2,0,ZC+H/2+2],'Fuel tanks');label([(xStack+xEndStack)/2,0,ZC+H/2+1.2],'Fuel feed line');}
      // Braking feed: from the disc walls (locked while braking) along the straps to the aft tow frame.
      if(SH.layers.some(l=>has(seg(1,l.index))))for(const [dy,color,role] of [[.3,'#9fc0d2','deuterium-feed'],[-.3,'#d8c79c','helium3-feed']])pipe('tanks',[DISC_X[0],dy,zt+.05],[xTail,dy,zt+.05],.07,color).role=role;
      // Forward bay between the shield and the stack (or the habitats): orbital service unit and the GCR allowance.
      const xTop=attachedMods.length?xStack:xFront;xShield=xTop-8;const t=orb,xf=xTop-4;
      if(!landing){
      cylinder('power',[xf,0,ZC],1,3,'#d5ad68','x',1,t).role='orbital-service-reactor';
      if(state.showRadiators!==false)for(const s of [-1,1])radiator('radiators',[[xf-1.4,s*1.4,ZC],[xf+1.4,s*1.4,ZC],[xf+1.4,s*4.5,ZC],[xf-1.4,s*4.5,ZC]],.08,'#4e666d',t);
      for(let k=0;k<4;k++)box('shield',[xf,(k%2?1:-1)*W/3,ZC+(k<2?-1:1)*H/4],[2.2,2.2,2.2],'#9c9c8c',[0,0,0],1,t).role='gcr-equipment-allowance';
      label([xf,0,ZC+H/2+2],'Orbital service unit',t);
      }
      if(SH.layers.some(l=>has(seg(1,l.index))))label([centre,0,zt+3],'Radiation shielding fuel tanks');
      label([centre,0,zt+1.5],'Habitat discs');
    }else{
      // ---- Cargo: payload canisters, the rover cabin and scout bay, landing bay, then braking and acceleration modules.
      R=S8.cargo_envelope_radius_m;const RM=R-.1;ZC=0;W=2*R;H=2*R;xShield=-4;xFront=-1;
      const legacy=x0=>q=>body([q[0]+x0,q[1],q[2]-SPINE]),PAY=.25;
      const rows=[...IN.cargo_hardware.filter(r=>r[2]&&!/Landing|exploration|repair/i.test(r[0])),...IN.cargo_inventories.map(r=>[r[0],r[1],true])];
      let x=0;for(const [name,mass] of rows){const len=mass*PAY;const c=cylinder('cargo',[x+len/2,0,0],RM-.3,len,'#c4c9b4','x');c.role='payload-canister';c.ledger={name,mass_t:mass};
        for(const xx of [x+.1,x+len-.1])torus('cargo',[xx,0,0],RM-.26,.07,'#8e9a90','x').role='canister-frame';label([x+len/2,0,RM+1.2],name);x+=len+.4;}
      roverCabin([3.9,0,SPINE],legacy(x),true);label([x+4,0,RM+1.2],'Pressurised rover');x+=8.2;
      scoutBay([2.2,0,SPINE],legacy(x));label([x+2,0,RM+1.2],'Scout bay');x+=4.8;
      const xl0=x,xl1=x+11;
      for(const xx of [xl0+.3,xl1-.3])torus('structure',[xx,0,0],RM-.2,.16,'#9aa8a0','x').role='landing-cradle';
      for(let k=0;k<8;k++)pipe('structure',ax(RM-.2,k*Math.PI/4,xl0+.3),ax(RM-.2,k*Math.PI/4,xl1-.3),.12,'#a4b2b1').role='landing-cradle';
      if(phase!=='entry'){for(const y of [-R*.6,R*.6])pipe('structure',[0,y,R*.75],[xl1,y,R*.75],.14,'#9aa8a0').role='landing-cradle';
        for(let k=0;k<LD.cargo_engines;k++){const x=k>>1?xl1-2.5:xl0+2.5,y=(k%2?1:-1)*1.5,p=[x,y,R*.3];box('structure',p,[1.1,1.1,1],'#8d9a97').role='landing-engine-pod';cylinder('structure',add(p,[0,0,.75]),.3,.6,'#718582','z').role='landing-engine';cylinder('structure',add(p,[0,0,1.35]),.28,.7,'#a89372','z',1,body,.6).role='landing-engine-bell';}}
      const lnd=P7.ledger.landing;
      for(const [mass,rho,color,role,ps] of [[lnd.oxygen_t,1.141,'#c7d3d6','landing-oxygen',[[xl0+2.5,0,0]]],[lnd.hydrogen_t,.0708,'#e3e7e4','landing-hydrogen',[[xl0+6.3,0,0]]]]){
        const r=Math.min(RM-.2,Math.cbrt(3*mass/ps.length/rho/(4*Math.PI))),len=mass/ps.length/rho/(Math.PI*r*r)-4*r/3;
        for(const p of ps){const tk=len>0?cylinder('structure',p,r,len+2*r,color,'x'):sphere('structure',p,[r,r,r],color);tk.role=role;tk.massT=mass/ps.length;tk.densityTm3=rho;}}
      if(phase!=='entry')for(let k=0;k<12;k++){const a=(k+.5)*Math.PI/6,r=RM+.025;
        slab('structure',[ax(r,a-.085,xl0+.65),ax(r,a-.085,xl1-.65),ax(r,a+.085,xl1-.65),ax(r,a+.085,xl0+.65)],.12,'#c9a27a').role='stowed-aeroshell';}
      torus('structure',[xl1+.15,0,0],RM-.2,.14,'#d0b07d','x').role='arrival-separation';
      label([(xl0+xl1)/2,0,RM+2],'Landing bay');
      xRear=xl1;xStack=xl1+1;xTail=xl1+.15;x=xStack;
      for(const [p,list] of [[1,[7,6,5,4,3,2,1,0]],[0,[7,6,5,4,3,2,1,0]]])for(const i of list){const s=seg(p,i),mod=S8.cargo_stack.find(m=>m.phase===p&&m.index===i);
        if(has(s)){tankModule(x,s,mod,{R:RM});xTail=x+mod.length_m;}
        x+=mod.length_m;}
      xEndStack=x;
      if(phase!=='entry')box('structure',[xShield+2,0,0],[1.6,3.2,3.2],'#8e9ea2',[0,0,0],1,orb).role='cargo-autonomy-core';
    }
    if(phase!=='entry'){
      const t=orb;
      // ---- Tow engine. The engine pulls on tethers, so no long member is in compression. Acceleration and the first half
      // of the coast: engine ahead, tethered to a tow frame in front of the forward shield. Second half of the coast and
      // braking: re-rigged behind, tethered to the aft frame and pulling backward, so the ship's shield keeps facing the
      // incoming material. Four complete pod engines (each its own reaction chamber, field coils, pellet injectors and
      // magnetic nozzle) sit in a row across the dust shield's width so the engine fits the shield's outline: a fusion
      // plasma cannot be piped round bends to shared nozzles, so each pod expands its own exhaust, canted outward so the
      // plumes run past the ship. Each pod has an S7-size shadow shield
      // 50 m toward the ship on its line of sight to it. The Zylon tethers start at a bridle where all four shadows cover
      // the axis; between the bridle and the engine a refractory tow link carries the pull through the unshadowed near
      // field (unsized: it is radiation-heated).
      const TW=S8.inputs.tow,TS=S8.tow[cargoShip?'cargo':'crew'],ahead=flight.engineAhead,dir=ahead?-1:1,ex=-dir,s=Math.cbrt(PR.engine_with_allowance_t/121.4),sp=s/Math.cbrt(4);
      const SS=IN.source_shadow,cant=TS.nozzle_cant_deg*Math.PI/180,podY=cargoShip?TW.cargo_pod_offsets_y_m:TW.pod_offsets_y_m,exitR=cargoShip?TW.cargo_nozzle_exit_radius_m:TW.nozzle_exit_radius_m,ymax=Math.max(...podY.map(Math.abs));
      const xA=ahead?xShield:xTail,xE=xA+dir*TW.length_m,bridle=Math.ceil((ymax+1.6)/(ymax/TW.length_m+SS.radius_m/SS.distance_from_source_m)),xBr=xE+ex*bridle;
      // Tow frame, tethers to the bridle, and tension straps the length of the ship so the habitat and every module hang
      // from whichever end the engine pulls. Ship-side parts are drawn with the ship.
      const towCorners=cargoShip?[0,1,2,3].map(k=>[(R-.1)*Math.cos(quad(k)),(R-.1)*Math.sin(quad(k))]):[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[a*(W/2+.1),ZC+b*(H/2+.1)]);
      for(let k=0;k<4;k++)pipe('structure',[xA,...towCorners[k]],[xA,...towCorners[(k+1)%4]],.16,'#8f8a6a').role='tow-frame';
      for(const [y,z] of towCorners){const a=Math.atan2(z-ZC,y);pipe('structure',[xA,y,z],add([xBr,.6*Math.cos(a),ZC+.6*Math.sin(a)],ORB),.15,'#d8cfa8').role='tow-tether';
        pipe('structure',[xShield,y,z],[xTail,y,z],.08,'#b9a77a').role='tension-strap';}
      // Ring frames around each disc tie the four straps together and carry the despun corridor (and so the habitats).
      if(!cargoShip)for(const x of DISC_X)for(let k=0;k<4;k++)pipe('structure',[x,...towCorners[k]],[x,...towCorners[(k+1)%4]],.08,'#8f8a6a').role='strap-frame';
      // Feed trunk along the tether to a buffer tank behind the yoke (peak flow from the report: a few-cm cryogenic line).
      const FD=S8.fuel_feed[cargoShip?'cargo':'crew'],fr=Math.max(.05,FD.line_inner_diameter_m/2+.03);
      for(const [dy,color,role] of [[.25,'#9fc0d2','deuterium-feed'],[-.25,'#d8c79c','helium3-feed'],[0,'#d7a35f','antimatter-feed']])pipe('tanks',[xA,dy,ZC+.1],add([xE+dir*10*s,dy,ZC+.1],ORB),fr,color).role=role;
      smooth(sphere('propulsion',[xE+dir*10*s,0,ZC+2.2*s],[1.6*s,1.6*s,1.6*s],'#c5d3da',1,t)).role='feed-buffer-tank';
      // Bridle ring and the refractory link to the yoke.
      torus('propulsion',[xBr,0,ZC],.6,.12,'#8f8a6a','x',t).role='tow-bridle';pipe('propulsion',[xBr,0,ZC],[xE+dir*14*s,0,ZC],.22,'#3f3f44',t).role='refractory-tow-link';
      // Thrust yoke on the far side: a beam across the pod row with struts to each pod.
      const xy=xE+dir*14*s;pipe('propulsion',[xy,-ymax-2,ZC],[xy,ymax+2,ZC],.3*s,'#59666a',t).role='thrust-yoke';
      for(const y of podY){pipe('propulsion',[xy,y,ZC],[xE,y,ZC],.2*s,'#a7b5b1',t).role='thrust-strut';pipe('propulsion',[xy,y,ZC+1.5*s],[xE,y,ZC],.12*s,'#8a9f9d',t).role='thrust-strut';}
      for(let k=0;k<4;k++){const p=[xy,(k<2?-1:1)*(ymax+1.6),ZC+(k%2?1:-1)*.8*s];pipe('propulsion',p,[xy,p[1],ZC],.1*s,'#8a9f9d',t).role='rcs-mount';box('propulsion',p,[.8*s,.8*s,.8*s],'#8d9a97',[0,0,0],1,t).role='rcs-quad';for(const d of [-1,1])cylinder('propulsion',add(p,[d*.6*s,0,0]),.1*s,.4*s,'#5d6466','x',1,t,.22*s).role='rcs-nozzle';}
      const cs=exitR/6.2,coils=[[1,2],[3,2.8],[5.5,3.8],[8.5,5],[12,6.2]].map(([dx,r])=>[dx*cs,r*cs]);
      const hot=flight.burning;
      for(const [pi,y] of podY.entries()){const C=[xE,y,ZC],sy=Math.sign(y),cantK=(TS.pod_cants_deg?.[pi]??TS.nozzle_cant_deg)*Math.PI/180;
        // Reaction chamber with three orthogonal field coils, injectors fed from a ring manifold, and an antimatter trap.
        smooth(sphere('propulsion',C,[3*sp,3*sp,3*sp],'#718582',1,t)).role='reaction-chamber';
        for(const ax3 of ['x','y','z']){const tt=ax3==='y'?q=>t(add(rotate(sub(q,C),[0,0,Math.PI/2]),C)):t;torus('propulsion',C,3.4*sp,.3*sp,'#c2ab86',ax3==='z'?'z':'x',tt).role='field-coil';}
        const Cm=add(C,[dir*6*sp,0,0]);torus('propulsion',Cm,4*sp,.14*sp,'#9fc0d2','x',t).role='deuterium-manifold';
        for(let k=0;k<4;k++){const b=k*Math.PI/2+Math.PI/4,p0=add(Cm,[0,4*sp*Math.cos(b),4*sp*Math.sin(b)]),p1=add(C,[dir*1.5*sp,2.6*sp*Math.cos(b),2.6*sp*Math.sin(b)]);pipe('propulsion',p0,p1,.2*sp,'#a8b4b0',t).role='pellet-injector';box('propulsion',p0,[.8*sp,.8*sp,.8*sp],'#6f8085',[0,0,0],1,t).role='injector-drive';}
        box('propulsion',add(C,[dir*7*sp,0,2*sp]),[1.2*sp,1*sp,1*sp],'#c9bd94',[0,0,0],1,t).role='antimatter-trap';
        // Magnetic nozzle on the ship side, canted outward along the pod's own radial direction.
        const P0=add(C,[ex*3.2*sp,0,0]),e1=[ex*Math.cos(cantK),sy*Math.sin(cantK),0],e2=[0,0,1],e3=cross(e1,e2);
        const L=q=>t(add(P0,add(add(mul(e1,q[0]),mul(e2,q[1])),mul(e3,q[2]))));
        for(const [dx,r] of coils){torus('propulsion',[dx,0,0],r,.22*cs,'#c2ab86','x',L).role='nozzle-coil';torus('propulsion',[dx+.4*cs,0,0],r,.1*cs,'#6f8589','x',L).role='coil-heat-shield';}
        for(let j=0;j<6;j++){const b=j*Math.PI/3;let p=ax(1.2*cs,b,0);for(const [dx,r] of coils){const q=ax(r,b,dx);pipe('propulsion',p,q,.1*cs,'#a7b5b1',L).role='nozzle-strut';p=q;}}
        if(hot&&state.showBeam!==false){
          // Exhaust leaves each pod along its canted axis, fading over 40 km; the outer glow follows the sized plume-edge
          // half-angle. Segments step down in opacity so the plume dims with distance instead of ending abruptly.
          const x0=12.5*cs,edge=Math.tan(TW.plume_edge_half_angle_deg*Math.PI/180);let xa0=x0;
          for(const [len,fade] of [[600,1],[1400,.8],[3000,.6],[7000,.4],[14000,.22],[14000,.1]]){const xa1=xa0+len;
            for(const [k0,k1,color,opacity] of [[.08,.5*cs,'#ffffff',.9],[.3,3*cs,'#b9a8ff',.12],[1,6.2*cs,'#6f5cf0',.035]]){
              const r0=xa0===x0?k1:k1+k0*edge*(xa0-x0),r1=k1+k0*edge*(xa1-x0),b=cylinder('beam',[(xa0+xa1)/2,0,0],r0,len,color,'x',opacity*fade,L,r1);b.faces?.splice(-2);b.material=-1;b.role='exhaust-beam';}
            xa0=xa1;}
          const throat=sphere('beam',[0,0,0],[1.2*cs,1.2*cs,1.2*cs],'#ffffff',1,L);throat.material=-1;throat.role='exhaust-beam';}
      }
      // The single forward dust shield, always at the leading end: in front of the engine (beyond the radiators) while it
      // leads, and in front of the ship once the engine is re-rigged behind. Dust arrives along the axis, so its shadow
      // covers everything behind it, including the tethers and the ship 2 km back. Radiator fins (wider than any shield)
      // fly edge-on with leading-edge guards.
      {const xS=ahead?xy+dir*(SS.distance_from_source_m-14*s+2):xShield;
        // The 100 kg/m2 face allocation is split between two graphite-composite skins.
        // The stand-off gives dust fragments room to spread between skins.
        const arealMass=cargoShip?IN.geometry.forward_shield_areal_mass_kg_m2:S8.inputs.forward_shield.areal_mass_kg_m2;
        const solid=arealMass/1800,gap=.55,frontX=xS-solid*.3;
        const shieldSkin=(x,depth,color)=>cargoShip?cylinder('shield',[x,0,0],R,depth,color,'x',1,t)
          :box('shield',[x,0,ZC],[depth,FR.width_m,FR.height_m],color,[0,0,0],1,t);
        const face=shieldSkin(frontX,solid*.6,'#beb8a4'),rearX=xS+gap+solid*.2;
        shieldSkin(rearX,solid*.4,'#586069').role='shield-backing';
        face.role='forward-collision-shield';face.frontalAreaM2=cargoShip?Math.PI*R*R:FR.area_m2;
        face.assemblyThicknessM=gap+solid;face.arealMassKgM2=arealMass;
        if(cargoShip){
          const rim=cylinder('shield',[xS+gap/2,0,0],R,gap,'#6e7270','x',1,t);rim.faces.splice(-2);rim.role='shield-standoff-rim';
        }else{
          for(const y of [-1,1])box('shield',[xS+gap/2,y*(FR.width_m/2-.009),ZC],[gap,.018,FR.height_m],'#6e7270',[0,0,0],1,t).role='shield-standoff-rim';
          for(const z of [-1,1])box('shield',[xS+gap/2,0,ZC+z*(FR.height_m/2-.009)],[gap,FR.width_m-.036,.018],'#6e7270',[0,0,0],1,t).role='shield-standoff-rim';
        }
        const cw=cargoShip?R:FR.width_m/2,ch=cargoShip?R:FR.height_m/2,corners=cargoShip?[0,1,2,3].map(k=>[.9*R*Math.cos(quad(k)),.9*R*Math.sin(quad(k))]):[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[a*cw*.95,ZC+b*ch*.95]);
        const anchor=ahead?([y,z])=>[xS-dir*6,0,ZC]:([y,z])=>[xShield+8,y*.9,ZC+(z-ZC)*.9];
        for(const c of corners)pipe('shield',[rearX,...c],anchor(c),.12,'#9aa8a0',t).role='shield-support';
        if(!cargoShip)for(let k=0;k<4;k++)pipe('shield',[rearX+.08,...corners[k]],[rearX+.08,...corners[(k+1)%4]],.1,'#9aa8a0',t).role='shield-rim';
        // Four spikes covering the radiator fins' leading edges (the fins are wider than the ship).
        {const RS=S8.radiator_strips[cargoShip?'cargo':'crew'],w=S8.radiator_strips.crew.width_m;for(let k=0;k<4;k++){const a2=k*Math.PI/2,r0=cargoShip?R:(k%2?FR.height_m:FR.width_m)/2-.05,r1=RS.fin_reach_m;if(r1<=r0)continue;
          const m=box('shield',ax((r0+r1)/2,a2,xS,ZC),[solid,k%2?w:r1-r0,k%2?r1-r0:w],'#beb8a4',[0,0,0],1,t);m.role='shield-radiator-spike';pipe('shield',ax(r0,a2,xS+.1,ZC),ax(r1,a2,xS+.1,ZC),.06,'#9aa8a0',t).role='shield-radiator-spike-edge';}}
        label([xS,0,ZC+ch+1.5],'Forward shield',t);scene.shieldX=xS;}
      // Cryocoolers and power conditioning on the yoke; high-gain antenna.
      for(let k=0;k<4;k++){const p=[xy+dir*.8*s,(k-1.5)*1.6*s,ZC+1.4*s];pipe('propulsion',p,[xy,p[1],ZC],.08*s,'#8a9f9d',t).role='cryocooler-mount';box('propulsion',p,[1.2*s,1*s,1*s],'#8e9ea2',[0,0,0],1,t).role='cryocooler';for(const d of [-.3,0,.3])box('propulsion',add(p,[0,0,(d+.75)*s]),[1.1*s,.05*s,.5*s],'#6f8085',[0,0,0],1,t).role='cryocooler-fin';}
      for(const y of [-1,1]){box('propulsion',[xy+dir*1.2*s,y*1.8*s,ZC-1.8*s],[2*s,1.2*s,.9*s],'#7f8f8c',[0,0,0],1,t).role='power-conditioning';pipe('propulsion',[xy+dir*1.2*s,y*1.8*s,ZC-1.4*s],[xy,y*1.8*s,ZC],.1*s,'#8a9f9d',t).role='power-mount';}
      cylinder('propulsion',[xy,0,ZC+4],1.1*s,.15*s,'#d6d8cc','z',1,t,.2*s).role='high-gain-antenna';pipe('propulsion',[xy,0,ZC],[xy,0,ZC+3.9],.08*s,'#a4b2b1',t).role='high-gain-antenna';
      if(state.showRadiators!==false){
        // Main hot radiators: area from mass at 5 kg/m2 after the 10% allowance; four fins beyond the yoke on the far side,
        // edge-on to the direction of travel, with heat-pipe panels, headers and leading-edge guards; glowing while burning.
        const area=PR.hot_radiator_with_allowance_t/(1+IN.hardware_allowance)*1000/5,Lf=SS.distance_from_source_m-(15+1)*s-2,Wf=area/(4*Lf),x0=xy+dir*1.5*s,x1=x0+dir*Lf;
        // A central mast carries all four fins from the yoke to the leading shield; coolant lines run from each pod.
        pipe('radiators',[xy,0,ZC],[xy+dir*(SS.distance_from_source_m-14*s+1.8),0,ZC],.35,'#8a9f9d',t).role='radiator-mast';
        for(const y of podY)pipe('radiators',[xE+dir*1.5*sp,y,ZC+.6],[x0,0,ZC+.6],.12,'#be9470',t).role='coolant-line';
        for(let k=0;k<4;k++){const a=k*Math.PI/2,r0=.35;const fin=radiator('radiators',[ax(r0,a,x0,ZC),ax(r0,a,x1,ZC),ax(r0+Wf,a,x1,ZC),ax(r0+Wf,a,x0,ZC)],.15,hot?'#d4603a':'#5f4138',t,true);fin.areaM2=Wf*Lf;
          pipe('radiators',ax(r0,a,x0,ZC),ax(r0+Wf,a,x0,ZC),.1,'#a1aca0',t).role='radiator-edge';
          pipe('radiators',ax(r0,a,ahead?x1:x0,ZC),ax(r0+Wf,a,ahead?x1:x0,ZC),.22,'#beb8a4',t).role='radiator-leading-edge-guard';}
        label([(x0+x1)/2,0,ZC+2+Wf+1.5],'Radiators',t);
      }
      label([xE,0,ZC+6],'Main engine',t);
      label([(xA+xBr)/2,0,ZC+(cargoShip?R:H/2)+3],'Tow tethers');
      label([xBr,0,ZC+3],'Tow bridle',t);label([(xBr+xE)/2,0,ZC+2],'Refractory tow link',t);
      label([(xShield+xTail)/2,0,ZC-(cargoShip?R:H/2)-6],'Tension straps');
    }
    if(phase==='entry'&&cargoShip){
      // Cargo lander: the payload sits inside an elongated inflatable heat shield (stacked, touching elliptical tori
      // rising up the sides into a dish, under a lofted TPS skin) that faces the flow (native +z). Four landing engines
      // fire down from pods along the keel frame, between payload and shield, after the shield is released.
      const D=LD.cargo_aeroshell_diameter_m,A=xRear/2+3,B=Math.PI*D*D/4/(Math.PI*A),xc=xRear/2,nT=7,rho=.45,n=48;
      const ring=(f,z)=>Array.from({length:n},(_,i)=>{const u=i/n*2*Math.PI;return [xc+A*f*Math.cos(u),B*f*Math.sin(u),z];});
      const rings=[];
      for(let k=0;k<nT;k++){
        const f=k<2?1-.03*k:.95-.55*(k-2)/(nT-3),z=k<2?-R*.15+k*R*.75:R+.6+3*Math.pow((k-2)/(nT-3),.8);
        const centreline=ring(f,z),nCross=8,vertices=[],faces=[];
        rings.push(centreline.map(([x,y,pz])=>add([x,y,pz+rho+.08],mul(norm([(x-xc)/(A*A),y/(B*B),0]),rho+.12))));
        for(const point of centreline){
          const [x,y]=point,out=norm([(x-xc)/(A*A),y/(B*B),0]);
          for(let j=0;j<nCross;j++){
            const angle=j/nCross*2*Math.PI;
            vertices.push(add(point,add(mul(out,rho*Math.cos(angle)),[0,0,rho*Math.sin(angle)])));
          }
        }
        for(let i=0;i<n;i++)for(let j=0;j<nCross;j++){
          const b=i*nCross,next=((i+1)%n)*nCross,l=(j+1)%nCross;
          faces.push([b+j,next+j,next+l,b+l]);
        }
        smooth(mesh('structure',vertices,faces,'#c79a69')).role='aeroshell-ring';
      }
      const v=rings.flat(),fc=[];for(let k=0;k<nT-1;k++)for(let i=0;i<n;i++){const j=(i+1)%n;fc.push([k*n+i,k*n+j,(k+1)*n+j,(k+1)*n+i]);}
      fc.push(rings[nT-1].map((_,i)=>(nT-1)*n+i));const skin=mesh('structure',v,fc,'#9b7349',1,body);skin.role='deployed-aeroshell';skin.diameterM=D;
      // Keel frame under the payload, tied to the shield rings.
      for(const y of [-R*.6,R*.6])pipe('structure',[0,y,R*.75],[xRear,y,R*.75],.14,'#9aa8a0').role='landing-cradle';
      for(let k=0;k<=8;k++){const x=k/8*xRear,f=.95,hw=B*f*Math.sqrt(Math.max(0,1-((x-xc)/(A*f))**2))-.7;pipe('structure',[x,-R*.6,R*.75],[x,R*.6,R*.75],.1,'#9aa8a0').role='landing-cradle';if(hw>R*.6+.3)for(const y of [-1,1])pipe('structure',[x,y*R*.6,R*.75],[x,y*Math.min(R*1.3,hw),R+.6-rho*.5],.1,'#9aa8a0').role='landing-cradle';}
      const xlb=xRear-11;for(let k=0;k<LD.cargo_engines;k++){const x=k>>1?xRear-2.5:xlb+2.5,y=(k%2?1:-1)*1.5,p=[x,y,R*.3];box('structure',p,[1.1,1.1,1],'#8d9a97').role='landing-engine-pod';
        cylinder('structure',add(p,[0,0,.75]),.3,.6,'#718582','z').role='landing-engine';cylinder('structure',add(p,[0,0,1.35]),.28,.7,'#a89372','z',1,body,.6).role='landing-engine-bell';}
      for(const x of [xRear*.3,xRear*.7]){const p=[x,0,-R-.45];cylinder('structure',p,.7,.9,'#d8d2c0','z').role='parachute-pack';}
      label([xc,0,R+5],'Heat shield');label([xRear-5.5,0,R+2.5],'Landing engine');label([xRear*.3,0,-R-2],'Parachutes');
    }
    {const BRACE=/^(orbital-service-reactor|service-radiator|gcr-equipment-allowance|antimatter-containment|landing-oxygen|landing-hydrogen|landing-engine|habitat-service-reactor|stowed-aeroshell|rover-pressure-hull|scout-frame-mount|cargo-autonomy-core|payload-canister)$/;
      const corners=phase==='entry'?(cargoShip?[[-R*.6,R*.75],[R*.6,R*.75]]:[]):cargoShip?[0,1,2,3].map(k=>[(R-.1)*Math.cos(quad(k)),(R-.1)*Math.sin(quad(k))]):[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[a*(W/2+.1),ZC+b*(H/2+.1)]);
      if(corners.length)for(const m of [...scene.meshes]){if(!BRACE.test(m.role??'')||m.stage?.phase==='acceleration'||!m.vertices?.length)continue;
        const c=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length),best=corners.reduce((a,b)=>Math.hypot(a[0]-c[1],a[1]-c[2])<=Math.hypot(b[0]-c[1],b[1]-c[2])?a:b);
        pipe('structure',c,[c[0],best[0],best[1]],.08,'#9aa8a0',q=>q).role='equipment-brace';}}
    scene.labels.push(...labels);
    scene.flightLayout={shieldX:scene.shieldX??xShield,nose:xShield,front:xFront,rear:xRear,stackStart:xStack,stackEnd:xEndStack,width:W,height:H,zCentre:ZC,radius:R,orbitalOffset:ORB,engineAhead:flight.engineAhead,centre,tail:xTail};
  }
  // The cargo ship carries no habitat: skip the habitat, interiors, settlement and crew-module chain.
  // Sky helpers shared by the flight and settlement skies.
  const starDir=(ra,dec)=>{const a=ra*Math.PI/12,d=dec*Math.PI/180;return [Math.cos(d)*Math.cos(a),Math.sin(d),Math.cos(d)*Math.sin(a)];};
  const skyDisc=(centre,r,color,opacity=1,n=24)=>{const nn=norm(centre),u=norm(cross(nn,Math.abs(nn[1])<.9?[0,1,0]:[1,0,0])),w=cross(nn,u);const m=mesh('sky',Array.from({length:n},(_,i)=>add(centre,add(mul(u,r*Math.cos(i/n*2*Math.PI)),mul(w,r*Math.sin(i/n*2*Math.PI))))),[Array.from({length:n},(_,i)=>i)],color,opacity,p=>p);m.material=-2;return m;};
  const starSize=mag=>Math.min(40,12*Math.pow(10,-mag*.13));
  let world=null;
  if(!cargoShip){
  // Room frame: fittings occupy z ±1.5 m; the remaining axial depth is a single walk-through aisle on +z.
  const AXIAL_SHIFT=.6,HULL_Z0=-L.disc_axial_depth_m/2+AXIAL_SHIFT+.1,HULL_Z1=L.disc_axial_depth_m/2+AXIAL_SHIFT-.1,CABIN_FRONT_Z=1.6,DOOR_Z=1.65,AISLE_Z=2.2,LADDER_Z=2.6;
  // Walking data per disc deck (radius, partitions, named rooms and cabins) and the ladders between decks.
  const deckInfo=new Map(),ladders=new Map(),HATCH_Z0=LADDER_Z-AXIAL_SHIFT-.65,HUB_R=3,HUB_HALF=C?L.disc_axial_depth_m/2:3.5,TUBE_R=1;
  // Four vertical shafts per disc, one inside every communal room on every deck, continuing to the hub.
  const SHAFTS=[2,5,8,11].map(c=>c*Math.PI/6);
  // Deck plan: merged communal rooms from sharedRooms, plus single-cell private cabin pods on the outer deck.
  const deckRooms=(deck,habitat)=>{
    const pods=deck===0?[...new Set(data.habitats.cabin_bay_layout.map(p=>p.cell))].map(cell=>({cell,name:'Private cabins',residential:true})):[];
    const rooms=[...sharedRooms[deck].map(room=>surface?{...room,name:surfaceRoomName(room.name,habitat)}:room),...pods].sort((a,b)=>a.cell-b.cell);
    return rooms.map((room,i)=>({...room,span:((rooms[(i+1)%rooms.length].cell-room.cell+11)%12)+1}));
  };
  // ---- Burn configuration (engine mode). Thrust gives a steady pull toward the engine (+x in disc coordinates); the discs are locked and
  // each room's folding floor panels re-set at right angles to the thrust, turning rooms into stacked levels joined by ladders.
  const burnRooms=new Map(),burnCache=new Map(),discFrames=[];
  // Levels for a room wedge: floors are planes x = f; a level needs 2.3 m of clear height above a run at least 2.4 m long.
  const burnLevels=(key,rin,rout,a0,a1)=>{
    if(burnCache.has(key))return burnCache.get(key);
    const span=a1-a0,inside=(x,y)=>{const r=Math.hypot(x,y);if(r<rin+.08||r>rout-.08)return false;const t=((Math.atan2(y,x)-a0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);return t>.12/r&&t<span-.12/r;};
    const pts=[];for(let i=0;i<=36;i++){const t=a0+span*i/36;for(const r of [rin,rout])pts.push([r*Math.cos(t),r*Math.sin(t)]);}
    const xmax=Math.max(...pts.map(p=>p[0])),xmin=Math.min(...pts.map(p=>p[0])),ymin=Math.min(...pts.map(p=>p[1])),ymax=Math.max(...pts.map(p=>p[1]));
    // Longest run along the floor plane x = f with 2.1 m of clear height above it.
    const run=f=>{let best=null,start=null;for(let y=ymin;y<=ymax+1e-9;y+=.15){const ok=[0,.7,1.4,2.1].every(h=>inside(f-h,y)),last=y+.15>ymax+1e-9;
      if(ok&&start===null)start=y;if(start!==null&&(!ok||last)){const end=ok?y:y-.15;if(!best||end-start>best.u1-best.u0)best={u0:start,u1:end};start=null;}}return best;};
    // Choose floors (at least 2.35 m apart, runs of 1.2 m or more) that maximise total floor length.
    const cand=[];for(let f=xmax-.05;f-2.1>xmin;f-=.15){const rr=run(f);if(rr&&rr.u1-rr.u0>=1.2)cand.push({f,...rr,len:rr.u1-rr.u0});}
    const best=new Array(cand.length+1).fill(0),pick=new Array(cand.length).fill(null);
    for(let i=cand.length-1;i>=0;i--){let j=i+1;while(j<cand.length&&cand[j].f>cand[i].f-2.35)j++;const take=cand[i].len+best[j];if(take>best[i+1]){best[i]=take;pick[i]=j;}else best[i]=best[i+1];}
    const levels=[];for(let i=0;i<cand.length;){if(pick[i]!==null&&best[i]!==best[i+1]){levels.push({...cand[i],uc:(cand[i].u0+cand[i].u1)/2});i=pick[i];}else i++;}
    burnCache.set(key,levels);return levels;
  };
  // Ladder from a lower level to the next one up: vertical where the floors overlap, otherwise an inclined ship's ladder
  // from the near end of the lower floor to the near end of the upper one.
  const ladderBetween=(a,b)=>{const lo=Math.max(a.u0,b.u0),hi=Math.min(a.u1,b.u1);if(hi-lo>=.8)return {uA:(lo+hi)/2,uB:(lo+hi)/2};
    const up=b.u0>=a.u1-.8,uA=up?a.u1-.35:a.u0+.35,uB=up?b.u0+.35:b.u1-.35;return Math.abs(uB-uA)<4?{uA,uB}:null;};
  // Settlement: pressurised links meet habitat A's outer ring (to B and to the greenhouse) and habitat B's (to A).
  // Surface rings share their boundary walls; the innermost rooms continue to the hub.
  const FLOORS=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m,SURF_HALF=2.35,SURF_RC=[FLOORS[0]+.65-SURF_HALF],SURF_CORE=SURF_RC[0]-SURF_HALF,RES_X=3.6,SURF_Z=L.surface_disc_centres_z_m??[-45,-45],LINK_Z=(SURF_Z[0]+SURF_Z[1])/2-3.2,SURF_TURN=[0,-Math.PI/6];
  const surfaceRing=r=>{const k=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m.findIndex(F=>Math.abs(F-1.3-r)<1e-6);return k<0?r:SURF_RC[k];};
  const ROUT=surface?SURF_RC[0]+SURF_HALF:data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.02,LINK_HW=1.2,LINK_FLOOR=1.75,LINK_ROOF=4.22,GH_ANGLE=255*Math.PI/180;
  const surfaceRooms=[[],[]],surfaceCabins=[[],[]];
  // Opening for a link through the ring wall: centred on the mean direction of its two edge points (so an opening that
  // straddles angle 0 is not put on the far side), as an angle range in [0, 2pi).
  const linkHole=(pts,turn=0)=>{const m=pts.reduce((n,[x,y])=>[n[0]+x,n[1]+y],[0,0]),angle=Math.atan2(m[1],m[0]),mid=(angle-turn+2*Math.PI)%(2*Math.PI),spread=Math.max(...pts.map(([x,y])=>Math.abs(Math.atan2(Math.sin(Math.atan2(y,x)-angle),Math.cos(Math.atan2(y,x)-angle))))),half=spread*.83,z0=3-LINK_ROOF,z1=3-LINK_FLOOR;
    // Split an opening that crosses angle 0 so each part lies inside one wall cell.
    return mid-half<0?[{a0:mid-half+2*Math.PI,a1:2*Math.PI,z0,z1},{a0:0,a1:mid+half,z0,z1}]:mid+half>2*Math.PI?[{a0:mid-half,a1:2*Math.PI,z0,z1},{a0:0,a1:mid+half-2*Math.PI,z0,z1}]:[{a0:mid-half,a1:mid+half,z0,z1}];};
  const ringPoint=(y,sign)=>[sign*Math.sqrt(ROUT*ROUT-y*y),y],ghx=ROUT*Math.cos(GH_ANGLE);
  const resHole=d=>linkHole([(d?-RES_X:RES_X)-LINK_HW,(d?-RES_X:RES_X)+LINK_HW].map(x=>[x,Math.sqrt(ROUT*ROUT-x*x)]),SURF_TURN[d]);
  const nextHabitatHole=d=>linkHole([-LINK_HW,LINK_HW].map(x=>ringPoint(LINK_Z-SURF_Z[d]+x,d?-1:1)),SURF_TURN[d]);
  const surfaceLinks=surface?[[...nextHabitatHole(0),...linkHole([ghx-LINK_HW,ghx+LINK_HW].map(x=>[x,-Math.sqrt(ROUT*ROUT-x*x)])),...resHole(0)],
    [...nextHabitatHole(1),...resHole(1)]]:[[],[]];
  for(let d=0;d<2;d++){
    const id=d?'habB':'habA',cx=DISC_X[d],spin=(state.spin&&!surface?(d?1:-1)*time*SPIN_RATE:0)+(brakingLock?Math.PI:0);
    const furnish=state.interiorHabitat===undefined||state.interiorHabitat==='all'||state.interiorHabitat===(d?'B':'A');
    const scale=1;
    const transform=p=>{
      let q=rotate([p[0]*scale,p[1]*scale,p[2]],[0,0,surface?SURF_TURN[d]:spin]);
      if(surface){q=rotate(q,[Math.PI/2,0,0]);return add(q,[cx,3,SURF_Z[d]]);}
      return body(place(d,q));
    };
    const floors=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m;
    if(!surface){
      const v=[],f=[];curvedPanel(v,f,HUB_R,0,2*Math.PI,-HUB_HALF,HUB_HALF,32,SHAFTS.map(a=>({a0:a-.5/HUB_R,a1:a+.5/HUB_R,z0:HATCH_Z0,z1:L.disc_axial_depth_m/2})));
      const ring=(r,z)=>{const b=v.length;for(let i=0;i<32;i++){const a=i/32*2*Math.PI;v.push([r*Math.cos(a),r*Math.sin(a),z]);}return b;};
      const closed=ring(HUB_R,-HUB_HALF);f.push(Array.from({length:32},(_,i)=>closed+31-i));
      const outer=ring(HUB_R,HUB_HALF),inner=ring(TUBE_R,HUB_HALF);for(let i=0;i<32;i++)f.push([outer+i,outer+(i+1)%32,inner+(i+1)%32,inner+i]);
      mesh(id,v,f,'#a5b7b1',1,transform).role='service-hub';
      for(const z of [-1.6,-.4])torus(id,[0,0,z],HUB_R-.12,.035,'#c3bf9f','z',transform).role='hub-handhold';
    }
    {
      // In flight the dome caps the hub; on the surface it roofs the central hall at ring-roof height.
      const z=-(surface?2.15:HUB_HALF),hubR=surface?SURF_CORE+.05:3,origin=transform([0,0,z]),out=norm(sub(transform([0,0,z-1]),origin)),dome=sphere(id,[0,0,z],[hubR,hubR,surface?1.2:.5],'#a5b7b1',surface&&state.cutaway?.18:1,transform);
      dome.faces=dome.faces.filter(f=>f.reduce((n,i)=>n+dot(sub(dome.vertices[i],origin),out),0)>=-1e-8);dome.role='service-hub';
    }
    if(!surface)torus(id,[0,0,0],3.2,.18,'#c8c7ad','z',transform).role='service-hub';
    const programmes=data.habitats.deck_programmes.map((row,deck)=>surface&&d===0&&deck===0
      ? row.map((purpose,cell)=>cell===4||cell===5?row[cell+6]:cell===10||cell===11?row[cell-6]:purpose) : row);
    const entries=[];
    const roomTransform=(r,a)=>q=>{
      if(surface){
        // Follow the curved floor plan so rectangular fittings do not pierce radial walls.
        const rc=surfaceRing(r),radius=rc-(q[2]-AXIAL_SHIFT),angle=a-q[0]/rc;
        return transform([radius*Math.cos(angle),radius*Math.sin(angle),q[1]]);
      }
      const radius=r+q[1],angle=a-q[0]/r;
      return transform([radius*Math.cos(angle),radius*Math.sin(angle),q[2]-AXIAL_SHIFT]);
    };

    function addEntry(id,t,privateRoom=false){
      const room={id,eye:t([0,-.1,privateRoom?0:AISLE_Z]),up:sub(t([0,-1,0]),t([0,0,0])),forward:sub(t([1,0,0]),t([0,0,0]))};
      (scene.rooms??=[]).push(room);entries.push({room,t,privateRoom});
      return room;
    }
    // Burn frames: q[1] runs with the thrust gravity (+x), q[0] along the level, q[2] axial as in the cruise frame.
    const tE=lv=>q=>transform([lv.f-1.19+q[1],lv.uc-q[0],q[2]-AXIAL_SHIFT]);
    {const o=transform([0,0,0]);discFrames[d]={origin:o,down:norm(sub(transform([1,0,0]),o)),u:norm(sub(transform([0,1,0]),o)),w:norm(sub(transform([0,0,1]),o))};}
    function burnRoom(room,name,functions,residential,R,a0,a1,deck,cell){
      const levels=burnLevels(`${deck}-${cell}`,(deck+1<floors.length?floors[deck+1]+.02:HUB_R),R+.15,a0,a1),ladderList=[],wL=LADDER_Z-AXIAL_SHIFT,hatchQ2=HATCH_Z0+AXIAL_SHIFT,colour=deck%2?'#a7b4a7':'#b9c1aa';
      levels.forEach((lv,k)=>{
        const t=tE(lv),below=levels[k-1],above=levels[k+1],hatchU=below?ladderBetween(below,lv)?.uB??null:null;
        // Floor panel; a hatch is left where the ladder from the level below arrives.
        const slab=(q0a,q0b,q2a,q2b)=>{if(q0b-q0a>.05&&q2b-q2a>.05)box(room,[(q0a+q0b)/2,1.25,(q2a+q2b)/2],[q0b-q0a,.12,q2b-q2a],colour,[0,0,0],1,t).role='folding-deck';};
        if(hatchU===null)slab(-lv.len/2,lv.len/2,HULL_Z0,HULL_Z1);
        else{const h=lv.uc-hatchU;slab(-lv.len/2,lv.len/2,HULL_Z0,hatchQ2);slab(-lv.len/2,h-.55,hatchQ2,HULL_Z1);slab(h+.55,lv.len/2,hatchQ2,HULL_Z1);}
        const lad=above?ladderBetween(lv,above):null;
        if(lad){ladderList.push({...lad,w:wL,from:k,to:k+1});
          const rise=lv.f-above.f,at=t=>[lv.f-rise*t,lad.uA+(lad.uB-lad.uA)*t,wL],end=1+1/rise;
          for(const du of [-.25,.25])pipe(room,add(at(0),[0,du,0]),add(at(end),[0,du,0]),.035,'#9fb2ad',transform).role='access-ladder';
          for(let i=1;i*.3<rise;i++){const p=at(i*.3/rise);pipe(room,add(p,[0,-.25,0]),add(p,[0,.25,0]),.025,'#c3c6b2',transform);}}
        wallSign(room,name,[0,-.3,HULL_Z1+.085],q=>t([-q[0],q[1],-q[2]+2*(HULL_Z1+.085)]),1);
        if(!residential&&furnish)furnishCell(room,functions[k%functions.length],Math.max(2,lv.len-.4),t);
      });
      burnRooms.set(room,{levels,ladders:ladderList,name,d});
      if(!residential&&levels.length){const e=addEntry(room,tE(levels[0]));e.burn={room,level:0,d};}
    }
    // Cabins take 3.3 m slots along their pod's levels, two per pod, 4 m across the disc's axial depth.
    const burnCabinFrame=(placement,cabin)=>{
      const pod=`bay-${d?'B':'A'}-0-${placement.cell}`,info=burnRooms.get(pod);if(!info?.levels.length)return null;
      const slots=info.levels.flatMap((lv,k)=>{const n=Math.floor(lv.len/2.6),w=lv.len/Math.max(1,n);return Array.from({length:n},(_,i)=>({k,lv,w,u:lv.u0+w*(i+.5)}));});
      const index=data.habitats.cabin_bay_layout.slice(0,cabin).filter(p=>p.cell===placement.cell).length,slot=slots[index]??slots[index%Math.max(1,slots.length)]??{k:0,lv:info.levels[0],u:info.levels[0].uc};
      // Burn-configuration cabins are shorter along the floor and wider across the disc, keeping about the same area.
      const q0=slot.lv.uc-slot.u,te=tE(slot.lv),k=Math.min(1,((slot.w??3.3)-.05)/3.3),kz=.8;
      return {t:q=>te([q0-q[2]*k,q[1],q[0]*kz+AXIAL_SHIFT-.2]),burn:{room:pod,level:slot.k,d,cabinName:`Berth bay ${cabin+1}`}};
    };

    for(let deck=0;deck<floors.length;deck++){
      if(surface&&deck>0)continue;
      const R=floors[deck],visible=state.deck===undefined||state.deck==='all'||+state.deck===deck;
      if(!visible)continue;
      const RIN=deck===floors.length-1?HUB_R:surface?SURF_RC[deck]-SURF_HALF:floors[deck+1]+.02,ROUT_R=surface?SURF_RC[deck]+SURF_HALF:R+.02,fyR=surface?1.25:R-.11-(R-1.3),cyR=surface?-2.05:RIN-(R-1.3);
      const r=R-1.3,ceilingY=RIN-r,floorY=R-.11-r,walls=[],info={radius:R-1.4,gravity:L.spin_gravity_g*R/floors[0],walls,rooms:[],cabins:[]};deckInfo.set(`${d}-${deck}`,info);
      // Hatch openings: this deck's ladders pierce its ceiling; the deck below's ladders pierce this floor and outer shell.
      const hatches=k=>k<0||k>=floors.length||surface?[]:SHAFTS.map(angle=>({angle,z0:HATCH_Z0,z1:L.disc_axial_depth_m/2+.01}));
      // On the surface the rings lie flat: ring k opens to ring k+1 through doorways 2.1 m high above the 1.75 m floor.
      const doorways=k=>surface&&k>=0&&k<floors.length-1?SHAFTS.map(angle=>({angle,z0:3-1.75-2.1,z1:3-1.75})):[];
      const at=(list,a0,a1,rs)=>list.filter(h=>h.angle>a0&&h.angle<a1).map(h=>({...h,a0:h.angle-.5/rs,a1:h.angle+.5/rs}));
      for(const {cell,span,name,residential} of deckRooms(deck,d?'B':'A')){
        // Merged rooms span several 30° cells; each cell keeps its function's fittings.
        const a0=cell*Math.PI/6,a1=(cell+span)*Math.PI/6,a=(a0+a1)/2;
        const room=`bay-${d?'B':'A'}-${deck}-${cell}`,functions=programmes[deck].slice(cell,cell+span);
        if(!residential&&!engine)addEntry(room,roomTransform(r,a));
        scene.zones.push({id:room,habitat:d?'B':'A',deck:deck+1,radius_m:R,purpose:name,functions,gravity_g:L.spin_gravity_g*R/floors[0],status:'Proposed room/stowage zoning; inventory and net usable area unvalidated'});
        info.rooms.push({a0,a1,name,id:room});if(surface)surfaceRooms[d].push({deck,a0,a1,name,id:residential?null:room});
        // Outer-ring windows: in cruise this wall is the floor, so they only matter once the habitat lies flat on the surface.
        const ringWindows=deck===0?(residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>(p.cell+.5)*Math.PI/6+p.offset_m/(floors[0]-1.3)):Array.from({length:span},(_,i)=>a0+(i+.5)*Math.PI/6)).map(c=>({angle:c,a0:c-.6/ROUT_R,a1:c+.6/ROUT_R,z0:-1.05,z1:.35})).filter(w=>!surfaceLinks[d].some(h=>w.a1>h.a0&&w.a0<h.a1)):[];
        const lockAngle=deck===0&&/airlock/i.test(name)?a:null;
        const lockHole=surface&&lockAngle!==null?[{a0:a-.75/ROUT_R,a1:a+.75/ROUT_R,z0:-1.05,z1:1.25}]:[];
        const windows=residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>(p.cell+.5)*Math.PI/6+p.offset_m/(floors[0]-1.3)):[a];
        const ceilingHoles=at(surface?doorways(deck):hatches(deck),a0,a1,RIN),floorHoles=at(hatches(deck-1),a0,a1,R);
        const shell=pressureCell(room,RIN,ROUT_R,a0,a1,surface?4.3:L.disc_axial_depth_m,'#b8cbb5',transform,span,{windows,innerHoles:ceilingHoles,outerHoles:at(surface?doorways(deck-1):hatches(deck-1),a0,a1,ROUT_R).concat(deck===0?surfaceLinks[d].filter(h=>h.a1>a0+1e-9&&h.a0<a1-1e-9).map(h=>({...h,a0:Math.max(h.a0,a0),a1:Math.min(h.a1,a1)})):[],ringWindows,lockHole),hatchAngle:lockAngle,outerWall:deck===0,innerWall:surface||deck===floors.length-1});
        for(const w of ringWindows.filter(w=>lockAngle===null||Math.abs(w.angle-lockAngle)>.1)){
          const depth=surface?4.3:L.disc_axial_depth_m,half=depth/2,step=2*Math.PI/(state.detail==='overview'?72:state.detail==='medium'?144:192),angles=[w.a0,...Array.from({length:Math.ceil(w.a1/step)-Math.floor(w.a0/step)+1},(_,i)=>(Math.floor(w.a0/step)+i)*step).filter(a=>a>w.a0&&a<w.a1),w.a1],zs=[w.z0,...Array.from({length:9},(_,i)=>-half+i*depth/8).filter(z=>z>w.z0&&z<w.z1),w.z1],v=[],f=[],point=(a,z)=>pressureOutline([ROUT_R*Math.cos(a),ROUT_R*Math.sin(a),z],depth);
          for(const z of zs)for(const a of angles)v.push(point(a,z));
          for(let j=0;j<zs.length-1;j++)for(let i=0;i<angles.length-1;i++){const b=j*angles.length+i;f.push([b,b+1,b+angles.length+1,b+angles.length]);}
          smooth(mesh(room,v,f,'#8fb3c0',.4,transform)).role='ring-window-glass';
          const frameStart=scene.meshes.length;
          for(const a of [w.a0,w.a1])for(let j=0;j<zs.length-1;j++)pipe(room,point(a,zs[j]),point(a,zs[j+1]),.04,'#cad2ce',transform).role='ring-window-frame';
          for(const z of [w.z0,w.z1])for(let i=0;i<angles.length-1;i++)pipe(room,point(angles[i],z),point(angles[i+1],z),.04,'#cad2ce',transform).role='ring-window-frame';
          // Mullions about every 0.6 m and a mid transom: a simple pane pattern on the glass.
          {const nm=Math.max(1,Math.round((w.a1-w.a0)*ROUT_R/.6));for(let i=1;i<nm;i++){const a=w.a0+(w.a1-w.a0)*i/nm;pipe(room,point(a,w.z0),point(a,w.z1),.018,'#cad2ce',transform).role='ring-window-frame';}
            const zmid=(w.z0+w.z1)/2;for(let i=0;i<angles.length-1;i++)pipe(room,point(angles[i],zmid),point(angles[i+1],zmid),.018,'#cad2ce',transform).role='ring-window-frame';}
          const parts=scene.meshes.splice(frameStart),fv=[],ff=[];for(const part of parts){const offset=fv.length;fv.push(...part.vertices);ff.push(...part.faces.map(f=>f.map(i=>i+offset)));}if(parts.length)mesh(room,fv,ff,'#cad2ce',1,p=>p).role='ring-window-frame';
        }
        if(surface&&deck>0)for(const {angle} of at(doorways(deck-1),a0,a1,ROUT_R)){
          // A shallow frame lines the doorway through the shared wall.
          const rIn=ROUT_R,rOut=SURF_RC[deck-1]-SURF_HALF,pt=q=>transform([q[1]*Math.cos(angle)+q[0]*Math.sin(angle),q[1]*Math.sin(angle)-q[0]*Math.cos(angle),3-q[2]]),len=rOut-rIn+.12,mid=(rIn+rOut)/2;
          for(const x of [-.53,.53])box(room,[x,mid,2.8],[.06,len,2.1],'#9aaba6',[0,0,0],1,pt).role='hull-boundary';
          box(room,[0,mid,3.88],[1.12,len,.06],'#9aaba6',[0,0,0],1,pt).role='doorway-passage';box(room,[0,mid,1.75],[1.12,len,.12],'#a7b4a7',[0,0,0],1,pt).role='doorway-passage';
        }shell.opacity=1;shell.role='inflatable-envelope';smooth(shell);
        if(lockAngle!==null){
          const baseLt=roomTransform(r,lockAngle),lt=surface?baseLt:q=>baseLt([q[0],q[1],1.2-q[2]]),lockId=d?'habB':'habA',outerOpen=state.airlockOutside===lockId,z0=surface?1.1:2.2,z1=surface?-2.7:-1.55,centre=lt([0,-.1,(z0+z1)/2]);
          (scene.airlocks??=[]).push({id:lockId,centre,angle:lockAngle,outerOpen,inner:lt([0,-.1,z0]),outer:lt([0,-.1,z1])});
          for(const x of [-1.15,1.15])box(room,[x,.1,(z0+z1)/2],[.12,2.3,z0-z1],'#9aaba7',[0,0,0],1,lt).role='hull-boundary';
          for(const y of [-1.05,1.25])box(room,[0,y,(z0+z1)/2],[2.4,.12,z0-z1],'#a7b8ac',[0,0,0],1,lt).role='hull-boundary';
          for(const [z,open,side] of [[z0,!outerOpen,'inner'],[z1,outerOpen,'outer']]){
            for(const x of [-.8,.8])box(room,[x,.1,z],[.12,2.3,.16],'#d5b678',[0,0,0],1,lt).role='airlock-door-frame';
            box(room,[0,-1.05,z],[1.7,.12,.16],'#d5b678',[0,0,0],1,lt).role='airlock-door-frame';
            const door=box(room,[open?1.65:0,.1,z],[1.5,2.2,.1],'#6e9297',[0,0,0],1,lt);door.role=open?'airlock-door-open':'hull-boundary';door.airlockDoor=side;
          }
          for(const x of [-.85,.85]){
            box(room,[x,-.05,(z0+z1)/2],[.45,.85,.35],'#dddcc7',[0,0,0],1,lt).role='spacesuit';
            sphere(room,[x,-.73,(z0+z1)/2],[.25,.27,.25],'#d6d9c5',1,lt).role='suit-helmet';
            box(room,[x,-.72,(z0+z1)/2+.23],[.31,.17,.04],'#486c7a',[0,0,0],1,lt).role='suit-visor';
            for(const dx of [-.13,.13])box(room,[x+dx,.7,(z0+z1)/2],[.17,.65,.2],'#d7d9c4',[0,0,0],1,lt).role='spacesuit';
          }
          wallSign(room,'AIRLOCK',[0,-.8,z0+.1],lt);wallSign(room,'F CYCLE DOORS',[0,-.55,(z0+z1)/2-.1],lt,.8);
          if(surface){box(room,[0,1.25,-2.7],[2,.12,1.6],'#a9b4a5',[0,0,0],1,lt).role='airlock-exterior-landing';for(let i=0;i<5;i++)box(room,[0,1.4+i*.3,-3.4-i*.4],[1.8,.18,.45],'#a9b4a5',[0,0,0],1,lt).role='airlock-exterior-step';}
        }
        if(engine)burnRoom(room,name,functions,residential,R,a0,a1,deck,cell);
        else if(flight?.phase!=='entry'){
        const floor=surface?sector(room,RIN,ROUT_R,a0,a1,.12,deck%2?'#a7b4a7':'#b9c1aa',1,q=>transform(add(q,[0,0,1.25])),8*span):floorHoles.length?floorSlab(room,R-.11,R+.02,a0,a1,L.disc_axial_depth_m-.2,deck%2?'#a7b4a7':'#b9c1aa',transform,8*span,floorHoles):sector(room,R-.11,R+.02,a0,a1,L.disc_axial_depth_m-.2,deck%2?'#a7b4a7':'#b9c1aa',1,transform,8*span);
        floor.role='folding-deck';floor.packedEnvelopeVolumeM3=.5*((R+.02)**2-(R-.11)**2)*(a1-a0)*3.4;
        }
        scene.labels.push({id:room,p:roomTransform(r,a)([0,-.8,0]),text:name.toUpperCase(),closeOnly:true});
        if(surface){
          const tb=roomTransform(r,a0),z0=SURF_RC[deck]+AXIAL_SHIFT-ROUT_R,z1=SURF_RC[deck]+AXIAL_SHIFT-RIN,top=fyR-2.1;
          for(const [lo,hi] of [[z0,DOOR_Z],[2.72,z1]])box(room,[0,(cyR+fyR)/2,(lo+hi)/2],[.08,fyR-cyR,hi-lo],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          box(room,[0,(cyR+top)/2,(DOOR_Z+2.72)/2],[.08,top-cyR,2.72-DOOR_Z],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
        }
        if(!engine&&flight?.phase!=='entry'){
          const tb=roomTransform(r,a0),z=surface?1.8:(DOOR_Z+HULL_Z1)/2,top=(surface?fyR:floorY)-2.1,plan=deckRooms(deck,d?'B':'A'),previous=plan[(plan.findIndex(x=>x.cell===cell)+plan.length-1)%plan.length].name;
          for(const side of [-1,1]){const face=q=>tb([side*(.056+q[2]),q[1],z-side*q[0]]);wallSign(room,side>0?name:previous,[0,top-.15,0],face,.95);wallSign(room,'CORRIDOR',[-.85,-.4,0],face,.55);}
        }
        if(!surface&&flight?.phase!=='entry'){
          // Bulkhead at the room's leading edge; its doorway sits in the aisle so rooms are walked through in sequence.
          const tb=roomTransform(r,a0),doorTop=floorY-2.1,height=floorY-ceilingY;
          box(room,[0,(ceilingY+floorY)/2,(HULL_Z0+DOOR_Z)/2],[.1,height,DOOR_Z-HULL_Z0],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          box(room,[0,(ceilingY+doorTop)/2,(DOOR_Z+HULL_Z1)/2],[.1,doorTop-ceilingY,HULL_Z1-DOOR_Z],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          walls.push({angle:a0,half:.05/r,z0:HULL_Z0-AXIAL_SHIFT,z1:DOOR_Z-AXIAL_SHIFT});
          if(!residential){
            // Ladder in this room's shaft: up to the deck above, or to the hub from the innermost deck.
            const la=SHAFTS.find(x=>x>a0&&x<a1),hub=deck+1>=floors.length,top=(hub?HUB_R:floors[deck+1])-r;
            // Straight frame along the shaft so rails and walls stay parallel rather than converging toward the axis.
            const tl=q=>transform([(r+q[1])*Math.cos(la)+q[0]*Math.sin(la),(r+q[1])*Math.sin(la)-q[0]*Math.cos(la),q[2]-AXIAL_SHIFT]);
            // Rails continue 1 m above the upper floor as handholds when stepping off.
            for(const x of [-.25,.25])pipe(room,[x,floorY,LADDER_Z],[x,hub?top:top-1,LADDER_Z],.035,'#9fb2ad',tl).role='access-ladder';
            for(let y=floorY-.3;y>top;y-=.3)pipe(room,[-.25,y,LADDER_Z],[.25,y,LADDER_Z],.025,'#c3c6b2',tl);
            // Hatch rims frame the openings in this ceiling and in the floor (or hub wall) above.
            const zc=(HATCH_Z0+AXIAL_SHIFT+HULL_Z1)/2,zl=HULL_Z1-HATCH_Z0-AXIAL_SHIFT;
            for(const y of [ceilingY,top]){for(const x of [-.54,.54])box(room,[x,y,zc],[.08,.06,zl],'#8ea19c',[0,0,0],1,tl).role='access-hatch';box(room,[0,y,HATCH_Z0+AXIAL_SHIFT-.04],[1.16,.06,.08],'#8ea19c',[0,0,0],1,tl).role='access-hatch';}
            // Shaft lining closes the gap between this ceiling and the deck or hub above.
            {const h=ceilingY-top,yc=(ceilingY+top)/2,z0=HATCH_Z0+AXIAL_SHIFT;for(const x of [-.54,.54])box(room,[x,yc,(z0+HULL_Z1)/2],[.04,h,HULL_Z1-z0],'#9aaba6',[0,0,0],1,tl).role='access-shaft';for(const z of [z0,HULL_Z1])box(room,[0,yc,z],[1.12,h,.04],'#9aaba6',[0,0,0],1,tl).role='access-shaft';}
            const ladder={angle:la,z:LADDER_Z-AXIAL_SHIFT-.4,from:deck,to:hub?null:deck+1,topRadius:HUB_R-.6};
            ladders.has(d)?ladders.get(d).push(ladder):ladders.set(d,[ladder]);
          }
        }
        for(let i=0;i<span;i++){
          const ac=a0+(i+.5)*Math.PI/6,purpose=functions[i],t=roomTransform(r,ac),arcWidth=(surface?surfaceRing(r):r)*Math.PI/6;
          // Rigid fittings still pack per 30° cell so each assembly fits a transport rack.
          if(!engine&&residential){
            // Private cabins open onto a short aisle that links the communal rooms on either side.
            const doors=residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>-p.offset_m).sort((a,b)=>a-b):[0];
            let edge=-arcWidth/2;
            for(const x of [...doors,arcWidth/2+.7]){
              const end=x-.7;
              if(end>edge)box(room,[(edge+end)/2,(cyR+fyR)/2,CABIN_FRONT_Z],[end-edge,fyR-cyR,.08],'#a6b7ad',[0,0,0],1,t).role='room-front';
              if(x<arcWidth/2)box(room,[x,(cyR+fyR-2.1)/2,CABIN_FRONT_Z],[1.4,fyR-2.1-cyR,.08],'#a6b7ad',[0,0,0],1,t).role='door-lintel';
              edge=x+.7;
            }
          }
          if(residential||!furnish||engine)continue;
          furnishCell(room,purpose,arcWidth,t);
        }
      }
    }
    if(surface){
      // Central hall: with the hub and bearings left in orbit, the middle of the disc becomes the shared hall. The inner
      // deck's plant, workshop and store racks stand round its wall; dining and commons fill the floor.
      const H=d?'B':'A',hall=q=>transform([q[0],q[2],1.25+q[1]-1.19]),ids=sharedRooms[1].map(room=>`bay-${H}-1-${room.cell}`);
      sector(ids[0],.05,SURF_CORE,0,2*Math.PI,.12,'#b9c1aa',1,q=>transform(add(q,[0,0,1.25])),48).role='folding-deck';
      cylinder(ids[0],[0,0,-.45],.22,3.4,'#a5b7b1','z',1,transform).role='hall-roof-post';
      for(const angle of SHAFTS){const pt=q=>transform([q[1]*Math.cos(angle)+q[0]*Math.sin(angle),q[1]*Math.sin(angle)-q[0]*Math.cos(angle),3-q[2]]);
        for(const x of [-.53,.53])box(ids[0],[x,SURF_CORE,2.8],[.06,.16,2.1],'#9aaba6',[0,0,0],1,pt).role='hull-boundary';
        box(ids[0],[0,SURF_CORE,3.88],[1.12,.16,.06],'#9aaba6',[0,0,0],1,pt).role='doorway-passage';}
      programmes[1].forEach((purpose,cell)=>{const a=(cell+.5)*Math.PI/6,room=ids[Math.floor(cell/3)];
        machine(room,purpose,0,-.1,q=>hall([(SURF_CORE-.55-q[2])*Math.cos(a)-q[0]*Math.sin(a),q[1],(SURF_CORE-.55-q[2])*Math.sin(a)+q[0]*Math.cos(a)]));});
      for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,t=q=>hall([1.75*Math.cos(a)+q[0]*Math.cos(a)-q[2]*Math.sin(a),q[1],1.75*Math.sin(a)+q[0]*Math.sin(a)+q[2]*Math.cos(a)]);
        wallSign(ids[k],sharedRooms[1][k].name,[0,-.75,0],q=>{const b=(3*k+1.5)*Math.PI/6,rho=SURF_CORE-.1-q[2];return hall([rho*Math.cos(b)-q[0]*Math.sin(b),q[1],rho*Math.sin(b)+q[0]*Math.cos(b)]);},.95);
        table(ids[k],[0,.44,0],1.5,t);for(const dx of [-.4,.4])for(const sz of [-1,1])seat(ids[k],[0,0,0],q=>t(add([dx,.71,sz*.9],rotate(q,[0,sz>0?Math.PI:0,0]))));
        const eye=hall([.8*Math.cos(a+.6),-.1,.8*Math.sin(a+.6)]);
        (scene.rooms??=[]).push({id:ids[k],eye,up:[0,1,0],forward:norm(sub(hall([Math.cos(a),-.1,Math.sin(a)]),hall([0,-.1,0])))});}
      surfaceRooms[d].push({deck:1,a0:0,a1:2*Math.PI,name:'Central hall',id:ids[0]});
      scene.zones.push({id:ids[0],habitat:H,deck:2,purpose:'Central hall',functions:programmes[1],status:'Proposed surface use of the disc centre; fit and services unvalidated'});
    }
    // Four bays per disc; selected adult architecture has three convertible berths per bay.
    if(state.deck===undefined||state.deck==='all'||+state.deck===0)for(let cabin=0;cabin<data.habitats.couples_per_disc;cabin++){
      const placement=data.habitats.cabin_bay_layout[cabin],theta=(placement.cell+.5)*Math.PI/6+placement.offset_m/(floors[0]-1.3),cabinId=`cabin-${d*data.habitats.couples_per_disc+cabin+1}`,bc=engine?burnCabinFrame(placement,cabin):null,t=bc?bc.t:roomTransform(floors[0]-1.3,theta);
      {const entry=addEntry(cabinId,t,true);if(bc)entry.burn=bc.burn;}
      if(surface)surfaceCabins[d].push({angle:theta,half:2.05/SURF_RC[0],r0:SURF_RC[0]-1.05,r1:SURF_RC[0]+SURF_HALF,name:`Berth bay ${cabin+1}`,id:cabinId});
      if(!surface){const rr=floors[0]-1.3,front=CABIN_FRONT_Z-AXIAL_SHIFT;deckInfo.get(`${d}-0`).cabins.push({angle:theta,half:2.05/rr,front,name:`Berth bay ${cabin+1}`,id:cabinId});if(placement.offset_m<0)deckInfo.get(`${d}-0`).walls.push({angle:(placement.cell+.5)*Math.PI/6,half:.035/rr,z0:HULL_Z0-AXIAL_SHIFT,z1:front});deckInfo.get(`${d}-0`).walls.push(...[-1,1].map(side=>({angle:theta+side*1.35/rr,half:.65/rr,z0:front-.04,z1:front+.04}))); }
      box(cabinId,[0,surface?1.16:1.12,0],[4,.04,3],COLORS.cabin,[0,0,0],1,t);
      if(furnish){
        wallSign(cabinId,`BERTHS ${d?'B':'A'} ${cabin+1}`,[0,surface||engine?-1.08:-1.45,1.647],t,.75);
        // Bunks run front-to-back along the side partitions, heads at the hull, leaving the doorway clear.
        for(let side of [-1,1]){
          const tb=q=>t([side*1.30-q[2],q[1],-.25+q[0]]);
          box(cabinId,[0,.9,0],[2.2,.4,.85],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,tb).role='lower-berth';
          box(cabinId,[-.7,.64,0],[.45,.12,.65],'#e6e6d5',[0,0,0],1,tb);
          box(cabinId,[.2,.64,0],[1.3,.07,.75],side<0?'#a3c0ae':'#c9af91',[0,0,0],1,tb);
          box(cabinId,[-1.08,.35,0],[.12,.8,.8],'#7199a0',[0,0,0],1,tb);
          box(cabinId,[-1.16,.25,0],[.04,.3,.45],'#b9ded6',[0,0,0],1,tb);
          for(let yy of [.95,.55])pipe(cabinId,[-1,yy,side*.35],[1,yy,side*.35],.02,'#d2d9cc',tb);
          // Upper berth on corner posts, with its own monitor and a guard rail on the open side.
          if(side<0||data.habitats.berths_per_bay===4){
          box(cabinId,[0,-.28,0],[2.2,.12,.85],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,tb).role='upper-berth';
          box(cabinId,[-.7,-.4,0],[.45,.12,.65],'#e6e6d5',[0,0,0],1,tb);box(cabinId,[.2,-.37,0],[1.3,.07,.75],side<0?'#a3c0ae':'#c9af91',[0,0,0],1,tb);
          for(const x of [-1.05,1.05])for(const z of [-.38,.38])pipe(cabinId,[x,-.3,z],[x,1.1,z],.025,'#b5beb1',tb);
          pipe(cabinId,[-.6,-.55,-side*.4],[1,-.55,-side*.4],.02,'#d2d9cc',tb);box(cabinId,[-1.16,-.75,0],[.04,.3,.45],'#b9ded6',[0,0,0],1,tb);
          }
        }
        if(data.architecture&&cabin===0){
          box(cabinId,[1.4,-.35,-.35],[.9,.65,1.5],COLORS.shield,[0,0,0],1,t).role='reproductive-bank-protection';
          box(cabinId,[1.4,-.35,.42],[.65,.4,.06],'#7eb6aa',[0,0,0],1,t).role='reproductive-bank';
          wallSign(cabinId,`BANK ${d?'B':'A'}`,[1.4,-.35,.46],t,.4);
        }
        // Low cabinet sits under the porthole so the window stays clear.
        box(cabinId,[0,.72,-1.22],[1,.9,.5],'#a6b1a2',[0,0,0],1,t).role='cabin-wardrobe';
        for(let yy of [.4,.62,.85])box(cabinId,[0,yy,-.955],[.9,.025,.035],'#d7d9c9',[0,0,0],1,t);
        box(cabinId,[-1.18,.55,1.28],[1.1,.1,.5],'#c6b89a',[0,0,0],1,t).role='cabin-desk';
        box(cabinId,[-1.18,.03,1.53],[.9,.65,.05],'#638e96',[0,0,0],1,t);
        const cabinCeiling=surface?-2.05:engine?1.19-2.4:(floors[1]+.02)-(floors[0]-1.3),cabinFloor=surface?1.3:floors[0]-.11-(floors[0]-1.3);
        if(!engine&&placement.offset_m<0)box(cabinId,[0,(cabinCeiling+cabinFloor)/2,(HULL_Z0+CABIN_FRONT_Z)/2],[.07,cabinFloor-cabinCeiling,CABIN_FRONT_Z-HULL_Z0],'#9bada4',[0,0,0],1,roomTransform(floors[0]-1.3,(placement.cell+.5)*Math.PI/6)).role='cabin-divider';
        if(engine){
          const partition=(x,lo,hi,top=cabinCeiling,bottom=cabinFloor)=>box(cabinId,[x,(top+bottom)/2,(lo+hi)/2],[.08,bottom-top,hi-lo],'#9bada4',[0,0,0],1,t).role='cabin-divider';
          partition(-1.92,HULL_Z0,CABIN_FRONT_Z);
          partition(1.92,HULL_Z0,.25);partition(1.92,1.40,CABIN_FRONT_Z);
          partition(1.92,.25,1.40,cabinCeiling,cabinFloor-2.1);
          box(cabinId,[0,(cabinCeiling+cabinFloor)/2,CABIN_FRONT_Z],[3.92,cabinFloor-cabinCeiling,.08],'#a6b7ad',[0,0,0],1,t).role='room-front';
        }
      }
    }
    // Check entry clearance in each room's own frame, including nearby fittings and partitions.
    const fittings=scene.meshes.filter(m=>m.id.startsWith(`bay-${d?'B':'A'}-`)||m.id.startsWith('cabin-')&&Math.floor((+m.id.slice(6)-1)/CABINS_PER_DISC)===d)
      .filter(m=>!['inflatable-envelope','folding-deck','window-wall','porthole-glass','porthole-frame'].includes(m.role))
      .map(m=>({mesh:m,lo:[0,1,2].map(i=>Math.min(...m.vertices.map(p=>p[i]))),hi:[0,1,2].map(i=>Math.max(...m.vertices.map(p=>p[i])))}));
    for(const {room,t,privateRoom} of entries){
      const origin=t([0,0,0]),axes=[norm(room.forward),norm(room.up),norm(cross(room.forward,room.up))],project=p=>axes.map(axis=>dot(sub(p,origin),axis));
      const bounds=fittings.filter(b=>origin.every((v,i)=>v>b.lo[i]-3&&v<b.hi[i]+3)).map(({mesh:m})=>{const points=m.vertices.map(project);return {lo:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),hi:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};});
      const zs=privateRoom?[1,.9,1.1]:[AISLE_Z,AISLE_Z-.2,AISLE_Z+.2];
      let found=false;
      for(const z of zs){for(const x of privateRoom?[0,.3,-.3]:[-1.5,1.5,-2,2,-1,1,-2.5,2.5,0]){
        const eye=t([x,-.1,z]),p=project(eye);
        if(bounds.some(b=>p.every((v,i)=>v>b.lo[i]-.2&&v<b.hi[i]+.2)))continue;
        room.eye=eye;
        // Recompute the radial frame at the selected position on the curved deck.
        room.up=sub(t([x,-1,z]),t([x,0,z]));room.forward=sub(t([x+1,0,z]),t([x,0,z]));
        if(privateRoom&&!surface){const fn=norm(room.forward),rn=norm(cross(fn,norm(room.up))),into=norm(sub(t([x,-.1,z-1]),t([x,-.1,z])));room.yaw=Math.atan2(dot(into,rn),dot(into,fn));}
        found=true;break;
      }if(found)break;}
    }
    if(!surface){if(!(ship&&flight.phase==='entry')){const LY=data.selected_specification.layout,fixed=q=>body(place(d,q)),b0=HUB_HALF+LY.wall_thickness_m,b1=b0+.3,top=LY.corridor_z_m-.95;const sleeve=cylinder(id,[0,0,(b0+b1)/2],1.4,b1-b0,'#94a9a3','z',1,fixed);sleeve.faces?.splice(-2);sleeve.role='spin-bearing';for(const z of [b0+.1,b1-.1])torus(id,[0,0,z],1.5,.12,'#c3bf9f','z',fixed).role='spin-bearing';for(const sx of [-2.5,2.5])for(const y of [-.6,.6])pipe('structure',[sx,y,top],[sx*.5,y,b1],.15,'#a8b8ac',fixed).role='bearing-strut';}}
    else {
      sector(id,.5,ROUT,0,2*Math.PI,.9,'#a9b3ae',1,q=>[cx+q[0],.4+q[2],SURF_Z[d]+q[1]],192).role='habitat-base';

    }
  }
  if(crewShip&&data.settlement.cruise_agriculture.active)data.settlement.cruise_agriculture.cruise_centres_m.forEach((p,i)=>{farmBay(p,body,i);pipe('farm',[p[0],0,8],[p[0],Math.sign(p[1])*6.5,p[2]],.35,'#a2b3a6');});
  if(surface){
    // The nearest greenhouse abuts habitat A. Its growing aisle also leads to the other halls.
    const [ax,bx]=DISC_X,[az,bz]=SURF_Z,gx=ax+ghx,xm=(ax+bx)/2,hallR=7.5,hallL=16;
    const ringDepth=y=>Math.sqrt(ROUT*ROUT-y*y);
    const greenhouseDoor=az-ringDepth(ghx)-1.5,spineZ=greenhouseDoor-hallL-LINK_HW;
    const hallX=[0,1,2,3].map(k=>gx-16*(3-k));
    const rects=[
      {x0:ax+Math.min(ringDepth(LINK_Z-LINK_HW-az),ringDepth(LINK_Z+LINK_HW-az)),x1:bx-Math.min(ringDepth(LINK_Z-LINK_HW-bz),ringDepth(LINK_Z+LINK_HW-bz)),z0:LINK_Z-LINK_HW,z1:LINK_Z+LINK_HW,name:'A-B pressurised link'},
      {x0:gx-LINK_HW,x1:gx+LINK_HW,z0:greenhouseDoor,z1:az-ringDepth(ghx)+.4,name:'Greenhouse doorway'},
      {x0:hallX[0]-1.5,x1:gx+1.5,z0:spineZ-LINK_HW,z1:spineZ+LINK_HW,name:'Greenhouse spine'}];
    const habitatPath=[[rects[0].x0-1.6,LINK_Z],[rects[0].x1+1.6,LINK_Z]];
    const greenPath=[[rects[2].x0,spineZ],[rects[2].x1,spineZ]];
    const greenhouseThreshold=[[gx,greenhouseDoor-.18],[gx,rects[1].z1]];
    function pressureTunnel(path,closedStart=false){
      const v=[],f=[],profile=state.detail==='overview'?12:24,cy=2.1,ry=2.1,rx=1.25,frames=path.map((p,i)=>{
        const dir=norm([path[Math.min(i+1,path.length-1)][0]-path[Math.max(0,i-1)][0],0,path[Math.min(i+1,path.length-1)][1]-path[Math.max(0,i-1)][1]]);
        return {p:[p[0],cy,p[1]],side:[-dir[2],0,dir[0]],dir};
      }),shape=(frame,a,scale=1,offset=0)=>add(add(frame.p,mul(frame.dir,offset)),add(mul(frame.side,rx*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**(2/3)*scale),[0,ry*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**(2/3)*scale,0]));
      const dense=[];for(let i=0;i<frames.length-1;i++){const a=frames[i],b=frames[i+1],n=Math.max(1,Math.ceil(Math.hypot(...sub(b.p,a.p))/.5));for(let j=0;j<n;j++)dense.push({p:add(a.p,mul(sub(b.p,a.p),j/n)),side:norm(add(mul(a.side,1-j/n),mul(b.side,j/n))),dir:a.dir});}dense.push(frames.at(-1));
      for(const frame of dense)for(let j=0;j<profile;j++)v.push(shape(frame,j/profile*2*Math.PI));
      for(let i=0;i<dense.length-1;i++)for(let j=0;j<profile;j++){
        const ids=[i*profile+j,i*profile+(j+1)%profile,(i+1)*profile+(j+1)%profile,(i+1)*profile+j],c=[0,1,2].map(k=>ids.reduce((n,id)=>n+v[id][k],0)/4);
        if(path===habitatPath&&Math.abs(c[0]-xm)<1.04&&c[2]<LINK_Z-.65&&c[1]>LINK_FLOOR&&c[1]<LINK_ROOF)continue;
        if(path===greenPath&&hallX.some(x=>Math.abs(c[0]-x)<1.02)&&Math.abs(c[2]-spineZ)>.65&&c[1]>LINK_FLOOR&&c[1]<LINK_FLOOR+2.3)continue;
        f.push(ids);
      }
      if(closedStart){const base=v.length;for(let k=0;k<=8;k++)for(let j=0;j<profile;j++){const a=k*Math.PI/16;v.push(shape(frames[0],j/profile*2*Math.PI,Math.cos(a),-rx*Math.sin(a)));}for(let k=0;k<8;k++)for(let j=0;j<profile;j++)f.push([base+k*profile+j,base+k*profile+(j+1)%profile,base+(k+1)*profile+(j+1)%profile,base+(k+1)*profile+j]);}
      const shell=smooth(mesh('structure',v,f,'#a9b3ae',1,p=>p));shell.role='hull-boundary';shell.systemRole='pressurised-corridor';shell.centreline=path;
      const fv=[],ff=[];for(const frame of dense){fv.push(add(frame.p,add(mul(frame.side,-.85),[0,LINK_FLOOR-cy,0])),add(frame.p,add(mul(frame.side,.85),[0,LINK_FLOOR-cy,0])));}for(let i=0;i<dense.length-1;i++)ff.push([i*2,i*2+1,i*2+3,i*2+2]);mesh('structure',fv,ff,'#9ea596',1,p=>p).role='corridor-floor';
    }
    pressureTunnel(habitatPath);
    pressureTunnel(greenPath,true);
    box('structure',[rects[2].x1,2.1,spineZ],[.12,4.2,2.5],'#a9b3ae',[0,0,0],1,p=>p).role='hull-boundary';
    pressureTunnel(greenhouseThreshold);
    // Greenhouse: eight glazed vault halls on foundations either side of the spine. The glazing transmits Proxima's light;
    // it is drawn semi-opaque so the material reads as a surface.
    const glazing='#d9e6e2',glazingOpacity=.42,hallRects=[];
    for(let bay=0;bay<8;bay++){
      const x=hallX[bay%4],side=bay<4?1:-1,z=spineZ+side*(LINK_HW+hallL/2),place=q=>add(q,[x,LINK_FLOOR,z]),near=-side*hallL/2,direct=bay===3;
      box('farm',[x,LINK_FLOOR/2-.06,z],[2*hallR,LINK_FLOOR-.12,hallL],'#a9b3ae',[0,0,0],1,p=>p).role='hall-skirt';
      box('farm',[0,-.06,0],[2*hallR,.12,hallL],'#9ea596',[0,0,0],1,place).role='greenhouse-floor';
      hallRects.push({x0:x-hallR,x1:x+hallR,z0:z-hallL/2,z1:z+hallL/2,name:`Greenhouse hall ${bay+1}`,id:`greenhouse-${bay+1}`});
      const shell=vault('farm',hallL,hallR,glazing,glazingOpacity,place,18,direct?[0,0]:side>0?[0,1]:[1,0]);shell.role='farm-pressure-envelope';shell.farmBay=bay;shell.builtLocally=true;
      // Build both doorway reveals from the same arch samples as the vault so the glazing meets its frame.
      for(const end of direct?[near,-near]:[near]){
        const ev=[],ef=[],xs=[-1,1,...Array.from({length:19},(_,i)=>hallR*Math.cos(Math.PI*i/18))].sort((a,b)=>a-b);
        const h=x=>Math.sqrt(Math.max(0,hallR*hallR-x*x));
        for(let i=0;i<xs.length-1;i++){
          const x0=xs[i],x1=xs[i+1],y0=Math.abs((x0+x1)/2)<1?2.25:0,b=ev.length;
          ev.push([x0,y0,end],[x1,y0,end],[x1,h(x1),end],[x0,h(x0),end]);ef.push([b,b+1,b+2,b+3]);
        }
        mesh('farm',ev,ef,glazing,glazingOpacity,place).role='hull-boundary';
        for(const x of [-1.06,1.06])box('farm',[x,1.125,end],[.12,2.25,.22],'#8a9c97',[0,0,0],1,place).role='hull-boundary';
        box('farm',[0,2.31,end],[2.24,.12,.22],'#8a9c97',[0,0,0],1,place).role='hull-boundary';
      }
      // Arched ribs carry the glazing.
      for(let k=0;k<=4;k++){const zz=-hallL/2+hallL*k/4;for(let i=0;i<9;i++){const a0=Math.PI*i/9,a1=Math.PI*(i+1)/9;pipe('farm',[hallR*Math.cos(a0),hallR*Math.sin(a0),zz],[hallR*Math.cos(a1),hallR*Math.sin(a1),zz],.07,'#6f7c7a',place).role='greenhouse-rib';}}
      // Trays run along the hall; the lowest tier sits 0.5 m above the floor.
      for(const bank of [-2.85,2.85])farmBay([0,0,0],q=>place(add(rotate(q,[0,Math.PI/2,0]),[bank,2.3,0])),bay,true);
      // Entry just inside the door, looking down the hall.
      (scene.rooms??=[]).push({id:`greenhouse-${bay+1}`,select:'farm',label:`Greenhouse hall ${bay+1}`,eye:[x,LINK_FLOOR+1.35,z-side*(hallL/2-1.5)],up:[0,1,0],forward:[0,0,side]});
    }
    // The roll-out blankets are supported above the graded pad, with service aisles between strips.
    const SS2=data.selected_specification.surface_solar,LOAD=SS2.design_kW/1000,toward=PROXIMA_SKY_DIR;
    const SW=5,SG=1,columns=2,nRows=Math.ceil(SS2.area_m2/(SW*80*columns)),SL=SS2.area_m2/(SW*columns*nRows);
    const cols=[[-SL-3,-3],[3,SL+3]].map(([x0,x1])=>[x0+SOLAR_PAD.x,x1+SOLAR_PAD.x]);
    const zA=SOLAR_PAD.z-nRows*(SW+SG)/2,zB=zA+nRows*(SW+SG),padY=0,pvY=.18;
    const pad=box('ground',[SOLAR_PAD.x,padY-.1,(zA+zB)/2],[2*SL+18,.2,zB-zA+12],'#9c6b4c',[0,0,0],1,p=>p);
    pad.role='graded-pad';
    for(const [x0,x1] of cols){
      for(let i=0;i<nRows;i++){
        const z0=zA+i*(SW+SG),z=z0+SW/2;
        const blanket=box('power',[(x0+x1)/2,pvY-.025,z],[SL,.05,SW],'#1d3a52',[0,0,0],1,p=>p);
        blanket.role='solar-array';blanket.material=5;
        for(const edge of [z0+.12,z0+SW-.12])box('power',[(x0+x1)/2,(pvY-.05)/2,edge],[SL,pvY-.05,.12],'#647578',[0,0,0],1,p=>p).role='solar-anchor-rail';
        line('power',[x0,pvY+.02,z],[x1,pvY+.02,z],'#b9a36a',p=>p,1);
      }
      box('power',[x0-1.5,.4,SOLAR_PAD.z],[1.4,.8,zB-zA],'#8d9a97',[0,0,0],1,p=>p).role='solar-combiner-trench';
    }
    const rows=nRows*columns;
    const PX=bx+ROUT+12,PZ=LINK_Z-16;
    // Battery cabinets: ribbed housings with door seams, vent grilles, a roof cooling unit and cable trays.
    for(let i=0;i<2;i++){const c=[PX,1.3,PZ+i*3.6];box('power',c,[3,2.6,2.4],'#d6d4c8',[0,0,0],1,p=>p).role='battery-store';
      for(const dx of [-.75,0,.75])box('power',add(c,[dx,0,-1.21]),[.03,2.3,.02],'#9aa59d',[0,0,0],1,p=>p).role='battery-door-seam';
      for(let k=0;k<4;k++)box('power',add(c,[-1.1+k*.25,.7,-1.22]),[.18,.5,.02],'#5f6d6f',[0,0,0],1,p=>p).role='battery-vent';
      box('power',add(c,[0,1.55,0]),[1.6,.5,1.2],'#9aa59d',[0,0,0],1,p=>p).role='battery-cooling-unit';cylinder('power',add(c,[0,1.81,0]),.35,.04,'#5f6d6f','y',1,p=>p).role='battery-cooling-unit';
      for(const dz of [-1,1])box('power',add(c,[1.55,-.4,dz*.6]),[.1,1.6,.25],'#8d9a97',[0,0,0],1,p=>p).role='cable-tray';}
    for(let i=0;i<3;i++){box('power',[PX-6,1.6,PZ+i*5],[3.5,3.2,3],'#6d7f80',[0,0,0],1,p=>p).role='switchyard-transformer';for(const dz of [-.8,.8])cylinder('power',[PX-6,3.8,PZ+i*5+dz],.12,1.2,'#c7b98f','y',1,p=>p);}
    box('power',[xm,1.4,-30],[4,2.8,3],'#6d7f80',[0,0,0],1,p=>p).role='settlement-substation';
    line('power',[PX-6,.3,PZ],[xm,.3,-30],'#c99e67',p=>p,2);line('power',[PX,.3,PZ],[SOLAR_PAD.x,.3,SOLAR_PAD.z-nRows*(SW+SG)/2],'#c99e67',p=>p,2);
    // Load heat: the electricity ends as heat, rejected by fan-driven air-cooled dry coolers (using the atmosphere the entry
    // relies on), beside the power yard.
    {const units=4,x0=PX+6;for(let i=0;i<units;i++){const c=[x0+(i%4)*4.6,1.6,PZ+(i>>2)*6.2];box('radiators',c,[4,3.2,5.6],'#7f8f8c',[0,0,0],1,p=>p).role='air-cooler';
        for(let k=0;k<2;k++){cylinder('radiators',add(c,[0,1.62,(k-.5)*2.6]),1.1,.12,'#3e4a4c','y',1,p=>p).role='air-cooler-fan';torus('radiators',add(c,[0,1.68,(k-.5)*2.6]),1.12,.06,'#9aa8a0','z',q=>add(rotate(sub(q,add(c,[0,1.68,(k-.5)*2.6])),[Math.PI/2,0,0]),add(c,[0,1.68,(k-.5)*2.6])));}
        for(let k=0;k<6;k++)box('radiators',add(c,[-2.01,-.2,-2.3+k*.92]),[.02,2.4,.6],'#5f6d6f',[0,0,0],1,p=>p).role='air-cooler-fins';}
      for(const z of [PZ-3.3,PZ+9.5])pipe('radiators',[x0-2.5,.5,z],[x0+4.6*3+2.5,.5,z],.22,'#be9470',p=>p).role='radiator-header';
      scene.labels.push({p:[x0+7,6,PZ+3],text:'Air coolers'});scene.heatRejection={units,MW:LOAD};}
    scene.solarField={electricalMW:LOAD,fluxWm2:SS2.flux_W_m2,incidence:SS2.incidence,systemEfficiency:SS2.net_efficiency,areaM2:rows*SL*SW,storageMWh:SS2.storage_MWh,rows,rollOut:true,starElevationDeg:Math.asin(toward[1])*180/Math.PI};
    scene.labels.push({p:[SOLAR_PAD.x,6,SOLAR_PAD.z],text:'Roll-out solar array'},{p:[PX,5,PZ+2],text:'Batteries'});
    // Cargo modules just south of the A-B link (clear of both habitat hulls), joined to it and to each other by short
    // pressurised tunnels.
    const cm1=LINK_Z-11,cm2=cm1-11;for(const z of [cm1,cm2])cargoModule([xm,4,z],p=>p,false,true);
    pressureTunnel([[xm,LINK_Z-LINK_HW+.45],[xm,cm1+3.05]]);pressureTunnel([[xm,cm1-3.05],[xm,cm2+3.05]]);
    box('cargo',[xm,2.9,cm2-3.42],[2.16,2.3,.14],'#7a908a',[0,0,0],1,p=>p).role='hull-boundary';
    // ---- Inflatable residences: two closed two-storey cylinders unpacked from the disc lofts, one behind each disc.
    // Surface expansion provides room for the adult crew and later families; each joins its disc through a short tunnel.
    const SI=data.design.surface_inflatables,IS=L.surface_inflatables_study,IR=SI.radius_m,IL=SI.cylinder_length_m,resRects=[];
    for(const [k,cx] of DISC_X.entries()){
      const dockX=k?-RES_X:RES_X,cz=SURF_Z[k]+ROUT+5.5+IR,cy=LINK_FLOOR-IS.lower_floor_y_m,z0=SURF_Z[k]+Math.sqrt(ROUT*ROUT-dockX*dockX),skin=state.cutaway?.16:1,id='inflatable';
      // World frame at the module centre; down() is the same frame with y measured downward, as the furniture helpers expect.
      const t=q=>add(q,[cx,cy,cz]),down=q=>t([q[0],-q[1],q[2]]),lowerY=-IS.lower_floor_y_m,upperY=-IS.upper_floor_y_m,chord=y=>2*Math.sqrt(IR*IR-y*y);
      const hull=tube(id,[-IL/2,0,0],[1,0,0],[0,1,0],[0,0,1],IR,
        [0,dockX+IL/2-1,dockX+IL/2+1,IL],state.detail==='high'?48:24,COLORS.inflatable,t,
        ([x,y,z])=>Math.abs(x-dockX)<1&&z<0&&y>IS.lower_floor_y_m&&y<IS.lower_floor_y_m+2.35);
      hull.opacity=skin;hull.role='inflatable-habitat-shell';hull.residence=k+1;
      pressureCaps(id,[0,0,0],IR,IL/2,IR,COLORS.inflatable,skin,t,0);
      for(let x=-IL/2;x<=IL/2+.01;x+=2)torus(id,[x,0,0],IR+.03,.05,'#b3a279','x',t).role='restraint-hoop';
      // Windows: rectangular panes in rigid frames set into the skin between the hoops, on both decks and both sides.
      for(const side of [-1,1])for(const [ya,yb] of [[-IS.lower_floor_y_m-1.7,-IS.lower_floor_y_m-.7],[-IS.upper_floor_y_m-1.6,-IS.upper_floor_y_m-.7]])for(let x=-IL/2+1;x<IL/2-.5;x+=2){
        if(side<0&&ya>0&&Math.abs(x-dockX)<1.7)continue;
        const ang=y=>Math.asin(Math.max(-.98,Math.min(.98,-y/IR))),pt=(xx,y)=>[xx,-y,side*IR*Math.cos(ang(y))*1.005];
        const g=mesh(id,[pt(x-.6,ya),pt(x+.6,ya),pt(x+.6,yb),pt(x-.6,yb)],[[0,1,2,3]],'#8fb3c0',.42,t);g.role='window-glass';g.material=5;
        for(const [a,b] of [[[x-.6,ya],[x+.6,ya]],[[x+.6,ya],[x+.6,yb]],[[x+.6,yb],[x-.6,yb]],[[x-.6,yb],[x-.6,ya]],[[x,ya],[x,yb]]])pipe(id,pt(...a),pt(...b),.03,'#cad2ce',t).role='window-frame';}
      for(let j=0;j<12;j++){const a=j*Math.PI/6;pipe(id,[-IL/2,IR*Math.cos(a)*1.01,IR*Math.sin(a)*1.01],[IL/2,IR*Math.cos(a)*1.01,IR*Math.sin(a)*1.01],.035,'#b3a279',t).role='restraint-strap';}
      for(const x of [-IL/2+1,IL/2-1])for(const side of [-1,1]){pipe(id,[x,-IR*.55,side*IR*.84],[x,-cy+.1,side*(IR+1.3)],.04,'#8d7f5e',t).role='ground-anchor';box(id,[x,-cy+.1,side*(IR+1.3)],[.5,.2,.5],'#7b6a5c',[0,0,0],1,t);}
      // Lower deck: dining and commons for sixteen, a galley wall and hygiene; upper deck: eight couple cabins.
      box(id,[0,lowerY+.06,0],[IL+1.5,.12,chord(IS.lower_floor_y_m)-.2],'#b9c1aa',[0,0,0],1,down).role='residence-floor';
      box(id,[-.9,upperY+.05,0],[IL-.3,.1,chord(IS.upper_floor_y_m)-.2],'#a7b4a7',[0,0,0],1,down).role='residence-floor';
      for(const x of [-4.5,-1.5,1.5,4.5]){table(id,[x,lowerY-.75,-1.25],1.7,down);for(const dx of [-.45,.45])for(const sz of [-1,1])seat(id,[0,0,0],q=>down(add([x+dx,lowerY-.48,-1.25+sz*.95],rotate(q,[0,sz>0?Math.PI:0,0]))));}
      for(const x of [-4,-1.6,.8]){box(id,[x,lowerY-.95,2.55],[2.2,1.9,.6],'#dde0d2',[0,0,0],1,down).role='galley-unit';box(id,[x,lowerY-.48,2.2],[2.2,.06,.75],'#b9bba6',[0,0,0],1,down);}
      for(const x of [3.6,5.2]){box(id,[x,lowerY-1.05,2.2],[1.4,2.1,.06],'#b8c9be',[0,0,0],1,down).role='hygiene-cubicle';box(id,[x+.7,lowerY-1.05,2.6],[.06,2.1,.8],'#b8c9be',[0,0,0],1,down);cylinder(id,[x,lowerY-.3,2.65],.28,.55,'#d4d9cf','y',1,down);}
      for(const side of [-1,1])for(const x of [-5.4,-2.4,.6,3.6]){
        box(id,[x,upperY-.25,side*2.1],[1.95,.4,1.45],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,down).role='couple-bed';box(id,[x-.7,upperY-.5,side*2.1],[.4,.12,1.2],'#e6e6d5',[0,0,0],1,down);
        box(id,[x+1.5,upperY-.95,side*1.9],[.06,1.9,2.6],'#c9c2a8',[0,0,0],1,down).role='fabric-partition';box(id,[x+.9,upperY-.5,side*.72],[1.2,1,.05],'#c9c2a8',[0,0,0],1,down).role='fabric-partition';
        box(id,[x-.2,upperY-.45,side*3],[.9,.9,.4],'#a6b1a2',[0,0,0],1,down).role='cabin-locker';}
      for(const z of [-.25,.25])pipe(id,[IL/2-.4,lowerY,z],[IL/2-.4,upperY-1,z],.035,'#9fb2ad',down).role='access-ladder';
      for(let y=lowerY-.3;y>upperY;y-=.3)pipe(id,[IL/2-.4,y,-.25],[IL/2-.4,y,.25],.025,'#c3c6b2',down);
      for(const x of [dockX-1.05,dockX+1.05])box(id,[x,IS.lower_floor_y_m+1.14,-IR+.35],[.12,2.28,1.05],'#8a9391',[0,0,0],1,t).role='hull-boundary';
      box(id,[dockX,IS.lower_floor_y_m+2.33,-IR+.35],[2.22,.14,1.05],'#8a9391',[0,0,0],1,t).role='hull-boundary';
      pressureTunnel([[cx+dockX,z0-1],[cx+dockX,cz-IR+1.15]]);
      rects.push({x0:cx+dockX-LINK_HW,x1:cx+dockX+LINK_HW,z0:z0-.4,z1:cz-IR+1,name:`Residence ${k+1} link`});
      resRects.push({x0:cx-IL/2-IR+.8,x1:cx+IL/2+IR-.8,z0:cz-3,z1:cz+3,name:`Residence ${k+1}`,id:`residence-${k+1}`});
      scene.rooms.push({id:`residence-${k+1}`,select:'inflatable',label:`Residence ${k+1}`,eye:[cx-5.6,LINK_FLOOR+1.35,cz+.6],up:[0,1,0],forward:[1,0,0]});
      scene.labels.push({p:[cx,cy+IR+3,cz],text:`INFLATABLE RESIDENCE ${k+1} · ${Math.round(SI.floor_area_m2_per_module.lower+SI.floor_area_m2_per_module.upper)} m²`});
    }
    scene.inflatables={count:SI.count,grossFloorAreaM2:SI.gross_floor_area_m2,hardwareKg:SI.hardware_kg};
    scene.surfaceMap={habitats:[0,1].map(d=>({name:d?'B':'A',centre:[DISC_X[d],SURF_Z[d]],turn:SURF_TURN[d],rings:[...SURF_RC.map((rc,deck)=>({deck,r0:rc-SURF_HALF,r1:rc+SURF_HALF})),{deck:1,r0:0,r1:SURF_CORE}],rooms:surfaceRooms[d],cabins:surfaceCabins[d]})),
      corridors:rects.map(({x0,x1,z0,z1,name})=>({x0,x1,z0,z1,name})),halls:[...hallRects,...resRects],rover:{x0:86.5,x1:93.5,z0:-44.3,z1:-39.7}};
    for(const room of scene.rooms)room.surfaceMap=scene.surfaceMap;
    scene.driveObstacles=[...scene.surfaceMap.habitats.map(h=>({x:h.centre[0],z:h.centre[1],r:24})),...[...hallRects,...resRects].map(r=>({x0:r.x0-4.5,x1:r.x1+4.5,z0:r.z0-4.5,z1:r.z1+4.5})),...rects.map(r=>({x0:r.x0-4.5,x1:r.x1+4.5,z0:r.z0-4.5,z1:r.z1+4.5})),{x0:33,x1:55,z0:-76,z1:-46},{x:183,z:104,r:77}];
    const roverOrigin=[90,0,-42],roverTransform=p=>add(p,roverOrigin);
    roverCabin([0,3.5,0],roverTransform);
    // The rover cabin can be entered; its floor is 1.55 m below the hull axis.
    scene.rooms.push({id:'rover',select:'rover',label:'Crewed rover cabin',driver:true,eye:add(roverOrigin,[2.3,4.05,0]),up:[0,1,0],forward:[1,0,0]});
    box('rover',[0,1.2,0],[8,.6,5],'#8f9c91',[0,0,0],1,roverTransform);
    for(const x of [-3,0,3])for(const z of [-2.6,2.6]){cylinder('rover',[x,1,z],.85,.5,'#374548','z',1,roverTransform);cylinder('rover',[x,1,z+Math.sign(z)*.26],.5,.05,'#adb8a9','z',1,roverTransform);pipe('rover',[x,1,z],[0,1.5,0],.1,'#a2afa8',roverTransform);}
    // The two robotic micro-rovers, deployed (modelled z-up, turned so z is vertical on the ground).
    for(const x of [-5,4])microRover([0,0,0],q=>add(rotate(q,[-Math.PI/2,0,0]),[x,0,-80]));
    scene.labels.push({p:[ax,8,az],text:'HABITAT A / REDEPLOYED'},{p:[bx,8,bz],text:'HABITAT B / REDEPLOYED'},{p:[(hallX[0]+hallX.at(-1))/2,10,spineZ-8],text:'GREENHOUSE · 8 GLAZED HALLS'},{p:[xm,7,LINK_Z],text:'A–B PRESSURISED LINK'},{p:[90,8,-42],text:'CREWED ROVER'},{p:[xm,10,cm1-5],text:'CARGO MODULES'},{p:[xm,5,-30],text:'SUBSTATION'});
  }else{
    scene.labels.push({p:body(place(0,[0,24,0])),text:'HABITAT A'},{p:body(place(1,[0,-24,0])),text:'HABITAT B'});
  }
  if(state.dimensions){
    if(ship)scene.dimensions.push({a:body([GEO.screen.catcher_x,-20,8]),b:body([GEO.source_x+14,-20,8]),text:`${Math.round(GEO.ship_length_m)} m · BOW PLATE TO NOZZLE`},{a:body([GEO.screen.x,-20,8]),b:body([GEO.screen.catcher_x,-20,8]),text:`${Math.round(GEO.screen.catcher_x-GEO.screen.x)} m · SCREEN MAST`},
      {a:body([L.disc_centres_x_m[0],-HAB.envelope_radius_m,-5]),b:body([L.disc_centres_x_m[0],HAB.envelope_radius_m,-5]),text:`DIAMETER ${(HAB.envelope_radius_m*2).toFixed(1)} m`});
    if(surface)scene.dimensions.push({a:[-96,.2,-132],b:[-42,.2,-132],text:'GREENHOUSE HALLS: GEOMETRY STUDY'});
  }
  if(state.showRadiators===false){scene.meshes=scene.meshes.filter(m=>m.id!=='radiators');scene.lines=scene.lines.filter(l=>l.id!=='radiators');}
  for(const m of scene.meshes){
    if(m.material===undefined)m.material=m.role==='porthole-glass'||m.id==='radiators'||['#507c8a','#739eaa','#638e96'].includes(m.color)?5:m.role==='folding-deck'||(m.id.startsWith('cabin-')&&m.color===COLORS.cabin)?4:m.id==='tanks'?3:m.role==='seat'||['#7eb6aa','#d2a079','#e6e6d5','#a3c0ae','#c9af91'].includes(m.color)?2:0;
  }
  if(crewShip&&flight.phase!=='entry'){
    // Transfer corridor: up each hub's spin axis, across above the gap, and down between the discs to the food trains.
    const floors=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m,xA=DISC_X[0],xB=DISC_X[1],xm=(xA+xB)/2,zc=data.selected_specification.layout.corridor_z_m;
    for(const x of [xA,xB])tube('transfer',[x,0,HUB_HALF],[0,0,1],[1,0,0],[0,1,0],TUBE_R,[0,.5,zc-HUB_HALF],24,'#b9c6bf',body).role='transfer-corridor';
    tube('transfer',[xA-TUBE_R,0,zc],[1,0,0],[0,1,0],[0,0,1],TUBE_R,Array.from({length:Math.ceil((xB-xA+2*TUBE_R)/.5)+1},(_,i)=>Math.min(xB-xA+2*TUBE_R,i*.5)),24,'#b9c6bf',body,p=>p[2]<zc-.3&&[xA,xB,xm].some(x=>Math.abs(p[0]-x)<(x===xm?.65:.9))).role='transfer-corridor';
    for(const x of [xA-TUBE_R,xB+TUBE_R])cylinder('transfer',[x,0,zc],TUBE_R+.015,.1,'#b9c6bf','x',1,body).role='transfer-end-cap';
    tube('transfer',[xm,0,zc],[0,0,-1],[1,0,0],[0,1,0],.7,[0,.5,1,zc-.6,zc+.7],24,'#b9c6bf',body,p=>p[2]<.9&&Math.abs(p[1])>.3).role='crew-passage';
    for(let x=xA+1.5;x<xB-1;x+=1.5)torus('transfer',[x,0,zc],TUBE_R-.06,.03,'#d0cdb4','x').role='corridor-handhold';
    world={segments:[...[0,1].map(h=>{const a=place(h,[0,0,-HUB_HALF+.4]),b=place(h,[0,0,HUB_HALF-.1]);return {a,b,r:HUB_R-.4};}),
        ...[xA,xB].map(x=>({a:[x,0,HUB_HALF-.5],b:[x,0,zc+.3],r:TUBE_R-.25,name:'Transfer corridor'})),{a:[xA-.3,0,zc],b:[xB+.3,0,zc],r:TUBE_R-.25,name:'Transfer corridor'},{a:[xm,0,zc+.2],b:[xm,0,-.2],r:.54,name:'Crew transfer passage'}],
      habitats:Object.fromEntries([0,1].map(h=>[h?'B':'A',{centre:place(h,[0,0,0]),axis:sub(place(h,[0,0,1]),place(h,[0,0,0])),basis:[1,0,0],decks:[0,1,2].map(k=>deckInfo.get(`${h}-${k}`)??null),ladders:ladders.get(h)??[],hubTop:HUB_HALF,hubRadius:HUB_R-.4,hubGravity:L.spin_gravity_g*(HUB_R-1)/floors[0]}]))};
    const segments=[];
    for(const module of crewModules){
      const sy=module.side,near=sy>0?module.y0:module.y1;
      tube('transfer',[xm,0,0],[0,sy,0],[1,0,0],[0,0,1],.7,[0,.5,Math.abs(near)+.02],24,'#b9c6bf',body,p=>sy*p[1]<.6&&Math.hypot(p[0]-xm,p[2])<.8).role='crew-passage';
      segments.push({a:[xm,0,0],b:[xm,near+sy*.1,0],r:.54,name:'Crew transfer passage'});
      segments.push({a:[xm,module.y0-.05,0],b:[xm,module.y1+.05,0],r:module.r-.3,name:module.name,id:module.id});
      (scene.rooms??=[]).push({id:module.id,select:module.select,label:module.name,pressurizedModule:true,eye:[...module.centre],up:[0,0,-1],forward:[0,sy,0]});
    }
    // Viewing windows along both sides of the transfer tube (in place of a separate cupola): tinted panes with frames,
    // each with an external shutter that closes for shielding. EVA uses the habitats' own airlocks and suits; the ship
    // adds only handrails, tether points and a small robotic arm.
    for(const sy of [-1,1])for(let x=xA+3;x<=xB-3;x+=2.2){if(Math.abs(x-xm)<1.2)continue;const y=sy*(TUBE_R+.01);
      const g=box('transfer',[x,y,zc+.15],[1.1,.04,.7],'#8fb3c0',[0,0,0],.42);g.role='window-glass';g.material=5;
      for(const [p0,p1] of [[[-.58,-.4],[.58,-.4]],[[.58,-.4],[.58,.4]],[[.58,.4],[-.58,.4]],[[-.58,.4],[-.58,-.4]],[[0,-.4],[0,.4]]])pipe('transfer',[x+p0[0],y*1.01,zc+.15+p0[1]],[x+p1[0],y*1.01,zc+.15+p1[1]],.025,'#cad2ce').role='window-frame';
      box('transfer',[x,sy*(TUBE_R+.08),zc+.62],[1.2,.05,.18],'#c9c4ad').role='window-shutter';}
    scene.labels.push({p:body([xm+3,-(TUBE_R+.6),zc+.9]),text:'Windows'});
    for(let x=xA+2;x<=xB-2;x+=4)for(const sy of [-1,1])torus('structure',[x,sy*(TUBE_R+.15),zc-.75],.12,.03,'#d7c27a','z').role='eva-tether-point';
    // Robotic arm stowed along the corridor side (unfolds for work; stays inside the shield outline when stowed).
    {const b0=[xB-5,TUBE_R+.25,zc],j1=[xB-7.5,TUBE_R+.5,zc+.3],j2=[xB-9.5,TUBE_R+.5,zc-.3];
      cylinder('structure',b0,.45,.5,'#9aa8a0','y').role='robotic-arm';pipe('structure',add(b0,[0,.25,0]),j1,.18,'#e0ddd2').role='robotic-arm';
      smooth(sphere('structure',j1,[.28,.28,.28],'#9aa8a0')).role='robotic-arm';pipe('structure',j1,j2,.15,'#e0ddd2').role='robotic-arm';box('structure',j2,[.5,.5,.5],'#7f8f8c').role='robotic-arm-end-effector';
      scene.labels.push({p:body(add(j1,[0,0,.8])),text:'Robotic arm'});}
    for(const sz of [-.55,.55]){for(let x=xA+1.5;x<=xB-1.5;x+=2)pipe('structure',[x,TUBE_R*.85,zc+sz],[x,TUBE_R+.22,zc+sz],.025,'#d7c27a').role='eva-handrail';pipe('structure',[xA+1.5,TUBE_R+.22,zc+sz],[xB-1.5,TUBE_R+.22,zc+sz],.035,'#d7c27a').role='eva-handrail';}
    scene.labels.push({p:body([xm,TUBE_R+.6,zc+.9]),text:'Handrails'});
    world.segments.push(...segments);scene.crewModules=crewModules;
    scene.world=world;
    for(const room of scene.rooms??[])if(room.pressurizedModule)room.gravity={type:'float',world};
  }
  // Walkable while spinning (radial gravity) or burning (thrust gravity toward the engine); entry has no designed interior.
  if(crewShip&&!spinning&&!engine)scene.rooms=[];
  if(spinning)for(const room of scene.rooms??[]){
    if(room.pressurizedModule)continue;
    const habitat=room.id.startsWith('cabin-')?(+room.id.slice(6)<=CABINS_PER_DISC?0:1):(room.id.split('-')[1]==='A'?0:1);
    const centre=place(habitat,[0,0,0]);
    const deck=room.id.startsWith('cabin-')?0:+room.id.split('-')[2];
    room.gravity={world,habitat:habitat?'B':'A',deck,decks:[0,1,2].map(k=>deckInfo.get(`${habitat}-${k}`)??null),ladders:ladders.get(habitat)??[],walls:deckInfo.get(`${habitat}-${deck}`)?.walls??[],centre,axis:sub(place(habitat,[0,0,1]),centre),radius:Math.hypot(room.eye[0]-centre[0],room.eye[1]),axialMin:-L.disc_axial_depth_m/2+.3,axialMax:L.disc_axial_depth_m/2-.3};
  }
  // Settlement sky (uses the surface layout above; independent of the flight display turn).
  if(surface){
    const env=data.settlement.proxima_b_sky,C0=SETTLEMENT_CENTRE,terrain=settlementTerrain;
    const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),toHex=a=>'#'+a.map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0')).join(''),lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
    // Terrain: a graded pad under the settlement, then dunes and low hills rising to distant ridges.
    // Wind and a thin atmosphere erode small craters, so only two old, softened ones remain in view.
    scene.terrain={centre:C0,flatRadius:260};
    scene.meshes.push(...settlementPlanet(data).map(part=>({...part})));
    // Scattered rocks, kept clear of buildings, links and the rover yard.
    let seed=11;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const keepOut=[[DISC_X[0],SURF_Z[0],24],[DISC_X[1],SURF_Z[1],24],[DISC_X[0],SURF_Z[0]+20,16],[DISC_X[1],SURF_Z[1]+20,16],[0,LINK_Z,14],[-40,-72,45],[SOLAR_PAD.x,SOLAR_PAD.z,SOLAR_PAD.r],[90,-42,10],[0,-62,16],[40,-55,22],[0,-80,8],[-1,-30,6]];
    const rockGroups=[['#6e4b38',[],[]],['#7d5a45',[],[]],['#5a3d2f',[],[]]];
    for(let i=0;i<700;i++){const r=30+1500*Math.pow(random(),1.6),a=random()*2*Math.PI,x=C0[0]+r*Math.cos(a),z=C0[1]+r*Math.sin(a),size=.25+1.6*Math.pow(random(),3);
      if(keepOut.some(([kx,kz,kr])=>Math.hypot(x-kx,z-kz)<kr+size))continue;
      const [,v,f]=rockGroups[i%3],b=v.length,y=terrain(x,z)-size*.25,j=()=>.75+.5*random();
      for(const p of [[1,0,0],[-1,0,0],[0,1,0],[0,-.4,0],[0,0,1],[0,0,-1]])v.push([x+p[0]*size*j(),y+p[1]*size*j(),z+p[2]*size*j()]);
      for(const [p,q,s] of [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]])f.push([b+p,b+q,b+s]);}
    for(const [color,v,f] of rockGroups)mesh('ground',v,f,color,1,p=>p).role='rock';
    for(const [x,z,r] of [[-700,520,70],[950,-600,110]]){const y=terrain(x,z);
      mesh('ground',Array.from({length:32},(_,i)=>[x+r*Math.cos(i/32*2*Math.PI),y+.3,z+r*Math.sin(i/32*2*Math.PI)]),[Array.from({length:32},(_,i)=>31-i)],'#7a523b',1,p=>p).role='crater';
      torus('ground',[x,y,z],r,r*.05,'#94684d','y',p=>add(rotate(sub(p,[x,y,z]),[Math.PI/2,0,0]),[x,y,z])).role='crater-rim';}
    // Daytime sky with a thin dusty atmosphere (assumed): rust haze at the horizon to a dark zenith.
    // Smooth sky: dusty horizon haze to a dark zenith, forward-scattered glow around Proxima, and regolith-coloured
    // haze below the horizon so the distant ground never ends at an edge. Drawn relative to the camera.
    {const toward=PROXIMA_SKY_DIR,R=4900,rings=40,n=72,v=[],f=[],colors=[],H=hex('#946652'),Z=hex('#110e17'),G=hex('#5a3a29'),S=hex('#e09466');
     for(let j=0;j<=rings;j++){const e=-Math.PI/2+Math.PI*j/rings;for(let i=0;i<n;i++){const a=i/n*2*Math.PI,d=[Math.cos(e)*Math.cos(a),Math.sin(e),Math.cos(e)*Math.sin(a)];v.push(mul(d,R));
       let c=e<0?lerp(H,G,Math.min(1,-e/.12)):lerp(H,Z,Math.pow(Math.sin(e),.45));const psi=Math.acos(Math.max(-1,Math.min(1,dot(d,toward))));colors.push(toHex(lerp(c,S,.55*Math.exp(-psi/.3)*(e<0?.3:1))));}}
     for(let j=0;j<rings;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);
     const dome=mesh('sky',v,f,'#946652',1,p=>p);dome.colors=colors;dome.material=-2;dome.role='sky-dome';}
    // Proxima Centauri: a 0.154 solar-radius red dwarf 0.0486 AU away spans about 1.7°, roughly three times the Sun seen from Earth.
    const proximaAngle=2*Math.atan(env.star_radius_solar*695700/(env.orbit_au*149597870.7)),sunDir=PROXIMA_SKY_DIR,proximaR=4500*Math.tan(proximaAngle/2);
    for(const [r,color,opacity,shift] of [[proximaR*5,'#ff7a3d',.07,40],[proximaR*2.2,'#ff8448',.22,20],[proximaR,'#ff9257',1,0]]){const d=skyDisc(mul(sunDir,4500+shift),r,color,opacity,48);d.role=r===proximaR?'proxima':'proxima-glow';if(r===proximaR)d.angularDiameterDeg=proximaAngle*180/Math.PI;}
    // Alpha Centauri A and B from about 13,000 AU: a bright pair, magnitudes about -6.6 and -5.3, roughly 0.13° apart.
    const abDir=norm([.45,.62,-.64]),abU=norm(cross(abDir,[0,1,0])),sep=env.alpha_cen_separation_au/env.alpha_cen_distance_au;
    for(const [name,m0,offset,size] of [['A',env.alpha_cen_A_mag_from_earth,0,7],['B',env.alpha_cen_B_mag_from_earth,sep,5]]){const dir=norm(add(abDir,mul(abU,offset))),mag=m0+5*Math.log10(env.alpha_cen_distance_au/env.alpha_cen_earth_distance_au);
      const s=skyDisc(mul(dir,4600),size,'#fff3dc',1,12);s.role='alpha-centauri-'+name;s.apparentMagnitude=mag;skyDisc(mul(dir,4601),size*3,'#fff3dc',.15,16).role='star-glow';}
  }
  if(surface)scene.surfaceSky=scene.meshes.filter(m=>m.id==='sky');
  if(engine)for(const room of scene.rooms??[]){const b=room.burn;if(!b)continue;const info=burnRooms.get(b.room),fr=discFrames[b.d];
    room.gravity={type:'linear',roomId:room.id,habitat:b.d?'B':'A',frame:{origin:[...fr.origin],down:[...fr.down],u:[...fr.u],w:[...fr.w]},levels:info.levels,ladders:info.ladders,level:b.level,wMin:-L.disc_axial_depth_m/2+.3,wMax:L.disc_axial_depth_m/2-.3,g:flight.accelerationG,roomName:b.cabinName??info.name};}
  }
  if(state.flat&&ship){
    // Display frame: flight stays along x; the discs' spin axis (native z) becomes vertical (inverse in spinPoint and gpu.js).
    const turn=p=>rotate(p,[Math.PI/2,0,0]);
    for(const m of scene.meshes){m.vertices=m.vertices.map(turn);if(m.normals)m.normals=m.normals.map(turn);}
    for(const l of scene.lines){l.a=turn(l.a);l.b=turn(l.b);}
    for(const l of scene.labels)l.p=turn(l.p);
    for(const lock of scene.airlocks??[])for(const key of ['centre','inner','outer'])lock[key]=turn(lock[key]);
    for(const r of scene.rooms??[]){r.eye=turn(r.eye);r.up=turn(r.up);r.forward=turn(r.forward);if(r.gravity?.centre){r.gravity.centre=turn(r.gravity.centre);r.gravity.axis=turn(r.gravity.axis);}if(r.gravity?.frame){const fr=r.gravity.frame;for(const k of ['origin','down','u','w'])fr[k]=turn(fr[k]);}}
    if(world){for(const g of world.segments){g.a=turn(g.a);g.b=turn(g.b);}for(const h of Object.values(world.habitats)){h.centre=turn(h.centre);h.axis=turn(h.axis);h.basis=turn(h.basis);}}
    scene.flat=true;
  }
  // Ship views get their sky from flightSky(), drawn per frame outside this cached scene.
  // Labels name the item and nothing more. Interior items get close-range labels (one per item), shown inside too.
  const simple=text=>{let t=text.split(' · ')[0].replace(/ \/ REDEPLOYED$/,'').replace(/\s*\d+ m²$/,'');if(t===t.toUpperCase())t=t.split(' ').map((w,i)=>/^[A-Z]{2,}$/.test(w)?(i?w.toLowerCase():w[0]+w.slice(1).toLowerCase()):w).join(' ');return t;};
  for(const l of scene.labels)l.text=simple(l.text);
  const ITEM={'shared-table':'Table','galley-unit':'Galley','waste-management-toilet':'Toilet','treadmill':'Treadmill','resistive-exercise-device':'Exercise machine','cycle-ergometer':'Exercise bike','virtual-window':'Virtual window','rack-backplane':'Equipment rack','spacesuit':'Spacesuit','fresh-food-tray':'Food trays','filter-column':'Water filter','pump-motor':'Pump','air-treatment-canister':'Air scrubber','fabrication-bed':'3D printer','cargo-transfer-bag':'Stowage bags','science-glovebox':'Glovebox','lower-berth':'Bunk','upper-berth':'Bunk','reproductive-bank':'Reproductive bank','cabin-wardrobe':'Wardrobe','cabin-desk':'Desk','access-ladder':'Ladder','airlock-door-frame':'Airlock door','food-bioreactor':'Bioreactor','food-processing-unit':'Food processor','couple-bed':'Bed','hygiene-cubicle':'Washroom','cabin-locker':'Locker','crop-tray':'Crop trays','window-glass':'Window','porthole-glass':'Window','ring-window-glass':'Window','suit-life-support-pack':'Life-support pack','tool-locker':'Tool locker','foot-restraint':'Foot restraint','window-shutter':'Shutter','eva-tether-point':'Tether point','rover-seat':'Seat','rover-console':'Controls','rover-galley':'Galley','rover-bunk':'Bunk','rover-suitport':'Suitport','rover-locker':'Locker','rover-screen':'Screen','rover-hand-controller':'Hand controller','light-strip':'Light'};
  const seen=new Set();
  for(const m of scene.meshes){const text=ITEM[m.role];if(!text||!m.vertices?.length)continue;const c=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length),key=`${m.id}:${text}:${c.map(v=>Math.round(v/1.5)).join(',')}`;
    if(seen.has(key))continue;seen.add(key);scene.labels.push({p:c,text,id:m.id,closeOnly:true,item:true});}
  return scene;
}

export function exportOBJ(scene){let offset=1,normalOffset=1;const rows=['# PROXIMA — metre-based detailed layout; not validated engineering geometry'];for(let m of scene.meshes){rows.push(`o ${m.id}`);for(let v of m.vertices)rows.push(`v ${v.map(x=>x.toFixed(4)).join(' ')}`);if(m.normals){for(let n of m.normals)rows.push(`vn ${n.map(x=>x.toFixed(6)).join(' ')}`);rows.push('s 1');}else rows.push('s off');for(let f of m.faces)rows.push(`f ${f.map(i=>m.normals?`${i+offset}//${i+normalOffset}`:i+offset).join(' ')}`);offset+=m.vertices.length;if(m.normals)normalOffset+=m.normals.length;}return rows.join('\n');}
