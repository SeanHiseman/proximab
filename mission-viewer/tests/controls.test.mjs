import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../dist/renderer.js';
function harness(){const listeners={};const canvas={getContext:type=>type==='2d'?{}:null,addEventListener:(name,fn)=>listeners[name]=fn,setPointerCapture:()=>{}};const r=new Renderer(canvas,()=>{});r.width=800;r.height=500;r.setup();const fire=(name,event={})=>listeners[name]({preventDefault(){},pointerId:1,...event});return {r,fire};}
function anchorAt(r,x,y){
 const {ray,depth}=r.sampleCursor(x,y);
 return r.eye.map((v,i)=>v+ray[i]*(depth??(r.insideView?1:r.camera.distance)));
}
test('right drag reverses both orbit directions',()=>{const {r,fire}=harness(),yaw=r.camera.yaw,pitch=r.camera.pitch;fire('pointerdown',{button:2,clientX:100,clientY:100});fire('pointermove',{clientX:120,clientY:110});assert.ok(r.camera.yaw>yaw);assert.ok(r.camera.pitch<pitch);});
test('left drag pans without shift or changing orbit',()=>{const {r,fire}=harness(),yaw=r.camera.yaw,pitch=r.camera.pitch,target=[...r.camera.target];fire('pointerdown',{button:0,clientX:100,clientY:100});fire('pointermove',{clientX:130,clientY:120,shiftKey:false});assert.equal(r.camera.yaw,yaw);assert.equal(r.camera.pitch,pitch);assert.notDeepEqual(r.camera.target,target);});
test('right context menu is suppressed only by the canvas listener',()=>{const {fire}=harness();let prevented=false;fire('contextmenu',{preventDefault(){prevented=true;}});assert.ok(prevented);});
test('wheel and keyboard zoom reach centimetre scale rather than 18 metres',()=>{const {r,fire}=harness();for(let i=0;i<30;i++)fire('wheel',{deltaY:-500});assert.equal(r.camera.distance,.05);r.camera.distance=1;for(let i=0;i<120;i++)fire('keydown',{key:'+'});assert.equal(r.camera.distance,.05);assert.ok(r.project(r.camera.target));});

test('left pan keeps the clicked surface point under the cursor at its actual depth',()=>{
  const {r,fire}=harness();const point=r.eye.map((v,i)=>v+r.forward[i]*37+r.right[i]*3);const before=r.project(point);r.gpu={pickHit:()=>({point})};fire('pointerdown',{button:0,clientX:before[0],clientY:before[1]});fire('pointermove',{clientX:before[0]+80,clientY:before[1]-30});r.setup();const after=r.project(point);assert.ok(Math.abs(after[0]-before[0]-80)<1e-8);assert.ok(Math.abs(after[1]-before[1]+30)<1e-8);
});

