import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../dist/renderer.js';
function harness(){const listeners={};const canvas={getContext:type=>type==='2d'?{}:null,addEventListener:(name,fn)=>listeners[name]=fn,setPointerCapture:()=>{}};const r=new Renderer(canvas,()=>{});r.width=800;r.height=500;r.setup();const fire=(name,event={})=>listeners[name]({preventDefault(){},pointerId:1,...event});return {r,fire};}
test('right drag reverses both orbit directions',()=>{const {r,fire}=harness(),yaw=r.camera.yaw,pitch=r.camera.pitch;fire('pointerdown',{button:2,clientX:100,clientY:100});fire('pointermove',{clientX:120,clientY:110});assert.ok(r.camera.yaw>yaw);assert.ok(r.camera.pitch<pitch);});
test('left drag pans without shift or changing orbit',()=>{const {r,fire}=harness(),yaw=r.camera.yaw,pitch=r.camera.pitch,target=[...r.camera.target];fire('pointerdown',{button:0,clientX:100,clientY:100});fire('pointermove',{clientX:130,clientY:120,shiftKey:false});assert.equal(r.camera.yaw,yaw);assert.equal(r.camera.pitch,pitch);assert.notDeepEqual(r.camera.target,target);});
test('right context menu is suppressed only by the canvas listener',()=>{const {fire}=harness();let prevented=false;fire('contextmenu',{preventDefault(){prevented=true;}});assert.ok(prevented);});
test('wheel and keyboard zoom reach centimetre scale rather than 18 metres',()=>{const {r,fire}=harness();for(let i=0;i<30;i++)fire('wheel',{deltaY:-500});assert.equal(r.camera.distance,.05);r.camera.distance=1;for(let i=0;i<80;i++)fire('keydown',{key:'+'});assert.equal(r.camera.distance,.05);assert.ok(r.project(r.camera.target));});

test('left pan keeps the clicked surface point under the cursor at its actual depth',()=>{
  const {r,fire}=harness();const point=r.eye.map((v,i)=>v+r.forward[i]*37+r.right[i]*3);const before=r.project(point);r.gpu={pickHit:()=>({point})};fire('pointerdown',{button:0,clientX:before[0],clientY:before[1]});fire('pointermove',{clientX:before[0]+80,clientY:before[1]-30});r.setup();const after=r.project(point);assert.ok(Math.abs(after[0]-before[0]-80)<1e-8);assert.ok(Math.abs(after[1]-before[1]+30)<1e-8);
});

test('right drag keeps the clicked point fixed on screen',()=>{const {r,fire}=harness();const point=r.eye.map((v,i)=>v+r.forward[i]*100+r.right[i]*12);const before=r.project(point);r.gpu={pickHit:()=>({point})};fire('pointerdown',{button:2,clientX:before[0],clientY:before[1]});fire('pointermove',{clientX:before[0]+30,clientY:before[1]+15});r.setup();const after=r.project(point);assert.ok(Math.abs(after[0]-before[0])<1e-8);assert.ok(Math.abs(after[1]-before[1])<1e-8);});

test('wheel zoom keeps the point under the cursor fixed',()=>{const {r,fire}=harness();const point=r.eye.map((v,i)=>v+r.forward[i]*100+r.right[i]*12);const before=r.project(point);r.gpu={pickHit:()=>({point})};fire('wheel',{deltaY:-200,clientX:before[0],clientY:before[1]});r.setup();const after=r.project(point);assert.ok(Math.abs(after[0]-before[0])<1e-8);assert.ok(Math.abs(after[1]-before[1])<1e-8);});
test('inside navigation follows room gravity, stops on blur and restores outside camera',()=>{
 const {r,fire}=harness(),camera=structuredClone(r.camera);
 r.enterInside({eye:[0,0,0],up:[0,0,1],forward:[1,0,0]});
 fire('keydown',{key:'w'});r.walk(1);assert.ok(Math.abs(r.insideView.eye[0]-3.6)<1e-9);
 fire('keyup',{key:'w'});assert.equal(r.walk(1),false);
 fire('keydown',{key:'e'});r.walk(1);assert.equal(r.insideView.eye[2],0);
 fire('blur');assert.equal(r.walk(1),false);
 r.leaveInside();assert.deepEqual(r.camera,camera);assert.equal(r.insideView,null);
});

