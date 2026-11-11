import {createScene} from './model.js';
import {compileScene} from './gpu.js';
export const sceneKey=s=>[s.mode,s.cutaway,s.airlockOutside??'',s.detail,!!s.flat,s.interiorHabitat??'all',s.mode==='engine'?(s.showBeam!==false?'beam':'no-beam'):''].join('/');
export class SceneStore{
  constructor(data,worker,{timeoutMs=20000,startupTimeoutMs=1500,onStatus=()=>{}}={}){
    this.data=data;this.worker=worker;this.timeoutMs=timeoutMs;this.onStatus=onStatus;this.cache=new Map();this.pending=new Map();this.queue=[];this.busy=false;this.active=null;this.buildCount=0;
    if(worker){
      worker.onmessage=e=>{if(this.worker!==worker)return;if(e.data.ready){clearTimeout(this.startupTimer);return;}clearTimeout(this.startupTimer);this.complete(e.data);};
      worker.onerror=e=>{e.preventDefault?.();if(this.worker===worker)this.failWorker(e.message||'Background model preparation failed.');};
      worker.onmessageerror=()=>{if(this.worker===worker)this.failWorker('Background model data could not be read.');};
      this.startupTimer=setTimeout(()=>this.failWorker('Worker startup did not respond; preparing locally.'),startupTimeoutMs);
      try{worker.postMessage({data});}catch(error){this.failWorker(error.message);}
    }
  }
  request(state){const key=sceneKey(state);if(this.cache.has(key)){const scene=this.cache.get(key);this.cache.delete(key);this.cache.set(key,scene);return Promise.resolve(scene);}if(this.pending.has(key))return this.pending.get(key).promise;
    let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});this.pending.set(key,{promise,resolve,reject});this.queue.push({key,state:{...state,dimensions:true,spin:false,deck:'all',showRadiators:true}});this.pump();return promise;
  }
  drop(scene){for(const [key,value] of this.cache)if(value===scene)this.cache.delete(key);}
  failWorker(reason){
    clearTimeout(this.timer);clearTimeout(this.startupTimer);this.worker?.terminate();this.worker=null;
    if(this.active)this.queue.push(this.active);
    this.active=null;this.busy=false;this.onStatus(reason);this.pump();
  }
  pump(){
    if(this.busy||!this.queue.length)return;this.busy=true;const job=this.active=this.queue.pop();
    if(this.worker){
      this.timer=setTimeout(()=>this.failWorker('Background preparation timed out; switching to local preparation.'),this.timeoutMs);
      try{this.worker.postMessage(job);}catch(error){this.failWorker(error.message);}
    }else setTimeout(()=>{try{const raw=createScene(job.state,this.data),scene=job.state.gpu?{...raw,meshes:[],lines:[],meshCount:raw.meshes.length,gpuData:compileScene(raw)}:raw;this.complete({key:job.key,scene});}catch(error){this.complete({key:job.key,error:error.message});}},0);
  }
  complete({key,scene,error}){
    const job=this.pending.get(key);if(!job||this.active?.key!==key)return;
    clearTimeout(this.timer);this.pending.delete(key);this.active=null;this.busy=false;
    if(error)job.reject(Error(error));else{this.buildCount++;this.cache.set(key,scene);if(this.cache.size>12)this.cache.delete(this.cache.keys().next().value);job.resolve(scene);}this.pump();
  }
}
export function createSceneWorker(){try{return new Worker(new URL('./scene-worker.js',import.meta.url),{type:'module'});}catch{return null;}}
