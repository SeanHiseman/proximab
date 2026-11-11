import * as gpu from '../dist/gpu.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene,exportOBJ,scenarioMass,poseScene} from '../dist/model.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url),'utf8'));
const active=data.viewer_design?.nominal??data.mass_budget.nominal;
const base={mode:'cruise',selected:'habA',cutaway:true,dimensions:true,spin:false};
test('all three views have finite metre-based geometry and the touchdown view is gone',()=>{
  for(const mode of ['cruise','engine','settlement']){
    const s=createScene({...base,mode},data,0);
    for(const id of (mode==='settlement'?['habA','habB','structure','radiators','rover','inflatable']:['habA','habB','structure','propulsion','radiators','refuge','tanks','shield']))assert.ok(s.meshes.some(m=>m.id===id),`${mode}: missing ${id}`);
    for(const m of s.meshes){assert.ok(m.vertices.flat().every(Number.isFinite));for(const f of m.faces)assert.ok(f.every(i=>Number.isInteger(i)&&i>=0&&i<m.vertices.length));}
    assert.ok(!s.meshes.some(m=>['transport-cover','local-landing-strut'].includes(m.role)));
  }
});
test('all eight berth bays keep two two-tier bunks in every view',()=>{
  for(const mode of ['cruise','engine','settlement']){const s=createScene({...base,mode},data);const ids=new Set(s.meshes.map(m=>m.id).filter(x=>x.startsWith('cabin-')));assert.equal(ids.size,8);assert.equal(s.meshes.filter(m=>m.role==='upper-berth').length,16,mode+': 16 upper berths over 16 lower ones');}
});
test('service spine clears both rotating habitat pressure volumes',()=>{
  assert.ok(data.layout.service_spine_z_offset_m_study-1.35>data.layout.disc_axial_depth_m/2);
  // Coaxial discs sit either side of the spine frame (longerons 2 m from its centreline) with clearance.
  const [za,zb]=data.layout.disc_centres_z_m,spine=data.layout.service_spine_z_offset_m_study,half=data.layout.disc_axial_depth_m/2;
  assert.equal(data.layout.disc_centres_x_m[0],data.layout.disc_centres_x_m[1]);// Hull faces clear the 0.16 m-radius longerons by at least 0.15 m.
  assert.ok(za+half<=spine-2-.16-.15&&zb-half>=spine+2+.16+.15);
});
test('everything behind the bow plate stays inside the frontal silhouette',()=>{
  const scene=createScene(base,data),S=data.design.geometry.screen,spine=data.layout.service_spine_z_offset_m_study;
  for(const m of scene.meshes){if(['shield','sky'].includes(m.id))continue;for(const [x,y,z] of m.vertices){assert.ok(Math.abs(y)<=S.width_m/2+.01,`${m.id} ${m.role??''}: y ${y}`);assert.ok(Math.abs(z-spine)<=S.height_m/2+.01,`${m.id} ${m.role??''}: z ${z}`);}}
});
test('fixed structure stays out of the volume swept by the spinning discs',()=>{
  const scene=createScene({...base,flat:false},data),r=data.design.habitat.envelope_radius_m,half=data.layout.disc_axial_depth_m/2+.3;
  for(const m of scene.meshes){if(/^(hab|bay-|cabin-|transfer|sky)/.test(m.id))continue;
    const centre=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length);
    for(const p of [...m.vertices,centre])for(const [d,cz] of data.layout.disc_centres_z_m.entries())assert.ok(!(Math.hypot(p[0]-data.layout.disc_centres_x_m[d],p[1])<r+.05&&Math.abs(p[2]-cz)<half),`${m.id} ${m.role??''} enters disc ${d}`);}
});
test('hardware along the engine boom stays inside the shield shadow cone',()=>{
  const scene=createScene(base,data),G=data.design.geometry,spine=data.layout.service_spine_z_offset_m_study,cone=s=>G.cone.source_radius_m+(G.cone.protected_radius_m-G.cone.source_radius_m)*s/G.cone.boom_length_m;
  // The pellet guides and nozzle struts must pass round the shield's edge, so they alone leave the shadow.
  for(const m of scene.meshes){if(['shield','sky'].includes(m.id)||['injector-guide','nozzle-strut'].includes(m.role))continue;for(const p of m.vertices)if(p[0]>G.boom.x0+1&&p[0]<G.shield.x-G.shield.thickness_m)assert.ok(Math.hypot(p[1],p[2]-spine)<=cone(G.source_x-p[0])+.02,`${m.id} ${m.role??''} outside the shadow at x ${p[0]}`);}
  assert.ok(G.shield.radius_m>G.cone.source_radius_m&&G.shield.thickness_m>.4);
});
test('tanks, antimatter store and radiators are drawn at their calculated sizes',()=>{
  const scene=createScene(base,data),G=data.design.geometry,D=data.design,extent=role=>{const xs=scene.meshes.filter(m=>m.role===role).flatMap(m=>m.vertices.map(p=>p[0]));return [Math.min(...xs),Math.max(...xs)];};
  for(const [role,g] of [['hydrogen-propellant-tank',G.hydrogen_tank],['bulk-antimatter-store',G.antimatter_store]]){const [lo,hi]=extent(role);assert.ok(Math.abs(lo-g.x0)<.05&&Math.abs(hi-g.x1)<.05,role);}
  const capsule=g=>Math.PI*g.radius_m**2*(g.x1-g.x0-2*g.radius_m)+4/3*Math.PI*g.radius_m**3;
  assert.ok(capsule(G.hydrogen_tank)*70.8*.97>=D.storage.matching_hydrogen_kg-1);
  assert.ok(scene.meshes.filter(m=>m.role==='antihydrogen-ice').length>=Math.ceil(D.storage.electrostatic_levitation.log_count),'every log of ice is drawn in the cutaway');
  assert.ok(G.service_fins.effective_emitting_m2>=G.service_fins.required_emitting_m2);assert.ok(G.hot_fins.effective_emitting_m2>=G.hot_fins.required_emitting_m2*.999);
  const quad=m=>{const [a,b,c,d]=m.vertices,cr=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],su=(u,v)=>u.map((x,i)=>x-v[i]);return (Math.hypot(...cr(su(b,a),su(c,a)))+Math.hypot(...cr(su(c,a),su(d,a))))/2;};
  const hot=scene.meshes.filter(m=>m.role==='hot-radiator-fin').reduce((n,m)=>n+quad(m),0);assert.ok(Math.abs(hot/G.hot_fins.planform_m2-1)<.08,`hot fins ${hot} vs ${G.hot_fins.planform_m2}`);
  const capacity=scene.meshes.filter(m=>m.role==='hydrogen-tank').reduce((n,m)=>n+m.usableHydrogenCapacityKg,0);assert.ok(capacity>=active.thermal_hydrogen_kg*1.0499);
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
  for(const mode of ['cruise','settlement']){const s=createScene({...base,mode},data);const hulls=s.meshes.filter(m=>m.role==='rover-pressure-hull');assert.equal(hulls.length,1);const xs=hulls[0].vertices.map(p=>p[0]);assert.equal(Math.max(...xs)-Math.min(...xs),7);assert.equal(s.meshes.filter(m=>m.role==='cargo-container').length,2);}
});
test('surface cabin floors are below beds in surface gravity',()=>{
  const s=createScene({...base,mode:'settlement'},data);const [floor,bed]=s.meshes.filter(m=>m.id==='cabin-1');const averageY=m=>m.vertices.reduce((n,p)=>n+p[1],0)/m.vertices.length;assert.ok(averageY(floor)<averageY(bed));
});
test('interior zoning fills both decks to the hub and can isolate a single level',()=>{
  const all=createScene({...base,deck:'all'},data);assert.equal(all.zones.length,24);assert.ok(all.zones.every(z=>z.purpose&&z.status.includes('unvalidated')));
  const one=createScene({...base,deck:'1'},data);assert.equal(one.zones.length,8);assert.ok(one.zones.every(z=>z.deck===2));assert.equal(one.meshes.filter(m=>m.id.startsWith('cabin-')).length,0);
});
test('radiating faces clear habitat x envelopes and visibility toggle hides radiator hardware',()=>{
  const scene=createScene(base,data);const panels=scene.meshes.filter(m=>m.role==='radiator-panel');assert.ok(panels.length>0);
  for(const m of panels){const xs=m.vertices.map(p=>p[0]),lo=Math.min(...xs),hi=Math.max(...xs);for(const centre of data.layout.disc_centres_x_m)assert.ok(hi<centre-data.layout.disc_radius_m||lo>centre+data.layout.disc_radius_m);}
  const hidden=createScene({...base,showRadiators:false},data);assert.equal(hidden.meshes.filter(m=>m.id==='radiators').length,0);assert.equal(hidden.lines.filter(m=>m.id==='radiators').length,0);
});
test('high-detail curved geometry has finite normals and keeps the crewed rover hull unchanged',()=>{
  const s=createScene({...base,detail:'high'},data);for(const m of s.meshes)if(m.normals){assert.equal(m.normals.length,m.vertices.length);assert.ok(m.normals.flat().every(Number.isFinite));}const hull=s.meshes.find(m=>m.role==='rover-pressure-hull');assert.ok(hull);assert.equal(Math.max(...hull.vertices.map(p=>p[0]))-Math.min(...hull.vertices.map(p=>p[0])),7);
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
  const scene=createScene(base,data),posed=poseScene(scene,Math.PI/2),index=scene.meshes.findIndex(m=>m.id==='cabin-1'),a=scene.meshes[index].vertices[0],b=posed.meshes[index].vertices[0],cx=data.layout.disc_centres_x_m[0];assert.ok(Math.abs(b[0]-cx-a[1])<1e-8);assert.ok(Math.abs(b[1]+a[0]-cx)<1e-8);assert.equal(b[2],a[2]);assert.deepEqual(posed.meshes[0].vertices,scene.meshes[0].vertices);
});

