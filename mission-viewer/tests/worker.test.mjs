import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Worker} from 'node:worker_threads';
test('all six main views compile and transfer in the background without blocking the UI thread',{timeout:60000},async()=>{
  const worker=new Worker(new URL('./worker-harness.mjs',import.meta.url)),data=JSON.parse(fs.readFileSync(new URL('../dist/design-data.json',import.meta.url)));let ticks=0;const timer=setInterval(()=>ticks++,5);
  try{
    worker.postMessage({data});let prepared=0,retainedBytes=0;
    for(const mode of ['engine','cruise','settlement'])for(const landing of ['horizontal'])for(const cutaway of [true,false]){
      const response=new Promise((resolve,reject)=>{worker.on('message',function receive(message){if(message.ready)return;worker.off('message',receive);resolve(message);});worker.once('error',reject);});worker.postMessage({key:mode+landing+cutaway,state:{mode,landing,cutaway,deck:'all',detail:'overview',dimensions:true,gpu:true}});const result=await response;assert.equal(result.error,undefined);assert.equal(result.scene.meshes.length,0);assert.ok(result.scene.meshCount>100);assert.ok(result.scene.gpuData.streams[0].byteLength>10000);const ids=new Set(result.scene.gpuData.pickEntries.map(m=>m.id));for(const id of (mode==='settlement'?['habA','habB','farm','rover']:['habA','habB','propulsion','refuge']))assert.ok(ids.has(id),`${mode}: missing ${id}`);assert.equal([...ids].filter(id=>id.startsWith('cabin-')).length,8);retainedBytes+=result.scene.gpuData.streams.reduce((n,v)=>n+v.byteLength,0)+result.scene.gpuData.pickStream.byteLength;prepared++;
    }
    assert.equal(prepared,6);assert.ok(retainedBytes<128*1024*1024,`Overview cache too large: ${retainedBytes} bytes`);assert.ok(ticks>30,'main thread should remain available during generation');
  }
  finally{clearInterval(timer);await worker.terminate();}
});