test('right drag keeps the point under the current cursor fixed',()=>{
 const {r,fire}=harness(),x=470,y=240;
 const point=anchorAt(r,x,y);r.gpu={pickHit:()=>({point})};
 fire('pointerdown',{button:2,clientX:x-30,clientY:y-15});
 fire('pointermove',{clientX:x,clientY:y});
 const after=r.project(point);assert.ok(Math.hypot(after[0]-x,after[1]-y)<1e-8);
});

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
test('inside right-drag orbits the cursor without moving the walker',()=>{
 const {r,fire}=harness();r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});r.setup();
 const eye=[...r.insideView.eye];
 fire('pointerdown',{button:2,clientX:100,clientY:100});
 fire('pointermove',{clientX:100,clientY:140});assert.ok(r.insideView.pitch>0);
 const point=anchorAt(r,100,60);r.gpu={pickHit:()=>({point})};
 fire('pointermove',{clientX:100,clientY:60});assert.ok(r.insideView.pitch<0);
 assert.deepEqual(r.insideView.eye,eye);
 assert.ok(Math.hypot(r.project(point)[0]-100,r.project(point)[1]-60)<1e-8);
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
 // The corridor runs across above the gap to habitat B's hub, then down its spin axis.
 // Float up the leg to the cross corridor (above the hub, along the spin axis), across, then down into B's hub.
 const B=scene.world.habitats.B,cross=scene.world.segments.find(g=>g.name==='Transfer corridor'&&Math.abs(g.a[0]-g.b[0])>5);hold('w',()=>Math.abs(v.eye[1]-cross.a[1])<.2);
 v.forward=[1,0,0];v.up=[0,0,1];hold('w',()=>v.eye[0]>=B.centre[0]-.05,800);v.forward=B.axis.map(x=>-x);hold('w',()=>v.frame==='B');assert.equal(v.frame,'B');assert.equal(v.habitat,'B');assert.match(r.roomName(),/Habitat B · Hub/);
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
 const scene=createScene({mode:'cruise',year:20.5,landing:'horizontal',flat:true,cutaway:false,deck:'all',interiorHabitat:'all',detail:'overview'},data);
 const room=scene.rooms.find(r=>r.gravity?.levels?.length>=2),{r}=harness();r.enterInside(room);const v=r.insideView,g=v.gravity,l=g.ladders.find(l=>l.from===0);
 assert.match(r.roomName(),/Burn 0\.\d\d g .* Level 1 of/);
 v.eye=r.linearPoint(g.levels[0].f-1.29,l.uA,l.w-.45);r.walkKeys.add('e');for(let i=0;i<200&&v.level!==1;i++)r.walk(.05);r.walkKeys.clear();
 assert.equal(v.level,1);assert.match(r.roomName(),/Level 2 of/);
 const [s]=r.linearCoords(v.eye);assert.ok(Math.abs(s-(g.levels[1].f-1.29))<1e-6,'standing on level 2');
 r.walkKeys.add('q');r.walk(.3);r.walkKeys.clear();assert.equal(v.mode,'ladder');r.walkKeys.add(' ');r.walk(.05);assert.equal(v.mode,'walk');assert.equal(v.level,1,'nearer end');
 const before=[...v.eye];r.walkKeys.add('w');r.walk(.1);assert.ok(Math.abs(r.linearCoords(v.eye)[0]-r.linearCoords(before)[0])<1e-9,'walking keeps the floor height');
});

test('zoom keeps the point under the cursor fixed and scales the current distance by a fixed step',()=>{
 const {r,fire}=harness();r.reset('cruise','horizontal');r.setup();const d0=r.camera.distance,cx=50,cy=60;
 const ray=[0,1,2].map(i=>r.forward[i]+r.right[i]*(cx-r.width/2)/r.focal-r.up[i]*(cy-r.height*.51)/r.focal),n=Math.hypot(...ray),dir=ray.map(v=>v/n),fd=r.forward.reduce((t,v,i)=>t+v*dir[i],0);
 const P=r.eye.map((v,i)=>v+dir[i]*d0/fd),before=r.project(P);
 fire('wheel',{deltaY:200,clientX:cx,clientY:cy});r.setup();const after=r.project(P);
 assert.ok(Math.abs(r.camera.distance/d0-Math.exp(.3))<1e-9,'one step is a fixed factor of the current distance');
 assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])<1e-6,'the point under the cursor stays put');
 for(let i=0;i<6;i++)fire('wheel',{deltaY:800,clientX:cx,clientY:cy});
 assert.ok(r.camera.distance>15000);
 for(let i=0;i<6;i++)fire('wheel',{deltaY:-800,clientX:cx,clientY:cy});
 assert.ok(Math.abs(r.camera.distance/d0-Math.exp(.3))<1e-9);
});

for(const mode of ['settlement','cargo'])test(`${mode} zoom remains finite with a zero-depth pick and reverses large wheel input`,()=>{
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

test('crew can float from one food train through the passage to the other',async()=>{
 const {createScene}=await import('../dist/model.js'),fs=await import('node:fs'),data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url))),scene=createScene({mode:'cruise',landing:'horizontal',cutaway:false,detail:'overview'},data),{r}=harness();
 r.enterInside(scene.rooms.find(x=>x.id==='food-factory-1'));const v=r.insideView;assert.equal(v.mode,'float');
 v.forward=[0,-1,0];v.yaw=0;v.pitch=0;r.walkKeys.add('w');for(let i=0;i<400&&v.eye[1]>-4;i++)r.walk(.05);assert.ok(v.eye[1]<=-4);assert.match(r.roomName(),/Food factory 2/);
 for(let i=0;i<200;i++)r.walk(.05);assert.ok(v.eye[1]>-8.5,'stops at the end of the train');
});