test('inside movement cannot cross a solid wall even with a long frame',()=>{
 const {r,fire}=harness();
 r.enterInside({eye:[0,0,0],up:[0,1,0],forward:[1,0,0]},[{role:'hull-boundary',opacity:1,vertices:[[1,-3,-3],[1,3,-3],[1,3,3],[1,-3,3]],faces:[[0,1,2,3]]}]);
 fire('keydown',{key:'w'});r.walk(1);assert.ok(r.insideView.eye[0]<.8);
});

test('furniture is passable while transparent porthole glazing remains solid',()=>{
 const {r,fire}=harness(),room={eye:[0,0,0],up:[0,1,0],forward:[1,0,0]};
 const panel={opacity:1,vertices:[[1,-3,-3],[1,3,-3],[1,3,3],[1,-3,3]],faces:[[0,1,2,3]]};
 r.enterInside(room,[{...panel,role:'seat'}]);fire('keydown',{key:'w'});r.walk(1);assert.ok(r.insideView.eye[0]>3);
 r.leaveInside();r.enterInside(room,[{...panel,opacity:.12,role:'porthole-glass'}]);fire('keydown',{key:'w'});r.walk(1);assert.ok(r.insideView.eye[0]<.8);
});

test('looking steeply upward and vertical keys cannot change walking height',()=>{
 const {r,fire}=harness();r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});
 r.insideView.pitch=1.4;fire('keydown',{key:'w'});fire('keydown',{key:'e'});
 for(let i=0;i<100;i++)r.walk(.016);
 assert.equal(r.insideView.eye[1],1.35);assert.ok(r.insideView.eye[0]>5);
});
test('inside dragging down looks up and dragging up looks down without moving the eye',()=>{
 const {r,fire}=harness();r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});r.setup();
 const eye=[...r.insideView.eye];
 fire('pointerdown',{button:0,clientX:100,clientY:100});
 fire('pointermove',{clientX:100,clientY:140});assert.ok(r.insideView.pitch>0);
 fire('pointermove',{clientX:100,clientY:60});assert.ok(r.insideView.pitch<0);
 assert.deepEqual(r.insideView.eye,eye);
});

test('radial walking passes through bulkhead doorways and private cabin doors only',()=>{
 const {r}=harness(),angle=Math.PI/12,radial=[Math.cos(angle),Math.sin(angle),0],radius=16,at=(a,z)=>[radius*Math.cos(a),radius*Math.sin(a),z];
 // A bulkhead at angle 0 with its doorway at z>1, and a cabin centred on angle with a 1.4 m door in its front wall at z=1.
 const walls=[{angle:0,half:.05/radius,z0:-2.25,z1:1},{angle:angle-1.35/radius,half:.65/radius,z0:.96,z1:1.04},{angle:angle+1.35/radius,half:.65/radius,z0:.96,z1:1.04}];
 r.enterInside({eye:at(angle,1.6),up:radial.map(v=>-v),forward:[radial[1],-radial[0],0],gravity:{centre:[0,0,0],axis:[0,0,1],radius,axialMin:-1.95,axialMax:1.95,walls}});
 r.walkKeys.add('w');for(let i=0;i<600;i++)r.walk(.016);
 assert.ok(Math.abs(Math.hypot(r.insideView.eye[0],r.insideView.eye[1])-radius)<1e-8);
 assert.equal(r.insideView.eye[2],1.6);
 assert.ok(r.insideView.up[0]*r.insideView.eye[0]+r.insideView.up[1]*r.insideView.eye[1]<-15.99);
 r.insideView.eye=at(.3/radius,1.6);assert.equal(r.walkRadial(at(.1/radius,1.6).map((v,i)=>v-r.insideView.eye[i])),true,'bulkhead doorway');
 r.insideView.eye=at(.3/radius,0);assert.equal(r.walkRadial(at(.1/radius,0).map((v,i)=>v-r.insideView.eye[i])),false,'solid bulkhead');
 r.insideView.eye=at(angle+1.2/radius,1.4);assert.equal(r.walkRadial([0,0,-.3]),false,'solid cabin front');
 r.insideView.eye=at(angle,1.4);assert.equal(r.walkRadial([0,0,-.3]),true,'cabin doorway');
 r.insideView.eye=at(angle,-1.9);assert.equal(r.walkRadial([0,0,-.2]),false,'hull containment');
});

