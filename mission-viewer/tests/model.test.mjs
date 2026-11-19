import * as gpu from '../dist/gpu.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene,exportOBJ,scenarioMass,poseScene,missionTimeline,shipStateAt,stageYear,flightSky,missionScale,settlementTerrain,settlementFrame,systemSky} from '../dist/model.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url),'utf8'));
const active=data.viewer_design?.nominal??data.mass_budget.nominal;
const base={mode:'cruise',selected:'habA',cutaway:true,dimensions:true,spin:false};
// S7 timeline years: crew acceleration burn, mid-coast (the default) and crew braking burn.
const ACCEL=20.5,BRAKE=39.2;
const S8=data.selected_specification,remote=/tow-|feed|thrust-|radiator-|shadow-shield|radiation-shadow|refractory|buffer-tank|coolant|shield-radiator|rcs|reaction-chamber|field-coil|coil-|manifold|injector|antimatter-trap|nozzle|shadow-shield|shield-retainer|cryocooler|power-conditioning|high-gain|hot-|radiator-edge|exhaust|deployed-aeroshell|aeroshell-rib/;
const centreOf=m=>[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length);
test('selected mission requirements stay distinct from historical propulsion sizing',()=>{
  assert.equal(data.architecture.crew,24);
  assert.equal(data.mission_config.crew,24);
  assert.equal(data.architecture.children_in_transit,0);
  assert.equal(data.architecture.crew_departure_year+data.architecture.crew_flight_earth_years,data.architecture.arrival_year);
  assert.equal(data.architecture.cargo_flight_earth_years,40);
  assert.equal(data.architecture.complete_fleet_antimatter_t,null);
  assert.equal(data.roster.schedule,null);
  assert.match(data.viewer_design.status,/reference/i);
});
test('all views have finite metre-based geometry and the touchdown view is gone',()=>{
  for(const [mode,ids] of [['cruise',['habA','habB','structure','propulsion','radiators','tanks','shield','farm','power']],['cargo',['cargo','rover','exploration','tanks','structure','shield','propulsion','radiators']],['settlement',['habA','habB','structure','radiators','rover','inflatable']]]){
    const s=createScene({...base,mode},data,0);
    for(const id of ids)assert.ok(s.meshes.some(m=>m.id===id),`${mode}: missing ${id}`);
    for(const m of s.meshes){assert.ok(m.vertices.flat().every(Number.isFinite));for(const f of m.faces)assert.ok(f.every(i=>Number.isInteger(i)&&i>=0&&i<m.vertices.length));}
    assert.ok(!s.meshes.some(m=>['transport-cover','local-landing-strut'].includes(m.role)));
  }
});
test('24-adult architecture has three berths per bay and two reproductive banks',()=>{
  for(const state of [{},{year:ACCEL},{mode:'settlement'}]){const s=createScene({...base,...state},data);const ids=new Set(s.meshes.map(m=>m.id).filter(x=>x.startsWith('cabin-')));assert.equal(ids.size,8);assert.equal(s.meshes.filter(m=>m.role==='upper-berth').length,8);assert.equal(s.meshes.filter(m=>m.role==='lower-berth').length,16);assert.equal(s.meshes.filter(m=>m.role==='reproductive-bank').length,2);}
});
test('tandem discs sit edge-on along the flight axis with the braking fuel built into their walls',()=>{
  const [za,zb]=data.layout.disc_centres_z_m,[xa,xb]=data.layout.disc_centres_x_m,LY=S8.layout,T=S8.shell.thickness_m;assert.equal(za,zb);assert.ok(xb>xa);
  assert.ok(Math.abs(xb-LY.disc_centres_x_m[1])<1e-3,'layout spacing follows the sized walls');
  // Edge-on: frontal height (along the spin axis) is far smaller than the disc diameter.
  assert.ok(LY.height_m<2*(S8.envelope.radius_m+T)&&S8.frontal.height_m<S8.frontal.width_m);
  // The wall layers belong to the discs (they turn with them) and wrap the pressure hull: rim from the hull radius
  // outward, faces from the hull's axial faces outward; the outermost layer reaches the sized thickness.
  const scene=createScene({...base,year:ACCEL,cutaway:false,flat:false},data),walls=scene.meshes.filter(m=>/^shell-/.test(m.role??''));
  assert.ok(walls.length>0&&walls.every(m=>m.id==='habA'||m.id==='habB'));
  for(const m of walls){const cx=data.layout.disc_centres_x_m[m.id==='habB'?1:0],r=m.vertices.map(p=>Math.hypot(p[0]-cx,p[1]));
    assert.ok(Math.max(...r)<=S8.envelope.radius_m+T+1e-6);assert.ok(m.vertices.every(p=>Math.hypot(p[0]-cx,p[1])>=S8.envelope.radius_m-1e-6||Math.abs(p[2])>=S8.envelope.depth_m/2-1e-6),'no wall inside the hull');}
  assert.ok(Math.max(...walls.flatMap(m=>m.vertices.map(p=>p[2])))>S8.envelope.depth_m/2+T-1e-6);
});
test('flight hardware stays inside each ship\'s forward-shield projection and the shield leads',()=>{
  for(const mode of ['cruise','cargo'])for(const year of [5,ACCEL,30,35,BRAKE,39.95]){
    const scene=createScene({...base,mode,year,flat:false},data),F=scene.flightLayout,face=scene.meshes.find(m=>m.role==='forward-collision-shield');
    if(!face){assert.equal(scene.flight.phase,'entry','the shield stays in orbit only from entry');continue;}
    const front=face?Math.min(...face.vertices.map(p=>p[0])):-Infinity;
    for(const m of scene.meshes){if(m.id==='sky'||remote.test(m.role??''))continue;for(const p of m.vertices){
      const inside=mode==='cargo'?Math.hypot(p[1],p[2])<=F.radius+1e-6:Math.abs(p[1])<=S8.frontal.width_m/2+1e-6&&Math.abs(p[2]-F.zCentre)<=S8.frontal.height_m/2+1e-6;
      assert.ok(inside,`${mode} ${year} ${m.id} ${m.role??''} outside the shield projection`);assert.ok(p[0]>=front-1e-6,`${mode} ${year} ${m.role} ahead of the shield`);}}
  }
  assert.ok(Math.abs(createScene(base,data).meshes.find(m=>m.role==='forward-collision-shield').frontalAreaM2-S8.frontal.area_m2)<1e-9);
});
test('fixed structure stays out of the volume swept by the spinning discs',()=>{
  const scene=createScene({...base,flat:false},data),r=data.design.habitat.envelope_radius_m+S8.layout.wall_thickness_m,half=data.layout.disc_axial_depth_m/2+S8.layout.wall_thickness_m;
  for(const m of scene.meshes){if(/^(hab|bay-|cabin-|transfer|sky)/.test(m.id))continue;
    const centre=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length);
    for(const p of [...m.vertices,centre])for(const [d,cz] of data.layout.disc_centres_z_m.entries())assert.ok(!(Math.hypot(p[0]-data.layout.disc_centres_x_m[d],p[1])<r+.05&&Math.abs(p[2]-cz)<half),`${m.id} ${m.role??''} enters disc ${d}`);}
});
// Closest approach of a canted plume cylinder (start and end rings) to the ship's axis over the ship's length.
const plumeClearance=(m,F)=>{const n=m.vertices.length/2,ring=k=>m.vertices.slice(k*n,(k+1)*n),cen=r=>[0,1,2].map(i=>r.reduce((a,p)=>a+p[i],0)/r.length);
  const a=ring(0),b=ring(1),ca=cen(a),cb=cen(b),ra=Math.hypot(...a[0].map((v,i)=>v-ca[i])),rb=Math.hypot(...b[0].map((v,i)=>v-cb[i]));let worst=Infinity;
  for(let j=0;j<=20;j++){const x=F.front+(F.tail-F.front)*j/20,f=(x-ca[0])/(cb[0]-ca[0]);if(f<0||f>1)continue;worst=Math.min(worst,Math.hypot(ca[1]+f*(cb[1]-ca[1]),ca[2]+f*(cb[2]-ca[2])-F.zCentre)-(ra+f*(rb-ra)));}
  return worst;};