test('both discs provide living, clinical and plant rooms for eight awake and 32 berths',()=>{
  const scene=createScene(base,data);for(const habitat of ['A','B']){const zones=scene.zones.filter(z=>z.habitat===habitat);for(const purpose of ['Shared lounge','Mission control','Galley and dining','Exercise and rehabilitation','Hygiene and laundry','Medical and torpor service','Life support','Fresh-food garden','Clean workshop','Food reserve'])assert.ok(zones.some(z=>z.functions.includes(purpose)),purpose);}
  assert.equal(scene.meshes.filter(m=>m.id==='refuge'&&m.role==='seat').length,32);for(const disc of ['A','B'])assert.ok(scene.meshes.filter(m=>m.role==='seat'&&m.id.startsWith('bay-'+disc+'-')).length>=8);for(const role of ['treadmill','resistive-exercise-device','cycle-ergometer','science-glovebox','waste-management-toilet'])assert.ok(scene.meshes.some(m=>m.role===role),role);
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
  for(const mode of ['cruise','engine','settlement']){const scene=createScene({...base,mode},data);assert.equal(scene.meshes.filter(m=>m.role==='food-factory-hull').length,mode==='settlement'?0:2);const cropHulls=scene.meshes.filter(m=>m.role==='farm-pressure-envelope');assert.equal(cropHulls.length,mode==='settlement'?8:0);assert.ok(cropHulls.every(m=>m.builtLocally));}
  const scene=createScene(base,data);assert.equal(scene.meshes.filter(m=>m.role==='fresh-food-tray').reduce((n,m)=>n+m.cropAreaM2,0),30);
});
test('food trains clear rotating discs, spine and radiator planes',()=>{
  const scene=createScene(base,data);
  for(const mesh of scene.meshes.filter(m=>m.role==='food-factory-hull'))for(const p of mesh.vertices){for(const cx of data.layout.disc_centres_x_m)assert.ok(Math.hypot(p[0]-cx,p[1])>data.layout.disc_radius_m+.25);assert.ok(Math.abs(p[1])<=1.5+.001,'inline food factory');}
});
test('berth-bay spin grouping changes between the fourth and fifth bays',()=>{
  const scene=createScene(base,data),posed=poseScene(scene,.2);
  for(const [id,index,sign] of [['cabin-4',0,-1],['cabin-5',1,1]]){const before=scene.meshes.find(m=>m.id===id).vertices[0],after=posed.meshes.find(m=>m.id===id).vertices[0],cx=data.layout.disc_centres_x_m[index],angle=.2*sign;assert.ok(Math.abs(after[0]-(cx+(before[0]-cx)*Math.cos(angle)-before[1]*Math.sin(angle)))<1e-8);assert.ok(Math.abs(after[1]-((before[0]-cx)*Math.sin(angle)+before[1]*Math.cos(angle)))<1e-8);}
});
test('flight-only screens, shield, bulk store, boom and bearings do not reach the surface',()=>{
  const cruise=createScene(base,data);for(const role of ['bulk-antimatter-store','hydrogen-propellant-tank','shadow-shield','stripper-film','deflector-coil','engine-boom','nozzle-coil','spin-bearing','thermal-touchdown-engine','descent-containment'])assert.ok(cruise.meshes.some(m=>m.role===role),role);
  const scene=createScene({...base,mode:'settlement'},data);assert.ok(!scene.meshes.some(m=>m.id==='shield'||['bulk-antimatter-store','hydrogen-propellant-tank','engine-boom','nozzle-coil','spin-bearing','thermal-touchdown-engine','radiator-panel','hot-radiator-fin'].includes(m.role)));
});
test('displayed reuse-study ledgers close at early release, handover and settlement',()=>{
  const {components,nominal}=data.viewer_design;
  for(const [phase,key] of [['surface','final_retained_mass_kg'],['orbit','early_release_mass_kg'],['handover','late_engine_stage_release_mass_kg']])assert.ok(Math.abs(components.filter(r=>r.release_stage===phase).reduce((n,r)=>n+r.mass_kg,0)-nominal[key])<1e-6);
});
test('the thrust spine stays in space and ground utilities have physical supports',()=>{
  const cruise=createScene(base,data);assert.ok(cruise.meshes.filter(m=>m.role==='cruise-support-frame').length>100);assert.equal(cruise.meshes.filter(m=>m.role==='fuel-feed').length,4);
  const surface=createScene({...base,mode:'settlement'},data);
  assert.equal(surface.meshes.filter(m=>m.role==='cruise-support-frame'||m.role==='fuel-feed').length,0);
  assert.ok(surface.meshes.filter(m=>m.role==='radiator-header').length>=2);assert.ok(surface.meshes.some(m=>m.systemRole==='pressurised-corridor'));
});
test('every cabin and shared room has a finite inside entry in deployed configurations',()=>{
 for(const mode of ['cruise','settlement']){
  const scene=createScene({...base,mode},data);
  // Settlement: ring rooms, berth bays and hall quarters per disc, eight greenhouse halls, two residences and the rover.
  const expected=mode==='settlement'?35:28;assert.equal(scene.rooms.length,expected);
  assert.equal(new Set(scene.rooms.map(r=>r.id)).size,expected);
  for(const r of scene.rooms)for(const v of [r.eye,r.up,r.forward])assert.ok(v.every(Number.isFinite));
 }
});