test('ladders climb between decks and the room name follows the walker',()=>{
 const {r}=harness(),angle=Math.PI/3,deck=(radius,name)=>({radius,gravity:.5,walls:[],rooms:[{a0:0,a1:2*Math.PI,name}],cabins:[]});
 const gravity={habitat:'A',deck:0,decks:[deck(16,'Dining'),deck(12,'Lounge'),deck(8,'Garden')],ladders:[{angle,z:1.6,from:0,to:1,topRadius:3.9},{angle,z:1.6,from:1,to:2,topRadius:3.9}],centre:[0,0,0],axis:[0,0,1],radius:16,axialMin:-1.95,axialMax:1.95,walls:[]};
 const radial=[Math.cos(angle),Math.sin(angle),0];
 r.enterInside({eye:[16*radial[0],16*radial[1],1.5],up:radial.map(v=>-v),forward:[radial[1],-radial[0],0],gravity});
 assert.match(r.roomName(),/Deck 1.*Dining/);
 r.walkKeys.add('e');for(let i=0;i<200&&r.insideView.deck!==1;i++)r.walk(.05);
 assert.equal(r.insideView.deck,1);assert.ok(Math.abs(Math.hypot(r.insideView.eye[0],r.insideView.eye[1])-12)<1e-8);assert.match(r.roomName(),/Deck 2.*Lounge/);
 r.walkKeys.clear();r.walkKeys.add('w');r.walk(.1);assert.equal(r.insideView.deck,1,'walks off the ladder on the upper deck');
 r.walkKeys.clear();r.walkKeys.add('q');for(let i=0;i<200&&r.insideView.deck!==0;i++)r.walk(.05);
 assert.equal(r.insideView.deck,0);assert.match(r.roomName(),/Deck 1/);
 r.walkKeys.clear();r.insideView.eye=[16*Math.cos(angle+1),16*Math.sin(angle+1),1.6];r.walkKeys.add('e');r.walk(.1);assert.equal(r.insideView.deck,0,'no ladder within reach');
});

test('walker climbs to the hub, floats the corridor to the other habitat and climbs down, with spin applied only to the camera',async()=>{
 const {createScene,spinPoint}=await import('../dist/model.js'),fs=await import('node:fs');
 const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url),'utf8'));
 const scene=createScene({mode:'cruise',landing:'horizontal',flat:true,cutaway:false,deck:'all',interiorHabitat:'all',detail:'overview'},data);
 const {r}=harness(),spin={angle:.7,centres:scene.spinCentres,flat:true};r.spinState=spin;
 r.enterInside(scene.rooms.find(x=>x.id==='bay-A-1-0'));const v=r.insideView,hold=(key,until,n=400)=>{r.walkKeys.clear();r.walkKeys.add(key);for(let i=0;i<n&&!until();i++)r.walk(.05);r.walkKeys.clear();};
 // Inside a habitat the camera is the walker's position carried round by the spin.
 r.setup();const expected=spinPoint(v.eye,'habA',.7,scene.spinCentres,false,true);assert.ok(r.eye.every((x,i)=>Math.abs(x-expected[i])<1e-9));
 const up=r.hab().ladders.find(l=>l.from===1);r.placeRadial(up.angle,v.radius,up.z);
 hold('e',()=>v.mode==='float');assert.equal(v.mode,'float');assert.equal(v.frame,'A');assert.match(r.roomName(),/Hub/);
 // Point along the hub axis and float out into the static corridor; the camera does not jump at the frame change.
 // Float inward to the hub axis (the walker's up points at it on arrival), then face along the axis.
 const A=r.hab();v.forward=[...A.axis];v.yaw=0;v.pitch=0;hold('e',()=>false,24);
 let before;hold('w',()=>{r.setup();before={eye:[...r.eye],forward:[...r.forward]};return v.frame===null;});
 assert.equal(v.frame,null);r.setup();assert.ok(Math.hypot(...r.eye.map((x,i)=>x-before.eye[i]))<.15);assert.ok(Math.hypot(...r.forward.map((x,i)=>x-before.forward[i]))<1e-9);
 assert.match(r.roomName(),/Transfer corridor/);
 // The corridor runs straight along the shared axis into habitat B's hub.
 hold('w',()=>v.frame==='B');assert.equal(v.frame,'B');assert.equal(v.habitat,'B');assert.match(r.roomName(),/Habitat B · Hub/);
 // Board the hub ladder and climb down to the outer deck of habitat B.
 const down=r.hab().ladders.find(l=>l.to===null);v.eye=r.radialPoint(down.angle,down.topRadius,down.z).point;
 hold('q',()=>v.deck===0&&v.mode==='walk',800);assert.equal(v.mode,'walk');assert.equal(v.deck,0);assert.match(r.roomName(),/Habitat B · Deck 1/);
 // Walking on the lower deck moves the walker in its own frame regardless of the spin angle.
 const start=[...v.eye];r.walkKeys.add('w');r.walk(.1);assert.ok(Math.hypot(...v.eye.map((x,i)=>x-start[i]))>.2);
});