test('towed engine pulls from 2000 m ahead, then behind for braking, with tethers in its shadow and plumes clear of the ship',()=>{
  const SS=data.final_model_inputs.source_shadow,TW=S8.inputs.tow,T=missionTimeline(data).crew,mid=T.depart+T.burnYears+T.coastYears/2;
  for(const [year,ahead] of [[5,true],[ACCEL,true],[mid-1,true],[mid+1,true],[BRAKE,false]]){
    const scene=createScene({...base,year,flat:false},data),F=scene.flightLayout,ec=centreOf(scene.meshes.find(m=>m.role==='reaction-chamber'));
    assert.equal(F.engineAhead,ahead);
    // Tethers run from the tow frame (front of the shield, or the aft end of the last attached module) to the engine.
    const frame=ahead?F.nose:F.tail;
    assert.ok(Math.abs(ec[0]-frame-(ahead?-1:1)*TW.length_m)<1e-6);
    // Engine radiation shadow shields are removed for now (open item).
    assert.ok(!scene.meshes.some(m=>/shadow-shield|radiation-shadow/.test(m.role??'')));
    const tethers=scene.meshes.filter(m=>m.role==='tow-tether');assert.equal(tethers.length,4);
    for(const m of scene.meshes.filter(m=>m.role==='hot-radiator-fin'))assert.ok(Math.abs(centreOf(m)[0]-F.centre)>Math.abs(ec[0]-F.centre),'radiators on the far side, away from the plumes');
    const plumes=scene.meshes.filter(m=>m.role==='exhaust-beam'&&Math.max(...m.vertices.map(p=>p[0]))-Math.min(...m.vertices.map(p=>p[0]))>100);assert.equal(plumes.length>0,scene.flight.burning);
    if(scene.flight.burning)assert.ok(Math.max(...plumes.flatMap(m=>m.vertices.map(p=>Math.abs(p[0]-ec[0]))))>30000,'plume fades out over tens of kilometres');
    // The drawn plume edge spreads at the assumed half-angle and the cant is sized so that edge clears the ship by the margin.
    for(const m of plumes)assert.ok(plumeClearance(m,F)>Math.hypot(F.width,F.height)/2+TW.plume_clearance_margin_m-1,'canted plume edge clears the ship');
  }
});
test('tension straps hang the habitat and modules from the tow end; tow masses come from the S8 report',()=>{
  for(const [year,ahead] of [[ACCEL,true],[BRAKE,false]]){const scene=createScene({...base,year,flat:false},data),F=scene.flightLayout,straps=scene.meshes.filter(m=>m.role==='tension-strap');
    assert.equal(straps.length,4);for(const m of straps){const xs=m.vertices.map(p=>p[0]);assert.ok(Math.min(...xs)<F.front&&Math.abs(Math.max(...xs)-F.tail)<.2,'straps span the whole ship');}
    for(const t of ['Tow tethers','Tension straps','Main engine'])assert.ok(scene.labels.some(l=>l.text===t),t);}
  assert.ok(S8.tow.crew.thrust_MN>0&&S8.engine_shadow_shield.standoff_m===S8.inputs.tow.length_m);
});
test('tank modules, shell layers, containment, radiators and landing propellant follow the S8 ledger at liquid density',()=>{
  const I=data.final_model_inputs,st=S8.inputs.storage,rho=S8.mixture_density_t_m3;
  for(const mode of ['cruise','cargo']){
    const kind=mode==='cargo'?'cargo':'crew',P=S8.ships[kind].propulsion,scene=createScene({...base,mode,year:mode==='cargo'?-1:5,flat:false},data);
    const mods=[...new Map(scene.meshes.filter(m=>m.stage).map(m=>[m.stage.phase+m.stage.index,m.stage])).values()];
    assert.equal(mods.length,16,'all 16 modules before departure');
    assert.ok(Math.abs(mods.reduce((n,x)=>n+x.fusion_t,0)-P.fusion_t)<1e-6);assert.ok(Math.abs(mods.reduce((n,x)=>n+x.antimatter_t,0)-P.antimatter_t)<1e-9);
    assert.ok(Math.abs(mods.reduce((n,x)=>n+x.tank_and_separation_t,0)-P.tank_and_separation_t)<1e-6);
    // Domed cylindrical tanks hold each module's species at liquid density.
    for(const seg of P.segments.filter(s=>kind==='cargo'||s.phase===0)){const parts=scene.meshes.filter(m=>m.stage?.phase===(seg.phase?'braking':'acceleration')&&m.stage.index===seg.index),sum=role=>parts.filter(m=>m.role===role).reduce((n,m)=>n+m.volumeM3,0);
      const d=sum('deuterium-module'),h=sum('helium3-module');
      assert.ok(Math.abs(d-seg.fusion_t*st.deuterium_mass_fraction/st.deuterium_liquid_density_t_m3)<1e-6*seg.fusion_t,'deuterium at liquid density');assert.ok(Math.abs(d+h-seg.fusion_t/rho)<1e-6*seg.fusion_t);
      assert.ok(parts.some(m=>m.role==='deuterium-module-dome')||parts.filter(m=>m.role==='deuterium-module').length>0);}
    assert.equal(scene.meshes.some(m=>m.role==='antimatter-containment'),kind==='crew','containment only where antimatter is loaded');
    const area=scene.meshes.filter(m=>m.role==='hot-radiator-fin').reduce((n,m)=>n+m.areaM2,0);assert.ok(Math.abs(area-P.hot_radiator_with_allowance_t/(1+I.hardware_allowance)*1000/5)<1e-6);
    const L=S8.ships[kind].ledger.landing;for(const [role,t] of [['landing-oxygen',L.oxygen_t],['landing-hydrogen',L.hydrogen_t]])assert.ok(Math.abs(scene.meshes.filter(m=>m.role===role).reduce((n,m)=>n+m.massT,0)-t)<1e-9,role);
    assert.equal(scene.meshes.filter(m=>m.role==='landing-engine').length,kind==='crew'?I.landing.crew_engines:I.landing.cargo_engines);
  }
  // Every braking module of the crew ship is a shell layer: deuterium and helium-3 sub-layers present.
  const crew=createScene({...base,year:5,flat:false},data);for(const l of S8.shell.layers)for(const role of ['shell-deuterium','shell-helium3'])assert.ok(crew.meshes.some(m=>m.role===role&&m.stage.index===l.index),role+' '+l.index);
});
test('burn acceleration is within what the structure carries',()=>{
  const S=data.design.structure;assert.equal(S.design_acceleration_g,data.design.nominal.main_acceleration_g);assert.ok(S.design_acceleration_g<S.governing_limit_g);
  for(const c of S.checks)assert.ok(c.margin_at_design>1,c.element);
  assert.ok(data.trajectory.each_burn_onboard_days>300,'slower burns last longer');
});
test('scenario rocket accounting scales linearly with payload and adds touchdown fuel',()=>{
  const a=scenarioMass(500,.5,1.025,data.trajectory.rapidity),b=scenarioMass(1000,.5,1.025,data.trajectory.rapidity);assert.ok(Math.abs(b.departureTonnes-2*a.departureTonnes)<1e-9);assert.ok(a.departureTonnes>500&&a.hydrogenTonnes>0);assert.equal(scenarioMass(500,.5,0,data.trajectory.rapidity).hydrogenTonnes,0);assert.ok(scenarioMass(500,.3,1.025,data.trajectory.rapidity).departureTonnes>a.departureTonnes);
});
test('rover reuses one pressure hull and cargo is transferred rather than duplicated',()=>{
  // S7: the rover travels on the cargo ship (heavy exploration), not the crew ship.
  assert.equal(createScene(base,data).meshes.filter(m=>m.role==='rover-pressure-hull').length,0);
  for(const mode of ['cargo','settlement']){const s=createScene({...base,mode},data);const hulls=s.meshes.filter(m=>m.role==='rover-pressure-hull');assert.equal(hulls.length,1);const xs=hulls[0].vertices.map(p=>p[0]);assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-7)<1e-9);}
  assert.equal(createScene({...base,mode:'settlement'},data).meshes.filter(m=>m.role==='cargo-container').length,2);
  const canisters=createScene({...base,mode:'cargo'},data).meshes.filter(m=>m.role==='payload-canister').map(m=>m.ledger.name);
  for(const name of ['Industry and resource processing','Surface habitat expansion','Food and life-support backup','Surface power and services','Startup supplies, spares and process inventories'])assert.ok(canisters.includes(name),name);
});
test('surface cabin floors are below beds in surface gravity',()=>{
  const s=createScene({...base,mode:'settlement'},data);const [floor,bed]=s.meshes.filter(m=>m.id==='cabin-1');const averageY=m=>m.vertices.reduce((n,p)=>n+p[1],0)/m.vertices.length;assert.ok(averageY(floor)<averageY(bed));
});
test('interior zoning fills both decks to the hub and can isolate a single level',()=>{
  const all=createScene({...base,deck:'all'},data);assert.equal(all.zones.length,24);assert.ok(all.zones.every(z=>z.purpose&&z.status.includes('unvalidated')));
  const one=createScene({...base,deck:'1'},data);assert.equal(one.zones.length,8);assert.ok(one.zones.every(z=>z.deck===2));assert.equal(one.meshes.filter(m=>m.id.startsWith('cabin-')).length,0);
});
test('service radiators stay clear of the spinning discs and the toggle hides all radiator hardware',()=>{
  const scene=createScene({...base,flat:false},data);const panels=scene.meshes.filter(m=>m.role==='service-radiator');assert.ok(panels.length>0);
  const half=data.layout.disc_axial_depth_m/2;for(const m of panels)for(const p of m.vertices)data.layout.disc_centres_x_m.forEach((cx,d)=>assert.ok(Math.hypot(p[0]-cx,p[1])>data.layout.disc_radius_m||Math.abs(p[2]-data.layout.disc_centres_z_m[d])>half));
  const hidden=createScene({...base,showRadiators:false},data);assert.equal(hidden.meshes.filter(m=>m.id==='radiators').length,0);assert.equal(hidden.lines.filter(m=>m.id==='radiators').length,0);
});
test('high-detail curved geometry has finite normals and keeps the crewed rover hull unchanged',()=>{
  const s=createScene({...base,detail:'high'},data);for(const m of s.meshes)if(m.normals){assert.equal(m.normals.length,m.vertices.length);assert.ok(m.normals.flat().every(Number.isFinite));}const hull=createScene({...base,mode:'cargo',detail:'high'},data).meshes.find(m=>m.role==='rover-pressure-hull');assert.ok(hull);assert.ok(Math.abs(Math.max(...hull.vertices.map(p=>p[0]))-Math.min(...hull.vertices.map(p=>p[0]))-7)<1e-9);
});
test('OBJ exports valid vertex references and matching source mass allocations',()=>{
  const s=createScene(base,data),obj=exportOBJ(s),count=s.meshes.reduce((n,m)=>n+m.vertices.length,0),normalCount=obj.split('\n').filter(x=>x.startsWith('vn ')).length;assert.equal(obj.split('\n').filter(x=>x.startsWith('v ')).length,count);assert.ok(normalCount>0);for(const row of obj.split('\n').filter(x=>x.startsWith('f ')))for(const token of row.slice(2).split(' ')){const [v,,n]=token.split('/');assert.ok(+v>0&&+v<=count);if(n)assert.ok(+n>0&&+n<=normalCount);}
  assert.ok(data.viewer_design.components.every(x=>Number.isFinite(x.mass_kg)));assert.equal(data.settlement.power.surface_antimatter_inventory_kg,1);assert.equal(data.exploration.crewed_rover.nominal_endurance_days,7);
});

test('parked rover clears deployed habitat footprints',()=>{
  const scene=createScene({...base,mode:'settlement'},data);
  for(const mesh of scene.meshes.filter(m=>m.id==='rover'))for(const p of mesh.vertices)for(const cx of data.layout.disc_centres_x_m)assert.ok(Math.hypot(p[0]-cx,p[2]+45)>data.layout.disc_radius_m+2);
});
test('interiors include identifiable pumps, filters, fabrication machinery and drawer racks',()=>{
  const roles=new Set(createScene(base,data).meshes.map(m=>m.role));for(const role of ['filter-column','pump-motor','fabrication-bed','cargo-transfer-bag'])assert.ok(roles.has(role));
});
test('spin posing rotates cabins around habitat hubs and preserves fixed structure',()=>{
  const scene=createScene(base,data),posed=poseScene(scene,Math.PI/2),fixed=scene.meshes.findIndex(m=>!/^(hab|bay-|cabin-)/.test(m.id)),index=scene.meshes.findIndex(m=>m.id==='cabin-1'),a=scene.meshes[index].vertices[0],b=posed.meshes[index].vertices[0],cx=data.layout.disc_centres_x_m[0];assert.ok(Math.abs(b[0]-cx-a[1])<1e-8);assert.ok(Math.abs(b[1]+a[0]-cx)<1e-8);assert.equal(b[2],a[2]);assert.deepEqual(posed.meshes[fixed].vertices,scene.meshes[fixed].vertices);
});

