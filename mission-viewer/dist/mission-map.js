import {shipStateAt} from './model.js';
// Mission map: the Sun–Proxima route with both ships at the selected year, and distance against Earth year showing the
// cargo ship leaving 20 years before the crew and both arriving together. Kinematics come from missionTimeline().
const NS='http://www.w3.org/2000/svg',SHIPS=[['cargo','Cargo ship'],['crew','Crew ship']];
const PHASE={departure:'Awaiting departure',accel:'Acceleration burn',coast:'Coasting',braking:'Braking burn',orbit:'In orbit at Proxima b',entry:'Entry and landing'};
export const phaseName=p=>PHASE[p]??p;
function el(name,attrs={},parent,text){const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;parent?.append(e);return e;}
export function renderMissionMap(root,T,year,onScrub){
  const W=900,H=590,end=T.crew.opsEnd,D=T.crew.distanceLy,m={l:64,r:150,top:208,bottom:56},cw=W-m.l-m.r,ch=H-m.top-m.bottom;
  const X=y=>m.l+y/end*cw,Y=d=>m.top+ch-d/D*ch,RX=d=>m.l+d/D*cw;
  root.textContent='';
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,class:'mission-map-svg',role:'img','aria-label':`Mission map. Cargo departs year ${T.cargo.depart}, crew departs year ${T.crew.depart}; both arrive at year ${T.crew.arrive.toFixed(1)}.`},root);
  // ---- Route strip: Sun to Proxima b at true relative distance, one lane per ship.
  el('text',{x:m.l,y:28,class:'mm-title'},svg,'Route at the selected year');
  const lanes={cargo:80,crew:120};
  el('line',{x1:RX(0),x2:RX(D),y1:100,y2:100,class:'mm-route'},svg);
  for(let ly=0;ly<=Math.floor(D);ly++){el('line',{x1:RX(ly),x2:RX(ly),y1:96,y2:104,class:'mm-tick'},svg);el('text',{x:RX(ly),y:148,class:'mm-axis','text-anchor':'middle'},svg,`${ly} ly`);}
  el('circle',{cx:RX(0),cy:100,r:9,class:'mm-sun'},svg);el('text',{x:RX(0),y:62,class:'mm-body','text-anchor':'middle'},svg,'Sun');
  el('circle',{cx:RX(D),cy:100,r:6,class:'mm-proxima'},svg);el('text',{x:RX(D),y:62,class:'mm-body','text-anchor':'middle'},svg,`Proxima b · ${D.toFixed(2)} ly`);
  for(const [kind,name] of SHIPS){const s=shipStateAt(T[kind],year),x=RX(s.distanceLy),y=lanes[kind];
    el('line',{x1:x,x2:x,y1:y,y2:100,class:'mm-leader'},svg);
    el('path',{d:`M${x+7} ${y}L${x-5} ${y-6}L${x-5} ${y+6}Z`,class:`mm-ship mm-${kind}`},svg);
    const right=x<RX(D)-170;el('text',{x:right?x+12:x-12,y:y+4,class:'mm-label','text-anchor':right?'start':'end'},svg,`${name} · ${phaseName(s.phase)}`);}
  // ---- Distance against Earth year.
  el('text',{x:m.l,y:m.top-18,class:'mm-title'},svg,'Distance from the Sun against Earth year');
  for(let d=0;d<=4;d++){el('line',{x1:m.l,x2:m.l+cw,y1:Y(d),y2:Y(d),class:'mm-grid'},svg);el('text',{x:m.l-8,y:Y(d)+4,class:'mm-axis','text-anchor':'end'},svg,`${d} ly`);}
  for(let yr=0;yr<=end;yr+=5)el('text',{x:X(yr),y:m.top+ch+20,class:'mm-axis','text-anchor':'middle'},svg,`Year ${yr}`);
  el('line',{x1:m.l,x2:m.l+cw,y1:m.top+ch,y2:m.top+ch,class:'mm-baseline'},svg);
  // Arrival window: cargo lands and confirms services before crew descent.
  el('rect',{x:X(T.crew.arrive),y:m.top,width:Math.max(2,X(end)-X(T.crew.arrive)),height:ch,class:'mm-window'},svg);
  for(const [kind,name] of SHIPS){const s=T[kind],pts=[];for(let i=0;i<=400;i++){const yr=s.depart+(end-s.depart)*i/400;pts.push(`${X(yr).toFixed(1)},${Y(shipStateAt(s,yr).distanceLy).toFixed(1)}`);}
    el('polyline',{points:pts.join(' '),class:`mm-line mm-${kind}`},svg);
    for(const d of s.drops)el('line',{x1:X(d.year),x2:X(d.year),y1:Y(shipStateAt(s,d.year).distanceLy)-4,y2:Y(shipStateAt(s,d.year).distanceLy)+4,class:`mm-drop mm-${kind}`},svg);
    el('circle',{cx:X(s.depart),cy:Y(0),r:5,class:`mm-dot mm-${kind}`},svg);
    el('text',{x:X(s.depart)+8,y:Y(0)-10,class:'mm-label'},svg,`${name} departs · year ${s.depart}`);
    el('text',{x:m.l+cw+10,y:Y(D)+(kind==='crew'?20:-10),class:'mm-label'},svg,`${name} · ${(s.arrive-s.depart).toFixed(1)} yr flight`);}
  el('circle',{cx:X(T.crew.arrive),cy:Y(D),r:6,class:'mm-arrive'},svg);
  el('text',{x:X(T.crew.arrive)-10,y:Y(D)-14,class:'mm-label','text-anchor':'end'},svg,`Both arrive · year ${T.crew.arrive.toFixed(1)}`);
  // Legend (identity is also carried by the direct labels).
  SHIPS.forEach(([kind,name],i)=>{const lx=m.l+cw+10,ly=m.top+ch-40+i*18;el('line',{x1:lx,x2:lx+18,y1:ly,y2:ly,class:`mm-line mm-${kind}`},svg);el('text',{x:lx+24,y:ly+4,class:'mm-axis'},svg,name);});
  el('text',{x:m.l+cw+10,y:m.top+ch+2,class:'mm-axis'},svg,'Ticks: tank drops');
  // Year cursor, hover readout and click-to-scrub.
  const cursor=el('line',{x1:X(year),x2:X(year),y1:m.top,y2:m.top+ch,class:'mm-cursor'},svg);
  el('text',{x:X(year),y:m.top-4,class:'mm-axis','text-anchor':'middle'},svg,`Year ${year.toFixed(2)}`);
  const hover=el('g',{class:'mm-hover',visibility:'hidden'},svg),hl=el('line',{y1:m.top,y2:m.top+ch,class:'mm-crosshair'},hover),box=el('rect',{width:228,height:58,rx:4,class:'mm-tip'},hover),tips=[0,1,2].map(i=>el('text',{class:'mm-tip-text'},hover));
  const hit=el('rect',{x:m.l,y:m.top,width:cw,height:ch,class:'mm-hit'},svg);
  const yearAt=e=>{const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W;return Math.min(end,Math.max(0,(px-m.l)/cw*end));};
  hit.addEventListener('pointermove',e=>{const yr=yearAt(e),x=X(yr),c=shipStateAt(T.crew,yr),g=shipStateAt(T.cargo,yr),bx=x+240>m.l+cw?x-236:x+8;
    hover.setAttribute('visibility','visible');hl.setAttribute('x1',x);hl.setAttribute('x2',x);box.setAttribute('x',bx);box.setAttribute('y',m.top+8);
    [`Year ${yr.toFixed(2)}`,`Crew  ${c.distanceLy.toFixed(3)} ly · ${c.beta.toFixed(3)}c · ${phaseName(c.phase)}`,`Cargo ${g.distanceLy.toFixed(3)} ly · ${g.beta.toFixed(3)}c · ${phaseName(g.phase)}`].forEach((t,i)=>{tips[i].textContent=t;tips[i].setAttribute('x',bx+8);tips[i].setAttribute('y',m.top+26+i*15);});});
  hit.addEventListener('pointerleave',()=>hover.setAttribute('visibility','hidden'));
  hit.addEventListener('click',e=>onScrub?.(yearAt(e)));
  return {svg,cursor};
}
// Readout rows for both ships (the map's table view; also shown under the ship views).
export function missionReadout(T,year){
  return SHIPS.map(([kind,name])=>{const s=shipStateAt(T[kind],year);return {kind,name,phase:phaseName(s.phase),distance:`${s.distanceLy.toFixed(3)} ly`,speed:`${s.beta.toFixed(3)}c`,
    mass:`${Math.round(s.massT).toLocaleString('en-GB')} t`,tanks:`${s.tanksAttached} of 16`,shipTime:`${s.properYears.toFixed(2)} yr`};});
}