test('floating along the hub axis from off-centre funnels into the corridor tube',async()=>{
 const {createScene}=await import('../dist/model.js'),fs=await import('node:fs');
 const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url),'utf8'));
 const scene=createScene({mode:'cruise',landing:'horizontal',flat:true,cutaway:false,deck:'all',interiorHabitat:'all',detail:'overview'},data);
 const {r}=harness();r.enterInside(scene.rooms.find(x=>x.id==='bay-A-1-0'));const v=r.insideView;
 const up=r.hab().ladders.find(l=>l.from===1);r.placeRadial(up.angle,v.radius,up.z);
 r.walkKeys.add('e');for(let i=0;i<200&&v.mode!=='float';i++)r.walk(.05);r.walkKeys.clear();
 // Arrive 2.4 m off the axis, face along it and fly straight: the tube mouth guides the walker in.
 v.forward=[...r.hab().axis];v.yaw=0;v.pitch=0;r.walkKeys.add('w');for(let i=0;i<300&&v.frame!==null;i++)r.walk(.05);
 assert.equal(v.frame,null);assert.match(r.roomName(),/Transfer corridor/);
});

test('space steps off a ladder at the nearer deck',()=>{
 const {r}=harness(),angle=Math.PI/3,deck=(radius,name)=>({radius,gravity:.5,walls:[],rooms:[{a0:0,a1:2*Math.PI,name}],cabins:[]});
 const gravity={habitat:'A',deck:0,decks:[deck(16,'Dining'),deck(12,'Lounge'),deck(8,'Garden')],ladders:[{angle,z:1.6,from:0,to:1,topRadius:2.4}],centre:[0,0,0],axis:[0,0,1],radius:16,axialMin:-1.95,axialMax:1.95,walls:[]};
 const radial=[Math.cos(angle),Math.sin(angle),0];
 r.enterInside({eye:[16*radial[0],16*radial[1],1.6],up:radial.map(v=>-v),forward:[radial[1],-radial[0],0],gravity});
 const v=r.insideView;r.walkKeys.add('e');for(let i=0;i<10;i++)r.walk(.05);r.walkKeys.clear();
 assert.equal(v.mode,'ladder');assert.ok(v.radius<16&&v.radius>14);
 r.walkKeys.add(' ');r.walk(.05);assert.equal(v.mode,'walk');assert.equal(v.deck,0);assert.equal(v.radius,16);assert.ok(!r.walkKeys.has(' '));
 // Three quarters of the way up, space steps off onto the upper deck.
 r.walkKeys.add('e');for(let i=0;i<38;i++)r.walk(.05);r.walkKeys.clear();
 assert.equal(v.mode,'ladder');r.walkKeys.add(' ');r.walk(.05);assert.equal(v.deck,1);assert.equal(v.mode,'walk');assert.equal(v.radius,12);
});