test('both discs retain living, clinical and plant rooms for the 24-adult architecture',()=>{
  const scene=createScene(base,data);for(const habitat of ['A','B']){const zones=scene.zones.filter(z=>z.habitat===habitat);for(const purpose of ['Shared lounge','Mission control','Galley and dining','Exercise and rehabilitation','Hygiene and laundry','Medical and torpor service','Life support','Fresh-food garden','Clean workshop','Food reserve'])assert.ok(zones.some(z=>z.functions.includes(purpose)),purpose);}
  assert.ok(!scene.meshes.some(m=>m.id==='refuge'),'S7 lands the whole habitat; no separate refuge');for(const disc of ['A','B'])assert.ok(scene.meshes.filter(m=>m.role==='seat'&&m.id.startsWith('bay-'+disc+'-')).length>=8);for(const role of ['treadmill','resistive-exercise-device','cycle-ergometer','science-glovebox','waste-management-toilet'])assert.ok(scene.meshes.some(m=>m.role===role),role);
});

test('selected cabin floors fit inside the outer pressure radius and adjacent cabins do not overlap',()=>{
  const scene=createScene(base,data),floors=Array.from({length:8},(_,i)=>scene.meshes.find(m=>m.id==='cabin-'+(i+1)));
  for(let i=0;i<floors.length;i++){const centre=data.layout.disc_centres_x_m[i<4?0:1];for(const v of floors[i].vertices)assert.ok(Math.hypot(v[0]-centre,v[1])<=data.layout.cabin_floor_radius_m+.25+1e-8);}
  for(let i=0;i<floors.length;i++)for(let j=i+1;j<floors.length;j++){
    if((i<4)!==(j<4))continue;// the two discs share an axis, so only bays in the same disc can collide
    const a=floors[i].vertices,b=floors[j].vertices,axes=[];for(const points of [a,b])for(const [u,v] of [[0,1],[0,3]]){const dx=points[v][0]-points[u][0],dy=points[v][1]-points[u][1];axes.push([-dy,dx]);}
    assert.ok(axes.some(axis=>{const pa=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),pb=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);return Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa);}),`Cabins ${i+1} and ${j+1} overlap`);
  }
});
test('two food trains remain aboard and large greenhouses are built locally',()=>{
  for(const state of [{},{year:ACCEL},{mode:'settlement'}]){const mode=state.mode??'cruise',scene=createScene({...base,...state},data);assert.equal(scene.meshes.filter(m=>m.role==='food-factory-hull').length,mode==='settlement'?0:2);const cropHulls=scene.meshes.filter(m=>m.role==='farm-pressure-envelope');assert.equal(cropHulls.length,mode==='settlement'?8:0);assert.ok(cropHulls.every(m=>m.builtLocally));}
  const scene=createScene(base,data);assert.equal(scene.meshes.filter(m=>m.role==='fresh-food-tray').reduce((n,m)=>n+m.cropAreaM2,0),30);
});
test('food trains sit in the despun gap, clear of both rotating discs',()=>{
  const scene=createScene({...base,flat:false},data),half=data.layout.disc_axial_depth_m/2,sides=new Set();
  for(const mesh of scene.meshes.filter(m=>m.role==='food-factory-hull')){sides.add(Math.sign(centreOf(mesh)[1]));for(const p of mesh.vertices)data.layout.disc_centres_x_m.forEach((cx,d)=>assert.ok(Math.hypot(p[0]-cx,p[1])>data.layout.disc_radius_m+.25||Math.abs(p[2]-data.layout.disc_centres_z_m[d])>half));}
  assert.equal(sides.size,2,'one train either side of the transfer passage');
});
test('berth-bay spin grouping changes between the fourth and fifth bays',()=>{
  const scene=createScene(base,data),posed=poseScene(scene,.2);
  for(const [id,index,sign] of [['cabin-4',0,-1],['cabin-5',1,1]]){const before=scene.meshes.find(m=>m.id===id).vertices[0],after=posed.meshes.find(m=>m.id===id).vertices[0],cx=data.layout.disc_centres_x_m[index],angle=.2*sign;assert.ok(Math.abs(after[0]-(cx+(before[0]-cx)*Math.cos(angle)-before[1]*Math.sin(angle)))<1e-8);assert.ok(Math.abs(after[1]-((before[0]-cx)*Math.sin(angle)+before[1]*Math.cos(angle)))<1e-8);}
});
test('flight-only shield, tanks, engine, tethers and bearings do not reach the surface',()=>{
  const roles=['forward-collision-shield','shell-deuterium','shell-helium3','deuterium-module','antimatter-containment','reaction-chamber','nozzle-coil','tow-tether','hot-radiator-fin','spin-bearing','orbital-service-reactor','gcr-equipment-allowance'];
  const cruise=createScene({...base,year:5},data);for(const role of roles)assert.ok(cruise.meshes.some(m=>m.role===role),role);
  const scene=createScene({...base,mode:'settlement'},data);assert.ok(!scene.meshes.some(m=>m.id==='shield'||roles.includes(m.role)));
});
test('displayed reuse-study ledgers close at early release, handover and settlement',()=>{
  const {components,nominal}=data.viewer_design;
  for(const [phase,key] of [['surface','final_retained_mass_kg'],['orbit','early_release_mass_kg'],['handover','late_engine_stage_release_mass_kg']])assert.ok(Math.abs(components.filter(r=>r.release_stage===phase).reduce((n,r)=>n+r.mass_kg,0)-nominal[key])<1e-6);
});
test('the thrust spine stays in space and ground utilities have physical supports',()=>{
  const cruise=createScene(base,data);assert.equal(cruise.meshes.filter(m=>m.role==='tow-tether').length,4);assert.equal(cruise.meshes.filter(m=>m.role==='bearing-strut').length,8);
  const surface=createScene({...base,mode:'settlement'},data);
  assert.equal(surface.meshes.filter(m=>m.role==='tow-tether'||m.role==='bearing-strut').length,0);
  assert.ok(surface.meshes.filter(m=>m.role==='radiator-header').length>=2);assert.ok(surface.meshes.some(m=>m.systemRole==='pressurised-corridor'));
});
test('every cabin and shared room has a finite inside entry in deployed configurations',()=>{
 for(const mode of ['cruise','settlement']){
  const scene=createScene({...base,mode},data);
  // Settlement: ring rooms, berth bays and hall quarters per disc, eight greenhouse halls, two residences and the rover.
  const expected=mode==='settlement'?35:26;assert.equal(scene.rooms.length,expected);
  assert.equal(new Set(scene.rooms.map(r=>r.id)).size,expected);
  for(const r of scene.rooms)for(const v of [r.eye,r.up,r.forward])assert.ok(v.every(Number.isFinite));
 }
});

test('closed shells retain cabin furniture and room doorways are open',()=>{
 const scene=createScene({...base,cutaway:false},data);
 assert.ok(scene.meshes.filter(m=>m.id==='cabin-1').length>15);
 assert.ok(scene.meshes.some(m=>m.role==='room-front'));
 assert.equal(scene.meshes.filter(m=>m.role==='pressure-hatch').length,0);
 assert.ok(scene.meshes.some(m=>m.role==='food-factory-mount'));
});


test('flat cruise presentation preserves radial gravity and exposes both furnished discs',()=>{
 const scene=createScene({...base,flat:true,cutaway:false,interiorHabitat:'all'},data);
 for(const room of scene.rooms.filter(r=>!r.pressurizedModule)){
  const {centre,radius}=room.gravity;
  const radial=[room.eye[0]-centre[0],0,room.eye[2]-centre[2]],length=Math.hypot(...radial);
  assert.ok(Math.abs(length-radius)<1e-8);
  assert.ok(room.up[0]*radial[0]+room.up[2]*radial[2]<-radius+.001);
 }
 assert.equal(scene.meshes.filter(m=>m.role==='porthole-glass').length,24);
 assert.equal(scene.meshes.filter(m=>m.role==='circulation-floor').length,0);
 assert.equal(scene.meshes.filter(m=>m.id==='cabin-1').length,scene.meshes.filter(m=>m.id==='cabin-5').length);
 const posed=poseScene(scene,.4),index=scene.meshes.findIndex(m=>m.id==='cabin-1');
 assert.ok(Math.abs(scene.meshes[index].vertices[0][1]-posed.meshes[index].vertices[0][1])<1e-8);
});
test('flat cutaway removes window-side covers on both habitats without removing contents',()=>{
 const state={...base,flat:true,detail:'medium',interiorHabitat:'all'};
 const closed=createScene({...state,cutaway:false},data),open=createScene({...state,cutaway:true},data);
 assert.equal(closed.meshes.filter(m=>m.role==='window-wall').length,24);
 assert.equal(open.meshes.filter(m=>m.role==='window-wall').length,0);
 for(const id of ['cabin-1','cabin-5'])assert.equal(open.meshes.filter(m=>m.id===id).length,closed.meshes.filter(m=>m.id===id).length);
});
test('settlement excludes elevated ship hardware but retains ground facilities',()=>{
 const scene=createScene({...base,mode:'settlement'},data);
 for(const id of ['tanks','propulsion','refuge'])assert.ok(!scene.meshes.some(m=>m.id===id));
 for(const id of ['farm','rover','cargo','power','habA','habB'])assert.ok(scene.meshes.some(m=>m.id===id));
 assert.ok(!scene.meshes.some(m=>m.role==='local-landing-strut'));
});

test('cruise circulation stays behind room fronts and cabin floors face outward',()=>{
 const scene=createScene({...base,flat:true,cutaway:false},data);
 const cabin=scene.meshes.find(m=>m.id==='cabin-1'),cx=data.layout.disc_centres_x_m[0];
 for(const v of cabin.vertices)assert.ok(Math.hypot(v[0]-cx,v[2])<data.layout.cabin_floor_radius_m-.11);
 assert.equal(scene.meshes.filter(m=>m.role==='door-lintel').length,8);
 for(const m of scene.meshes.filter(m=>m.role==='circulation-floor'))for(const v of m.vertices)assert.ok(v[1]<-1.09);
 for(const m of scene.meshes.filter(m=>m.role==='room-divider'))for(const v of m.vertices)assert.ok(v[1]>-.91);
});