test('closed shells retain cabin furniture and room doorways are open',()=>{
 const scene=createScene({...base,cutaway:false},data);
 assert.ok(scene.meshes.filter(m=>m.id==='cabin-1').length>15);
 assert.ok(scene.meshes.some(m=>m.role==='room-front'));
 assert.equal(scene.meshes.filter(m=>m.role==='pressure-hatch').length,0);
 assert.ok(scene.meshes.some(m=>m.id==='refuge'&&m.role==='equipment-mount'));
 assert.ok(scene.meshes.some(m=>m.id==='rover'&&m.role==='equipment-mount'));
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
  for(const m of scene.meshes){
   if(m.role==='porthole-glass')continue;
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
  for(const p of data.habitats.cabin_bay_layout){const theta=(d?-1:1)*((p.cell+.5)*Math.PI/6+p.offset_m/r);assert.ok(angles.some(a=>Math.abs(Math.atan2(Math.sin(a-theta),Math.cos(a-theta)))*r<.01),'cabin at '+theta);}
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
 const heights=role=>scene.meshes.filter(m=>m.role===role).map(m=>{const r=m.vertices.map(p=>Math.hypot(p[0]-data.layout.disc_centres_x_m[p[0]<0?0:1],p[1]));return Math.max(...r)-Math.min(...r);});
 for(const h of [...heights('cabin-divider'),...heights('room-front')])assert.ok(h>2.9,'partition reaches the ceiling');
});
test('compact cruise vehicle keeps a clear transfer corridor between the hubs',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,interiorHabitat:'all',detail:'overview'},data),xs=scene.meshes.filter(m=>m.id!=='sky').flatMap(m=>m.vertices.map(p=>p[0]));
 assert.ok(Math.max(...xs)-Math.min(...xs)<=data.design.geometry.overall_length_with_mast_m+1);
 // Straight shared-axis corridor from the outboard end of hub A to the outboard end of hub B.
 const x=data.layout.disc_centres_x_m[0],[za,zb]=data.layout.disc_centres_z_m,half=data.layout.disc_axial_depth_m/2;assert.ok(zb-za-2*half<=12,'corridor is short');
 for(const [o,d,len] of [[[x,0,za-half+.3],[0,0,1],zb-za+2*half-.6]])
  for(const m of scene.meshes.filter(m=>!['transfer','sky'].includes(m.id)||m.role==='corridor-handhold'))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t>len,`${m.id} ${m.role??''} blocks the corridor at ${t}`);}
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
 // In flight they ride as strapped bales on the spine, and their mass is in the ledger.
 const cruise=createScene(base,data),bales=cruise.meshes.filter(m=>m.role==='stowed-surface-habitat');assert.equal(bales.length,SI.packed_bales);
 assert.ok(Math.abs(bales.reduce((n,m)=>n+m.massKg,0)-SI.hardware_kg)<1e-6);assert.ok(Math.abs(data.viewer_design.components.find(r=>r.id==='surfacekit').mass_kg-SI.hardware_kg)<1e-6);
 assert.ok(!scene.meshes.some(m=>m.role==='stowed-surface-habitat'),'unpacked on the surface');
});
test('settlement greenhouse halls open onto the pressurised spine under the Proxima b sky',()=>{
 const scene=createScene({...base,mode:'settlement'},data),halls=scene.meshes.filter(m=>m.role==='farm-pressure-envelope');
 assert.equal(halls.length,8);assert.ok(halls.every(h=>h.opacity>.2&&h.opacity<.8),'glazing is translucent, not invisible');
 for(const h of halls)assert.ok(h.vertices.some(p=>Math.abs(Math.abs(p[2]+72)-1.2)<.01),'hall end meets the spine wall');
 assert.ok(scene.meshes.some(m=>m.role==='regolith'));assert.ok(scene.meshes.filter(m=>m.role==='rock').length>0);assert.ok(scene.meshes.filter(m=>m.role==='crater').length<=2);
 const sky=data.settlement.proxima_b_sky,proxima=scene.meshes.find(m=>m.role==='proxima'),angle=2*Math.atan(sky.star_radius_solar*695700/(sky.orbit_au*149597870.7))*180/Math.PI;
 assert.ok(Math.abs(proxima.angularDiameterDeg-angle)<1e-9&&angle>1.6&&angle<1.8,'Proxima spans about 1.7 degrees');
 const c=proxima.vertices.reduce((s,p)=>s.map((v,i)=>v+p[i]/proxima.vertices.length),[0,0,0]),r=Math.max(...proxima.vertices.map(p=>Math.hypot(...p.map((v,i)=>v-c[i]))));
 assert.ok(Math.abs(2*Math.atan(r/Math.hypot(...c))*180/Math.PI-angle)<.02,'drawn at its true angular size');
 for(const [name,mag] of [['A',-6.6],['B',-5.3]])assert.ok(Math.abs(scene.meshes.find(m=>m.role==='alpha-centauri-'+name).apparentMagnitude-mag)<.1);
 assert.ok(!scene.meshes.some(m=>m.role==='star'),'daylight sky hides the faint star field');
 for(const [mode,grid] of [['cruise',false],['settlement',false],['engine',false]])assert.equal(createScene({...base,mode},data).grid,grid);
});