test('thrust-gravity walking climbs between burn levels and space steps off a ladder',async()=>{
 const {createScene}=await import('../dist/model.js'),fs=await import('node:fs');
 const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url),'utf8'));
 const scene=createScene({mode:'engine',landing:'horizontal',flat:true,cutaway:false,deck:'all',interiorHabitat:'all',detail:'overview'},data);
 const room=scene.rooms.find(r=>r.gravity?.levels?.length>=2),{r}=harness();r.enterInside(room);const v=r.insideView,g=v.gravity,l=g.ladders.find(l=>l.from===0);
 assert.match(r.roomName(),/Burn 0\.2 g .* Level 1 of/);
 v.eye=r.linearPoint(g.levels[0].f-1.29,l.uA,l.w-.45);r.walkKeys.add('e');for(let i=0;i<200&&v.level!==1;i++)r.walk(.05);r.walkKeys.clear();
 assert.equal(v.level,1);assert.match(r.roomName(),/Level 2 of/);
 const [s]=r.linearCoords(v.eye);assert.ok(Math.abs(s-(g.levels[1].f-1.29))<1e-6,'standing on level 2');
 r.walkKeys.add('q');r.walk(.3);r.walkKeys.clear();assert.equal(v.mode,'ladder');r.walkKeys.add(' ');r.walk(.05);assert.equal(v.mode,'walk');assert.equal(v.level,1,'nearer end');
 const before=[...v.eye];r.walkKeys.add('w');r.walk(.1);assert.ok(Math.abs(r.linearCoords(v.eye)[0]-r.linearCoords(before)[0])<1e-9,'walking keeps the floor height');
});
test('settlement orbit camera cannot drop below the ground',()=>{
 const {r}=harness();r.reset('settlement','horizontal');r.camera.pitch=-1;r.setup();assert.ok(r.eye[1]>=1.5-1e-9);
 r.reset('cruise','horizontal');r.camera.pitch=-1;r.setup();assert.ok(r.eye[1]<0,'space views are unrestricted');
});

test('zooming out keeps the target, so zooming back in returns to the same place',()=>{
 const {r,fire}=harness();r.reset('settlement','horizontal');const target=[...r.camera.target];
 for(let i=0;i<6;i++)fire('wheel',{deltaY:800,clientX:50,clientY:60});
 assert.deepEqual(r.camera.target.map(v=>+v.toFixed(6)),target.map(v=>+v.toFixed(6)));assert.equal(r.camera.distance,1200,'settlement zoom-out is capped');
 for(let i=0;i<6;i++)fire('wheel',{deltaY:-800});assert.ok(r.camera.distance<100);
});
test('settlement camera stays above the terrain, including the hills',async()=>{
 const {settlementTerrain}=await import('../dist/model.js'),{r}=harness();r.reset('settlement','horizontal');
 for(const [x,z] of [[50,-20],[400,300],[-300,500]]){r.camera.target=[x,0,z];r.camera.distance=40;r.camera.pitch=-1.2;r.setup();assert.ok(r.eye[1]>=settlementTerrain(r.eye[0],r.eye[2])+1.5-1e-6,`above ground near ${x},${z}`);}
});

for(const mode of ['settlement','engine'])test(`${mode} zoom remains finite with a zero-depth pick and reverses large wheel input`,()=>{
 const {r,fire}=harness();r.reset(mode,'horizontal');r.setup();r.gpu={pickHit:()=>({point:[...r.eye]})};
 fire('wheel',{deltaY:-100,clientX:120,clientY:90});assert.ok(r.camera.target.every(Number.isFinite));
 fire('wheel',{deltaY:100000});const far=r.camera.distance;
 fire('wheel',{deltaY:-100000});assert.ok(r.camera.distance<far);assert.ok(r.camera.target.every(Number.isFinite));
});

test('surface airlock cycling blocks the inner or outer door while keeping the other route clear',async()=>{
 const {createScene}=await import('../dist/model.js'),fs=await import('node:fs'),data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url)));
 const state={mode:'settlement',landing:'horizontal',cutaway:false,detail:'medium'},scene=createScene(state,data),lock=scene.airlocks[0],{r}=harness();
 r.enterInside(scene.rooms.find(r=>r.id==='bay-A-0-7'),scene.meshes);r.insideView.eye=[...lock.centre];r.prepareWalkingWalls();
 const step=target=>target.map((v,i)=>(v-lock.centre[i])*1.2);
 assert.equal(r.blocked(lock.centre,step(lock.outer)),true);
 assert.equal(r.blocked(lock.centre,step(lock.inner)),false);
 const cycled=createScene({...state,airlockOutside:'habA'},data);r.setColliders(cycled.meshes);
 assert.equal(r.blocked(lock.centre,step(lock.outer)),false);
 assert.equal(r.blocked(lock.centre,step(lock.inner)),true);
});