test('porthole sightlines are clear of structure and fittings',async()=>{
 const {rayTriangle}=await import('../dist/gpu.js');
 const scene=createScene({...base,cutaway:false,flat:true,detail:'medium'},data);
 for(const habitat of ['A','B']){
  const glass=scene.meshes.find(m=>m.id.startsWith('bay-'+habitat)&&m.role==='porthole-glass');
  const centre=[0,1,2].map(i=>glass.vertices.reduce((sum,p)=>sum+p[i],0)/glass.vertices.length);
  const origin=[centre[0],centre[1]-.5,centre[2]],direction=[0,1,0];
  // In flight the fuel walls cover the portholes (shielding over view); the sightline check is for the habitat's own structure.
  for(const m of scene.meshes){
   if(m.role==='porthole-glass'||/^(shell-|fuel-wall|window-mullion)/.test(m.role??''))continue;
   if(m.vertices.every(p=>p[0]<origin[0])||m.vertices.every(p=>p[0]>origin[0])||m.vertices.every(p=>p[2]<origin[2])||m.vertices.every(p=>p[2]>origin[2]))continue;
   for(const f of m.faces)for(let i=1;i<f.length-1;i++){
    const t=rayTriangle(origin,direction,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);
    assert.ok(t===null||t>.8,m.id+' obstructs the porthole');
   }
  }
 }
});

test('each deck is a ring of walk-through rooms with doorway bulkheads and a ladder to the deck above',()=>{
 const scene=createScene({...base,flat:true,cutaway:true,interiorHabitat:'all'},data);
 for(const habitat of ['A','B'])for(const deck of [1,2])assert.equal(scene.zones.filter(z=>z.habitat===habitat&&z.deck===deck).length,deck===1?8:4);
 // Two panels (beside and above the doorway) per room boundary; one ladder per communal room.
 assert.equal(scene.meshes.filter(m=>m.role==='room-bulkhead').length,2*12*2);
 assert.equal(new Set(scene.meshes.filter(m=>m.role==='access-ladder').map(m=>m.id)).size,16);
 for(const z of scene.zones.filter(z=>z.purpose!=='Private cabins'))assert.ok(z.functions.length>=2&&!z.functions.includes('Residential'));
});

test('every inside entry starts clear of fittings and partitions',()=>{
 for(const flat of [false,true]){
  const scene=createScene({...base,flat,cutaway:false,interiorHabitat:'all',detail:'medium'},data);
  const solid=scene.meshes.filter(m=>(m.id.startsWith('bay-')||m.id.startsWith('cabin-'))&&!['inflatable-envelope','folding-deck','window-wall','porthole-glass','porthole-frame'].includes(m.role));
  for(const room of scene.rooms){
   const f=Math.hypot(...room.forward),u=Math.hypot(...room.up),axes=[room.forward.map(v=>v/f),room.up.map(v=>v/u)];axes.push([axes[0][1]*axes[1][2]-axes[0][2]*axes[1][1],axes[0][2]*axes[1][0]-axes[0][0]*axes[1][2],axes[0][0]*axes[1][1]-axes[0][1]*axes[1][0]]);
   const project=p=>axes.map(a=>a.reduce((s,v,i)=>s+v*(p[i]-room.eye[i]),0));
   for(const m of solid){
    if(m.vertices.every(p=>Math.hypot(p[0]-room.eye[0],p[1]-room.eye[1],p[2]-room.eye[2])>6))continue;
    const q=m.vertices.map(project),inside=[0,1,2].every(i=>Math.min(...q.map(p=>p[i]))<.15&&Math.max(...q.map(p=>p[i]))>-.15);
    assert.ok(!inside,`${room.id} entry is inside ${m.id} ${m.role??''}`);
   }
   if(room.pressurizedModule){assert.equal(room.gravity.type,'float');continue;}
   const g=room.gravity,offset=room.eye.map((v,i)=>v-g.centre[i]),z=offset.reduce((s,v,i)=>s+v*g.axis[i],0);
   assert.ok(z>g.axialMin&&z<g.axialMax,room.id);
  }
 }
});

test('each cabin has its own porthole centred on its back wall',()=>{
 const scene=createScene({...base,cutaway:false,interiorHabitat:'all'},data),r=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]-1.3;
 for(const [d,habitat] of ['A','B'].entries()){
  const cx=data.layout.disc_centres_x_m[d],angles=scene.meshes.filter(m=>m.role==='porthole-glass'&&m.id.startsWith('bay-'+habitat+'-0-')).map(m=>{const c=[0,1].map(i=>m.vertices.reduce((s,p)=>s+p[i],0)/m.vertices.length);return Math.atan2(c[1],c[0]-cx);});
  for(const p of data.habitats.cabin_bay_layout){const theta=(p.cell+.5)*Math.PI/6+p.offset_m/r;assert.ok(angles.some(a=>Math.abs(Math.atan2(Math.sin(a-theta),Math.cos(a-theta)))*r<.01),'cabin at '+theta);}
 }
});
test('ladder hatches pierce the ceiling, the shell above and the upper floor',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,interiorHabitat:'all'},data),g=scene.rooms.find(r=>r.id==='bay-A-0-1').gravity,cx=data.layout.disc_centres_x_m[0];
 const ladder=g.ladders.find(l=>l.from===0);
 // Cast a ray from the lower deck to the upper deck along the ladder; only the ladder itself, its rungs and hatch rims may lie on it.
 const from=g.decks[0].radius,to=g.decks[1].radius,o=[g.centre[0]+from*Math.cos(ladder.angle),g.centre[1]+from*Math.sin(ladder.angle),g.centre[2]+ladder.z],dir=[-Math.cos(ladder.angle),-Math.sin(ladder.angle),0];
 const {rayTriangle}=gpu;
 for(const m of scene.meshes.filter(m=>['inflatable-envelope','folding-deck'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=rayTriangle(o,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t>from-to,m.id+' '+m.role+' blocks the ladder');}
});

test('window-side walls have no gaps at their corners',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,interiorHabitat:'all'},data),cx=data.layout.disc_centres_x_m[0];
  for(const id of [...new Set(scene.meshes.filter(m=>m.role==='window-wall'&&m.id.startsWith('bay-A-')).map(m=>m.id))]){
  const parts=scene.meshes.filter(m=>m.id===id&&['window-wall','porthole-glass'].includes(m.role)),all=parts.flatMap(m=>m.vertices),ref=Math.atan2(all.reduce((s,p)=>s+p[1],0),all.reduce((s,p)=>s+p[0]-cx,0));
  // Angles relative to the room centre so rooms straddling ±180° do not wrap.
  const polar=p=>{const a=Math.atan2(p[1],p[0]-cx)-ref;return [Math.atan2(Math.sin(a),Math.cos(a)),Math.hypot(p[0]-cx,p[1])];},pts=all.map(polar);
  const [amin,amax]=[Math.min(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[0]))],[rmin,rmax]=[Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[1]))];
  const tris=parts.flatMap(m=>m.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>[f[0],f[i+1],f[i+2]].map(k=>polar(m.vertices[k])))));
  const inTri=(p,[a,b,c])=>{const s=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]),d1=s(a,b,p),d2=s(b,c,p),d3=s(c,a,p);return !((d1<-1e-12||d2<-1e-12||d3<-1e-12)&&(d1>1e-12||d2>1e-12||d3>1e-12));};
  for(const fa of [.005,.25,.5,.75,.995])for(const fr of [.01,.5,.99]){const p=[amin+(amax-amin)*fa,rmin+(rmax-rmin)*fr];assert.ok(tris.some(t=>inTri(p,t)),`${id} gap at ${fa},${fr}`);}
 }
});
test('cabin doorways open onto clear floor and every room wall reaches the ceiling',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,interiorHabitat:'all',detail:'medium'},data);
 for(const room of scene.rooms.filter(x=>x.id.startsWith('cabin-'))){
  const f=Math.hypot(...room.forward),u=Math.hypot(...room.up),axes=[room.forward.map(x=>x/f),room.up.map(x=>x/u),[0,0,1]],project=p=>axes.map(a=>a.reduce((s,x,i)=>s+x*(p[i]-room.eye[i]),0));
  // Doorway approach: 1.1 m wide, from the door (0.6 m ahead along the axis) to 0.9 m inside, below head height.
  for(const m of scene.meshes.filter(m=>m.id===room.id&&m.role!=='cabin-divider'&&m.color!=='#d9e0c9')){const q=m.vertices.map(project),lo=[0,1,2].map(i=>Math.min(...q.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...q.map(p=>p[i])));
   assert.ok(!(lo[0]<.55&&hi[0]>-.55&&lo[2]<.6&&hi[2]>-.9&&lo[1]<1.2&&hi[1]>-.6),`${room.id} doorway blocked by ${m.role??m.color}`);}
 }
 const heights=role=>scene.meshes.filter(m=>m.role===role).map(m=>{const cx=data.layout.disc_centres_x_m[m.id.startsWith('bay-B')||m.id.startsWith('cabin-')&&+m.id.slice(6)>4?1:0],r=m.vertices.map(p=>Math.hypot(p[0]-cx,p[1]));return Math.max(...r)-Math.min(...r);});
 for(const h of [...heights('cabin-divider'),...heights('room-front')])assert.ok(h>2.9,'partition reaches the ceiling');
});
test('tandem habitats keep a clear transfer corridor over both hubs and down to the food trains',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,interiorHabitat:'all',detail:'overview'},data),[xA,xB]=data.layout.disc_centres_x_m;
 assert.ok(Math.abs(xB-xA-S8.layout.disc_centres_x_m[1])<1e-3,'disc spacing matches the sized walls');
 assert.ok(xB-xA-2*(data.layout.disc_radius_m+S8.shell.thickness_m)>=3,'rim gap between the fuel walls holds the 3 m food trains');
 // Each corridor leg is clear of everything except corridor hardware.
 for(const g of scene.world.segments.filter(g=>/Transfer corridor|Crew transfer passage/.test(g.name??''))){const d=g.b.map((v,i)=>v-g.a[i]),len=Math.hypot(...d),dir=d.map(v=>v/len);
  for(const m of scene.meshes.filter(m=>!['transfer','sky'].includes(m.id)&&!['food-factory-hull','pressure-end-dome'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(g.a,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t<0||t>len,`${m.id} ${m.role??''} blocks ${g.name}`);}}
});