test('rover accelerates gradually, limits speed, coasts and brakes before reversing',async()=>{
 const {createRoverState,stepRover}=await import('../dist/model.js'),r=createRoverState();r.parked=false;const run=(key,seconds)=>{for(let i=0;i<seconds*100;i++)stepRover(r,new Set(key),.01);};
 run('w',1);assert.ok(r.speed>1.15&&r.speed<1.25);run('w',10);assert.equal(r.speed,8);
 const x=r.x;run('',1);assert.ok(r.speed>6.5&&r.speed<8);assert.ok(r.x>x+6.5,'coasting does not stop instantly');
 run(' ',3);assert.equal(r.speed,0);run('s',5);assert.equal(r.speed,-2);run('w',.5);assert.ok(r.speed<0&&r.speed>-1.6,'opposite input brakes first');
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

test('zoom pivots on the surface under the cursor when it is nearby',()=>{
 const {r,fire}=harness();r.setup();const d0=r.camera.distance,point=r.eye.map((v,i)=>v+r.forward[i]*d0*2);r.gpu={pickHit:()=>({point})};
 fire('wheel',{deltaY:-200,clientX:400,clientY:255});r.setup();
 assert.ok(Math.abs(r.camera.distance/d0-Math.exp(-.3))<1e-9);assert.ok(Math.abs(Math.hypot(...point.map((v,i)=>v-r.eye[i]))-2*d0*Math.exp(-.3))<1e-6,'moved toward the surface by the same fraction');
});


for(const mode of ['cruise','cargo','descent','settlement','system','interior'])test(`${mode} pan follows the cursor and orbit crosses the pole around its anchor`,()=>{
 const {r,fire}=harness();r.reset(mode);r.systemMode=mode==='system';r.systemKm=400;
 if(mode==='interior')r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});
 if(r.systemMode)r.systemPick=direction=>200/direction.reduce((sum,v,i)=>sum+v*r.forward[i],0);
 r.setup();const x=210,y=145,point=anchorAt(r,x,y);
 fire('pointerdown',{button:0,clientX:x,clientY:y});
 const dy=mode==='settlement'?20:-951;
 fire('pointermove',{clientX:x+1200,clientY:y+dy-1});
 fire('pointermove',{clientX:x+1201,clientY:y+dy});
 r.setup();assert.ok(Math.hypot(r.project(point)[0]-x-1201,r.project(point)[1]-y-dy)<1e-7);
 fire('lostpointercapture');
 if(r.insideView)r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});
 r.setup();const pivot=anchorAt(r,x+37,y+500);if(!r.systemMode)r.gpu={pickHit:()=>({point:pivot})};
 fire('pointerdown',{button:2,clientX:x,clientY:y});
 fire('pointermove',{clientX:x+37,clientY:y+500});
 assert.ok(Math.hypot(r.project(pivot)[0]-x-37,r.project(pivot)[1]-y-500)<1e-7);
});

test('system cursor zoom reverses at the same rate across frame rebases',()=>{
 const {r,fire}=harness();r.systemMode=true;r.systemKm=400;r.setup();
 const x=108,y=87,initial=anchorAt(r,x,y),origin=[0,0,0];
 for(const deltaY of [16,16,-32]){
   fire('wheel',{deltaY,deltaMode:1,clientX:x,clientY:y});
   const target=r.camera.target,scale=r.systemKm/400;
   for(let i=0;i<3;i++)origin[i]+=target[i]*scale;
   r.camera.target=[0,0,0];r.setup();
   const projected=r.project(initial.map((v,i)=>(v-origin[i])/scale));
   assert.ok(Math.hypot(projected[0]-x,projected[1]-y)<1e-7);
 }
 assert.ok(Math.abs(r.systemKm-400)<1e-8);
});