test('engine mode locks the discs, braces them for 1.2 g and shows a switchable exhaust beam',()=>{
 const scene=createScene({...base,mode:'engine'},data),off=createScene({...base,mode:'engine',showBeam:false},data);
 assert.equal(scene.spinCentres,null);assert.equal(scene.meshes.filter(m=>m.role==='burn-brace').length,8);
 assert.ok(scene.meshes.some(m=>m.role==='exhaust-beam'));assert.ok(!off.meshes.some(m=>m.role==='exhaust-beam'));
 const beam=scene.meshes.filter(m=>m.role==='exhaust-beam').flatMap(m=>m.vertices.map(p=>p[0]));assert.ok(Math.max(...beam)-Math.min(...beam)>3000,'beam is kilometres long');
 assert.ok(!createScene(base,data).meshes.some(m=>m.role==='burn-brace'||m.role==='exhaust-beam'),'cruise has neither');
});
test('burn configuration turns every room into thrust-facing levels that are all reachable',()=>{
 const scene=createScene({...base,mode:'engine',flat:false,interiorHabitat:'all',detail:'medium'},data);
 assert.equal(scene.rooms.length,28);assert.equal(new Set(scene.meshes.filter(m=>m.id.startsWith('cabin-')).map(m=>m.id)).size,8);
 for(const m of scene.meshes.filter(m=>m.role==='folding-deck')){const xs=m.vertices.map(p=>p[0]);assert.ok(Math.max(...xs)-Math.min(...xs)<.15,'floor panels lie at right angles to the thrust');}
 for(const r of scene.rooms.filter(r=>!r.pressurizedModule)){const g=r.gravity;assert.equal(g.type,'linear');assert.ok(g.levels.length>=1);assert.equal(g.ladders.length,g.levels.length-1,r.id+' every level has a ladder up');
  for(const l of g.ladders)assert.ok(g.levels[l.to].f<g.levels[l.from].f-2,'ladder climbs against the thrust');
  for(const lv of g.levels)assert.ok(lv.len>=1.2);}
});
test('every engine-mode entry starts on a floor, clear of fittings',()=>{
 const scene=createScene({...base,mode:'engine',flat:true,cutaway:false,interiorHabitat:'all',detail:'medium'},data);
 const solid=scene.meshes.filter(m=>(m.id.startsWith('bay-')||m.id.startsWith('cabin-'))&&!['inflatable-envelope','folding-deck','window-wall','porthole-glass','porthole-frame'].includes(m.role));
 for(const room of scene.rooms.filter(r=>!r.pressurizedModule)){const f=Math.hypot(...room.forward),u=Math.hypot(...room.up),axes=[room.forward.map(v=>v/f),room.up.map(v=>v/u)];axes.push([axes[0][1]*axes[1][2]-axes[0][2]*axes[1][1],axes[0][2]*axes[1][0]-axes[0][0]*axes[1][2],axes[0][0]*axes[1][1]-axes[0][1]*axes[1][0]]);
  const project=p=>axes.map(a=>a.reduce((s,v,i)=>s+v*(p[i]-room.eye[i]),0));
  for(const m of solid){if(m.vertices.every(p=>Math.hypot(p[0]-room.eye[0],p[1]-room.eye[1],p[2]-room.eye[2])>6))continue;const q=m.vertices.map(project);assert.ok(![0,1,2].every(i=>Math.min(...q.map(p=>p[i]))<.15&&Math.max(...q.map(p=>p[i]))>-.15),`${room.id} entry is inside ${m.id} ${m.role??''}`);}
  const g=room.gravity,o=room.eye.map((v,i)=>v-g.frame.origin[i]),s=o.reduce((n,v,i)=>n+v*g.frame.down[i],0);assert.ok(Math.abs(s-(g.levels[g.level].f-1.29))<1e-6,room.id+' eye stands on its level');
 }
});
test('cruise and engine skies place the Sun and Alpha Centauri at their real brightness',()=>{
 const cruise=createScene(base,data),engine=createScene({...base,mode:'engine'},data),centre=m=>m.vertices.reduce((s,p)=>s.map((v,i)=>v+p[i]/m.vertices.length),[0,0,0]);
 const sun=cruise.meshes.find(m=>m.role==='sun'),ab=cruise.meshes.find(m=>m.role==='alpha-centauri');
 assert.ok(centre(sun)[0]>4900,'Sun dead astern');assert.ok(Math.abs(sun.apparentMagnitude+.17)<.1,'Sun ~ -0.2 at the midpoint, dimmed by Doppler');
 const a=centre(ab),angle=Math.acos(-a[0]/Math.hypot(...a))*180/Math.PI;assert.ok(angle<5,'Alpha Centauri within 5 degrees of dead ahead');assert.ok(Math.abs(ab.apparentMagnitude+2.6)<.15,'Alpha Centauri ~ -2.6, brightened by Doppler');
 assert.ok(!cruise.meshes.some(m=>m.role==='proxima'),'Proxima itself is too faint to show at the midpoint');
 const esun=engine.meshes.find(m=>m.role==='sun');assert.ok(esun.distanceAU>1500&&esun.distanceAU<2500,'halfway through a 0.2 g burn');assert.ok(esun.apparentMagnitude<-9.5&&esun.apparentMagnitude>-11.5);assert.ok(centre(esun)[0]>4900);
});
test('settlement habitats and greenhouse are linked by walkable pressurised corridors',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false,interiorHabitat:'all'},data),walls=scene.meshes.filter(m=>['inflatable-envelope','hull-boundary','farm-pressure-envelope'].includes(m.role));
 const blocked=(a,b)=>{const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),dir=d.map(v=>v/len);for(const m of walls)for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(a,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>1e-6&&t<len)return m.id+' '+m.role;}return null;};
 const y=3.1,path=pts=>{for(let i=1;i<pts.length;i++)assert.equal(blocked(pts[i-1],pts[i]),null,`blocked between ${pts[i-1]} and ${pts[i]}`);};
 const zl=(data.layout.surface_disc_centres_z_m[0]+data.layout.surface_disc_centres_z_m[1])/2;
 path([[-8,y,zl],[8,y,zl]]);
 const gx=data.layout.surface_disc_centres_x_m[0]+(data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.65)*Math.cos(255*Math.PI/180);
 path([[gx,y,-61.5],[gx,y,-69]]);path([[gx-4,y,-72],[-54,y,-72],[-54,y,-62]]);
 assert.ok(blocked([0,y,zl],[0,y,zl-12]),'corridor walls contain the walker');
});
test('power island is a designed, sized installation at a stated standoff',()=>{
 const scene=createScene({...base,mode:'settlement'},data),label=scene.labels.find(l=>/POWER ISLAND/.test(l.text)).text;
 assert.ok(!/TBD/.test(label));assert.ok(scene.powerIsland.standoffM>150);assert.ok(scene.powerIsland.hotLoopAreaM2>=data.power.ideal_hot_loop_emitting_area_m2_at_600K);
 for(const role of ['converter-hall','regolith-berm','surface-radiator-panel','switchyard-transformer','backup-solar','exclusion-fence','settlement-substation'])assert.ok(scene.meshes.some(m=>m.role===role),role);
});