test('settlement ring rooms open onto the central hall through lined doorways',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false,interiorHabitat:'all'},data);
 const cx=data.layout.surface_disc_centres_x_m[0],cz=data.layout.surface_disc_centres_z_m[0],a=2*Math.PI/6,o=[cx+3*Math.cos(a),3.1,cz+3*Math.sin(a)],dir=[Math.cos(a),0,Math.sin(a)],len=4;
 // Walk outward at standing eye height from the hall into the ring: no wall may block the way.
 for(const m of scene.meshes.filter(m=>m.id.startsWith('bay-A-')&&['inflatable-envelope','hull-boundary','room-bulkhead'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t>len,`${m.id} ${m.role} blocks the doorway at ${t}`);}
 assert.equal(scene.meshes.filter(m=>m.role==='doorway-passage').length,2*4,'a lintel for each of four hall doorways in both habitats');
 // The hall is furnished rather than empty: racks from the inner deck round the wall, tables and seats on the floor.
 for(const disc of ['A','B']){const hall=scene.meshes.filter(m=>m.id.startsWith(`bay-${disc}-1-`));assert.equal(hall.filter(m=>m.role==='shared-table').length,4);assert.equal(hall.filter(m=>m.role==='seat').length,16);assert.ok(hall.filter(m=>m.role==='rack-backplane').length>=8);}
});
test('two inflatable residences join the discs so all 32 can be awake on the surface',()=>{
 const scene=createScene({...base,mode:'settlement'},data),SI=data.design.surface_inflatables;
 assert.equal(scene.meshes.filter(m=>m.role==='inflatable-habitat-shell').length,2);assert.equal(scene.meshes.filter(m=>m.role==='couple-bed').length,16,'a private bed for each of 16 couples');
 assert.equal(scene.meshes.filter(m=>m.id==='inflatable'&&m.role==='seat').length,32,'everyone can sit down to eat');
 assert.ok(SI.gross_floor_area_m2>300);assert.ok(SI.hardware_kg<10000,'kept light');assert.ok(Math.abs(SI.per_module_kg.total-SI.per_module_kg.shell-SI.per_module_kg.floors-SI.per_module_kg.interiors-SI.per_module_kg.hatches_frame_anchors)<1e-6);
 assert.ok(scene.rooms.some(r=>r.id==='residence-1')&&scene.rooms.some(r=>r.id==='residence-2'));
 // S7: surface habitat expansion travels on the cargo ship as one payload line, not as bales on the crew ship.
 assert.equal(createScene(base,data).meshes.filter(m=>m.role==='stowed-surface-habitat').length,0);
 assert.ok(createScene({...base,mode:'cargo'},data).meshes.some(m=>m.ledger?.name==='Surface habitat expansion'));
 assert.ok(!scene.meshes.some(m=>m.role==='stowed-surface-habitat'),'unpacked on the surface');
});
test('settlement greenhouse halls open onto the pressurised spine under the Proxima b sky',()=>{
 const scene=createScene({...base,mode:'settlement'},data),halls=scene.meshes.filter(m=>m.role==='farm-pressure-envelope');
 assert.equal(halls.length,8);assert.ok(halls.every(h=>h.opacity>.2&&h.opacity<.8),'glazing is translucent, not invisible');
 const spine=scene.surfaceMap.corridors.find(c=>c.name==='Greenhouse spine');
 for(const h of halls)assert.ok(h.vertices.some(p=>[spine.z0,spine.z1].some(z=>Math.abs(p[2]-z)<.01)),'hall meets the spine');
 const cropArea=scene.meshes.filter(m=>m.role==='crop-tray').reduce((sum,m)=>sum+m.cropAreaM2,0);
 assert.ok(Math.abs(cropArea-data.settlement.greenhouse.initial_planted_area_m2_study)<1e-8);
 assert.ok(scene.meshes.some(m=>m.role==='regolith'));assert.ok(scene.meshes.filter(m=>m.role==='rock').length>0);assert.ok(scene.meshes.filter(m=>m.role==='crater').length<=2);
 const sky=data.settlement.proxima_b_sky,proxima=scene.meshes.find(m=>m.role==='proxima'),angle=2*Math.atan(sky.star_radius_solar*695700/(sky.orbit_au*149597870.7))*180/Math.PI;
 assert.ok(Math.abs(proxima.angularDiameterDeg-angle)<1e-9&&angle>1.6&&angle<1.8,'Proxima spans about 1.7 degrees');
 const c=proxima.vertices.reduce((s,p)=>s.map((v,i)=>v+p[i]/proxima.vertices.length),[0,0,0]),r=Math.max(...proxima.vertices.map(p=>Math.hypot(...p.map((v,i)=>v-c[i]))));
 assert.ok(Math.abs(2*Math.atan(r/Math.hypot(...c))*180/Math.PI-angle)<.02,'drawn at its true angular size');
 for(const [name,mag] of [['A',-6.6],['B',-5.3]])assert.ok(Math.abs(scene.meshes.find(m=>m.role==='alpha-centauri-'+name).apparentMagnitude-mag)<.1);
 assert.ok(!scene.meshes.some(m=>m.role==='star'),'daylight sky hides the faint star field');
 for(const [mode,grid] of [['cruise',false],['settlement',false],['cargo',false]])assert.equal(createScene({...base,mode},data).grid,grid);
});

