import {compileScene} from './gpu.js';
import {createScene} from './model.js';
let designData;
self.onmessage=({data:message})=>{if(message.data){designData=message.data;self.postMessage({ready:true});return;}try{const raw=createScene(message.state,designData);if(message.state.gpu){const gpuData=compileScene(raw),scene={...raw,meshes:[],lines:[],meshCount:raw.meshes.length,gpuData};self.postMessage({key:message.key,scene},[...gpuData.streams.map(v=>v.buffer),gpuData.pickStream.buffer]);}else self.postMessage({key:message.key,scene:raw});}catch(error){self.postMessage({key:message.key,error:error.message});}};
