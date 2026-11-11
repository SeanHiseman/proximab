import test from 'node:test';
import assert from 'node:assert/strict';
import {GPUScene,compileScene,rayBox,rayTriangle} from '../dist/gpu.js';
test('close-up ray selection handles front/back faces and misses',()=>{
  const a=[-1,-1,0],b=[1,-1,0],c=[0,1,0];assert.equal(rayTriangle([0,0,10],[0,0,-1],a,b,c),10);assert.equal(rayTriangle([0,0,10],[0,0,-1],c,b,a),10);assert.equal(rayTriangle([5,0,10],[0,0,-1],a,b,c),null);assert.equal(rayTriangle([0,0,10],[0,0,1],a,b,c),null);
  assert.ok(rayBox([0,0,10],[0,0,-1],[-1,-1,-1],[1,1,1]));assert.ok(rayBox([0,0,0],[1,0,0],[-1,-1,-1],[1,1,1]));assert.equal(rayBox([2,0,10],[0,0,-1],[-1,-1,-1],[1,1,1]),false);
});
test('GPU submissions are finite and camera movement does not re-upload static geometry',()=>{
  // Validates API data flow and caching, not actual GLSL compilation or browser pixels.
  let uploads=0,draws=0;const gl={canvas:{width:800,height:500},createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createVertexArray:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>({}),bufferData:(target,a)=>{uploads++;assert.ok(a.every(Number.isFinite));assert.equal(a.length%28,0);},drawArrays:(kind,start,count)=>{draws++;assert.ok(Number.isInteger(start)&&Number.isInteger(count));}};
  for(const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','bindVertexArray','bindBuffer','enableVertexAttribArray','vertexAttribPointer','viewport','clearColor','clear','useProgram','uniform3fv','uniform2f','uniform1f','enable','depthFunc','disable','depthMask','polygonOffset','blendFunc','deleteBuffer'])gl[name]=()=>{};
  const gpu=new GPUScene(gl),scene={meshes:[{id:'test',vertices:[[-1,-1,0],[1,-1,0],[0,1,0]],faces:[[0,1,2]],opacity:1,color:'#aacccc'}],lines:[]},state={selected:'test',mode:'cruise'},camera={eye:[0,0,10],right:[1,0,0],up:[0,1,0],forward:[0,0,-1],focal:500,width:800,height:500,camera:{distance:10}};
  gpu.draw(scene,state,camera);assert.equal(uploads,3);gpu.draw(scene,{...state,selected:'another'},camera);assert.equal(uploads,3);const alternate={...scene,meshes:[...scene.meshes]};gpu.prepare(alternate);assert.equal(uploads,6);gpu.draw(alternate,state,camera);gpu.draw(scene,state,camera);assert.equal(uploads,6);camera.eye=[0,0,11];for(let i=0;i<120;i++)gpu.draw(scene,{...state,spinAngle:i*.01},camera);assert.equal(uploads,6);assert.ok(draws>=4);assert.equal(gpu.pick(400,255,camera),'test');gpu.maxCacheBytes=gpu.cacheBytes;const extra={...scene,meshes:[...scene.meshes]};gpu.prepare(extra);assert.ok(gpu.cache.has(scene));assert.ok(!gpu.cache.has(alternate));assert.ok(gpu.cacheBytes<=gpu.maxCacheBytes);
});

test('worker-ready streams preserve geometry, compact normals and component tags',()=>{
  const scene={meshes:[{id:'habA',vertices:[[1,2,3],[2,2,3],[1,3,3]],faces:[[0,1,2]],opacity:1,color:'#aabbcc'}],lines:[],spinCentres:[0,10]},compiled=compileScene(scene);assert.equal(compiled.streams[0].byteLength,3*28);const view=new DataView(compiled.streams[0].buffer);assert.equal(view.getFloat32(0,true),1);assert.equal(view.getFloat32(4,true),2);assert.equal(view.getFloat32(8,true),3);assert.equal(view.getInt8(14),127);assert.equal(view.getUint8(16),170);assert.equal(view.getInt8(21),-1);assert.equal(view.getInt16(24,true),-1);assert.equal(compiled.pickEntries[0].triangles.length,9);assert.equal(compiled.counts[0],3);
});

test('WebGL 1 receives compatible shaders and vertex-array extension bindings',()=>{
 const sources=[],gl={createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>({}),getExtension:name=>name==='OES_vertex_array_object'?{createVertexArrayOES:()=>({}),bindVertexArrayOES(){}}:null,shaderSource:(shader,source)=>sources.push(source)};
 for(const name of ['compileShader','attachShader','linkProgram','deleteShader'])gl[name]=()=>{};
 new GPUScene(gl);
 assert.equal(sources.length,2);
 for(const source of sources)assert.doesNotMatch(source,/#version 300|layout\(|^in |^out /m);
 assert.match(sources[0],/attribute vec3 position/);assert.match(sources[1],/gl_FragColor/);
});


test('moving the rover updates picking without uploading the terrain again',async()=>{
 const {createRoverState,placeRover}=await import('../dist/model.js');let uploads=0;
 const gl=new Proxy({canvas:{width:800,height:500},createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createVertexArray:()=>({}),getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>({}),bufferData:()=>uploads++},{get:(o,k)=>o[k]??(()=>{})});
 const gpu=new GPUScene(gl),scene={meshes:[{id:'rover',vertices:[[89,-1,-42],[91,-1,-42],[90,1,-42]],faces:[[0,1,2]],opacity:1,color:'#aacccc'}],lines:[]},rover=createRoverState(),camera={eye:[100,-.2,-32],right:[1,0,0],up:[0,1,0],forward:[0,0,-1],focal:500,width:800,height:500,camera:{distance:10}};
 rover.x=100;placeRover(rover);gpu.draw(scene,{mode:'settlement',rover},camera);assert.equal(gpu.pick(400,255,camera),'rover');assert.equal(uploads,3);
 rover.x=110;placeRover(rover);gpu.draw(scene,{mode:'settlement',rover},camera);assert.equal(gpu.pick(400,255,camera),null);camera.eye[0]=110;assert.equal(gpu.pick(400,255,camera),'rover');assert.equal(uploads,3);
});
