import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SceneStore,sceneKey} from '../dist/scene-store.js';
test('prepared views reuse scenes; urgent requests precede queued background work',async()=>{
  const sent=[],worker={postMessage:m=>sent.push(m)},store=new SceneStore({},worker),a={mode:'cruise',cutaway:true},b={mode:'engine',cutaway:true},c={mode:'settlement',cutaway:false};
  const pa=store.request(a);assert.equal(store.request(a),pa);const pb=store.request(b),pc=store.request(c);assert.equal(sent.length,2);
  const sceneA={meshes:[]};worker.onmessage({data:{key:sceneKey(a),scene:sceneA}});assert.equal(await pa,sceneA);assert.equal(sent[2].key,sceneKey(c));worker.onmessage({data:{key:sceneKey(c),scene:{}}});await pc;assert.equal(sent[3].key,sceneKey(b));worker.onmessage({data:{key:sceneKey(b),scene:{}}});await pb;const count=sent.length;assert.equal(await store.request(a),sceneA);assert.equal(sent.length,count);assert.equal(store.buildCount,3);
  assert.equal(sceneKey({...a,dimensions:true,selected:'habB',landing:'upright',showRadiators:false,deck:'2'}),sceneKey(a));
});

const emptyState={mode:'cruise',cutaway:true,detail:'medium'};
test('worker load error settles the request instead of leaving preparation pending',async()=>{
  let terminated=false;const notices=[],worker={postMessage(){},terminate(){terminated=true;}};
  const store=new SceneStore({},worker,{onStatus:message=>notices.push(message)}),result=store.request(emptyState);
  worker.onerror({message:'Worker blocked',preventDefault(){}});
  await assert.rejects(result);assert.equal(terminated,true);assert.equal(store.busy,false);assert.equal(store.pending.size,0);assert.deepEqual(notices,['Worker blocked']);
});
test('silent worker times out, falls back and clears queued requests',async()=>{
  const worker={postMessage(){},terminate(){}};const store=new SceneStore({},worker,{timeoutMs:5});
  const results=await Promise.allSettled([store.request(emptyState),store.request({...emptyState,mode:'engine'})]);
  assert.ok(results.every(r=>r.status==='rejected'));assert.equal(store.pending.size,0);assert.equal(store.busy,false);assert.equal(store.worker,null);
});
test('postMessage failure and unknown or late replies cannot strand the queue',async()=>{
  let posts=0;const worker={postMessage(){if(++posts>1)throw Error('Channel closed');},terminate(){}};
  const store=new SceneStore({},worker),result=store.request(emptyState);store.complete({key:'stale',scene:{}});await assert.rejects(result);assert.equal(store.busy,false);assert.equal(store.pending.size,0);
});
test('blocked worker recovers a real renderable configuration locally',async()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url))),worker={postMessage(){},terminate(){}};
  const store=new SceneStore(data,worker),result=store.request({...emptyState,gpu:true});worker.onmessageerror();
  const scene=await result;assert.ok(scene.meshCount>1000);assert.ok(scene.gpuData.streams[0].byteLength>10000);assert.equal(store.pending.size,0);assert.equal(store.busy,false);
});

test('silent startup falls back before the long scene-generation timeout',async()=>{
 let terminated=false;
 const worker={postMessage(){},terminate(){terminated=true;}};
 const data=JSON.parse((await import('node:fs')).readFileSync(new URL('../dist/design-data.json',import.meta.url)));
 const store=new SceneStore(data,worker,{startupTimeoutMs:10,timeoutMs:20000});
 const start=performance.now();
 const scene=await store.request({mode:'cruise',landing:'horizontal',detail:'overview',cutaway:true});
 assert.ok(terminated);assert.ok(scene.meshes.length>100);
 assert.ok(performance.now()-start<3000,'startup must not wait for the 20-second generation timeout');
});