test('interior zoom preserves the cursor ray and reverses at a constant magnification',()=>{
 const {r,fire}=harness();r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});r.setup();
 const x=275,y=315,point=anchorAt(r,x,y),focal=r.focal;
 fire('wheel',{deltaY:-10,deltaMode:1,clientX:x,clientY:y});r.setup();
 assert.ok(Math.abs(r.focal/focal-Math.exp(.24))<1e-9);
 assert.ok(Math.hypot(r.project(point)[0]-x,r.project(point)[1]-y)<1e-8);
 fire('wheel',{deltaY:160,clientX:x,clientY:y});r.setup();assert.ok(Math.abs(r.focal-focal)<1e-8);
});

test('orbit and wheel use live cursor coordinates with a visible pointer',()=>{
 const listeners={},samples=[];
 const canvas={getContext:type=>type==='2d'?{}:null,addEventListener:(name,fn)=>listeners[name]=fn,
   setPointerCapture(){},requestPointerLock(){assert.fail('the pointer must stay visible');}};
 const r=new Renderer(canvas,()=>{});r.width=800;r.height=500;r.setup();
 const fire=(name,event)=>listeners[name]({pointerId:1,preventDefault(){},...event});
 r.gpu={pickHit:(x,y)=>{samples.push([x,y]);return {point:r.eye.map((v,i)=>v+10*r.forward[i])};}};
 fire('pointerdown',{button:2,clientX:100,clientY:90});
 fire('pointermove',{clientX:320,clientY:220});
 fire('wheel',{clientX:420,clientY:260,deltaY:-100});
 fire('pointermove',{clientX:425,clientY:265});
 fire('pointerup',{});
 assert.deepEqual(samples,[[320,220],[420,260],[425,265]]);
 assert.equal(r.pointer,null);
});

test('software stars retain position and size through far zoom and interior magnification',()=>{
 function paintedStar(state,inside){
   const paths=[],ctx=new Proxy({},{
     get(o,key){if(key==='moveTo'||key==='lineTo')return (x,y)=>paths.push([x,y]);return o[key]??(()=>{});}
   });
   const canvas={getContext:type=>type==='2d'?ctx:null,addEventListener(){},focus(){}};
   const r=new Renderer(canvas,()=>{});r.width=800;r.height=500;
   if(inside)r.enterInside({eye:[0,0,0],up:[0,1,0],forward:[1,0,0]});
   r.setup();
   const vertices=[[-.03,-.02],[.03,-.02],[.03,.02],[-.03,.02]].map(([x,y])=>
     r.forward.map((v,i)=>4000*(v+r.right[i]*x+r.up[i]*y)));
   const skyMesh={id:'sky',material:-2,color:'#ffffff',opacity:1,vertices,faces:[[0,1,2,3]]};
   const scene={meshes:state.sky?[]:[skyMesh],lines:[],labels:[]};
   if(state.sky)state.sky={meshes:[skyMesh]};
   r.render(scene,state);const before=paths.splice(0);
   assert.equal(before.length,4);
   r.zoomAt(583,131,inside?.25:1e4);r.render(scene,state);
   assert.equal(paths.length,before.length);
   assert.ok(paths.every((p,i)=>Math.hypot(p[0]-before[i][0],p[1]-before[i][1])<1e-7));
 }
 paintedStar({mode:'settlement'},false);paintedStar({mode:'cruise',sky:true},false);paintedStar({mode:'settlement'},true);
});

test('distant off-centre surface remains fixed through orbit',()=>{
 const {r,fire}=harness();r.camera.distance=5e3;r.setup();
 const x=540,y=194,depth=8e4;
 const point=r.eye.map((v,i)=>v+depth*(r.forward[i]+r.right[i]*(x-r.centreX)/r.focal+r.up[i]*(r.centreY-y)/r.focal));
 r.gpu={pickHit:()=>({point})};
 fire('pointerdown',{button:2,clientX:x-21,clientY:y+10});
 fire('pointermove',{clientX:x,clientY:y});
 assert.ok(Math.hypot(r.project(point)[0]-x,r.project(point)[1]-y)<1e-7);
});