test('ship views label their main parts and the settlement labels its links',()=>{
 for(const mode of ['cruise','engine']){const texts=createScene({...base,mode},data).labels.map(l=>l.text).join('|');for(const t of ['WIND SCREEN','DUST CATCHER PLATE','SERVICE RADIATORS','CARGO RACKS','DESCENT REFUGE','ANTIHYDROGEN ICE','LIQUID HYDROGEN','SHADOW SHIELD','MAGNETIC NOZZLE','HUB TRANSFER TUBE','PACKED SURFACE RESIDENCES'])assert.ok(texts.includes(t),mode+' '+t);}
 assert.ok(createScene({...base,mode:'engine'},data).labels.some(l=>l.text==='BURN BRACES'));
 const surface=createScene({...base,mode:'settlement'},data).labels.map(l=>l.text).join('|');for(const t of ['A–B PRESSURISED LINK','GREENHOUSE LINK','CREWED ROVER','INFLATABLE RESIDENCE 1','INFLATABLE RESIDENCE 2'])assert.ok(surface.includes(t),t);
});
test('greenhouse halls and the rover cabin can be entered on the surface',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data),walls=scene.meshes.filter(m=>['inflatable-envelope','hull-boundary','farm-pressure-envelope','rover-pressure-hull','rover-window'].includes(m.role));
 const halls=scene.rooms.filter(r=>r.id.startsWith('greenhouse-'));assert.equal(halls.length,8);
 const rover=scene.rooms.find(r=>r.id==='rover');assert.ok(rover);assert.ok(scene.meshes.filter(m=>m.id==='rover').length>20,'rover interior is fitted without cutaway');
 // From each entry, walls surround the walker within a few metres at eye height in all four directions.
 for(const room of [...halls,rover])for(const dir of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){let hit=Infinity;
  for(const m of walls)for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(room.eye,dir,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>0)hit=Math.min(hit,t);}
  assert.ok(hit<20,`${room.id} enclosed toward ${dir}`);}
});
test('settlement sky is one smooth dome that also fills the view below the horizon',()=>{
 const scene=createScene({...base,mode:'settlement'},data),dome=scene.meshes.filter(m=>m.role==='sky-dome');
 assert.equal(dome.length,1);assert.equal(dome[0].colors.length,dome[0].vertices.length);assert.ok(new Set(dome[0].colors).size>100,'smooth gradient');
 assert.ok(Math.min(...dome[0].vertices.map(p=>p[1]))<-4800,'covers below the horizon');assert.equal(dome[0].material,-2,'drawn relative to the camera');
});


