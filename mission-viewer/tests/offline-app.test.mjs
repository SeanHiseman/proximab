import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercises the actual packaged application and real software renderer with a
// minimal DOM/canvas API; this is not browser pixel or CSS-layout verification.
test('offline app leaves preparation and switches views when workers are blocked',{timeout:60000},async()=>{
  const html=fs.readFileSync(new URL('../../proxima-design-viewer.html',import.meta.url),'utf8');
  const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const payload=html.match(/<script type="application\/json" id="design-payload">([\s\S]*?)<\/script>/)[1];
  const ids=new Map(),frames=new Set();let stopped=false,rafCount=0;
  const ctx=new Proxy({measureText:text=>({width:String(text).length*6})},{get:(object,key)=>object[key]??(()=>{})});
  const element=(id='')=>({id,hidden:false,dataset:{},style:{},children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},
    textContent:'',innerHTML:'',setAttribute(){},append(...nodes){this.children.push(...nodes);},
    addEventListener(name,fn){this.listeners[name]=fn;},getBoundingClientRect(){return {left:0,top:0,width:800,height:500};},
    getContext:type=>type==='2d'?ctx:null});
  const get=id=>{if(!ids.has(id))ids.set(id,element(id));return ids.get(id);};
  get('design-payload').textContent=payload;
  const modes=['cruise','engine','settlement'].map(mode=>({...element(),dataset:{mode}}));
  const document={getElementById:get,querySelector:selector=>get(selector.slice(1)),querySelectorAll:selector=>selector==='[data-mode]'?modes:[],createElement:()=>element()};
  const windowListeners={};const window={devicePixelRatio:1,addEventListener(name,fn){windowListeners[name]=fn;},location:{reload(){}}};
  class BlockedWorker{constructor(){setTimeout(()=>this.onerror?.({message:'Worker blocked by test',preventDefault(){}}),0);}postMessage(){}terminate(){}}
  const raf=fn=>{if(stopped)return;rafCount++;const timer=setTimeout(()=>{frames.delete(timer);fn(performance.now());},8);frames.add(timer);};
  const context=vm.createContext({document,window,performance,console,setTimeout,clearTimeout,requestAnimationFrame:raf,
    Worker:BlockedWorker,Blob,URL,ResizeObserver:class{observe(){}}});
  async function until(check){const end=Date.now()+45000;while(!check()){if(Date.now()>end)throw Error('Application did not finish: '+get('loading').textContent+' / '+JSON.stringify(window.__proximaErrors));await new Promise(resolve=>setTimeout(resolve,10));}}
  try{
    vm.runInContext(code,context);
    await until(()=>window.__proxima?.ready);
    assert.equal(get('loading').hidden,true);assert.ok(window.__proxima.faceCount>1000);
    assert.ok(window.__proximaErrors.includes('Worker blocked by test'));
    assert.ok(!html.includes('id="ledger-content"'));assert.ok(!html.includes('id="dimensions"'));assert.equal(window.__proxima.state.dimensions,false);assert.equal(get('room-select').children.length,28);assert.ok(get('room-select').children.every(o=>/^(?:[AB][1-3]: |Ship: )/.test(o.textContent)));assert.equal(window.__proxima.state.interiorHabitat,'all');
    assert.ok(!html.includes('id="systems-panel"'));assert.ok(!html.includes('id="toggle-sidebar"'));assert.ok(html.includes('id="labels"'));
    get('labels').listeners.change({target:{checked:false}});assert.equal(vm.runInContext('state.showLabels',context),false);

    assert.equal(window.__proxima.state.detail,'medium');
    const built=vm.runInContext('sceneStore.buildCount',context);
    for(let i=0;i<5;i++){windowListeners.scroll();await new Promise(resolve=>setTimeout(resolve,100));}
    assert.equal(vm.runInContext('sceneStore.buildCount',context),built,'background jobs pause during page interaction');
    for(const mode of ['engine','settlement']){modes.find(button=>button.dataset.mode===mode).onclick();await until(()=>window.__proxima.state.mode===mode);assert.equal(get('loading').hidden,true);assert.ok(window.__proxima.faceCount>1000);}
    assert.equal(vm.runInContext('sceneStore.buildCount',context),3,'only visited configurations are built');
    await new Promise(resolve=>setTimeout(resolve,250));const idleFrames=rafCount;
    await new Promise(resolve=>setTimeout(resolve,80));assert.equal(rafCount,idleFrames,'idle viewer must stop scheduling frames');
    vm.runInContext('renderer.camera.distance=20;markDirty()',context);await until(()=>window.__proxima.state.detail==='medium');
    vm.runInContext('renderer.camera.distance=290;markDirty()',context);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(window.__proxima.state.detail,'medium');assert.equal(vm.runInContext('sceneStore.buildCount',context),3,'camera motion must not rebuild geometry');
  }finally{stopped=true;for(const timer of frames)clearTimeout(timer);}
});

test('hidden overlays override their author display rules in both builds',()=>{
  const css=fs.readFileSync(new URL('../dist/detail.css',import.meta.url),'utf8');
  assert.match(css,/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  const html=fs.readFileSync(new URL('../../proxima-design-viewer.html',import.meta.url),'utf8');
  assert.ok(html.includes('[hidden]{display:none!important}'));
});

test('embedded standalone worker produces renderable buffers',()=>{
  const html=fs.readFileSync(new URL('../../proxima-design-viewer.html',import.meta.url),'utf8');
  const payload=JSON.parse(html.match(/<script type="application\/json" id="design-payload">([\s\S]*?)<\/script>/)[1]);
  const source=JSON.parse(html.match(/new Blob\(\[("(?:[^"\\]|\\.)*")\],\{type:'text\/javascript'\}\)/)[1]);
  let response;const self={postMessage:value=>{response=value;}};
  vm.runInNewContext(source,{self});self.onmessage({data:{data:payload}});
  self.onmessage({data:{key:'cruise',state:{mode:'cruise',landing:'horizontal',cutaway:true,detail:'medium',gpu:true,dimensions:true}}});
  assert.equal(response.error,undefined);assert.ok(response.scene.meshCount>1000);assert.ok(response.scene.gpuData.streams[0].byteLength>10000);
});