test('zoom rate scales with the distance to the current cursor surface',()=>{
 const step=depth=>{
   const {r,fire}=harness();const x=470,y=210;
   const ray=r.forward.map((v,i)=>v+r.right[i]*(x-r.centreX)/r.focal+r.up[i]*(r.centreY-y)/r.focal);
   const before=[...r.eye],point=before.map((v,i)=>v+depth*ray[i]);
   r.gpu={pickHit:()=>({point})};
   fire('wheel',{deltaY:-200,clientX:x,clientY:y});r.setup();
   assert.ok(Math.hypot(r.project(point)[0]-x,r.project(point)[1]-y)<1e-7);
   return Math.hypot(...r.eye.map((v,i)=>v-before[i]))/depth;
 };
 assert.ok(step(.3)<step(50)*.5);
});

test('settlement pan, orbit and wheel stop above the rendered terrain without a horizontal travel limit',async()=>{
 const {settlementCameraFloor}=await import('../dist/model.js'),{r,fire}=harness();r.reset('settlement');r.setup();
 fire('pointerdown',{button:0,clientX:400,clientY:255});
 fire('pointermove',{clientX:400,clientY:-7000});r.setup();
 const valid=()=>assert.ok(r.eye[1]>=settlementCameraFloor(r.eye[0],r.eye[2])+1.2-1e-7);
 valid();
 const x=r.eye[0];fire('pointermove',{clientX:2600,clientY:-7000});r.setup();valid();assert.ok(Math.abs(r.eye[0]-x)>1000);
 fire('pointerup');
 fire('pointerdown',{button:2,clientX:480,clientY:260});
 fire('pointermove',{clientX:510,clientY:700});valid();fire('pointerup');
 for(let i=0;i<35;i++){fire('wheel',{deltaY:-400,clientX:400,clientY:255});r.setup();valid();}
});

test('Canvas fallback paints celestial and terrain faces in their vertex colors',()=>{
 const colors=[],ctx=new Proxy({fill(){colors.push(this.fillStyle);}}, {get:(o,k)=>o[k]??(()=>{})});
 const canvas={getContext:type=>type==='2d'?ctx:null,addEventListener(){}};
 const r=new Renderer(canvas,()=>{});r.width=800;r.height=500;r.setup();
 const at=(x,y)=>r.forward.map((v,i)=>100*v+x*r.right[i]+y*r.up[i]);
 const body={id:'sky',vertices:[at(-2,-2),at(2,-2),at(0,2)],faces:[[0,1,2]],material:-2,opacity:1,color:'#ffffff',colors:['#8a4010','#a05a20','#b06830']};
 r.render({meshes:[body],lines:[],labels:[]},{mode:'system'});
 assert.deepEqual(colors,['rgb(158,86,32)']);
});

test('right-drag over empty space turns in place instead of swinging around the camera target',()=>{
 const {r,fire}=harness();r.systemMode=true;r.systemKm=90;r.setup();
 const eye=[...r.eye],forward=[...r.forward];
 fire('pointerdown',{button:2,clientX:650,clientY:154});
 fire('pointermove',{clientX:765,clientY:230});
 assert.ok(Math.hypot(...r.eye.map((v,i)=>v-eye[i]))<1e-8);
 assert.notDeepEqual(r.forward,forward);
});

test('wheel samples the current ray on every packet and limits a jump after the foreground disappears',()=>{
 const {r,fire}=harness(),x=570,y=195;
 const initial=[...r.eye];let samples=0;
 r.gpu={pickHit:(px,py)=>{
   assert.deepEqual([px,py],[x,y]);samples++;
   if(samples===1){
     const ray=r.forward.map((v,i)=>v+r.right[i]*(x-r.centreX)/r.focal+r.up[i]*(r.centreY-y)/r.focal);
     return {point:r.eye.map((v,i)=>v+ray[i]*.4)};
   }
   if(samples===2)return null;
   return {point:r.eye.map((v,i)=>v+r.forward[i]*800)};
 }};
 const at=()=>{fire('wheel',{deltaY:-400,clientX:x,clientY:y});r.setup();return [...r.eye];};
 const one=at(),two=at(),three=at();
 assert.equal(samples,3);
 for(const [a,b] of [[initial,one],[one,two],[two,three]])assert.ok(Math.hypot(...b.map((v,i)=>v-a[i]))<.4);
});