test('burns lock the discs, show a switchable plume and keep the shield facing forward',()=>{
  for(const [year,ahead] of [[ACCEL,true],[BRAKE,false]]){
    const scene=createScene({...base,year,flat:true},data),off=createScene({...base,year,flat:true,showBeam:false},data);
    assert.equal(scene.spinCentres,null);assert.ok(scene.flight.burning);
    assert.ok(scene.meshes.some(m=>m.role==='exhaust-beam'));assert.ok(!off.meshes.some(m=>m.role==='exhaust-beam'));
    const beam=scene.meshes.filter(m=>m.role==='exhaust-beam').flatMap(m=>m.vertices.map(p=>p[0]));assert.ok(Math.max(...beam)-Math.min(...beam)>3000,'plume is kilometres long');
    assert.ok(ahead?Math.min(...beam)<-1900&&Math.max(...beam)>1500:Math.max(...beam)>1900&&Math.min(...beam)<-1500,'plumes run back from the engine past the ship');
    const shield=Math.min(...scene.meshes.find(m=>m.role==='forward-collision-shield').vertices.map(p=>p[0]));
    for(const m of scene.meshes.filter(m=>['habA','habB','tanks','farm'].includes(m.id)&&!/feed/.test(m.role??'')))assert.ok(Math.min(...m.vertices.map(p=>p[0]))>shield);
  }
  const coast=createScene(base,data);assert.ok(coast.spinCentres);assert.ok(!coast.meshes.some(m=>m.role==='exhaust-beam'),'coast has no plume');
});
test('the crew ship drops its tank modules in chronological order, outermost first',()=>{
  const P=S8.ships.crew.propulsion,T=missionTimeline(data).crew;let top=-Infinity,shell=Infinity;
  for(let n=0;n<=16;n++){
    const year=n?T.drops[n-1].year+1e-6:5,scene=createScene({...base,year,flat:false},data),present=new Set(scene.meshes.filter(m=>m.stage).map(m=>(m.stage.phase==='braking'?1:0)+'-'+m.stage.index));
    assert.deepEqual([...present].sort(),P.segments.slice(n).map(s=>s.phase+'-'+s.index).sort(),`after ${n} drops`);
    const acc=scene.meshes.filter(m=>m.stage?.phase==='acceleration'&&/module/.test(m.role)),sh=scene.meshes.filter(m=>m.stage?.phase==='braking'&&/shell/.test(m.role));
    // The stack hangs above the crew with the first-dropped module at the top (front): the top moves aft as modules go.
    if(n>0&&n<8){const t=Math.min(...acc.flatMap(m=>m.vertices.map(p=>p[0])));assert.ok(t>top,'acceleration modules leave from the top of the stack');top=t;assert.ok(Math.max(...acc.flatMap(m=>m.vertices.map(p=>p[0])))<data.layout.disc_centres_x_m[0],'tanks hang above the habitats');}
    if(n>8&&n<16){const w=Math.max(...sh.flatMap(m=>m.vertices.map(p=>Math.abs(p[1]))));assert.ok(w<shell,'shell empties from the outermost layer');shell=w;}
  }
});
test('burn configuration turns every room into thrust-facing levels that are all reachable',()=>{
 for(const year of [ACCEL,BRAKE]){
 const scene=createScene({...base,year,flat:false,interiorHabitat:'all',detail:'medium'},data);
 assert.equal(scene.rooms.length,26);assert.ok(Math.abs(scene.rooms.find(r=>r.gravity?.type==='linear').gravity.frame.down[0]-(year===ACCEL?1:-1))<1e-9,'down faces the engine');assert.equal(new Set(scene.meshes.filter(m=>m.id.startsWith('cabin-')).map(m=>m.id)).size,8);
 for(const m of scene.meshes.filter(m=>m.role==='folding-deck')){const xs=m.vertices.map(p=>p[0]);assert.ok(Math.max(...xs)-Math.min(...xs)<.15,'floor panels lie at right angles to the thrust');}
 for(const r of scene.rooms.filter(r=>!r.pressurizedModule)){const g=r.gravity;assert.equal(g.type,'linear');assert.ok(g.levels.length>=1);assert.equal(g.ladders.length,g.levels.length-1,r.id+' every level has a ladder up');
  for(const l of g.ladders)assert.ok(g.levels[l.to].f<g.levels[l.from].f-2,'ladder climbs against the thrust');
  for(const lv of g.levels)assert.ok(lv.len>=1.2);}
}
});
test('every burn entry starts on a floor, clear of fittings',()=>{
 const scene=createScene({...base,year:ACCEL,flat:true,cutaway:false,interiorHabitat:'all',detail:'medium'},data);
 const solid=scene.meshes.filter(m=>(m.id.startsWith('bay-')||m.id.startsWith('cabin-'))&&!['inflatable-envelope','folding-deck','window-wall','porthole-glass','porthole-frame'].includes(m.role));
 for(const room of scene.rooms.filter(r=>!r.pressurizedModule)){const f=Math.hypot(...room.forward),u=Math.hypot(...room.up),axes=[room.forward.map(v=>v/f),room.up.map(v=>v/u)];axes.push([axes[0][1]*axes[1][2]-axes[0][2]*axes[1][1],axes[0][2]*axes[1][0]-axes[0][0]*axes[1][2],axes[0][0]*axes[1][1]-axes[0][1]*axes[1][0]]);
  const project=p=>axes.map(a=>a.reduce((s,v,i)=>s+v*(p[i]-room.eye[i]),0));
  for(const m of solid){if(m.vertices.every(p=>Math.hypot(p[0]-room.eye[0],p[1]-room.eye[1],p[2]-room.eye[2])>6))continue;const q=m.vertices.map(project);assert.ok(![0,1,2].every(i=>Math.min(...q.map(p=>p[i]))<.15&&Math.max(...q.map(p=>p[i]))>-.15),`${room.id} entry is inside ${m.id} ${m.role??''}`);}
  const g=room.gravity,o=room.eye.map((v,i)=>v-g.frame.origin[i]),s=o.reduce((n,v,i)=>n+v*g.frame.down[i],0);assert.ok(Math.abs(s-(g.levels[g.level].f-1.29))<1e-6,room.id+' eye stands on its level');
 }
});
test('S8 timeline: cargo leaves 20 years before the crew, both arrive together and the ledger closes',()=>{
  const T=missionTimeline(data),S=S8;
  assert.equal(T.cargo.depart,0);assert.equal(T.crew.depart,20);assert.ok(Math.abs(T.cargo.arrive-T.crew.arrive)<1e-9);assert.equal(T.crew.opsEnd,40);assert.equal(T.cargo.opsEnd,40);
  for(const kind of ['crew','cargo']){const t=T[kind],P=S.ships[kind].propulsion;
    assert.ok(Math.abs(t.distanceLy-4.24)<1e-6,'both cover the same 4.24 ly');assert.ok(Math.abs(t.properYears-P.trajectory.proper_years)<1e-9);
    assert.ok(Math.abs(shipStateAt(t,t.depart+t.burnYears).beta-P.trajectory.beta)<1e-12,'peak speed at burn end');
    assert.equal(shipStateAt(t,t.depart-1e-6).massT,P.departure_t);const end=shipStateAt(t,t.arrive);assert.equal(end.dropped,16);assert.ok(Math.abs(end.massT-P.retained_core_t)<1e-9);assert.equal(end.beta,0);
    // Equal-rapidity stages: drops are evenly spaced in rapidity within each burn.
    const rap=y=>Math.atanh(shipStateAt(t,y).beta);for(const d of t.drops.slice(0,7))assert.ok(Math.abs(rap(d.year)-(d.index+1)*t.phi/8)<1e-9);
    let last=-1;for(let y=0;y<=40;y+=.05){const x=shipStateAt(t,y).distanceLy;assert.ok(x>=last-1e-12);last=x;}}
  assert.equal(shipStateAt(T.crew,39.95).phase,'orbit');assert.equal(shipStateAt(T.cargo,39.95).phase,'entry','cargo descends first');assert.equal(shipStateAt(T.crew,40).phase,'entry');
  assert.equal(stageYear(T.crew,22),stageYear(T.crew,22.5),'scene keyed by stage, not by exact year');
});
test('flight skies follow the exact year: Sun astern, parallax, aberration, and Proxima b at arrival',()=>{
  const T=missionTimeline(data),centre=m=>m.vertices.reduce((s,p)=>s.map((v,i)=>v+p[i]/m.vertices.length),[0,0,0]),dir=m=>{const c=centre(m),n=Math.hypot(...c);return c.map(v=>v/n);};
  // The 3D ship scene carries no sky; the sky changes continuously with the year (not per stage).
  assert.ok(!createScene({...base,year:30},data).meshes.some(m=>m.id==='sky'));
  const a=flightSky(data,'crew',30),b=flightSky(data,'crew',30.01);assert.notDeepEqual(a.meshes.find(m=>m.role==='sun').vertices,b.meshes.find(m=>m.role==='sun').vertices);
  for(const year of [25,30,ACCEL]){
    const sky=flightSky(data,'crew',year),st=shipStateAt(T.crew,year),beta=st.beta,g=1/Math.sqrt(1-beta*beta);
    assert.ok(sky.meshes.every(m=>m.material===-2&&m.vertices.flat().every(Number.isFinite)),'camera-relative and finite');
    const sun=sky.meshes.find(m=>m.role==='sun');assert.ok(dir(sun)[0]>.999,'Sun dead astern');
    assert.ok(Math.abs(sun.apparentMagnitude-(4.83+5*Math.log10(sun.distanceAU/63241.077/32.6156)-10*Math.log10(g*(1-beta))))<1e-6,'inverse square plus Doppler dimming astern');
    // Sirius (8.6 ly) shifts by parallax as the ship moves 4 ly; aberration crowds stars forward at speed.
    const ab=sky.meshes.find(m=>m.role==='alpha-centauri-A');assert.ok(Math.acos(-dir(ab)[0])*180/Math.PI<20,'Alpha Centauri ahead');
  }
  const still=flightSky(data,'crew',20),fast=flightSky(data,'crew',30),fwd=s=>s.meshes.filter(m=>m.role==='star').filter(m=>dir(m)[0]<0).length;
  assert.ok(fwd(fast)>fwd(still),'aberration moves stars into the forward hemisphere');
  // Parallax at rest (departure vs in orbit): Sirius, 8.6 ly away, moves by many degrees over the 4.24 ly baseline.
  const sirius=s=>dir(s.meshes.filter(m=>m.role==='star').reduce((x,y)=>x.apparentMagnitude<y.apparentMagnitude?x:y)),s0=sirius(still),s1=sirius(flightSky(data,'crew',T.crew.arrive+.01));
  assert.ok(Math.acos(Math.min(1,s0.reduce((n,v,i)=>n+v*s1[i],0)))*180/Math.PI>5,'nearby stars shift by parallax');
  // Approach: Proxima brightens and shows its true disc; Proxima b grows from a dot to filling the view in orbit.
  const day=flightSky(data,'crew',T.crew.arrive-1/365.25),orbit=flightSky(data,'crew',T.crew.arrive+.01),pb=s=>s.meshes.find(m=>m.role==='proxima-b');
  assert.ok(pb(day)&&pb(day).angularDiameterDeg<1&&pb(orbit).angularDiameterDeg>120,'planet grows to fill the view from orbit');
  const px=orbit.meshes.find(m=>m.role==='proxima');assert.ok(Math.abs(px.angularDiameterDeg-1.69)<.1,'Proxima about 1.7 degrees across from Proxima b');assert.ok(px.apparentMagnitude<-20);
  for(const name of ['A','B'])assert.ok(orbit.meshes.find(m=>m.role==='alpha-centauri-'+name).apparentMagnitude<-4,'Alpha Centauri '+name+' bright from Proxima');
});
test('the slider follows each ship\'s journey on a stretched scale with milestones',()=>{
  const T=missionTimeline(data);
  for(const view of ['crew','cargo','map']){const sc=missionScale(T,view);
    assert.equal(sc.start,view==='crew'?T.crew.depart:0);assert.equal(sc.end,view==='map'?40:T[view].arrive,'ship sliders stop on arrival; the descent is its own view');
    for(let u=0;u<=1;u+=.01)assert.ok(Math.abs(sc.toU(sc.toYear(u))-u)<1e-9);
    for(let u=.01;u<=1;u+=.01)assert.ok(sc.toYear(u)>=sc.toYear(u-.01),'monotonic');
    assert.ok(sc.milestones.length>=4&&sc.milestones.every(m=>m.u>=0&&m.u<=1));}
  const sc=missionScale(T,'crew'),a=T.crew.arrive;
  // The last month before arrival gets far more slider than its share of time; the last day more still.
  assert.ok(sc.toU(a)-sc.toU(a-30/365.25)>.25);assert.ok(sc.toU(a)-sc.toU(a-1/365.25)>.1);
  for(const label of ['Departs','Flip and braking','Proxima b 1° wide','Arrive in orbit'])assert.ok(sc.milestones.some(m=>m.label===label),label);
});
test('housing, greenhouses and cargo have clear public routes and both airlocks lead outdoors',()=>{
 const roles=['inflatable-envelope','hull-boundary','farm-pressure-envelope','room-front','room-bulkhead','cabin-divider','inflatable-habitat-shell','cargo-container','crop-tray','window-glass'];
 function hit(scene,a,b){
   const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),dir=d.map(v=>v/len);
   for(const m of scene.meshes.filter(m=>roles.includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){
     const t=gpu.rayTriangle(a,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);
     if(t!==null&&t>1e-6&&t<len)return m.id+' '+m.role;
   }
   return null;
 }
 const surface={...base,mode:'settlement',cutaway:false,interiorHabitat:'all'};
 const scene=createScene(surface,data),corridors=scene.meshes.filter(m=>m.systemRole==='pressurised-corridor');
 const point=([x,z],y=3.1)=>[x,y,z];
 const clear=(a,b)=>assert.equal(hit(scene,a,b),null,`blocked between ${a} and ${b}`);
 const [habitats,spine,door,cargo,between,...residences]=corridors.map(m=>m.centreline);
 for(const path of [habitats,door,cargo,between,...residences])clear(point(path[0]),point(path.at(-1)));
 for(const end of habitats){
   const h=scene.surfaceMap.habitats[end[0]<0?0:1],a=(Math.atan2(end[1]-h.centre[1],end[0]-h.centre[0])-h.turn+2*Math.PI)%(2*Math.PI);
   assert.ok(h.rooms.some(r=>r.id&&r.deck===0&&a>r.a0&&a<r.a1),'link opens into a shared room');
 }
 assert.ok(Math.abs(door[1][1]-door[0][1])<2.2,'a short threshold rather than a separate corridor');
 const x=door[0][0],z=spine[0][1];
 clear([x,3.1,door[1][1]+1],[x,3.1,z-2]);
 for(const hall of scene.surfaceMap.halls.filter(h=>h.id.startsWith('greenhouse-'))){
   const mid=(hall.x0+hall.x1)/2,into=z<(hall.z0+hall.z1)/2?1:-1;
   clear([mid,3.1,z],[mid,3.1,z+into*4]);
 }
 for(const id of ['habA','habB']){
   const open=createScene({...surface,airlockOutside:id},data),lock=open.airlocks.find(l=>l.id===id);
   const out=lock.outer.map((v,i)=>v-lock.inner[i]),len=Math.hypot(...out);
   const at=distance=>lock.outer.map((v,i)=>v+out[i]*distance/len);
   assert.equal(hit(open,at(-.55),at(8)),null,`clear exterior approach for ${id}`);
 }
});
test('surface power is a solar field sized to the load, with storage and heat rejection',()=>{
 const scene=createScene({...base,mode:'settlement'},data),F=scene.solarField,env=data.settlement.proxima_b_sky;
 assert.equal(F.fluxWm2,877);
 assert.ok(Math.abs(F.areaM2*F.fluxWm2*F.systemEfficiency*F.incidence-F.electricalMW*1e6)<1e-6);
 assert.ok(F.areaM2>16000&&F.areaM2<17000);assert.ok(Math.abs(F.starElevationDeg-45)<.5);
 for(const panel of scene.meshes.filter(m=>m.role==='solar-array')){
   for(const [x,y,z] of panel.vertices)assert.ok(y>settlementTerrain(x,z)+.1,'panel clears regolith');
 }
 for(const role of ['solar-array','battery-store','switchyard-transformer','settlement-substation','air-cooler'])assert.ok(scene.meshes.some(m=>m.role===role),role);
 for(const role of ['converter-hall','regolith-berm','exclusion-fence','containment-vault-hatch'])assert.ok(!scene.meshes.some(m=>m.role===role),'no antimatter plant: '+role);
});

