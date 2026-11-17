import {createScene,sharedRooms,CABINS_PER_DISC} from './model.js';
import {Renderer} from './renderer.js';
import {SceneStore,sceneKey,createSceneWorker} from './scene-store.js';
const $=s=>document.querySelector(s);
const state={showBeam:true,interiorHabitat:'all',flat:true,mode:'cruise',selected:'habA',cutaway:true,dimensions:false,showLabels:false,spin:false,showRadiators:true,deck:'all',detail:'medium',tab:'mass'};
const systems=[['habA','A','Habitat A'],['habB','B','Habitat B'],['shield','01','Forward shielding'],['structure','02','Frame & landing'],['propulsion','03','Antimatter propulsion'],['tanks','04','Hydrogen & tanks'],['radiators','05','Thermal systems'],['refuge','06','Crew refuge'],['cargo','07','Cargo & fabrication'],['rover','08','Pressurised rover'],['exploration','09','Remote exploration'],['farm','10','Food factory'],['power','11','Surface power'],['inflatable','12','Inflatable residences']];
let data,renderer,lastScene,lastFrame=0,dirty=true,geometryKey='',spinAngle=0,lastTick=0,sceneStore,requestedKey='';
let drawFrame,frameScheduled=false;
function scheduleFrame(){if(drawFrame&&!frameScheduled){frameScheduled=true;requestAnimationFrame(drawFrame);}}
function markDirty(){dirty=true;scheduleFrame();}
function component(id){return {name:id.startsWith('cabin-')?'Berth bay '+id.slice(6):lastScene?.zones.find(z=>z.id===id)?.purpose??systems.find(s=>s[0]===id)?.[2]??id};}
function select(id){if(!systems.some(s=>s[0]===id)&&!id.startsWith('cabin-')&&!id.startsWith('bay-'))return;state.selected=id;document.querySelectorAll('.system-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.system===id)));renderInspector();markDirty();}
function renderInspector(){}
function renderArchitecture(){
  const a=data.architecture;if(!a)return;
  const put=(id,text)=>{const el=$(id);if(el)el.textContent=text;};
  put('#architecture-summary',`${a.crew} adults, no children in transit. Crew: ${a.crew_flight_earth_years} Earth years. Cargo: ${a.cargo_flight_earth_years} years, launching 20 years earlier and arriving together. Births follow establishment of protected surface accommodation.`);
  put('#architecture-habitat',`${a.adult_berths} convertible berths in eight three-person bays; ${a.descent_places} descent seats; two separated reproductive-bank locations. ${a.usable_habitat_allocation_m3} m³ usable-space allocation inside the retained gravity-module envelopes. This is not a measured net usable volume or a new mass estimate.`);
  put('#architecture-health',`Torpor is optional; no fixed roster or ageing reduction is assumed. Adult lifetime planning allowance: ${a.adult_lifetime_planning_limit_mSv} mSv; transit GCR study allocation: ${a.transit_GCR_study_allocation_mSv} mSv. Protection remains unresolved.`);
  put('#architecture-propulsion',a.preferred_propulsion_study+'. '+a.propulsion_selection_status+'.');
  put('#architecture-reference','Engine, tank and landing geometry: historical reference pending hybrid sizing. Complete dry mass and fleet antimatter budget: not yet established.');
  if(data.staged_baseline){const b=data.staged_baseline.selected;put('#architecture-reference',`Selected optimistic crew baseline: ${Math.round(b.departure_t).toLocaleString()} t departure; ${b.loaded_antimatter_t.toFixed(1)} t loaded antimatter; ${Math.round(b.loaded_fusion_t).toLocaleString()} t fusion fuel. Discard ${b.discarded_t.toFixed(1)} t empty launch storage and separation hardware; retain braking and reserve storage. Engine/radiator/reserve mass is included under speculative coefficients. Radiation and landing remain unresolved; displayed hardware geometry is still a reference.`);}
  if(data.integrated_specification){const s=data.integrated_specification,c=s.crew.selected,f=s.fleet;put('#architecture-reference',`${s.revision}: crew ${Math.round(c.departure_t).toLocaleString()} t departure and ${c.loaded_antimatter_t.toFixed(1)} t antimatter; fleet ${Math.round(f.departure_t).toLocaleString()} t and ${f.loaded_antimatter_t.toFixed(1)} t antimatter. Includes component budgets, chemical landing fuel and source-shield heat. 10% hardware allowance and 2% main-fuel reserve. Surface exploration/repair travels on cargo; crew collision shield stays in orbit. Cargo must verify surface services before crew descent. Radiation protection and atmospheric entry remain unverified; no final healthy-arrival optimum is claimed. 3D propulsion geometry remains a reference.`);}
  if(data.fusion_efficiency){const e=data.fusion_efficiency,c=e.coupling_cases[e.selected_case_index].ship;put('#architecture-reference',`Selected target: ${e.selected_antimatter_t} t fleet antimatter; zero main-fuel reserve; eight emptied tank modules discarded per burn. Optimistic 80% coupling case: crew ${Math.round(c.departure_t).toLocaleString()} t departure, ${Math.round(c.fusion_t).toLocaleString()} t fusion fuel and 500 t retained mass. Cargo uses separate electrical fusion. Research does not establish 80% annihilation-to-exhaust coupling; the 500 t component allocation and radiation protection are unqualified. S3 integrated component figures and 3D propulsion geometry remain references.`);}
  if(data.arrival_redesign){const r=data.arrival_redesign,c=r.fixed_allocation_comparator,l=r.crew_ledger_after.landing,m=r.sampled_minimum_AM_component_closed_crew;put('#architecture-reference',`S5 arrival redesign: one service unit and 36 t transit water remain orbital; habitat lands with one unit and 8 t water. Touchdown ${l.touchdown_t.toFixed(1)} t; chemical fuel ${l.loaded_t.toFixed(1)} t. At the adjusted fixed allocation, crew fusion fuel is ${Math.round(c.fusion_t).toLocaleString()} t using 20 t antimatter. Full component/engine sizing instead has a sampled minimum of ${m.antimatter_t.toFixed(2)} t antimatter: the 20 t cap is not yet closed. 80% coupling, radiation and landing remain unqualified; 3D hardware geometry remains a reference.`);}
  if(data.lean_landing_plan){const r=data.lean_landing_plan,c=r.ships.crew,l=c.ledger.landing;put('#architecture-reference',`S6 conditional plan: dedicated 36 t shielding water removed at launch; existing braking fuel surrounds occupied areas, with layout and dose unverified. Crew chemical descent target 500 m/s: ${l.loaded_t.toFixed(1)} t propellant, ${l.touchdown_t.toFixed(1)} t touchdown. Component-inclusive transfer: ${Math.round(c.propulsion.fusion_t).toLocaleString()} t crew fusion, ${r.fleet.antimatter_t.toFixed(1)} t fleet antimatter; ${c.retained_dry_hardware_t.toFixed(1)} t retained crew dry hardware. Capture fuel and shielding-layout additions remain unbudgeted; 80% coupling is hypothetical. 3D geometry remains historical.`);}
  if(data.final_model_specification){const r=data.final_model_specification,c=r.ships.crew,l=c.ledger.landing;put('#architecture-reference',`S7 frozen concept for redesign: two coaxial 19 m habitat envelopes, 20 m circular collision shield; 750 m? usable allocation. Crew: 20 t antimatter, ${Math.round(c.propulsion.fusion_t).toLocaleString()} t fusion, ${c.retained_dry_hardware_t.toFixed(1)} t retained dry hardware and ${l.touchdown_t.toFixed(1)} t touchdown. Cargo: zero antimatter, ${Math.round(r.ships.cargo.propulsion.fusion_t).toLocaleString()} t fusion. Capture fuel, radiation and tank geometry remain unresolved. Current 3D geometry is historical; use docs/FINAL_MODEL_SPECIFICATION.md for redesign.`);}
  const body=$('#architecture-trade');if(body)for(const r of data.propulsion_trade.cases){const tr=document.createElement('tr');for(const value of [`${r.years} years`,`${r.onboard.antimatter_t.toFixed(2)} t`,`${r.hybrid.antimatter_t.toFixed(2)} t`]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}
}
function updateMode(){document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));$('#configuration-label').textContent={engine:`REFERENCE ENGINE / ${data.design.nominal.main_acceleration_g} g THRUST / DISCS LOCKED`,cruise:`24 ADULTS / CRUISE / ${data.layout.spin_gravity_g} g`,settlement:'PROXIMA b / PERMANENT SETTLEMENT'}[state.mode];$('#spin').disabled=state.mode!=='cruise';$('#spin-control').hidden=state.mode!=='cruise';$('#beam-control').hidden=state.mode!=='engine';{const select=$('#room-select');if(select.querySelectorAll){for(const o of [...select.querySelectorAll('option[data-surface]')])o.remove();if(state.mode!=='settlement')for(const [value,text] of [['refuge','Ship: Descent refuge'],['food-factory-1','Ship: Food factory 1'],['food-factory-2','Ship: Food factory 2'],['rover','Ship: Rover cabin']]){const o=document.createElement('option');o.value=value;o.textContent=text;o.dataset.surface='1';select.append(o);}if(state.mode==='settlement')for(const [value,text] of [...Array.from({length:8},(_,i)=>[`greenhouse-${i+1}`,`Surface: Greenhouse hall ${i+1}`]),['residence-1','Surface: Inflatable residence 1'],['residence-2','Surface: Inflatable residence 2'],['rover','Surface: Crewed rover']]){const o=document.createElement('option');o.value=value;o.textContent=text;o.dataset.surface='1';select.append(o);}}}if(state.mode!=='cruise'){state.spin=false;$('#spin').checked=false;}renderer.reset(state.mode);renderInspector();markDirty();}
async function init(){
  const response=await fetch('design-data.json');if(!response.ok)throw Error('Design data could not be loaded. Serve this directory over HTTP.');data=await response.json();
  renderArchitecture();
  renderer=new Renderer($('#scene'),markDirty);state.gpu=!!renderer.gpu;window.__proximaView=camera=>{Object.assign(renderer.camera,camera);markDirty();};state.rover=renderer.roverPose;sceneStore=new SceneStore(data,createSceneWorker(),{onStatus:message=>{window.__proximaErrors.push(message);$('#view-readiness').textContent='Preparing views locally';}});if(renderer.gpu)renderer.gpu.onEvict=scene=>sceneStore.drop(scene);state.detail='medium';
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(renderer.insideView)leaveInside();state.mode=b.dataset.mode;updateMode();});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>renderer.view(b.dataset.view));
  for(let key of ['cutaway','spin'])$('#'+key).addEventListener('change',e=>{state[key]=e.target.checked;markDirty();});
  $('#labels').addEventListener('change',e=>{state.showLabels=e.target.checked;$('#hover-label').hidden=true;markDirty();});
  $('#radiators').addEventListener('change',e=>{state.showRadiators=e.target.checked;markDirty();});
  $('#reset-view').onclick=()=>{if(renderer.insideView)leaveInside();renderer.reset(state.mode);};
  // The exhaust beam is only shown during engine burns.
  $('#beam').onchange=e=>{state.showBeam=e.target.checked;markDirty();};
  $('#interiors').onchange=e=>{state.interiorHabitat=e.target.checked?'all':'none';markDirty();};
  const rooms=$('#room-select');
  for(const habitat of ['A','B']){
    sharedRooms.forEach((deck,level)=>deck.forEach(({name,cell})=>{
      const option=document.createElement('option');option.value=`bay-${habitat}-${level}-${cell}`;option.textContent=`${habitat}${level+1}: ${name}`;rooms.append(option);
    }));
    for(let n=1;n<=CABINS_PER_DISC;n++){const option=document.createElement('option');option.value='cabin-'+(n+(habitat==='B'?CABINS_PER_DISC:0));option.textContent=`${habitat}1: Berth bay ${n}`;rooms.append(option);}
  }
  for(const [value,text] of [['refuge','Ship: Descent refuge'],['food-factory-1','Ship: Food factory 1'],['food-factory-2','Ship: Food factory 2'],['rover','Ship: Rover cabin']]){const option=document.createElement('option');option.value=value;option.textContent=text;option.dataset.surface='1';rooms.append(option);}
  // Shows the room, deck and gravity at the walker's current position.
  function updateRoomHud(){const hud=$('#room-hud'),loc=renderer.insideView?renderer.roomLocation():null,text=loc?.text??'';if(hud.textContent!==text)hud.textContent=text;hud.hidden=!text;
    const select=$('#room-select');if(loc?.id&&select.value!==loc.id&&[...(select.options??[])].some(o=>o.value===loc.id))select.value=loc.id;}
  let exteriorCutaway=true,exteriorInteriors='all';
  function leaveInside(){renderer.leaveInside();state.interiorHabitat=exteriorInteriors;$('#interiors').disabled=false;state.cutaway=exteriorCutaway;$('#cutaway').checked=state.cutaway;$('#cutaway').disabled=false;$('#exit-room').hidden=true;$('#walk-help').hidden=true;updateRoomHud();markDirty();}
  $('#exit-room').onclick=leaveInside;
  const enterRoom=async()=>{
    if(!rooms.value)return;
    state.deck='all';
    if(renderer.insideView)leaveInside();
    exteriorInteriors=state.interiorHabitat;state.interiorHabitat='all';$('#interiors').disabled=true;
    exteriorCutaway=state.cutaway;state.cutaway=false;$('#cutaway').checked=false;$('#cutaway').disabled=true;
    const scene=createScene({...state,detail:'medium'},data);
    const entry=scene.rooms?.find(r=>r.id===rooms.value);
    if(!entry)return;
    state.selected=entry.select??entry.id;renderer.enterInside(entry,scene.meshes);$('#exit-room').hidden=false;$('#walk-help').hidden=false;$('#walk-help').textContent=entry.driver?'W accelerate / S brake then reverse / A and D steer / Space brake / drag to look / Escape to leave':'WASD walk / E and Q climb at ladders / Space step off / drag to look / F cycle airlock doors / Escape to leave';updateRoomHud();markDirty();
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
  const canvas=$('#scene');canvas.addEventListener('click',e=>{if(renderer.insideView||e.button!==0||renderer.moved)return;const r=canvas.getBoundingClientRect(),id=renderer.pick(e.clientX-r.left,e.clientY-r.top);if(id){select(id);if(lastScene?.rooms?.some(room=>room.id===id)){rooms.value=id;enterRoom();}}});
  let hoverTimer,lastInteraction=performance.now(),qualityTimer,viewportVisible=true;
  const trackInteraction=()=>{lastInteraction=performance.now();clearTimeout(qualityTimer);qualityTimer=setTimeout(markDirty,200);};
  for(const name of ['pointerdown','pointermove','wheel','keydown','scroll'])window.addEventListener(name,trackInteraction,{passive:true,capture:true});
  canvas.addEventListener('pointermove',event=>{clearTimeout(hoverTimer);$('#hover-label').hidden=true;if(!state.showLabels||renderer.insideView||renderer.pointer||state.spin)return;const x=event.clientX,y=event.clientY;hoverTimer=setTimeout(()=>{if(!state.showLabels||renderer.insideView||renderer.pointer||state.spin)return;const r=canvas.getBoundingClientRect(),id=renderer.pick(x-r.left,y-r.top),label=$('#hover-label');label.hidden=!id;if(id){label.textContent=component(id).name;label.style.left=Math.min(x-r.left+12,r.width-190)+'px';label.style.top=Math.max(8,y-r.top-28)+'px';}},140);});
  canvas.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);$('#hover-label').hidden=true;});
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{viewportVisible=entries[0].isIntersecting;if(viewportVisible)markDirty();}).observe(canvas);
  new ResizeObserver(()=>{renderer.resize();markDirty();}).observe($('#canvas-wrap'));renderer.resize();renderInspector();
  const canvasForErrors=$('#scene');canvasForErrors.addEventListener('webglcontextlost',event=>{event.preventDefault();dirty=false;state.spin=false;$('#spin').checked=false;showModelError(Error('The 3D graphics context was lost.'),()=>window.location.reload());});
  function requestScene(){const key=sceneKey(state);if(key===requestedKey)return;requestedKey=key;$('#loading').classList.remove('has-error');$('#loading').hidden=false;$('#loading').textContent='Preparing this configuration...';sceneStore.request(state).then(scene=>{if(key!==sceneKey(state))return;lastScene=scene;geometryKey=key;markDirty();}).catch(error=>{if(key===sceneKey(state))showModelError(error,()=>{requestedKey='';markDirty();});});}
  function frame(t){
    frameScheduled=false;if(document.hidden||!viewportVisible){lastTick=t;return;}
    try{
      const dt=lastTick?Math.min((t-lastTick)/1000,.1):0;lastTick=t;if(renderer.walk(dt))dirty=true;updateRoomHud();if(state.mode==='cruise'&&state.spin)spinAngle=(spinAngle+dt*Math.sqrt(data.layout.spin_gravity_g*9.80665/data.layout.cabin_floor_radius_m))%(2*Math.PI);if(state.mode!=='cruise')spinAngle=0;
      if(dirty||state.spin){if(renderer.gpu?.gl.isContextLost?.())throw Error('The 3D graphics context was lost. Reload the viewer to recover.');requestScene();if(lastScene&&geometryKey===sceneKey(state)&&t-lastFrame>15){const count=renderer.render(lastScene,{...state,spinAngle});window.__proxima={ready:true,state:{...state},meshCount:lastScene.meshCount??lastScene.meshes.length,faceCount:count,renderer:renderer.gpu?'WebGL2':'software',sceneBuildCount:sceneStore.buildCount,spinAngle,softwareStats:renderer.softwareStats,gpuCacheBytes:renderer.gpu?.cacheBytes};$('#loading').hidden=true;dirty=false;lastFrame=t;$('#view-readiness').textContent='';}}
    }catch(error){dirty=false;state.spin=false;$('#spin').checked=false;showModelError(error,()=>{if(lastScene)sceneStore.drop(lastScene);lastScene=null;geometryKey='';requestedKey='';markDirty();});}
    if((dirty||state.spin||(renderer.insideView&&renderer.walkKeys?.size)||Math.abs(renderer.roverPose.speed)>.001)&&geometryKey===sceneKey(state))scheduleFrame();
  }
  drawFrame=frame;markDirty();

}
function showModelError(error,retry){
  window.__proximaErrors.push(error.message);const loading=$('#loading');loading.hidden=false;loading.classList.add('has-error');loading.textContent='';const message=document.createElement('p');message.textContent='The model could not be prepared: '+error.message;const button=document.createElement('button');button.textContent='Retry model';button.onclick=retry;loading.append(message,button);
}
window.__proximaErrors=[];window.addEventListener('error',event=>window.__proximaErrors.push(event.message));
init().catch(error=>showModelError(error,()=>window.location.reload()));
