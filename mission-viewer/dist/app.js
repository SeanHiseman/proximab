import {createScene,sharedRooms,surfaceRoomName,CABINS_PER_DISC,missionTimeline,shipStateAt,stageYear,missionScale,flightSky,systemSky,systemFocusPoints,settlementFrame,add,sub,dot,cross,norm} from './model.js';
import {renderMissionMap,missionReadout,phaseName} from './mission-map.js';
import {Renderer} from './renderer.js';
import {SceneStore,sceneKey,createSceneWorker} from './scene-store.js';
const $=s=>document.querySelector(s);
const state={showBeam:true,interiorHabitat:'all',flat:true,mode:'cruise',year:20,systemFocus:'proxima',selected:'habA',cutaway:true,dimensions:false,showLabels:false,showSystemLabels:true,spin:false,showRadiators:true,deck:'all',detail:'medium',tab:'mass'};
const systems=[['habA','A','Habitat A'],['habB','B','Habitat B'],['shield','01','Forward shielding'],['structure','02','Frame & landing'],['propulsion','03','Main engine (fusion–antimatter)'],['tanks','04','Staged D–He3 tanks & AM containment'],['radiators','05','Thermal systems'],['cargo','07','Cargo & fabrication'],['rover','08','Pressurised rover'],['exploration','09','Remote exploration'],['farm','10','Food factory'],['power','11','Surface power'],['inflatable','12','Inflatable residences']];
let timeline,data,renderer,lastScene,lastFrame=0,dirty=true,geometryKey='',spinAngle=0,lastTick=0,sceneStore,requestedKey='';
let drawFrame,frameScheduled=false;
function scheduleFrame(){if(drawFrame&&!frameScheduled){frameScheduled=true;requestAnimationFrame(drawFrame);}}
function markDirty(){dirty=true;scheduleFrame();}
function component(id){return {name:id.startsWith('cabin-')?'Berth bay '+id.slice(6):lastScene?.zones.find(z=>z.id===id)?.purpose??systems.find(s=>s[0]===id)?.[2]??id};}
function select(id){if(!systems.some(s=>s[0]===id)&&!id.startsWith('cabin-')&&!id.startsWith('bay-'))return;state.selected=id;document.querySelectorAll('.system-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.system===id)));renderInspector();markDirty();}
function renderInspector(){}
// Timeline: each flight view shows its ship at the selected year; the 3D scene changes only with phase and tank drops.
function flightState(year=state.year){const kind=state.mode==='cargo'?'cargo':'crew',t=timeline[kind];return shipStateAt(t,stageYear(t,year));}
// The 3D scene depends only on phase, tank drops and which end the towed engine pulls from; this key changes only at those events.
const stageKey=f=>`${f.phase}:${f.dropped}:${f.engineAhead?'ahead':'aft'}`;
function updateTimeline(){
  const flight=state.mode==='cruise'||state.mode==='cargo'?flightState():null;
  const changedGravity=state.burning!==!!flight?.burning||(flight?.burning&&flight.phase!==state.stage?.split(':')[0]);
  state.stage=flight?stageKey(flight):'';state.burning=!!flight?.burning;
  const walkable=state.mode==='settlement'||(state.mode==='cruise'&&flight.phase!=='entry');
  if((!walkable||changedGravity)&&renderer?.insideView)$('#exit-room').onclick?.();
  $('#room-select').disabled=!walkable;$('#room-select').title=walkable?'':'No walkable interior in this view.';
  const spinOK=state.mode==='cruise'&&walkable&&!state.burning;
  $('#spin').disabled=!spinOK;$('#spin-control').hidden=state.mode!=='cruise';
  $('#spin-control').title=spinOK?'':'The discs are locked during burns and entry';
  $('#spin-label').textContent=spinOK?'Spin':'Spin locked';
  if(!spinOK&&state.spin){state.spin=false;$('#spin').checked=false;}
  $('#beam-control').hidden=!state.burning;
  const sc=scale();$('#year').value=sc.toU(state.year);$('#year-value').textContent=yearText(state.year);
  const label=$('#configuration-label')??{};
  if(state.mode==='cruise')label.textContent=`CREW SHIP · 24 ADULTS · ${phaseName(flight.phase).toUpperCase()} · ${flight.tanksAttached}/16 TANK MODULES${walkable?` · ${data.layout.spin_gravity_g} g SPIN`:' · DISCS LOCKED'}`;
  else if(state.mode==='cargo')label.textContent=`CARGO SHIP · ZERO ANTIMATTER · ${phaseName(flight.phase).toUpperCase()} · ${flight.tanksAttached}/16 TANK MODULES`;
  else if(state.mode==='map')label.textContent=`MISSION MAP · CARGO DEPARTS YEAR ${timeline.cargo.depart} · CREW YEAR ${timeline.crew.depart} · BOTH ARRIVE YEAR ${timeline.crew.arrive.toFixed(1)}`;
  else label.textContent=state.mode==='system'?'PROXIMA CENTAURI SYSTEM · TO SCALE':'PROXIMA b / PERMANENT SETTLEMENT';
  const rows=$('#timeline-rows');rows.textContent='';
  for(const r of missionReadout(timeline,state.year)){const tr=document.createElement('tr');
    [r.name,r.phase,r.distance,r.speed,r.mass,r.tanks,r.shipTime].forEach((v,k)=>{const td=document.createElement('td');if(!k){const sw=document.createElement('span');sw.className='swatch';sw.style.background=`var(--${r.kind})`;td.append(sw);}td.append(v);tr.append(td);});rows.append(tr);}
  const map=$('#mission-map');map.hidden=state.mode!=='map';if(state.mode==='map'){$('#loading').hidden=true;renderMissionMap(map,timeline,state.year,y=>setYear(y));}
  markDirty();
}
let timelineActive=false;
// The slider covers the selected ship's own journey (the map: the whole mission) on a non-linear scale with milestones.
const scaleView=()=>state.mode==='cargo'?'cargo':state.mode==='cruise'?'crew':'map';
let scaleCache=null;
function scale(){const view=scaleView();if(scaleCache?.view!==view)scaleCache=missionScale(timeline,view);return scaleCache;}
function yearText(year){const t=timeline[state.mode==='cargo'?'cargo':'crew'],toGo=(t.arrive-year)*365.25;
  const go=state.mode==='map'||toGo<=0||toGo>30?'':toGo>=1?` · ${toGo.toFixed(1)} days out`:toGo*24>=1?` · ${(toGo*24).toFixed(1)} h out`:` · ${(toGo*1440).toFixed(0)} min out`;
  return `Year ${year.toFixed(year>t.arrive-1/12&&year<t.arrive?4:2)}${go}`;}
const measure=(()=>{let ctx=null;return text=>{ctx??=document.createElement('canvas').getContext?.('2d');if(!ctx)return text.length*5.2;ctx.font='9px system-ui,sans-serif';return ctx.measureText(text).width;};})();
function renderMilestones(){const root=$('#milestones');if(!root)return;root.textContent='';const sc=scale(),W=Math.max(200,root.clientWidth||600),ends=[];
  for(const m of sc.milestones){const x=8+m.u*(W-16),w=measure(m.label)+8,right=x+w>W,left=right?x-w:x;let row=0;while(row<ends.length&&ends[row]>left-6)row++;ends[row]=left+w;
    const b=document.createElement('button');b.className='milestone'+(right?' end':'');b.style.left=`${left}px`;b.style.top=`${row*12}px`;b.textContent=m.label;b.title=`${m.label} · year ${m.year.toFixed(3)}`;b.onclick=()=>setYear(m.year);root.append(b);}
  root.style.height=`${ends.length*12+2}px`;root.parentElement&&(root.parentElement.style.paddingBottom=`${ends.length*12+10}px`);}
function setYear(y){timelineActive=true;const sc=scale();state.year=Math.min(sc.end,Math.max(sc.start,y));updateTimeline();}
function updateMode(keepCamera=false){document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));$('#timeline').hidden=state.mode==='settlement'||state.mode==='system'||state.mode==='descent';$('#system-panel').hidden=state.mode!=='system';renderer.mode=state.mode;renderer.systemMode=state.mode==='system';renderer.surfaceMode=state.mode==='settlement';for(const id of ['cutaway-control','labels-control'])$('#'+id).hidden=state.mode==='descent';if(state.mode!=='settlement'){const sc=scale();state.year=Math.min(sc.end,Math.max(sc.start,state.year));renderMilestones();}document.querySelector('.viewport-footer').hidden=state.mode==='map';document.querySelector('.room-controls').hidden=state.mode==='map'||state.mode==='system'||state.mode==='descent';{const select=$('#room-select');for(const option of select.options??[]){
  const {name,habitat,level}=option.dataset;
  if(name)option.textContent=habitat+(+level+1)+': '+(state.mode==='settlement'&&!+level?surfaceRoomName(name,habitat):name);
}if(select.querySelectorAll){for(const o of [...select.querySelectorAll('option[data-surface]')])o.remove();if(state.mode==='cruise')for(const [value,text] of [['food-factory-1','Ship: Food factory 1'],['food-factory-2','Ship: Food factory 2']]){const o=document.createElement('option');o.value=value;o.textContent=text;o.dataset.surface='1';select.append(o);}if(state.mode==='settlement')for(const [value,text] of [...Array.from({length:8},(_,i)=>[`greenhouse-${i+1}`,`Surface: Greenhouse hall ${i+1}`]),['residence-1','Surface: Inflatable residence 1'],['residence-2','Surface: Inflatable residence 2'],['rover','Surface: Crewed rover']]){const o=document.createElement('option');o.value=value;o.textContent=text;o.dataset.surface='1';select.append(o);}}}if(state.mode!=='cruise'){state.spin=false;$('#spin').checked=false;}if(!keepCamera&&state.mode!=='system')renderer.reset(state.mode);updateTimeline();renderInspector();markDirty();}
async function init(){
  const response=await fetch('design-data.json');if(!response.ok)throw Error('Design data could not be loaded. Serve this directory over HTTP.');data=await response.json();
  timeline=missionTimeline(data);
  renderer=new Renderer($('#scene'),markDirty);state.gpu=!!renderer.gpu;window.__proximaView=camera=>{Object.assign(renderer.camera,camera);markDirty();};state.rover=renderer.roverPose;sceneStore=new SceneStore(data,createSceneWorker(),{onStatus:message=>{window.__proximaErrors.push(message);$('#view-readiness').textContent='Preparing views locally';}});if(renderer.gpu)renderer.gpu.onEvict=scene=>sceneStore.drop(scene);state.detail='medium';
  let savedSystemCamera;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    if(b.dataset.mode===state.mode)return;
    if(renderer.insideView)leaveInside();
    if(state.mode==='system')savedSystemCamera=renderer.camera;
    landingRequested=false;
    state.mode=b.dataset.mode;
    if(state.mode==='system'){
      if(savedSystemCamera)renderer.camera=savedSystemCamera;
      else focusSystem(state.systemFocus??'proxima');
    }
    updateMode();
  });
  const FOCUS_KM={proxima:3e7,d:2.5e4,b:4e4,c:1.2e5};
  const focusButtons=document.querySelectorAll('[data-focus]');
  const updateFocusButtons=()=>focusButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focus===state.systemFocus)));
  function focusSystem(key){landingRequested=false;renderer.surfaceMode=false;state.systemFocus=key;renderer.systemKm=FOCUS_KM[key];renderer.camera.target=[0,0,0];renderer.camera.distance=1000;renderer.camera.roll=0;renderer.endDrag();renderer.zoomSpeed=null;const p=points[key].p;systemOrigin=[...p];updateFocusButtons();
    // Look at planets from the star-lit side, slightly off-axis.
    const toStar=Math.hypot(...p)>1?p.map(v=>-v/Math.hypot(...p)):[0,1,0],side=[toStar[2],0,-toStar[0]],n=key==='proxima'?[.45,.55,.7]:[.75*toStar[0]+.55*side[0],.75*toStar[1]+.35,.75*toStar[2]+.55*side[2]];
    const len=Math.hypot(...n);renderer.camera.yaw=Math.atan2(n[2],n[0]);renderer.camera.pitch=Math.asin(Math.max(-1,Math.min(1,n[1]/len)))*.999;renderer.setup();markDirty();}
  focusButtons.forEach(b=>b.onclick=()=>focusSystem(b.dataset.focus));
  for(let key of ['cutaway','spin'])$('#'+key).addEventListener('change',e=>{state[key]=e.target.checked;markDirty();});
  $('#labels').addEventListener('change',e=>{state.showLabels=e.target.checked;$('#hover-label').hidden=true;markDirty();});
  $('#system-labels').addEventListener('change',e=>{state.showSystemLabels=e.target.checked;markDirty();});
  $('#reset-view').onclick=()=>{if(renderer.insideView)leaveInside();if(state.mode==='system')focusSystem(state.systemFocus??'proxima');else renderer.reset(state.mode);};
  // The exhaust beam is only shown during engine burns.
  $('#beam').onchange=e=>{state.showBeam=e.target.checked;markDirty();};

  $('#year').addEventListener('input',e=>setYear(scale().toYear(+e.target.value)));
  // Play moves evenly along the slider's scale (the whole journey in about 90 seconds), so it slows through burns
  // and the final approach and stops at the end.
  let playing=null;const play=$('#play'),stop=()=>{cancelAnimationFrame(playing);playing=null;play.setAttribute('aria-pressed','false');play.textContent='▶ Play';};
  play.onclick=()=>{if(playing){stop();return;}if(scale().toU(state.year)>=1)setYear(scale().start);let last=performance.now();play.setAttribute('aria-pressed','true');play.textContent='❚❚ Pause';
    const step=t=>{const sc=scale(),u=Math.min(1,sc.toU(state.year)+(t-last)/1000/90);setYear(sc.toYear(u));last=t;if(u>=1){stop();return;}playing=requestAnimationFrame(step);};playing=requestAnimationFrame(step);};
  const rooms=$('#room-select');
  for(const habitat of ['A','B']){
    sharedRooms.forEach((deck,level)=>deck.forEach(({name,cell})=>{
      const option=document.createElement('option');option.value=`bay-${habitat}-${level}-${cell}`;Object.assign(option.dataset,{name,habitat,level});option.textContent=`${habitat}${level+1}: ${name}`;rooms.append(option);
    }));
    for(let n=1;n<=CABINS_PER_DISC;n++){const option=document.createElement('option');option.value='cabin-'+(n+(habitat==='B'?CABINS_PER_DISC:0));option.textContent=`${habitat}1: Berth bay ${n}`;rooms.append(option);}
  }
  for(const [value,text] of [['food-factory-1','Ship: Food factory 1'],['food-factory-2','Ship: Food factory 2']]){const option=document.createElement('option');option.value=value;option.textContent=text;option.dataset.surface='1';rooms.append(option);}
  // Shows the room, deck and gravity at the walker's current position.
  function updateRoomHud(){const hud=$('#room-hud'),loc=renderer.insideView?renderer.roomLocation():null,text=loc?.text??'';if(hud.textContent!==text)hud.textContent=text;hud.hidden=!text;
    const select=$('#room-select');if(loc?.id&&select.value!==loc.id&&[...(select.options??[])].some(o=>o.value===loc.id))select.value=loc.id;}
  let exteriorCutaway=true,exteriorInteriors='all';
  function leaveInside(){renderer.leaveInside();state.interiorHabitat=exteriorInteriors;state.cutaway=exteriorCutaway;$('#cutaway').checked=state.cutaway;$('#cutaway').disabled=false;$('#exit-room').hidden=true;$('#walk-help').hidden=true;updateRoomHud();markDirty();}
  $('#exit-room').onclick=leaveInside;
  const enterRoom=async()=>{
    if(!rooms.value||rooms.disabled)return;
    state.deck='all';
    if(renderer.insideView)leaveInside();
    exteriorInteriors=state.interiorHabitat;state.interiorHabitat='all';
    exteriorCutaway=state.cutaway;state.cutaway=false;$('#cutaway').checked=false;$('#cutaway').disabled=true;
    const scene=createScene({...state,detail:'medium'},data);
    const entry=scene.rooms?.find(r=>r.id===rooms.value);
    if(!entry){leaveInside();return;}
    state.selected=entry.select??entry.id;renderer.enterInside(entry,scene.meshes);$('#exit-room').hidden=false;$('#walk-help').hidden=false;$('#walk-help').textContent=entry.driver?'W accelerate / S brake then reverse / A and D steer / Space brake / right-drag to orbit / left-drag to pan / scroll to zoom / Escape to leave':'WASD walk / E and Q climb at ladders / Space step off / right-drag to orbit / left-drag to pan / scroll to zoom / F cycle airlock doors / Escape to leave';updateRoomHud();markDirty();
  };
  rooms.onchange=enterRoom;
  renderer.canvas.addEventListener('keydown',e=>{
    if(e.key==='Escape')leaveInside();
    if(e.key.toLowerCase()==='f'&&renderer.insideView){
      const eye=renderer.insideView.eye,lock=lastScene?.airlocks?.find(l=>Math.hypot(...l.centre.map((v,i)=>v-eye[i]))<4);
      if(!lock)return;e.preventDefault();state.airlockOutside=state.airlockOutside===lock.id?'':lock.id;
      const scene=createScene({...state,detail:'medium'},data);renderer.setColliders(scene.meshes);markDirty();
    }
  });
  const canvas=$('#scene');canvas.addEventListener('click',e=>{if(state.mode==='system')return;if(renderer.insideView||e.button!==0||renderer.moved)return;const r=canvas.getBoundingClientRect(),id=renderer.pick(e.clientX-r.left,e.clientY-r.top);if(id){select(id);if(lastScene?.rooms?.some(room=>room.id===id)){rooms.value=id;enterRoom();}}});
  let hoverTimer,lastInteraction=performance.now(),qualityTimer,viewportVisible=true;
  const trackInteraction=()=>{lastInteraction=performance.now();clearTimeout(qualityTimer);qualityTimer=setTimeout(markDirty,200);};
  for(const name of ['pointerdown','pointermove','wheel','keydown','scroll'])window.addEventListener(name,trackInteraction,{passive:true,capture:true});
  canvas.addEventListener('pointermove',event=>{clearTimeout(hoverTimer);$('#hover-label').hidden=true;if(state.mode==='descent'||!state.showLabels||renderer.insideView||renderer.pointer||state.spin)return;const x=event.clientX,y=event.clientY;hoverTimer=setTimeout(()=>{if(state.mode==='descent'||!state.showLabels||renderer.insideView||renderer.pointer||state.spin)return;const r=canvas.getBoundingClientRect(),id=renderer.pick(x-r.left,y-r.top),label=$('#hover-label');label.hidden=!id;if(id){label.textContent=component(id).name;label.style.left=Math.min(x-r.left+12,r.width-190)+'px';label.style.top=Math.max(8,y-r.top-28)+'px';}},140);});
  canvas.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);$('#hover-label').hidden=true;});
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{viewportVisible=entries[0].isIntersecting;if(viewportVisible)markDirty();}).observe(canvas);
  new ResizeObserver(()=>{renderer.resize();markDirty();}).observe($('#canvas-wrap'));
  if($('#milestones'))new ResizeObserver(()=>{if(state.mode!=='settlement'&&state.mode!=='system'&&state.mode!=='descent')renderMilestones();}).observe($('#milestones').parentElement);renderer.resize();renderInspector();
  const canvasForErrors=$('#scene');canvasForErrors.addEventListener('webglcontextlost',event=>{event.preventDefault();dirty=false;state.spin=false;$('#spin').checked=false;showModelError(Error('The 3D graphics context was lost.'),()=>window.location.reload());});
  // Within one view, keep drawing the current ship while the next timeline stage is prepared instead of blanking it.
  const showable=()=>lastScene&&(geometryKey===sceneKey(state)||geometryKey.split('/')[0]===state.mode);
  // Prefetch the neighbouring stages only while the timeline is in use and a background worker exists, so that
  // unvisited configurations are not built otherwise and a main-thread fallback never stalls on them.
  function prefetch(){
    if(!timelineActive||!sceneStore.worker||(state.mode!=='cruise'&&state.mode!=='cargo'))return;const t=timeline[state.mode==='cargo'?'cargo':'crew'];
    const cuts=[t.depart,t.depart+t.burnYears,t.depart+t.burnYears+t.coastYears/2,t.arrive,t.opsEnd,...t.drops.map(d=>d.year)].sort((a,b)=>a-b);
    const next=cuts.find(c=>c>state.year+1e-9),prev=[...cuts].reverse().find(c=>c<=state.year-1e-9);
    for(const y of [next===undefined?null:next+1e-6,prev===undefined?null:prev-1e-6])if(y!==null&&y>=0&&y<=40)sceneStore.request({...state,year:y,stage:stageKey(flightState(y))}).catch(()=>{});
  }
  function requestScene(){const key=sceneKey(state);if(key===requestedKey)return;requestedKey=key;const stale=showable();$('#loading').classList.remove('has-error');if(stale)$('#view-readiness').textContent='Updating to the selected stage…';else{$('#loading').hidden=false;$('#loading').textContent='Preparing this configuration...';}sceneStore.request(state).then(scene=>{if(key!==sceneKey(state))return;lastScene=scene;renderer.zoomSpeed=null;geometryKey=key;if(stale)$('#view-readiness').textContent='';prefetch();markDirty();}).catch(error=>{if(key===sceneKey(state))showModelError(error,()=>{requestedKey='';markDirty();});});}
  // Flight sky is cached by time. Surface uses the same celestial frame as the system once it reaches the upper atmosphere.
  let skyKey='',sky=null,nearAtmosphere,systemOrigin=[0,0,0],landingRequested=false;
  const landingFrame=settlementFrame(data),points=systemFocusPoints(data);
  const bodies=[points.proxima,points.d,points.b,points.c];
  const systemScene={meshes:[],lines:[],labels:[],dimensions:[],zones:[]};
  const toWorld=v=>add(systemOrigin,mul(v,renderer.systemKm/1000));
  const altitude=eye=>Math.hypot(...sub(eye,points.b.p))-points.b.r;
  function skyFor(){
    if(state.mode==='settlement'){
      if(renderer.insideView||!lastScene.surfaceSky)return null;
      const eye=landingFrame.position(renderer.eye),height=altitude(eye);
      if(height<1.5)return null;
      const orbit=systemSky(data,{eye,km:Math.max(.1,renderer.camera.distance/1000),
        forward:landingFrame.vector(renderer.forward),rings:24,omitSurfacePlanet:true});
      orbit.meshes=orbit.meshes.map(m=>({...m,vertices:m.vertices.map(landingFrame.local)}));
      orbit.lines=orbit.lines.map(l=>({...l,a:landingFrame.local(l.a),b:landingFrame.local(l.b)}));
      if(height<40){
        nearAtmosphere??=lastScene.surfaceSky.map(m=>{
          const scale=m.role==='sky-dome'?20/4900:10/4500;
          return {...m,vertices:m.vertices.map(v=>mul(v,scale))};
        });
        const t=(height-1.5)/38.5,fade=1-t*t*(3-2*t);
        orbit.meshes.push(...nearAtmosphere.map(m=>({...m,opacity:Math.min(.9899,m.opacity*fade)})));
      }
      return orbit;
    }
    if(state.mode!=='cruise'&&state.mode!=='cargo'&&state.mode!=='descent')return null;
    const key=`${state.mode}:${state.year}`;
    if(key!==skyKey){skyKey=key;sky=state.mode==='descent'?flightSky(data,'crew',40):flightSky(data,state.mode==='cargo'?'cargo':'crew',state.year);}
    return sky;
  }
  function rayEntry(eye,direction,body,radius=body.r){
    const rel=sub(body.p,eye),along=dot(rel,direction),side=Math.hypot(...cross(rel,direction));
    if(along<=0||side>=radius)return null;
    const entry=along-Math.sqrt((radius-side)*(radius+side));
    return Math.max(0,entry);
  }
  renderer.systemPick=(direction,orbiting)=>{
    const eye=toWorld(renderer.eye);let hit=Infinity,nearby=null,maxOrbitDistance=Infinity;
    if(orbiting)for(const body of bodies){
      const range=Math.hypot(...sub(eye,body.p));
      if(range<body.r*1.15){
        const horizon=Math.sqrt(Math.max(0,(range-body.r)*(range+body.r)));
        maxOrbitDistance=Math.min(maxOrbitDistance,horizon+Math.max(.001,horizon*.15));
      }
    }
    for(const body of bodies){
      const entry=rayEntry(eye,direction,body);
      if(entry!==null){if(entry<=maxOrbitDistance)hit=Math.min(hit,entry);continue;}
      const rel=sub(body.p,eye),along=dot(rel,direction),range=Math.hypot(...rel);
      if(along<=0||range<=body.r)continue;
      const angle=Math.acos(Math.max(-1,Math.min(1,along/range))),radius=Math.asin(body.r/range);
      const miss=angle-radius;
      if(miss>9/renderer.focal||nearby&&miss>=nearby.miss)continue;
      // Move only far enough across the cursor's neighbourhood to intersect the silhouette.
      const tangent=norm(sub(rel,mul(direction,along))),turn=miss+Math.min(.25*radius,.75/renderer.focal);
      const aim=add(mul(direction,Math.cos(turn)),mul(tangent,Math.sin(turn)));
      const distance=rayEntry(eye,aim,body);
      if(distance!==null&&distance<=maxOrbitDistance)nearby={distance,aim,miss};
    }
    return hit<Infinity?hit:nearby;
  };
  const selectedPlanet=()=>['b','c','d'].includes(state.systemFocus)?points[state.systemFocus]:null;
  renderer.systemOrbitCentre=()=>{
    const planet=selectedPlanet();
    return planet?mul(sub(planet.p,systemOrigin),1000/renderer.systemKm):null;
  };
  renderer.systemTravelLimit=(start,end,fixedPlanet=false)=>{
    const eye=toWorld(start),delta=sub(toWorld(end),eye),length=Math.hypot(...delta);
    if(length===0)return 1;
    const direction=norm(delta);
    let limit=1;
    const orbitBody=fixedPlanet?selectedPlanet():null;
    for(const body of bodies){
      // A fixed-radius arc stays outside its own planet even when a straight chord crosses it.
      if(body===orbitBody)continue;
      const clearance=Math.hypot(...sub(eye,body.p));
      // At the clearance boundary, tangent and outward motion remain available.
      const entry=rayEntry(eye,direction,body,Math.min(body.r+.0001,clearance));
      if(entry!==null)limit=Math.min(limit,entry/length);
    }
    return limit;
  };
  renderer.onSystemZoom=(start,end,inward)=>{
    if(!inward){landingRequested=false;return;}
    const eye=toWorld(start),next=toWorld(end),towardSite=sub(landingFrame.origin,eye);
    const direction=norm(sub(next,eye));
    landingRequested=dot(towardSite,direction)>0&&Math.hypot(...cross(towardSite,direction))<18
      &&Math.hypot(...sub(next,landingFrame.origin))<=145;
  };
  function poseCamera(eye,forward,right,distance){
    const yaw=Math.atan2(-forward[2],-forward[0]),pitch=Math.asin(Math.max(-1,Math.min(1,-forward[1])));
    const flatRight=[Math.sin(yaw),0,-Math.cos(yaw)],up=cross(flatRight,forward);
    const roll=Math.atan2(dot(right,up),dot(right,flatRight));
    return {yaw,pitch,roll,distance,target:add(eye,mul(forward,distance))};
  }
  function bridgeSurfaceAndSystem(){
    if(renderer.insideView)return;
    if(state.mode==='settlement'){
      renderer.setup();
      const eye=landingFrame.position(renderer.eye),distance=Math.hypot(...sub(eye,landingFrame.origin));
      if(distance<180)return;
      const forward=landingFrame.vector(renderer.forward),km=Math.max(.00005,renderer.camera.distance/1000);
      renderer.endDrag();state.mode='system';state.systemFocus=null;updateFocusButtons();
      renderer.systemKm=km;systemOrigin=add(eye,mul(forward,km));
      renderer.camera=poseCamera(mul(forward,-1000),forward,landingFrame.vector(renderer.right),1000);
      updateMode();
    }else if(state.mode==='system'&&landingRequested){
      renderer.setup();
      const eye=toWorld(renderer.eye);
      landingRequested=false;
      if(Math.hypot(...sub(eye,landingFrame.origin))>145)return;
      savedSystemCamera=renderer.camera;renderer.endDrag();
      renderer.camera=poseCamera(landingFrame.metres(eye),landingFrame.local(renderer.forward),
        landingFrame.local(renderer.right),renderer.systemKm*1000);
      state.mode='settlement';updateMode(true);
    }
  }
  function frame(t){
    frameScheduled=false;if(document.hidden||!viewportVisible){lastTick=t;return;}
    try{
      const dt=lastTick?Math.min((t-lastTick)/1000,.1):0;lastTick=t;if(renderer.walk(dt))dirty=true;updateRoomHud();if(state.mode==='cruise'&&state.spin&&!$('#spin').disabled)spinAngle=(spinAngle+dt*Math.sqrt(data.layout.spin_gravity_g*9.80665/data.layout.cabin_floor_radius_m))%(2*Math.PI);if(state.mode!=='cruise'||$('#spin').disabled)spinAngle=0;if(state.mode==='map'){window.__proxima={ready:true,state:{...state},map:true};return;}
      if(dirty)bridgeSurfaceAndSystem();
      if(state.mode==='system'){if(dirty){renderer.setup();
        // Rebase the render camera around its current world position.
        const tgt=renderer.camera.target;systemOrigin=add(systemOrigin,mul(tgt,renderer.systemKm/1000));
        renderer.camera.target=[0,0,0];renderer.setup();
        const eye=add(systemOrigin,mul(renderer.eye,renderer.systemKm/1000));
        const sky=systemSky(data,{eye,km:renderer.systemKm,forward:renderer.forward,rings:renderer.gpu?48:28});
        // One persistent (empty) scene object: a new object per frame would flood the GPU cache and evict other views.
        const scene=systemScene;scene.labels=sky.labels.map(l=>({p:add(renderer.eye,l.p),text:l.text}));
        renderer.render(scene,{...state,sky,showLabels:state.showSystemLabels});$('#loading').hidden=true;$('#view-readiness').textContent='';window.__proxima={ready:true,state:{...state},system:true,systemKm:renderer.systemKm,systemEye:eye};dirty=false;}return;}
      if(dirty||state.spin){if(renderer.gpu?.gl.isContextLost?.())throw Error('The 3D graphics context was lost. Reload the viewer to recover.');requestScene();if(showable()&&(dirty||t-lastFrame>15)){const count=renderer.render(lastScene,{...state,showLabels:state.mode!=='descent'&&state.showLabels,spinAngle,sky:skyFor()});window.__proxima={ready:true,state:{...state},meshCount:lastScene.meshCount??lastScene.meshes.length,faceCount:count,renderer:renderer.gpu?'WebGL2':'software',sceneBuildCount:sceneStore.buildCount,spinAngle,softwareStats:renderer.softwareStats,gpuCacheBytes:renderer.gpu?.cacheBytes};$('#loading').hidden=true;dirty=false;lastFrame=t;$('#view-readiness').textContent='';}}
    }catch(error){dirty=false;state.spin=false;$('#spin').checked=false;showModelError(error,()=>{if(lastScene)sceneStore.drop(lastScene);lastScene=null;geometryKey='';requestedKey='';markDirty();});}
    if((dirty||state.spin||(renderer.insideView&&renderer.walkKeys?.size)||Math.abs(renderer.roverPose.speed)>.001)&&showable())scheduleFrame();
  }
  drawFrame=frame;updateMode();markDirty();

}
function showModelError(error,retry){
  window.__proximaErrors.push(error.message);const loading=$('#loading');loading.hidden=false;loading.classList.add('has-error');loading.textContent='';const message=document.createElement('p');message.textContent='The model could not be prepared: '+error.message;const button=document.createElement('button');button.textContent='Retry model';button.onclick=retry;loading.append(message,button);
}
window.__proximaErrors=[];window.addEventListener('error',event=>window.__proximaErrors.push(event.message));
init().catch(error=>showModelError(error,()=>window.location.reload()));