test('adjacent decks have a shared wall with no annular cavity',()=>{
 for(const mode of ['cruise','engine']){
  const scene=createScene({...base,mode,flat:false,cutaway:false},data),bounds=deck=>{
   const r=scene.meshes.filter(m=>m.role==='inflatable-envelope'&&m.id.startsWith(`bay-A-${deck}-`)).flatMap(m=>m.vertices).map(p=>Math.hypot(p[0],p[1]));return [Math.min(...r),Math.max(...r)];
  };
  assert.ok(Math.abs(bounds(0)[0]-bounds(1)[1])<1e-8,mode+' shared wall');
  assert.ok(Math.abs(bounds(1)[0]-3)<1e-8,'innermost room meets the hub');
 }
});

test('room signs and corridor arrows are physical geometry and cabins have names',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data);
 for(const room of scene.rooms.filter(r=>r.id.startsWith('bay-')||r.id.startsWith('cabin-')))assert.ok(scene.meshes.some(m=>m.id===room.id&&m.role==='room-sign'),room.id);
 assert.ok(scene.meshes.filter(m=>m.role==='corridor-arrow').length>=24);
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


test('refuge retains 32 seats in two compact tiers directly aft of the habitats',()=>{
 const scene=createScene({...base,detail:'medium'},data),hull=scene.meshes.find(m=>m.role==='refuge-pressure-hull'),seats=scene.meshes.filter(m=>m.id==='refuge'&&m.role==='seat');
 assert.equal(seats.length,32);assert.equal(scene.meshes.filter(m=>m.role==='refuge-tier-floor').length,2);
 const xs=hull.vertices.map(p=>p[0]);assert.ok(Math.min(...xs)>data.layout.disc_radius_m);assert.ok(Math.max(...xs)-Math.min(...xs)<5);
});