test('ship views label their main parts and conceptual status, and the settlement labels its links',()=>{
  // Labels simply name the item.
  const all=s=>s.labels.map(l=>l.text),crew=all(createScene({...base,year:ACCEL},data));
  for(const t of ['Forward shield','Habitat discs','Radiation shielding fuel tanks','Fuel tanks','Fuel feed line','Main engine','Tow tethers','Tension straps','Radiators','Water tank','Orbital service unit','Landing bay','Windows','Robotic arm','Handrails'])assert.ok(crew.includes(t),'crew '+t);
  assert.ok([...crew,...all(createScene({...base,mode:'cargo'},data)),...all(createScene({...base,mode:'settlement'},data))].every(t=>!/·|[0-9]+ (t|m|MW)\b/.test(t)),'no extra detail in labels');
  const cargo=all(createScene({...base,mode:'cargo'},data));for(const t of ['Pressurised rover','Scout bay','Landing bay','Main engine','Forward shield'])assert.ok(cargo.includes(t),'cargo '+t);
  assert.ok(all(createScene({...base,year:40},data)).includes('Heat shield'));
  const surface=all(createScene({...base,mode:'settlement'},data));for(const t of ['A–B pressurised link','Crewed rover','Inflatable residence'])assert.ok(surface.some(x=>x.startsWith(t)),t);
});
test('greenhouse halls and the rover cabin can be entered on the surface',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data),walls=scene.meshes.filter(m=>['inflatable-envelope','hull-boundary','farm-pressure-envelope','rover-pressure-hull','rover-window'].includes(m.role));
 const halls=scene.rooms.filter(r=>r.id.startsWith('greenhouse-'));assert.equal(halls.length,8);
 const rover=scene.rooms.find(r=>r.id==='rover');assert.ok(rover);assert.ok(scene.meshes.filter(m=>m.id==='rover').length>20,'rover interior is fitted without cutaway');
 // From each entry, walls surround the walker within a few metres at eye height in all four directions.
 for(const room of [...halls,rover])for(const dir of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){let hit=Infinity;
  for(const m of walls)for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(room.eye,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>0)hit=Math.min(hit,t);}
  assert.ok(hit<(['greenhouse-4','greenhouse-8'].includes(room.id)&&dir[2]===1?45:20),`${room.id} enclosed toward ${dir}`);}
});
test('settlement sky is one smooth dome that also fills the view below the horizon',()=>{
 const scene=createScene({...base,mode:'settlement'},data),dome=scene.meshes.filter(m=>m.role==='sky-dome');
 assert.equal(dome.length,1);assert.equal(dome[0].colors.length,dome[0].vertices.length);assert.ok(new Set(dome[0].colors).size>100,'smooth gradient');
 assert.ok(Math.min(...dome[0].vertices.map(p=>p[1]))<-4800,'covers below the horizon');assert.equal(dome[0].material,-2,'drawn relative to the camera');
});


test('adjacent decks have a shared wall with no annular cavity',()=>{
 for(const year of [30,ACCEL]){const mode='year '+year;
  const scene=createScene({...base,year,flat:false,cutaway:false},data),bounds=deck=>{
   const r=scene.meshes.filter(m=>m.role==='inflatable-envelope'&&m.id.startsWith(`bay-A-${deck}-`)).flatMap(m=>m.vertices).map(p=>Math.hypot(p[0],p[1]));return [Math.min(...r),Math.max(...r)];
  };
  assert.ok(Math.abs(bounds(0)[0]-bounds(1)[1])<1e-8,mode+' shared wall');
  assert.ok(Math.abs(bounds(1)[0]-3)<1e-8,'innermost room meets the hub');
 }
});

test('room signs and cabin names are rendered without corridor arrows',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data);
 for(const room of scene.rooms.filter(r=>r.id.startsWith('bay-')||r.id.startsWith('cabin-')))assert.ok(scene.meshes.some(m=>m.id===room.id&&m.role==='room-sign'),room.id);
 assert.ok(!scene.meshes.some(m=>m.role==='corridor-arrow'));
});

test('each airlock has suits and interlocked doors plus an exterior surface landing',()=>{
 for(const airlockOutside of ['', 'habA']){
  const scene=createScene({...base,mode:'settlement',cutaway:false,airlockOutside},data);
  assert.equal(scene.airlocks.length,2);
  assert.equal(scene.meshes.filter(m=>m.role==='spacesuit').length,12);
  assert.equal(scene.meshes.filter(m=>m.airlockDoor&&m.role==='hull-boundary').length,2);
  assert.equal(scene.meshes.filter(m=>m.airlockDoor&&m.role==='airlock-door-open').length,2);
  assert.equal(scene.meshes.filter(m=>m.role==='airlock-exterior-landing').length,2);
  assert.equal(scene.airlocks[0].outerOpen,airlockOutside==='habA');
 }
});


test('dining seat backs face away from the nearest table on both sides',()=>{
 const scene=createScene({...base,flat:false,detail:'medium'},data),centre=m=>[0,1,2].map(k=>m.vertices.reduce((n,v)=>n+v[k],0)/m.vertices.length),dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const tables=scene.meshes.filter(m=>m.role==='shared-table'&&m.id.startsWith('bay-')).map(centre),backs=scene.meshes.filter(m=>m.role==='seat-back').map(centre);
 const seats=scene.meshes.filter(m=>m.role==='seat'&&m.id.startsWith('bay-')).map(centre).filter(at=>tables.some(t=>dist(at,t)<1.15));
 assert.ok(seats.length>=16);
 for(const at of seats){const nearest=list=>list.reduce((a,b)=>dist(a,at)<dist(b,at)?a:b),back=nearest(backs),table=nearest(tables);assert.ok(dist(back,at)<.6);assert.ok(dist(back,table)>dist(at,table));}
});


test('orbit and entry separate the landing package from the orbital assembly',()=>{
  const orbit=createScene({...base,year:39.95},data),entry=createScene({...base,year:40},data),has=(s,r)=>s.meshes.some(m=>m.role===r);
  assert.equal(orbit.flight.phase,'orbit');assert.equal(entry.flight.phase,'entry');
  for(const role of ['forward-collision-shield','reaction-chamber','orbital-service-reactor','tow-tether'])assert.ok(has(orbit,role)&&!has(entry,role),role+' stays in orbit');
  for(const role of ['habitat-service-reactor','working-water','landing-engine','landing-cradle','arrival-separation'])assert.ok(has(entry,role),role+' lands');
  assert.ok(!orbit.meshes.some(m=>m.stage),'all tank modules dropped after braking');
  assert.equal(orbit.flightLayout.orbitalOffset[0],0,'in orbit the ship simply stops, whole; the descent is its own view');
  // Two disc landers, each on its own heat shield; together they keep the 50 m allocation's area.
  const shells=entry.meshes.filter(m=>m.role==='deployed-aeroshell'&&m.diameterM);assert.equal(shells.length,2);assert.ok(Math.abs(shells.reduce((n,m)=>n+m.diameterM**2,0)-data.final_model_inputs.landing.crew_aeroshell_diameter_m**2)<1e-6);
  // Each shield is on the disc's native +z side, which the display turns to face down into the flow, with the disc
  // inside its rim; the payload rides on the other face in the shield's wake.
  for(const m of shells){const zs=m.vertices.map(p=>p[2]);assert.ok(Math.min(...zs)>data.layout.disc_axial_depth_m/2,'shield on the flow side of the disc');}
  for(const m of entry.meshes.filter(m=>m.role==='food-factory-hull'))assert.ok(Math.max(...m.vertices.map(p=>p[2]))<0,'payload in the wake');
  assert.ok(!has(entry,'stowed-aeroshell'));
  assert.equal(createScene({...base,mode:'cargo',year:40},data).meshes.find(m=>m.diameterM).diameterM,data.final_model_inputs.landing.cargo_aeroshell_diameter_m);
});

test('the cargo ship carries the scouts and rover; the crew ship carries neither',()=>{
  const cargo=createScene({...base,mode:'cargo',cutaway:false},data),crew=createScene({...base,cutaway:false},data);
  assert.equal(cargo.meshes.filter(m=>m.role==='scout-bay-frame').length,0);
  assert.ok(cargo.meshes.filter(m=>m.role==='scout-frame-mount').length>=12);
  assert.ok(!crew.meshes.some(m=>['exploration','rover','cargo'].includes(m.id)));
  assert.ok(!cargo.meshes.some(m=>m.id.startsWith('hab')||m.id.startsWith('bay-')||m.id.startsWith('cabin-')),'no habitat on the cargo ship');
  assert.ok(crew.labels.some(l=>l.text==='Food factory'));
});