test('crew can float from the refuge through both food trains to the rover cabin',async()=>{
 const {createScene}=await import('../dist/model.js'),fs=await import('node:fs'),data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url))),scene=createScene({mode:'cruise',landing:'horizontal',cutaway:false,detail:'overview'},data),{r}=harness();
 r.enterInside(scene.rooms.find(x=>x.id==='refuge'));assert.equal(r.insideView.mode,'float');r.walkKeys.add('w');for(let i=0;i<400&&r.insideView.eye[0]<36;i++)r.walk(.05);assert.ok(r.insideView.eye[0]>=36);assert.match(r.roomName(),/Rover cabin/);
 for(let i=0;i<200;i++)r.walk(.05);assert.ok(r.insideView.eye[0]<41,'cannot enter the unpressurised bays');
});

test('rover accelerates gradually, limits speed, coasts and brakes before reversing',async()=>{
 const {createRoverState,stepRover}=await import('../dist/model.js'),r=createRoverState();r.parked=false;const run=(key,seconds)=>{for(let i=0;i<seconds*100;i++)stepRover(r,new Set(key),.01);};
 run('w',1);assert.ok(r.speed>.44&&r.speed<.46);run('w',10);assert.equal(r.speed,3);
 const x=r.x;run('',1);assert.ok(r.speed>2.6&&r.speed<3);assert.ok(r.x>x+2.6,'coasting does not stop instantly');
 run(' ',3);assert.equal(r.speed,0);run('s',5);assert.equal(r.speed,-1);run('w',.5);assert.ok(r.speed<0&&r.speed>-.6,'opposite input brakes first');
});
test('rover steering requires motion and collision stops before a building',async()=>{
 const {createRoverState,stepRover}=await import('../dist/model.js'),r=createRoverState();r.parked=false;stepRover(r,new Set('a'),1);assert.equal(r.heading,0);
 for(let i=0;i<500;i++)stepRover(r,new Set('w'),.02,[{x0:94,x1:100,z0:-50,z1:-35}]);assert.ok(r.x<94);assert.equal(r.speed,0);
 const q=createRoverState();q.parked=false;q.speed=3;stepRover(q,new Set('wa'),1);assert.ok(q.heading>0&&q.heading<.28);assert.ok(q.z<-42);
});
test('rover pose follows terrain and its coordinate transform round trips',async()=>{
 const {createRoverState,placeRover,roverPoint,settlementTerrain}=await import('../dist/model.js'),r=createRoverState();r.x=400;r.z=300;r.heading=.7;placeRover(r);
 assert.ok(Math.abs(r.position[1]-(settlementTerrain(400,300)-.15))<1e-9);const p=[92,4,-41],q=roverPoint(roverPoint(p,r),r,false,true);assert.ok(q.every((v,i)=>Math.abs(v-p[i])<1e-8));
});

test('ground correction preserves pitch and lifts the camera',async()=>{
 const {settlementTerrain}=await import('../dist/model.js'),{r}=harness();r.reset('settlement','horizontal');r.camera.pitch=-1;r.setup();
 assert.equal(r.camera.pitch,-1);assert.ok(r.eye[1]>=settlementTerrain(r.eye[0],r.eye[2])+1.5-1e-9);
});
test('zoom uses a visible surface beyond the current target',()=>{
 const {r,fire}=harness();r.camera.distance=.05;r.setup();const point=r.eye.map((v,i)=>v+r.forward[i]*100);r.gpu={pickHit:()=>({point})};
 fire('wheel',{deltaY:-200,clientX:400,clientY:255});assert.ok(r.camera.distance>80&&r.camera.distance<90);
});

test('settlement pan reverses immediately after reaching the ground',async()=>{
 const {settlementTerrain}=await import('../dist/model.js'),{r,fire}=harness();r.reset('settlement','horizontal');r.setup();
 fire('pointerdown',{button:0,clientX:400,clientY:255});
 fire('pointermove',{clientX:400,clientY:-10000});
 assert.ok(r.eye[1]>=settlementTerrain(r.eye[0],r.eye[2])+1.5-1e-9);
 const height=r.eye[1];fire('pointermove',{clientX:400,clientY:-9999});
 assert.ok(r.eye[1]>height);assert.ok(r.eye[1]-height<r.pointer.scale*2);
});