test('scouts attach to longerons and food production sits aft of the habitats',()=>{
 const scene=createScene({...base,cutaway:false},data);
 assert.equal(scene.meshes.filter(m=>m.role==='scout-bay-frame').length,0);
 assert.ok(scene.meshes.filter(m=>m.role==='scout-frame-mount').length>=12);
 for(const m of scene.meshes.filter(m=>m.role==='food-factory-hull'))assert.ok(Math.min(...m.vertices.map(p=>p[0]))>data.layout.disc_radius_m);
 assert.equal(scene.labels.find(l=>/food factory/i.test(l.text)).text,'FOOD FACTORY');
});

test('surface cargo stays nearby without intersecting either habitat',()=>{
 const scene=createScene({...base,mode:'settlement'},data);
 for(const m of scene.meshes.filter(m=>m.role==='cargo-container')){
  const centre=[0,1,2].map(k=>m.vertices.reduce((n,p)=>n+p[k],0)/m.vertices.length);assert.ok(Math.min(...data.layout.surface_disc_centres_x_m.map((x,i)=>Math.hypot(centre[0]-x,centre[2]-data.layout.surface_disc_centres_z_m[i])))<35);
  for(const p of m.vertices)for(let i=0;i<2;i++)assert.ok(Math.hypot(p[0]-data.layout.surface_disc_centres_x_m[i],p[2]-data.layout.surface_disc_centres_z_m[i])>20);
 }
});

test('interior partitions and deck ends stay inside the closed axial shell',()=>{
 const scene=createScene({...base,flat:false,cutaway:false,detail:'medium'},data),half=data.layout.disc_axial_depth_m/2;
 for(const m of scene.meshes.filter(m=>['cabin-divider','room-front','room-bulkhead','access-shaft','folding-deck'].includes(m.role))){const d=m.id.startsWith('bay-B')||m.id.startsWith('cabin-')&&+m.id.slice(6)>4?1:0,cz=data.layout.disc_centres_z_m[d];for(const p of m.vertices)assert.ok(Math.abs(p[2]-cz)<half-.015,m.id+' '+m.role);}
});


