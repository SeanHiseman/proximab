import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createScene,poseScene} from '../dist/model.js';
import {compileScene} from '../dist/gpu.js';
import {Renderer} from '../dist/renderer.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url)));
function renderer(){const ctx=new Proxy({measureText:()=>({width:50})},{get:(o,k)=>o[k]??(()=>{})}),canvas={getContext:type=>type==='2d'?ctx:null,addEventListener(){}};const r=new Renderer(canvas,()=>{});Object.assign(r,{width:1000,height:600});return r;}

test('overview cuts buffer size while retaining cabins, food production and shared facilities',()=>{
  const state={mode:'cruise',landing:'horizontal',cutaway:true,dimensions:true},overview=createScene({...state,detail:'overview'},data),full=createScene({...state,detail:'high'},data);
  const bytes=s=>compileScene(s).streams.reduce((n,v)=>n+v.byteLength,0);
  assert.ok(bytes(overview)<bytes(full)*.25);assert.equal(new Set(overview.meshes.filter(m=>m.id.startsWith('cabin-')).map(m=>m.id)).size,8);
  for(const purpose of ['Shared lounge','Galley and dining','Mission control','Fresh-food garden'])assert.ok(overview.zones.some(z=>z.functions.includes(purpose)));
  assert.equal(overview.meshes.filter(m=>m.role==='food-factory-hull').length,2);
  assert.ok(full.meshes.length>overview.meshes.length*1.8,'close-up geometry retains small fittings');
});
test('software close-ups cull offscreen equipment without deleting source geometry',()=>{
  const scene=createScene({mode:'cruise',landing:'horizontal',cutaway:true,detail:'medium'},data),r=renderer(),count=scene.meshes.length;
  r.camera.distance=10;r.camera.target=[-38,0,0];r.render(scene,{mode:'cruise',dimensions:false,selected:'habA',spinAngle:0});
  assert.ok(r.softwareStats.visibleMeshes<count/3);assert.ok(r.softwareStats.drawnFaces>0);assert.equal(scene.meshes.length,count);
});
test('software spin matches a pre-rotated model without copying the scene each frame',()=>{
  const scene={spinCentres:[0,10],meshes:[{id:'cabin-1',vertices:[[-2,-2,0],[2,-2,0],[0,2,0]],faces:[[0,1,2]],opacity:1,color:'#aacccc'}],lines:[],labels:[],dimensions:[]};
  const a=renderer(),b=renderer();for(const r of [a,b])Object.assign(r.camera,{distance:20,yaw:Math.PI/2,pitch:0,target:[0,0,0]});
  a.render(scene,{mode:'cruise',spinAngle:.3});b.render(poseScene(scene,.3),{mode:'cruise',spinAngle:0});
  assert.ok(a.hits.length>0);assert.equal(a.hits.length,b.hits.length);for(let i=0;i<a.hits[0].points.length;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(a.hits[0].points[i][j]-b.hits[0].points[i][j])<1e-8);
});
test('submillimetre geometry at the near clipping plane does not break zoom',()=>{
  const r=renderer();Object.assign(r.camera,{distance:.05,yaw:Math.PI/2,pitch:0,target:[0,0,0]});
  const scene={meshes:[{id:'test',vertices:[[-.0001,-.0001,.048],[.0001,-.0001,.0482],[0,.0001,.0481]],faces:[[0,1,2]],opacity:1,color:'#aacccc'}],lines:[],labels:[],dimensions:[]};
  assert.doesNotThrow(()=>r.render(scene,{mode:'cruise'}));
});
test('interactive geometry retains components within a 20 MiB upload budget',()=>{
 const state={mode:'cruise',landing:'horizontal',flat:true,cutaway:true};
 const medium=createScene({...state,detail:'medium'},data),high=createScene({...state,detail:'high'},data);
 assert.equal(medium.meshes.length,high.meshes.length);
 assert.deepEqual(new Set(medium.meshes.map(m=>m.id)),new Set(high.meshes.map(m=>m.id)));
 const compiled=compileScene(medium);
 assert.ok(compiled.streams.reduce((sum,v)=>sum+v.byteLength,0)<20*1024*1024);
 assert.equal(medium.rooms.length,28);
});

test('overview defers fittings until interiors or a habitat is requested',()=>{
 const state={mode:'cruise',landing:'horizontal',flat:true,cutaway:true,detail:'medium'};
 const overview=createScene({...state,interiorHabitat:'none'},data),one=createScene({...state,interiorHabitat:'A'},data),all=createScene({...state,interiorHabitat:'all'},data);
 assert.equal(overview.rooms.length,28);assert.equal(one.rooms.length,28);
 const a=one.meshes.filter(m=>m.id==='cabin-1').length,b=one.meshes.filter(m=>m.id==='cabin-5').length;
 assert.ok(a>b);assert.equal(b,1);
 assert.ok(overview.meshes.length<all.meshes.length*.6);
 assert.ok(one.meshes.length<all.meshes.length);
 assert.equal(overview.meshes.filter(m=>m.role==='inflatable-envelope').length,24);
});
test('inside software views omit all exterior line overlays',()=>{
 const r=renderer();let lines=0;r.line=()=>lines++;
 r.enterInside({eye:[0,1.35,0],up:[0,1,0],forward:[1,0,0]});
 r.render({meshes:[],lines:[{a:[0,0,0],b:[1,0,0],color:'#ffffff'}],labels:[],dimensions:[]},{mode:'cruise'});
 assert.equal(lines,0);
 r.leaveInside();r.render({grid:true,meshes:[],lines:[],labels:[],dimensions:[]},{mode:'touchdown'});assert.ok(lines>0);
});
