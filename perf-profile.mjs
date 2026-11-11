import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createScene} from './dist/model.js';
import {compileScene,GPUScene} from './dist/gpu.js';
import {Renderer} from './dist/renderer.js';
const data=JSON.parse(fs.readFileSync(new URL('./dist/design-data.json',import.meta.url)));
const ctx=new Proxy({measureText:()=>({width:100})},{get:(o,k)=>o[k]??(()=>{})});
const canvas={getContext:type=>type==='2d'?ctx:null,addEventListener(){}};
const renderer=new Renderer(canvas,()=>{});Object.assign(renderer,{width:1000,height:600});
const report=[];
for(const detail of ['overview','medium','high']){
 const state={mode:'cruise',landing:'horizontal',cutaway:true,detail,dimensions:true,selected:'habA'};
 let start=performance.now();const scene=createScene(state,data);const build=performance.now()-start;
 start=performance.now();const compiled=compileScene(scene);const compile=performance.now()-start;
 const times=[];for(let i=0;i<4;i++){renderer.camera.yaw+=.02;start=performance.now();renderer.render(scene,state);times.push(performance.now()-start);}
 const gpu=Object.assign(Object.create(GPUScene.prototype),{pickEntries:compiled.pickEntries,spinAngle:0,spinCentres:scene.spinCentres,visibleDeck:-1,hideRadiators:false});
 const picks=[];for(let i=0;i<10;i++){start=performance.now();gpu.pick(450+i*10,300,renderer);picks.push(performance.now()-start);}
 report.push({detail,meshes:scene.meshes.length,triangles:(compiled.counts[0]+compiled.counts[2])/3,transparentDrawCalls:compiled.groups.length,gpuMB:compiled.streams.reduce((s,v)=>s+v.byteLength,0)/1048576,buildMS:build,compileMS:compile,softwareFrameMS:times,softwareStats:renderer.softwareStats,hoverPickMS:picks});
}
console.log(JSON.stringify(report,null,2));