test('Canvas orbit picks world geometry at the current camera pose between renders',()=>{
 const {r,fire}=harness(),ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});
 r.ctx=ctx;
 Object.assign(r.camera,{target:[0,0,0],distance:10,yaw:Math.PI/2,pitch:0});r.setup();
 const mesh={id:'panel',vertices:[[1,-5,0],[4,-5,0],[4,5,0],[1,5,0]],faces:[[0,1,2,3]],opacity:1,color:'#adc4cb'};
 r.render({meshes:[mesh],lines:[],labels:[]},{mode:'cruise'});
 r.camera.target=[2.5,0,0];r.setup();
 const x=400,y=255,pivot=[2.5,0,0];
 fire('pointerdown',{button:2,clientX:370,clientY:230});
 fire('pointermove',{clientX:x,clientY:y});
 assert.ok(Math.hypot(r.project(pivot)[0]-x,r.project(pivot)[1]-y)<1e-7);
});

test('System scroll travels faster in deep space while staying gradual near a planet',()=>{
 const ratio=km=>{
   const {r,fire}=harness();r.systemMode=true;r.systemKm=km;r.setup();
   fire('wheel',{deltaY:-200,clientX:575,clientY:177});
   return r.systemKm/km;
 };
 assert.ok(ratio(1e6)<.79);
 assert.ok(ratio(2e4)>.86&&ratio(2e4)<.88);
});

test('an oversized wheel packet takes a bounded step at close range',()=>{
 const {r,fire}=harness(),origin=[...r.eye];
 const point=origin.map((v,i)=>v+2*r.forward[i]);
 r.gpu={pickHit:()=>({point})};
 fire('wheel',{deltaY:-100000,clientX:400,clientY:255});r.setup();
 const travelled=Math.hypot(...r.eye.map((v,i)=>v-origin[i]));
 assert.ok(travelled>0&&travelled<.75);
});

test('an orbit across a distant wireframe gap uses nearby geometry at the current pixel',()=>{
 const {r,fire}=harness(),x=540,y=194,depth=2100;
 r.camera.distance=9000;r.setup();
 const anchor=r.eye.map((v,i)=>v+depth*r.cursorRay(x,y)[i]);
 const neighbour=r.eye.map((v,i)=>v+depth*r.cursorRay(x+3,y)[i]);
 r.gpu={pickHit:(px,py)=>px===x+3&&py===y?{point:neighbour}:null};
 fire('pointerdown',{button:2,clientX:410,clientY:200});
 fire('pointermove',{clientX:x,clientY:y});
 const p=r.project(anchor);assert.ok(Math.hypot(p[0]-x,p[1]-y)<1e-8);
});

test('the fully zoomed-out crew ship orbits about a real off-centre hull pick',async()=>{
 const {r,fire}=harness(),fs=await import('node:fs'),{createScene}=await import('../dist/model.js');
 const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url)));
 const state={mode:'cruise',year:30,cutaway:false,detail:'overview'},scene=createScene(state,data);
 r.ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});
 Object.assign(r.camera,{target:[18,0,0],yaw:Math.PI/2,pitch:.12,distance:3000});
 r.render(scene,state);
 const y=255,x=[403,397,405,395,401].find(px=>r.sampleCursor(px,y).depth>2000);
 assert.ok(x,'visible off-centre geometry at kilometre range');
 const pivot=anchorAt(r,x,y);
 fire('pointerdown',{button:2,clientX:x-10,clientY:y-6});
 fire('pointermove',{clientX:x,clientY:y});
 const p=r.project(pivot);assert.ok(Math.hypot(p[0]-x,p[1]-y)<1e-7);
});