test('surface pressure tunnels turn through a smooth bend instead of a right angle',()=>{
 const scene=createScene({...base,mode:'settlement'},data),tunnels=scene.meshes.filter(m=>m.systemRole==='pressurised-corridor');assert.equal(tunnels.length,4,'A-B link, greenhouse link and one to each residence');
 const path=tunnels.find(m=>m.centreline.length>2).centreline;
 for(let i=1;i<path.length-1;i++){const a=path[i].map((v,k)=>v-path[i-1][k]),b=path[i+1].map((v,k)=>v-path[i][k]),cos=a.reduce((n,v,k)=>n+v*b[k],0)/(Math.hypot(...a)*Math.hypot(...b));assert.ok(Math.acos(Math.min(1,cos))<.2);}
 assert.ok(tunnels.every(m=>m.normals?.length===m.vertices.length));
});


test('crew bays are inline aft of the wheels, before all unpressurised cargo',()=>{
 const scene=createScene({...base,flat:false,cutaway:false},data),modules=scene.crewModules;
 assert.deepEqual(modules.map(m=>m.id),['refuge','food-factory-1','food-factory-2','rover']);
 assert.ok(modules[0].x0>data.layout.disc_radius_m);
 for(let i=0;i<modules.length;i++){const m=modules[i];assert.deepEqual(m.centre.slice(1),[0,8]);assert.equal(scene.rooms.find(r=>r.id===m.id).gravity.type,'float');if(i)assert.ok(m.x0-modules[i-1].x1>0&&m.x0-modules[i-1].x1<.6);}
 const cargo=scene.meshes.filter(m=>m.role==='cargo-container');for(const m of cargo)assert.ok(Math.min(...m.vertices.map(p=>p[0]))>modules.at(-1).x1);
 assert.ok(scene.meshes.some(m=>m.role==='unpressurised-cargo'));
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

test('the pressurised route is unobstructed from the hub branch through all crew modules',()=>{
 const scene=createScene({...base,flat:false,cutaway:false},data),o=[0,0,8],d=[1,0,0],end=scene.crewModules.at(-1).x1-o[0];
 for(const m of scene.meshes.filter(m=>['refuge','farm','rover','transfer'].includes(m.id)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);assert.ok(t===null||t<0||t>end,m.id+' '+m.role+' blocks passage');}
});


test('communal rings have no extra concentric room fronts and signs fit door lintels',()=>{
 for(const mode of ['cruise','engine','settlement']){
  const scene=createScene({...base,mode,cutaway:false,detail:'medium'},data);
  if(mode!=='engine')assert.ok(!scene.meshes.some(m=>m.id.startsWith('bay-')&&m.id.split('-')[2]!=='0'&&m.role==='room-front'));
  const signs=scene.meshes.filter(m=>m.role==='room-sign-panel');assert.ok(signs.length>0);for(const m of signs){const lengths=m.faces[0].map((i,k,a)=>Math.hypot(...m.vertices[i].map((v,j)=>v-m.vertices[a[(k+1)%a.length]][j])));assert.ok(Math.max(...lengths)<1.1);}
 }
});
test('rover driver looks through real forward glazing rather than an opaque shell',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false},data),room=scene.rooms.find(r=>r.id==='rover');assert.equal(room.driver,true);
 const hits=[];for(const m of scene.meshes.filter(m=>m.id==='rover'))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(room.eye,room.forward,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null)hits.push({t,m});}
 hits.sort((a,b)=>a.t-b.t);assert.equal(hits[0].m.role,'rover-window');assert.ok(hits[0].m.opacity<.3);assert.ok(!hits.some(h=>h.t<3&&h.m.opacity>.9));
 assert.ok(!scene.meshes.some(m=>m.id.startsWith('hab')&&m.vertices.length===8&&!m.role),'unlabelled habitat support boxes removed');
});


test('a surface radial probe crosses only the outer wall and the hall wall',()=>{
 const scene=createScene({...base,mode:'settlement',cutaway:false,detail:'medium'},data),a=2.5,start=11,cx=data.layout.surface_disc_centres_x_m[0],cz=data.layout.surface_disc_centres_z_m[0],o=[cx+start*Math.cos(a),3.1,cz+start*Math.sin(a)],d=[-Math.cos(a),0,-Math.sin(a)],hits=[];
 for(const m of scene.meshes.filter(m=>m.id.startsWith('bay-A')&&['inflatable-envelope','room-front'].includes(m.role)))for(const f of m.faces)for(let i=1;i<f.length-1;i++){const t=gpu.rayTriangle(o,d,m.vertices[f[0]],m.vertices[f[i]],m.vertices[f[i+1]]);if(t!==null&&t>0&&t<9)hits.push(start-t);}
 const outer=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.65;
 hits.sort((p,q)=>q-p);assert.equal(hits.length,2);assert.ok(hits[0]>outer&&hits[0]<outer+.76,'rounded outer wall');assert.ok(Math.abs(hits[1]-(outer-4.7))<.02,'hall wall');
});