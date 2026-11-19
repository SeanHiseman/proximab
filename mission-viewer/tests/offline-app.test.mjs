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
  const drawnText=[];
  const ctx=new Proxy({measureText:text=>({width:String(text).length*6}),fillText:text=>drawnText.push(text)},{get:(object,key)=>object[key]??(()=>{})});
  const element=(id='')=>({id,hidden:false,dataset:{},style:{},children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},
    textContent:'',innerHTML:'',setAttribute(){},append(...nodes){this.children.push(...nodes);},
    setPointerCapture(){},addEventListener(name,fn){const previous=this.listeners[name];this.listeners[name]=previous?event=>{previous(event);fn(event);}:fn;},getBoundingClientRect(){return {left:0,top:0,width:800,height:500};},
    getContext:type=>type==='2d'?ctx:null});
  const get=id=>{if(!ids.has(id))ids.set(id,element(id));return ids.get(id);};
  get('design-payload').textContent=payload;
  const modes=['cruise','cargo','map','settlement','system','descent'].map(mode=>({...element(),dataset:{mode}}));
  const focusKeys=[...html.matchAll(/data-focus="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(focusKeys,['proxima','d','b','c']);
  assert.match(html,/<label><input id="system-labels" type="checkbox" checked> Labels<\/label>/);
  const focuses=focusKeys.map(focus=>({...element(),dataset:{focus}}));
  const document={getElementById:get,querySelector:selector=>get(selector.slice(1)),querySelectorAll:selector=>selector==='[data-mode]'?modes:selector==='[data-focus]'?focuses:[],createElement:()=>element()};
  const windowListeners={};const window={devicePixelRatio:1,addEventListener(name,fn){windowListeners[name]=fn;},location:{reload(){}}};
  class BlockedWorker{constructor(){setTimeout(()=>this.onerror?.({message:'Worker blocked by test',preventDefault(){}}),0);}postMessage(){}terminate(){}}
  const raf=fn=>{if(stopped)return;rafCount++;const timer=setTimeout(()=>{frames.delete(timer);fn(performance.now());},8);frames.add(timer);};
  const context=vm.createContext({document,window,performance,console,setTimeout,clearTimeout,requestAnimationFrame:raf,
    Worker:BlockedWorker,Blob,URL,structuredClone,ResizeObserver:class{observe(){}}});
  async function until(check){const end=Date.now()+45000;while(!check()){if(Date.now()>end)throw Error('Application did not finish: '+get('loading').textContent+' / '+JSON.stringify(window.__proximaErrors));await new Promise(resolve=>setTimeout(resolve,10));}}
  try{
    vm.runInContext(code,context);
    await until(()=>window.__proxima?.ready);
    assert.equal(get('loading').hidden,true);assert.ok(window.__proxima.faceCount>1000);
    assert.ok(window.__proximaErrors.includes('Worker blocked by test'));
    assert.ok(!html.includes('id="ledger-content"'));assert.ok(!html.includes('id="dimensions"'));assert.equal(window.__proxima.state.dimensions,false);assert.equal(get('room-select').children.length,26);assert.ok(get('room-select').children.every(o=>/^(?:[AB][1-3]: |Ship: )/.test(o.textContent)));assert.equal(window.__proxima.state.interiorHabitat,'all');
    assert.ok(!html.includes('id="systems-panel"'));assert.ok(!html.includes('id="toggle-sidebar"'));assert.ok(html.includes('id="labels"'));
    get('labels').listeners.change({target:{checked:false}});assert.equal(vm.runInContext('state.showLabels',context),false);

    assert.equal(window.__proxima.state.detail,'medium');
    const built=vm.runInContext('sceneStore.buildCount',context);
    for(let i=0;i<5;i++){windowListeners.scroll();await new Promise(resolve=>setTimeout(resolve,100));}
    assert.equal(vm.runInContext('sceneStore.buildCount',context),built,'background jobs pause during page interaction');
    for(const mode of ['cargo','settlement']){modes.find(button=>button.dataset.mode===mode).onclick();await until(()=>window.__proxima.state.mode===mode);assert.equal(get('loading').hidden,true);assert.ok(window.__proxima.faceCount>1000);}
    assert.equal(vm.runInContext('sceneStore.buildCount',context),3,'only visited configurations are built');
    await new Promise(resolve=>setTimeout(resolve,250));const idleFrames=rafCount;
    await new Promise(resolve=>setTimeout(resolve,80));assert.equal(rafCount,idleFrames,'idle viewer must stop scheduling frames');
    vm.runInContext('renderer.camera.distance=20;markDirty()',context);await until(()=>window.__proxima.state.detail==='medium');
    vm.runInContext('renderer.camera.distance=290;markDirty()',context);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(window.__proxima.state.detail,'medium');assert.equal(vm.runInContext('sceneStore.buildCount',context),3,'camera motion must not rebuild geometry');
    assert.ok(!html.includes('S8 redesign of the S7 concept: tandem edge-on habitats'));
    assert.ok(!html.includes('data-view='));
    assert.ok(!html.includes('100dvh - 58px'));
    assert.ok(html.includes('.app{height:100%;height:100dvh;'));
    assert.match(html,/<div class="viewport-footer"><button id="reset-view"[^>]*>[^<]*<span>Reset view<\/span><\/button><span><b>LEFT DRAG<\/b>/);
    const changeMode=mode=>modes.find(b=>b.dataset.mode===mode).onclick();
    changeMode('descent');
    await until(()=>window.__proxima.state.mode==='descent');
    assert.equal(get('cutaway-control').hidden,true);assert.equal(get('labels-control').hidden,true);
    changeMode('settlement');await until(()=>window.__proxima.state.mode==='settlement');
    assert.equal(get('cutaway-control').hidden,false);assert.equal(get('labels-control').hidden,false);
    const wheel=(deltaY,clientX=400,clientY=255)=>get('scene').listeners.wheel({deltaY,clientX,clientY,preventDefault(){}});
    vm.runInContext('Object.assign(renderer.camera,{distance:150000,target:[50,0,-20],yaw:.8,pitch:1.16});markDirty()',context);
    await until(()=>vm.runInContext('dirty===false',context));
    wheel(750,340,240);
    const surfacePose=vm.runInContext(`(()=>{renderer.setup();const f=settlementFrame(data);return {eye:f.position(renderer.eye),right:f.vector(renderer.right),forward:f.vector(renderer.forward),focal:renderer.focal};})()`,context);
    await until(()=>window.__proxima.state.mode==='system');
    assert.equal(window.__proxima.state.systemFocus,null);
    assert.ok(window.__proxima.systemEye.every((v,i)=>Math.abs(v-surfacePose.eye[i])<1e-7));
    const orbitalPose=vm.runInContext('({right:renderer.right,forward:renderer.forward,focal:renderer.focal})',context);
    for(const key of ['right','forward'])assert.ok(orbitalPose[key].every((v,i)=>Math.abs(v-surfacePose[key][i])<1e-8));
    assert.equal(orbitalPose.focal,surfacePose.focal);
    for(let i=0;i<7&&window.__proxima.state.mode==='system';i++){
      wheel(-550,340,240);await until(()=>vm.runInContext('dirty===false',context));
    }
    assert.equal(window.__proxima.state.mode,'settlement','return through the same orbital camera');
    changeMode('system');await until(()=>window.__proxima.state.mode==='system');
    const focus=key=>focuses.find(b=>b.dataset.focus===key).onclick();
    const clearance=key=>{
      const body=vm.runInContext(`systemFocusPoints(data).${key}`,context);
      return Math.hypot(...window.__proxima.systemEye.map((v,i)=>v-body.p[i]))-body.r;
    };
    drawnText.length=0;
    focus('c');await until(()=>vm.runInContext('dirty===false',context));
    const cName=vm.runInContext('systemFocusPoints(data).c.name',context);
    assert.ok(drawnText.includes(cName));
    drawnText.length=0;
    get('system-labels').listeners.change({target:{checked:false}});
    await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(!drawnText.includes(cName));
    get('system-labels').listeners.change({target:{checked:true}});
    await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(drawnText.includes(cName));
    assert.equal(window.__proxima.state.showLabels,false);
    for(let i=0;i<40;i++)wheel(790);
    await until(()=>vm.runInContext('dirty===false',context));
    const far=clearance('c');assert.ok(far>1e7);
    wheel(-500,405,255);await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(clearance('c')<far*.9,'can approach c off-centre after reaching the maximum zoom-out');
    for(let i=0;i<32;i++)wheel(-790,405,255);
    await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(clearance('c')>0&&clearance('c')<100,'off-centre scrolling reaches c without flying past it');
    focus('d');await until(()=>vm.runInContext('dirty===false',context));
    const beforeD=clearance('d');
    wheel(-100000);await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(clearance('d')>beforeD*.64&&clearance('d')<beforeD*.92,'one wheel packet approaches d gradually');
    for(let i=0;i<65;i++)wheel(-800);
    await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(clearance('d')>0&&clearance('d')<.01,'zoom stops at d surface without overshooting it');
    const nearD=[...window.__proxima.systemEye],radius=clearance('d');
    const projectD=()=>vm.runInContext(`(()=>{renderer.setup();const p=renderer.systemOrbitCentre();return renderer.project(p).slice(0,2);})()`,context);
    const screenD=projectD();
    const drag=(name,x,y)=>get('scene').listeners[name]({button:2,pointerId:1,clientX:x,clientY:y,preventDefault(){}});
    drag('pointerdown',400,255);
    for(const [x,y] of [[425,270],[445,300],[385,270],[430,265]])drag('pointermove',x,y);
    drag('pointerup',430,265);
    await until(()=>vm.runInContext('dirty===false',context));
    assert.ok(clearance('d')>0,'orbit remains outside the planet');
    assert.ok(Math.abs(clearance('d')-radius)<1e-7,'orbit keeps a fixed distance from the planet');
    assert.ok(Math.hypot(...window.__proxima.systemEye.map((v,i)=>v-nearD[i]))>100,'drag travels around the planet even at close range');
    assert.ok(projectD().every((v,i)=>Math.abs(v-screenD[i])<1e-7),'the selected planet keeps its framing');

    focus('b');await until(()=>vm.runInContext('dirty===false',context));
    vm.runInContext(`(()=>{
      const {p,normal}=systemFocusPoints(data).settlement,forward=mul(normal,-1);
      const eye=window.__proxima.systemEye,desiredEye=add(p,mul(normal,400));
      const localEye=add(renderer.eye,mul(sub(desiredEye,eye),1000/renderer.systemKm));
      const yaw=Math.atan2(normal[2],normal[0]),pitch=Math.asin(normal[1]);
      Object.assign(renderer.camera,{yaw,pitch,roll:0,target:add(localEye,mul(forward,renderer.camera.distance))});
      markDirty();
    })()`,context);
    await until(()=>vm.runInContext('dirty===false',context));
    for(let i=0;i<10&&window.__proxima.state.mode==='system';i++){
      wheel(-500);await until(()=>vm.runInContext('dirty===false',context));
    }
    assert.equal(window.__proxima.state.mode,'settlement','zooming toward Settlement enters Surface without a prior ascent');
    changeMode('system');await until(()=>window.__proxima.state.mode==='system');
    focus('c');await until(()=>vm.runInContext('dirty===false',context));
    const yaw=vm.runInContext('renderer.camera.yaw += 0.15',context);
    get('scene').listeners.click({button:0,clientX:400,clientY:255});
    assert.equal(vm.runInContext('renderer.camera.yaw',context),yaw);
    const originalEye=window.__proxima.systemEye;
    const canvas=get('scene');
    const pointer=(name,clientX,clientY)=>canvas.listeners[name]({button:0,pointerId:1,clientX,clientY,preventDefault(){}});
    pointer('pointerdown',360,240);pointer('pointermove',690,175);pointer('pointerup',690,175);
    await until(()=>Math.hypot(...window.__proxima.systemEye.map((v,i)=>v-originalEye[i]))>1000);
    const savedEye=[...window.__proxima.systemEye];
    modes.find(button=>button.dataset.mode==='settlement').onclick();
    modes.find(button=>button.dataset.mode==='system').onclick();
    await until(()=>window.__proxima.systemEye!==originalEye&&vm.runInContext('dirty',context)===false);
    assert.ok(window.__proxima.systemEye.every((v,i)=>Math.abs(v-savedEye[i])<1e-5));
    modes.find(button=>button.dataset.mode==='cruise').onclick();
    for(const year of [20.5,39.2]){
      vm.runInContext(`setYear(${year})`,context);
      assert.equal(get('spin').disabled,true);assert.equal(get('spin-label').textContent,'Spin locked');
      assert.equal(get('room-select').disabled,false);
      get('room-select').value='cabin-1';await get('room-select').onchange();
      assert.equal(vm.runInContext('renderer.insideView?.gravity.type',context),'linear');
      get('exit-room').onclick();
    }
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
  assert.equal(response.error,undefined);assert.ok(response.scene.meshCount>1000);assert.ok(response.scene.gpuData.streams[0].byteLength>1000);
});