test('surface cargo stays nearby without intersecting either habitat',()=>{
 const scene=createScene({...base,mode:'settlement'},data);
 for(const m of scene.meshes.filter(m=>m.role==='cargo-container')){
  const centre=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length);assert.ok(Math.min(...data.layout.surface_disc_centres_x_m.map((x,i)=>Math.hypot(centre[0]-x,centre[2]-data.layout.surface_disc_centres_z_m[i])))<35);
  for(const p of m.vertices)for(let i=0;i<2;i++)assert.ok(Math.hypot(p[0]-data.layout.surface_disc_centres_x_m[i],p[2]-data.layout.surface_disc_centres_z_m[i])>data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.65+.3,'clear of the habitat hull');
 }
});

test('interior partitions and deck ends stay inside the closed axial shell',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,detail:'medium'},data),half=data.layout.disc_axial_depth_m/2;
 for(const m of scene.meshes.filter(m=>['cabin-divider','room-front','room-bulkhead','access-shaft','folding-deck'].includes(m.role))){const d=m.id.startsWith('bay-B')||m.id.startsWith('cabin-')&&+m.id.slice(6)>4?1:0,cz=data.layout.disc_centres_z_m[d];for(const p of m.vertices)assert.ok(Math.abs(p[2]-cz)<half-.015,m.id+' '+m.role);}
});


test('berths fit inside the wall of each surface cabin',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data);
 for(const habitat of scene.surfaceMap.habitats)for(const cabin of habitat.cabins){
   for(const bed of scene.meshes.filter(m=>m.id===cabin.id&&['lower-berth','upper-berth'].includes(m.role)))for(const [x,y,z] of bed.vertices){
     const dx=x-habitat.centre[0],dz=z-habitat.centre[1],delta=Math.atan2(dz,dx)-habitat.turn-cabin.angle;
     assert.ok(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<Math.PI/12-.005,`${bed.id} clears its side partitions`);
     assert.ok(Math.hypot(dx,dz)<cabin.r1&&y>1.75,'berth is inside the shell and above the floor');
   }
 }
});

test('both food trains branch from the transfer passage into the despun gap',()=>{
  const scene=createScene({...base,flat:false,cutaway:false},data),modules=scene.crewModules,xm=(data.layout.disc_centres_x_m[0]+data.layout.disc_centres_x_m[1])/2;
  assert.deepEqual(modules.map(m=>m.id),['food-factory-1','food-factory-2']);assert.deepEqual(modules.map(m=>m.side),[1,-1]);
  for(const m of modules){assert.equal(m.centre[0],xm);assert.equal(m.centre[2],0);assert.equal(scene.rooms.find(r=>r.id===m.id).gravity.type,'float');assert.ok(Math.min(Math.abs(m.y0),Math.abs(m.y1))>.7,'clear of the passage');}
});

test('each ceiling is the underside of the next floor slab, with no intervening shell',()=>{
 const scene=createScene({...base,flat:false,cutaway:false},data),a=.18,start=7.5,o=[start*Math.cos(a),start*Math.sin(a),data.layout.disc_centres_z_m[0]+.3],d=[-Math.cos(a),-Math.sin(a),0],hits=[];
 for(const m of scene.meshes.filter(m=>m.id.startsWith('bay-A')&&['inflatable-envelope','folding-deck'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>0)hits.push(start-t);}
 const radii=[...new Set(hits.map(r=>+r.toFixed(2)))].sort((a,b)=>b-a),inner=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[1];
 // Polygon chord error is below 2 cm at this sampling angle.
 for(const [i,r] of [inner+.02,inner-.11].entries())assert.ok(Math.abs(radii[i]-r)<.02,`surface ${i}: ${radii[i]} vs ${r}`);
});

test('recessed airlock chambers fit within the wheel axial envelope',()=>{
 const scene=createScene({...base,flat:false,cutaway:false},data),half=data.layout.disc_axial_depth_m/2;
 for(const m of scene.meshes.filter(m=>m.id.startsWith('bay-')&&(m.airlockDoor||m.role==='spacesuit'||m.role==='hull-boundary'))){const cz=data.layout.disc_centres_z_m[m.id.startsWith('bay-B')?1:0];for(const p of m.vertices)assert.ok(Math.abs(p[2]-cz)<half,m.id+' '+m.role);}
});

test('the pressurised route is unobstructed from the passage through both food trains',()=>{
  const scene=createScene({...base,flat:false,cutaway:false},data),xm=(data.layout.disc_centres_x_m[0]+data.layout.disc_centres_x_m[1])/2;
  for(const module of scene.crewModules){const o=[xm,0,0],d=[0,module.side,0],end=Math.max(Math.abs(module.y0),Math.abs(module.y1));
    for(const m of scene.meshes.filter(m=>['farm','transfer'].includes(m.id)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t<0||t>end,m.id+' '+m.role+' blocks passage');}}
});


test('communal rings have no extra concentric room fronts and signs fit door lintels',()=>{
 for(const state of [{},{year:ACCEL},{mode:'settlement'}]){
  const scene=createScene({...base,...state,cutaway:false,detail:'medium'},data);
  assert.ok(!scene.meshes.some(m=>m.id.startsWith('bay-')&&m.id.split('-')[2]!=='0'&&m.role==='room-front'));
  const signs=scene.meshes.filter(m=>m.role==='room-sign-panel');assert.ok(signs.length>0);for(const m of signs){const lengths=m.faces[0].map((i,k,a)=>Math.hypot(...m.vertices[i].map((v,j)=>v-m.vertices[a[(k+1)%a.length]][j])));assert.ok(Math.max(...lengths)<1.1);}
 }
});
test('rover driver looks through real forward glazing rather than an opaque shell',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data),room=scene.rooms.find(r=>r.id==='rover');assert.equal(room.driver,true);
 const hits=[];for(const m of scene.meshes.filter(m=>m.id==='rover'))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(room.eye,room.forward,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null)hits.push({t,m});}
 hits.sort((a,b)=>a.t-b.t);assert.equal(hits[0].m.role,'rover-window');assert.ok(hits[0].m.opacity<.5,'tinted, slightly opaque glass');assert.ok(!hits.some(h=>h.t<3&&h.m.opacity>.9));
 assert.ok(!scene.meshes.some(m=>m.id.startsWith('hab')&&m.vertices.length===8&&!m.role),'unlabelled habitat support boxes removed');
});


test('a surface radial probe crosses only the outer wall and the hall wall',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false,detail:'medium'},data),a=2.5,start=11,cx=data.layout.surface_disc_centres_x_m[0],cz=data.layout.surface_disc_centres_z_m[0],o=[cx+start*Math.cos(a),3.1,cz+start*Math.sin(a)],d=[-Math.cos(a),0,-Math.sin(a)],hits=[];
 for(const m of scene.meshes.filter(m=>m.id.startsWith('bay-A')&&['inflatable-envelope','room-front'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>0&&t<9)hits.push(start-t);}
 const outer=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.65;
 hits.sort((p,q)=>q-p);assert.equal(hits.length,2);assert.ok(hits[0]>outer&&hits[0]<outer+.76,'rounded outer wall');assert.ok(Math.abs(hits[1]-(outer-4.7))<.02,'hall wall');
});

test('departures show a warm, self-lit solar disc in both ship views',()=>{
 const T=missionTimeline(data);
 for(const kind of ['crew','cargo']){
   const sun=flightSky(data,kind,T[kind].depart).meshes.find(m=>m.role==='sun');
   assert.equal(sun.material,-2);
   assert.equal(sun.distanceAU,1);
   assert.ok(new Set(sun.colors).size>=3);
   assert.ok(sun.colors.includes('#ffc573'));
 }
});

test('descent uses closed heat-shield noses and omits hidden walkway fittings',()=>{
 const scene=createScene({...base,mode:'descent',detail:'medium'},data);
 const shells=scene.meshes.filter(m=>m.role==='deployed-aeroshell');
 const noses=scene.meshes.filter(m=>m.role==='aeroshell-nose');
 assert.equal(shells.length,3);assert.equal(noses.length,2);
 for(const [i,nose] of noses.entries()){
   const skin=new Set(shells[i].vertices.map(p=>p.join(',')));
   assert.ok(nose.vertices.slice(0,-1).every(p=>skin.has(p.join(','))),'nose shares the shell seam');
 }
 assert.ok(!scene.meshes.some(m=>m.role==='access-hatch'||m.role==='lower-berth'));
});

test('surface terrain shares its edge and colour with the globe and projects into the same orbital frame',()=>{
 const scene=createScene({...base,mode:'settlement'},data);
 const patch=scene.meshes.find(m=>m.role==='regolith'),globe=scene.meshes.find(m=>m.role==='planet-regolith');
 assert.deepEqual(globe.vertices.slice(0,96),patch.vertices.slice(-96));
 assert.deepEqual(globe.colors.slice(0,96),patch.colors.slice(-96));
 assert.ok(globe.vertices.some(v=>v[1]<-13e6),'continues to the far side');
 const frame=settlementFrame(data),point=[95,240000,12],eye=frame.position(point);
 assert.ok(frame.metres(eye).every((v,i)=>Math.abs(v-point[i])<1e-6));
 const sky=systemSky(data,{eye,km:240,forward:frame.vector([0,-1,0])});
 for(const part of [patch,globe]){
   const orbital=sky.meshes.find(m=>m.role===part.role);
   assert.deepEqual(orbital.colors,part.colors);
   const local=frame.local(orbital.vertices[1]);
   assert.ok(local.every((v,i)=>Math.abs(v-(part.vertices[1][i]-point[i])/240)<1e-7));
 }
});

test('crew and cargo dust shields keep the face allocation and add a separated backing skin',()=>{
 for(const mode of ['cruise','cargo']){
   const scene=createScene({...base,mode,flat:false},data);
   const face=scene.meshes.find(m=>m.role==='forward-collision-shield'),rear=scene.meshes.find(m=>m.role==='shield-backing');
   const frontX=Math.min(...face.vertices.map(v=>v[0])),rearX=Math.max(...rear.vertices.map(v=>v[0]));
   assert.equal(face.arealMassKgM2,100);
   assert.ok(Math.abs(rearX-frontX-face.assemblyThicknessM)<1e-9);
   assert.ok(Math.abs(Math.min(...rear.vertices.map(v=>v[0]))-Math.max(...face.vertices.map(v=>v[0]))-.55)<1e-9);
 }
});
