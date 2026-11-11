import {createRoverState,stepRover,roverPoint,add,sub,mul,dot,cross,norm,spinPoint,spinSign,settlementTerrain,SETTLEMENT_CENTRE} from './model.js';
import {GPUScene,deckGroup} from './gpu.js';
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))yes=!yes;}return yes;}
export class Renderer{
  constructor(canvas,onChange){this.canvas=canvas;const gl=canvas.getContext('webgl2',{antialias:true,alpha:false})||canvas.getContext('webgl',{antialias:true,alpha:false});if(gl){try{this.gpu=new GPUScene(gl);}catch(error){this.fallbackReason=error.message;const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;this.canvas=canvas;}}if(this.gpu){this.overlay=canvas.ownerDocument.createElement('canvas');this.overlay.className='scene-overlay';this.overlay.setAttribute('aria-hidden','true');canvas.parentElement.append(this.overlay);this.ctx=this.overlay.getContext('2d');}else this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas rendering is unavailable in this browser.');this.camera={yaw:1.08,pitch:.42,distance:620,target:[150,0,5]};this.hits=[];this.softwareCache=new WeakMap();this.softwarePalettes=new Map();this.onChange=onChange;this.pointer=null;this.moved=false;this.roverPose=createRoverState();
    canvas.addEventListener('keyup',e=>this.walkKeys?.delete(e.key.toLowerCase()));
    canvas.addEventListener('blur',()=>{this.walkKeys?.clear();this.roverPose.parked=true;});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;e.preventDefault();canvas.focus?.({preventScroll:true});const rect=canvas.getBoundingClientRect?.()??{left:0,top:0};const hit=this.gpu?.pickHit(e.clientX-rect.left,e.clientY-rect.top,this);const depth=hit?dot(sub(hit.point,this.eye),this.forward):this.hitDepth(e.clientX-rect.left,e.clientY-rect.top)??this.camera.distance;this.pointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,button:e.button,scale:depth/this.focal,right:[...this.right],up:[...this.up],anchor:hit?.point??add(this.eye,add(mul(this.forward,depth),add(mul(this.right,(e.clientX-rect.left-this.width/2)*depth/this.focal),mul(this.up,-(e.clientY-rect.top-this.height*.51)*depth/this.focal))))};this.moved=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!this.pointer)return;if(this.insideView){const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;this.insideView.yaw-=dx*.004;this.insideView.pitch=Math.max(-1.45,Math.min(1.45,this.insideView.pitch+dy*.004));this.pointer.x=e.clientX;this.pointer.y=e.clientY;this.moved=true;onChange();return;}const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;if(Math.hypot(e.clientX-this.pointer.startX,e.clientY-this.pointer.startY)>3)this.moved=true;if(this.pointer.button===0){this.camera.target=add(this.camera.target,add(mul(this.pointer.right,-dx*this.pointer.scale),mul(this.pointer.up,dy*this.pointer.scale)));if(this.groundClamp!=null)this.setup();}else{const before=this.project(this.pointer.anchor);this.camera.yaw+=dx*.007;this.camera.pitch=Math.max(-1.4,Math.min(1.4,this.camera.pitch-dy*.007));this.setup();const after=this.project(this.pointer.anchor);if(before&&after){this.camera.target=add(this.camera.target,add(mul(this.right,(after[0]-before[0])*after[2]/this.focal),mul(this.up,-(after[1]-before[1])*after[2]/this.focal)));}}this.pointer.x=e.clientX;this.pointer.y=e.clientY;onChange();});
    canvas.addEventListener('pointerup',()=>{this.pointer=null;});canvas.addEventListener('pointercancel',()=>{this.pointer=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();if(this.insideView)return;this.setup();const rect=canvas.getBoundingClientRect?.()??{left:0,top:0},x=(e.clientX??rect.left+this.width/2)-rect.left,y=(e.clientY??rect.top+this.height*.51)-rect.top;const hit=this.gpu?.pickHit(x,y,this),depth=hit?dot(sub(hit.point,this.eye),this.forward):this.hitDepth(x,y);if(e.deltaY<0&&Number.isFinite(depth)&&depth>.05){this.camera.target=add(this.eye,mul(this.forward,depth));this.camera.distance=depth;}const distance=this.camera.distance,next=Math.max(.05,Math.min(this.groundClamp!=null?1200:3000,distance*Math.exp(Math.max(-2,Math.min(2,e.deltaY*.001))))),travel=Math.max(0,distance-next);this.camera.target=add(this.camera.target,add(mul(this.right,(x-this.width/2)/this.focal*travel),mul(this.up,-(y-this.height*.51)/this.focal*travel)));this.camera.distance=next;onChange();},{passive:false});
    canvas.addEventListener('keydown',e=>{if(this.insideView&&('wasdeq '.includes(e.key.toLowerCase())&&e.key.length===1||e.key==='Shift')){e.preventDefault();this.walkKeys.add(e.key.toLowerCase());onChange();return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')this.camera.yaw+=.1;if(e.key==='ArrowRight')this.camera.yaw-=.1;if(e.key==='ArrowUp')this.camera.pitch=Math.min(1.4,this.camera.pitch+.1);if(e.key==='ArrowDown')this.camera.pitch=Math.max(-1.4,this.camera.pitch-.1);if(e.key==='+'||e.key==='=')this.camera.distance=Math.max(.05,this.camera.distance*.9);if(e.key==='-')this.camera.distance=Math.min(3000,this.camera.distance/ .9);onChange();}});
  }
  enterInside(room,meshes=[]){this.savedCamera=structuredClone(this.camera);this.setColliders(meshes);this.walkKeys=new Set();const g=room.gravity;this.insideView={eye:[...room.eye],up:norm(room.up),forward:norm(room.forward),yaw:room.yaw??0,pitch:0,height:dot(room.eye,norm(room.up)),gravity:g,habitat:g?.habitat??'A',frame:g?.type==='float'?null:g?g.habitat??'A':null,label:room.label,driver:!!room.driver,surfaceMap:room.surfaceMap,mode:g?.type==='float'?'float':'walk',deck:g?.deck??0,radius:g?.radius,level:g?.level??null,ladder:null};if(!g)this.prepareWalkingWalls();this.canvas.focus?.();this.onChange();}
  setColliders(meshes){this.colliders=meshes.filter(m=>['inflatable-envelope','hull-boundary','porthole-glass','farm-pressure-envelope','rover-pressure-hull','rover-window','ring-window-glass'].includes(m.role)).map(m=>({...m,lo:[0,1,2].map(i=>Math.min(...m.vertices.map(v=>v[i]))),hi:[0,1,2].map(i=>Math.max(...m.vertices.map(v=>v[i])))}));if(this.insideView&&!this.insideView.gravity)this.prepareWalkingWalls();}
  leaveInside(){if(!this.insideView)return;this.insideView=null;this.roverPose.parked=true;this.walkKeys?.clear();this.camera=this.savedCamera;this.onChange();}
  // Walking data for the habitat the walker is currently in (both habitats are reachable through the hubs).
  hab(){const v=this.insideView,g=v.gravity;return g.world?.habitats?.[v.habitat]??g;}
  // The walker lives in its habitat's rotating frame; spin is applied only when converting to the camera.
  spinFrame(p,frame,sign,vector=false){const st=this.spinState;if(!frame||!st?.angle||!st.centres)return [...p];return spinPoint(p,'hab'+frame,sign*st.angle,st.centres,vector,st.flat);}
  walk(dt){if(this.insideView?.driver||Math.abs(this.roverPose.speed)>.001){const keys=this.insideView?.driver?this.walkKeys:new Set();if(keys.has('w')||keys.has('s'))this.roverPose.parked=false;return stepRover(this.roverPose,keys,dt,this.driveObstacles);}
    if(!this.insideView||!this.walkKeys?.size)return false;this.setup();const v=this.insideView,k=this.walkKeys;
    if(v.gravity?.type==='linear'){if(this.climbLinear(dt))return true;}
    else if(v.gravity){if(v.mode==='float'){this.float(dt);return true;}if(this.climb(dt))return true;}
    const forward=norm(sub(this.localForward,mul(v.up,dot(this.localForward,v.up))));let delta=add(mul(forward,Number(k.has('w'))-Number(k.has('s'))),mul(this.localRight,Number(k.has('d'))-Number(k.has('a'))));
    if(Math.hypot(...delta)>0){const movement=mul(norm(delta),dt*(k.has('shift')?6:3.6)),steps=Math.max(1,Math.ceil(Math.hypot(...movement)/.1)),step=mul(movement,1/steps);for(let i=0;i<steps;i++){if(v.gravity?.type==='linear'){if(!this.walkLinear(step))break;}else if(v.gravity){if(!this.walkRadial(step))break;}else{if(this.blocked(v.eye,step,v.up))break;v.eye=add(v.eye,step);v.eye=sub(v.eye,mul(v.up,dot(v.eye,v.up)-v.height));}}}return true;}
  // Angle of a point about the habitat axis, measured as in the model (basis x, side = axis × x).
  axisAngle(p){const axis=this.hab().axis,basis=[1,0,0],side=cross(axis,basis);return Math.atan2(dot(p,side),dot(p,basis));}
  radialPoint(angle,radius,z){const h=this.hab(),basis=[1,0,0],side=cross(h.axis,basis),radial=add(mul(basis,Math.cos(angle)),mul(side,Math.sin(angle)));return {radial,point:add(h.centre,add(mul(radial,radius),mul(h.axis,z)))};}
  placeRadial(angle,radius,z){const v=this.insideView,{radial,point}=this.radialPoint(angle,radius,z);v.eye=point;v.up=mul(radial,-1);v.forward=mul(norm(cross(this.hab().axis,radial)),-1);}
  walkRadial(step){
    const v=this.insideView,g=v.gravity,h=this.hab(),axis=h.axis,offset=sub(v.eye,h.centre),z=dot(offset,axis),next=add(offset,step),nextZ=dot(next,axis),radius=v.radius??g.radius,walls=h.decks?.[v.deck]?.walls??g.walls??[];
    const lock=v.deck===0&&(this.airlocks??[]).find(l=>l.id===(v.habitat==='B'?'habB':'habA')&&Math.abs(Math.atan2(Math.sin(this.axisAngle(next)-l.angle),Math.cos(this.axisAngle(next)-l.angle)))*radius<.5);
    const limit=lock?(lock.outerOpen?3.2:2.0):g.axialMax;
    if(nextZ<g.axialMin||nextZ>limit)return false;
    if(lock&&lock.outerOpen&&Math.min(z,nextZ)<-1.6&&Math.max(z,nextZ)>-1.6)return false;
    // Bulkheads and cabin partitions are angular/axial bands; doorways are the gaps between them.
    const inWall=(a,z)=>walls.some(w=>z>w.z0-.15&&z<w.z1+.15&&(Math.abs(Math.atan2(Math.sin(a-w.angle),Math.cos(a-w.angle)))-w.half)*radius<.15);
    const b=this.axisAngle(next);
    if(inWall(b,nextZ)&&!inWall(this.axisAngle(offset),z))return false;
    this.placeRadial(b,radius,nextZ);
    return true;
  }
  // E climbs toward the hub, Q climbs outward. Every shaft runs through all decks, so both work at any ladder.
  climb(dt){
    const v=this.insideView,h=this.hab(),k=this.walkKeys,dir=Number(k.has('q'))-Number(k.has('e'));
    // Space steps off the ladder at whichever end is nearer: a deck, or floating in the hub.
    if(k.has(' ')&&v.ladder){
      k.delete(' ');const l=v.ladder,bottom=h.decks[l.from].radius,top=l.to===null?l.topRadius:h.decks[l.to].radius,up=v.radius-top<bottom-v.radius;
      v.radius=up?top:bottom;this.placeRadial(l.angle,v.radius,l.z);v.ladder=null;
      if(up&&l.to===null)v.mode='float';else{v.deck=up?l.to:l.from;v.mode='walk';}
      return true;
    }
    if(!h.decks||!v.ladder&&!dir)return false;
    if(!v.ladder){
      const offset=sub(v.eye,h.centre),z=dot(offset,h.axis),a=this.axisAngle(offset);
      const ladder=(h.ladders??[]).find(l=>(dir<0?l.from===v.deck:l.to===v.deck)&&Math.abs(z-l.z)<.8&&Math.abs(Math.atan2(Math.sin(a-l.angle),Math.cos(a-l.angle)))*v.radius<.9);
      if(!ladder)return false;
      v.ladder=ladder;v.deck=null;v.mode='ladder';
    }
    const l=v.ladder,bottom=h.decks[l.from].radius,top=l.to===null?l.topRadius:h.decks[l.to].radius;
    v.radius=Math.min(bottom,Math.max(top,v.radius+dir*dt*1.6));
    this.placeRadial(l.angle,v.radius,l.z);
    if(dir<0&&v.radius<=top){v.ladder=null;if(l.to===null)v.mode='float';else{v.deck=l.to;v.mode='walk';}}
    else if(dir>0&&v.radius>=bottom){v.deck=l.from;v.ladder=null;v.mode='walk';}
    return true;
  }
  // Free float in the hubs and the transfer corridor: WASD along the view, E/Q along the view's up.
  float(dt){
    const v=this.insideView,k=this.walkKeys,world=v.gravity.world;
    if(k.has('q')&&v.frame){
      const l=(this.hab().ladders??[]).find(l=>l.to===null&&Math.hypot(...sub(v.eye,this.radialPoint(l.angle,l.topRadius,l.z).point))<1.1);
      if(l){v.mode='ladder';v.ladder=l;v.radius=l.topRadius;v.deck=null;this.placeRadial(l.angle,v.radius,l.z);return;}
    }
    const key=c=>Number(k.has(c)),move=add(add(mul(this.localForward,key('w')-key('s')),mul(this.localRight,key('d')-key('a'))),mul(this.localUp,key('e')-key('q')));
    if(!world||!Math.hypot(...move))return;
    const total=mul(norm(move),dt*(k.has('shift')?4:2)),steps=Math.max(1,Math.ceil(Math.hypot(...total)/.1)),step=mul(total,1/steps);
    // Zones are flat-ended cylinders, like the tubes themselves; they overlap where tubes join.
    const inside=p=>world.segments.some(({a,b,r})=>{const ab=sub(b,a),t=dot(sub(p,a),ab)/dot(ab,ab);return t>=0&&t<=1&&Math.hypot(...sub(p,add(a,mul(ab,t))))<=r;});
    // Pushing into a tube mouth slides the walker toward its centreline instead of stopping dead.
    const funnel=(from,p)=>{for(const {a,b,r} of world.segments){const ab=sub(b,a),t=dot(sub(p,a),ab)/dot(ab,ab);if(t<0||t>1)continue;const c=sub(add(a,mul(ab,t)),p),d=Math.hypot(...c);if(d>r&&d<r+3){const q=add(from,mul(c,Math.min(.1,d-r+.01)/d));if(inside(q))return q;}}return null;};
    for(let i=0;i<steps;i++){let next=add(v.eye,step);if(!inside(next))next=funnel(v.eye,next);if(!next)break;v.eye=next;this.floatFrame();}
  }
  // Above a hub's top the walker leaves the rotating hub for the static corridor, and vice versa, without a visible jump.
  floatFrame(){
    const v=this.insideView,world=v.gravity.world,convert=(frame,sign)=>{v.eye=this.spinFrame(v.eye,frame,sign);v.forward=this.spinFrame(v.forward,frame,sign,true);v.up=this.spinFrame(v.up,frame,sign,true);};
    if(v.frame){const h=this.hab();if(dot(sub(v.eye,h.centre),h.axis)>h.hubTop){convert(v.frame,1);v.frame=null;}return;}
    for(const [key,h] of Object.entries(world.habitats)){const off=sub(v.eye,h.centre),z=dot(off,h.axis);if(z<h.hubTop&&Math.hypot(...sub(off,mul(h.axis,z)))<h.hubRadius+.5){v.habitat=key;v.frame=key;convert(key,-1);return;}}
  }
  roomName(){return this.roomLocation()?.text??'';}
  // Where the walker is on the surface: greenhouse hall, rover, corridor, or a habitat ring room or cabin.
  surfaceLocation(m,[x,,z]){
    const inside=a=>a.x0<=x&&x<=a.x1&&a.z0<=z&&z<=a.z1,wrap=a=>Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
    for(const h of m.halls)if(inside(h))return {text:'Proxima b · '+h.name,id:h.id};
    if(inside(m.rover))return {text:'Proxima b · Crewed rover cabin',id:'rover'};
    for(const c of m.corridors)if(inside(c))return {text:'Proxima b · '+c.name,id:null};
    for(const hab of m.habitats){const dx=x-hab.centre[0],dz=z-hab.centre[1],r=Math.hypot(dx,dz),a=(Math.atan2(dz,dx)+2*Math.PI)%(2*Math.PI),ring=hab.rings.find(k=>r>=k.r0-.15&&r<=k.r1+.15);if(!ring)continue;
      const cabin=ring.deck===0?hab.cabins.find(c=>wrap(a-c.angle)<c.half&&r>=c.r0&&r<=c.r1):null,place=cabin??hab.rooms.find(q=>q.deck===ring.deck&&a>=q.a0&&a<q.a1);
      return {text:`Proxima b · Habitat ${hab.name} · Ring ${ring.deck+1} · ${place?.name??''}`,id:place?.id??null};}
    return null;
  }
  roomLocation(){
    const v=this.insideView,g=v?.gravity;if(!v)return null;if(v.driver)return {id:'rover',text:`Rover / ${(Math.abs(this.roverPose.speed)*3.6).toFixed(1)} km/h / W accelerate / S brake-reverse / A D steer / Space brake`};if(!g)return (v.surfaceMap&&this.surfaceLocation(v.surfaceMap,v.eye))||(v.label?{text:'Proxima b · '+v.label,id:null}:null);
    if(g.type==='linear')return {id:g.roomId,text:`Habitat ${g.habitat} · Burn ${g.g.toFixed(1)} g · ${g.roomName} · ${v.ladder?`Ladder · level ${v.ladder.from+1} → ${v.ladder.to+1}`:`Level ${v.level+1} of ${g.levels.length}`}`};
    if(v.mode==='float'){
      const segment=!v.frame&&v.gravity.world?.segments.find(s=>{const ab=sub(s.b,s.a),t=dot(sub(v.eye,s.a),ab)/dot(ab,ab);return s.name&&t>=0&&t<=1&&Math.hypot(...sub(v.eye,add(s.a,mul(ab,t))))<s.r;});
      return {id:segment?.id??null,text:v.frame?`Habitat ${v.habitat} \u00b7 Hub \u00b7 near zero g`:(segment?.name??'Transfer corridor')+' \u00b7 zero g'};
    }
    const h=this.hab();if(!h.decks)return null;
    if(v.ladder)return {id:null,text:`Habitat ${v.habitat} · Ladder · Deck ${v.ladder.from+1} → ${v.ladder.to===null?'hub':'Deck '+(v.ladder.to+1)}`};
    const d=h.decks[v.deck];if(!d)return null;
    const offset=sub(v.eye,h.centre),z=dot(offset,h.axis),a=(this.axisAngle(offset)+2*Math.PI)%(2*Math.PI);
    const place=d.cabins.find(c=>Math.abs(Math.atan2(Math.sin(a-c.angle),Math.cos(a-c.angle)))<c.half&&z<c.front)??d.rooms.find(room=>a>=room.a0&&a<room.a1);
    return {id:place?.id??null,text:`Habitat ${v.habitat} · Deck ${v.deck+1} (${d.gravity.toFixed(2)} g) · ${place?.name??''}`};
  }
  // Thrust gravity (engine mode): walk on the current level's floor; ladders, vertical or inclined, join the levels.
  linearPoint(s,u,w){const F=this.insideView.gravity.frame;return add(F.origin,add(mul(F.down,s),add(mul(F.u,u),mul(F.w,w))));}
  linearCoords(p){const F=this.insideView.gravity.frame,o=sub(p,F.origin);return [dot(o,F.down),dot(o,F.u),dot(o,F.w)];}
  walkLinear(step){const v=this.insideView,g=v.gravity,L=g.levels[v.level];if(!L)return false;const [,u,w]=this.linearCoords(add(v.eye,step));
    if(u<L.u0+.2||u>L.u1-.2||w<g.wMin||w>g.wMax)return false;v.eye=this.linearPoint(L.f-1.29,u,w);return true;}
  placeLadder(l,t){const g=this.insideView.gravity,a=g.levels[l.from],b=g.levels[l.to];this.insideView.eye=this.linearPoint(a.f+(b.f-a.f)*t-1.29,l.uA+(l.uB-l.uA)*t,l.w-.45);}
  climbLinear(dt){
    const v=this.insideView,g=v.gravity,k=this.walkKeys,dir=Number(k.has('q'))-Number(k.has('e'));
    if(k.has(' ')&&v.ladder){k.delete(' ');const l=v.ladder,top=v.progress>.5;v.progress=top?1:0;this.placeLadder(l,v.progress);v.level=top?l.to:l.from;v.ladder=null;v.mode='walk';return true;}
    if(!v.ladder&&!dir)return false;
    if(!v.ladder){const [,u,w]=this.linearCoords(v.eye),near=(uu,ww)=>Math.abs(u-uu)<.9&&Math.abs(w-(ww-.45))<.9;
      const l=(g.ladders??[]).find(l=>dir<0?l.from===v.level&&near(l.uA,l.w):l.to===v.level&&near(l.uB,l.w));if(!l)return false;v.ladder=l;v.progress=dir<0?0:1;v.mode='ladder';v.level=null;}
    const l=v.ladder,len=Math.hypot(g.levels[l.from].f-g.levels[l.to].f,l.uB-l.uA)||1;
    v.progress=Math.min(1,Math.max(0,v.progress-dir*dt*1.6/len));this.placeLadder(l,v.progress);
    if(dir<0&&v.progress>=1){v.level=l.to;v.ladder=null;v.mode='walk';}else if(dir>0&&v.progress<=0){v.level=l.from;v.ladder=null;v.mode='walk';}
    return true;
  }
  prepareWalkingWalls(){
    const v=this.insideView;this.wallU=norm(v.forward);this.wallV=norm(cross(this.wallU,v.up));this.walkingWalls=[];
    for(const m of this.colliders)for(const face of m.faces){
      const crossings=[];
      for(let i=0;i<face.length;i++){
        const a=m.vertices[face[i]],b=m.vertices[face[(i+1)%face.length]],da=dot(a,v.up)-v.height,db=dot(b,v.up)-v.height;
        if((da>0)===(db>0)||Math.abs(da-db)<1e-9)continue;
        const p=add(a,mul(sub(b,a),da/(da-db)));crossings.push([dot(p,this.wallU),dot(p,this.wallV)]);
      }
      if(crossings.length===2)this.walkingWalls.push([...crossings[0],...crossings[1]]);
    }
  }
  blocked(eye,step){
    const x=dot(eye,this.wallU),y=dot(eye,this.wallV),length=Math.hypot(...step),dx=dot(step,this.wallU)/length,dy=dot(step,this.wallV)/length;
    for(const [ax,ay,bx,by] of this.walkingWalls){
      const sx=bx-ax,sy=by-ay,den=dx*sy-dy*sx;if(Math.abs(den)<1e-9)continue;
      const qx=ax-x,qy=ay-y,t=(qx*sy-qy*sx)/den,u=(qx*dy-qy*dx)/den;
      if(t>=0&&t<=length+.25&&u>=0&&u<=1)return true;
    }
    return false;
  }
  resize(){const rect=this.canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);this.width=rect.width;this.height=rect.height;this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=Math.round(rect.height*ratio);if(this.overlay){this.overlay.width=this.canvas.width;this.overlay.height=this.canvas.height;}this.ctx.setTransform(ratio,0,0,ratio,0,0);}
  setup(){if(this.insideView){const v=this.insideView,r=norm(cross(v.forward,v.up)),flat=add(mul(v.forward,Math.cos(v.yaw)),mul(r,Math.sin(v.yaw)));this.localForward=add(mul(flat,Math.cos(v.pitch)),mul(v.up,Math.sin(v.pitch)));this.localRight=norm(cross(this.localForward,v.up));this.localUp=cross(this.localRight,this.localForward);this.eye=v.driver?roverPoint(v.eye,this.roverPose):this.spinFrame(v.eye,v.frame,1);this.forward=v.driver?roverPoint(this.localForward,this.roverPose,true):this.spinFrame(this.localForward,v.frame,1,true);this.right=v.driver?roverPoint(this.localRight,this.roverPose,true):this.spinFrame(this.localRight,v.frame,1,true);this.up=v.driver?roverPoint(this.localUp,this.roverPose,true):this.spinFrame(this.localUp,v.frame,1,true);this.focal=Math.min(this.width,this.height)*.8;return;}const c=this.camera;this.eye=add(c.target,[Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance]);if(this.groundClamp!=null){const [sx,sz]=SETTLEMENT_CENTRE,off=[c.target[0]-sx,c.target[2]-sz],r=Math.hypot(...off);if(r>700){c.target[0]=sx+off[0]*700/r;c.target[2]=sz+off[1]*700/r;}c.distance=Math.min(c.distance,1200);c.target[1]=Math.max(settlementTerrain(c.target[0],c.target[2]),c.target[1]);
      const place=()=>{this.eye=add(c.target,[Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance]);};place();
      const clearance=settlementTerrain(this.eye[0],this.eye[2])+this.groundClamp-this.eye[1];if(clearance>0){c.target[1]+=clearance;place();}}this.forward=norm(sub(c.target,this.eye));this.right=norm(cross(this.forward,[0,1,0]));this.up=cross(this.right,this.forward);this.focal=Math.min(this.width,this.height)*1.45;}
  project(p){const q=sub(p,this.eye),z=dot(q,this.forward);if(z<.002)return null;return [this.width/2+dot(q,this.right)*this.focal/z,this.height*.51-dot(q,this.up)*this.focal/z,z];}
  line(a,b,color,width=1,dashed=false){const p=this.project(a),q=this.project(b);if(!p||!q)return;const ctx=this.ctx;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[4,4]:[]);ctx.stroke();ctx.setLineDash([]);}
  render(scene,state){const ctx=this.ctx,w=this.width,h=this.height;this.airlocks=scene.airlocks??[];this.driveObstacles=scene.driveObstacles??[];this.spinState={angle:state.spinAngle??0,centres:scene.spinCentres,flat:scene.flat};this.groundClamp=state.mode==='settlement'?1.5:null;this.setup();ctx.clearRect(0,0,w,h);ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    if(this.gpu){ctx.clearRect(0,0,w,h);const result=this.gpu.draw(scene,state,this);this.hits=result.hits;this.annotations(scene,state);return result.faceCount;}
    const ground=state.mode==='cruise'?-40:0;
    if(!this.insideView&&scene.grid)for(let x=-300;x<=300;x+=25)this.line([x,ground,-220],[x,ground,220],'#223840',.6);
    if(!this.insideView&&scene.grid)for(let z=-225;z<=225;z+=25)this.line([-300,ground,z],[300,ground,z],'#223840',.6);
    const light=norm([-.25,.7,.65]),faces=[],angle=state.spinAngle??0,spinCentres=scene.spinCentres??[0,0];let visibleMeshes=0;
    for(const m of scene.meshes){
      if((state.showRadiators===false&&m.id==='radiators')||(state.deck!==undefined&&state.deck!=='all'&&deckGroup(m.id)>=0&&deckGroup(m.id)!==+state.deck))continue;
      let info=this.softwareCache.get(m);
      if(!info){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of m.vertices)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],p[i]);hi[i]=Math.max(hi[i],p[i]);}const centre=lo.map((v,i)=>(v+hi[i])/2);let palette=this.softwarePalettes.get(m.color);if(!palette){const rgb=m.color.slice(1).match(/../g).map(x=>parseInt(x,16));palette=Array.from({length:66},(_,i)=>`rgb(${rgb.map((v,k)=>Math.min(255,Math.round(v*(i%33)/32+(i>=33?[24,13,0][k]:0)))).join(',')})`);this.softwarePalettes.set(m.color,palette);}info={centre,radius:Math.hypot(...hi.map((v,i)=>(v-lo[i])/2)),faces:null,palette};this.softwareCache.set(m,info);}
      const sign=scene.spinCentres?spinSign(m.id):0,cx=spinCentres[sign<0?0:1],c=Math.cos(angle*sign),sn=Math.sin(angle*sign);
      const pose=m.id==='rover'&&state.mode==='settlement'&&state.rover?p=>roverPoint(p,state.rover):sign&&angle?p=>spinPoint(p,m.id,angle,spinCentres,false,scene.flat):p=>p;
      const centre=pose(info.centre),depth=dot(sub(centre,this.eye),this.forward),radius=info.radius;
      if(depth+radius<.002)continue;
      if(depth>radius){const q=this.project(centre),screenRadius=radius*this.focal/(depth-radius);if(!q)continue;if((screenRadius<.2&&m.id!=='sky')||q[0]+screenRadius<0||q[0]-screenRadius>w||q[1]+screenRadius<0||q[1]-screenRadius>h)continue;}
      visibleMeshes++;
      if(!info.faces)info.faces=m.faces.map(indices=>({indices,normal:norm(cross(sub(m.vertices[indices[1]],m.vertices[indices[0]]),sub(m.vertices[indices[2]],m.vertices[indices[0]])))}));
      const p=m.vertices.map(v=>this.project(m.material===-2?add(v,this.eye):pose(v))),localLight=m.id==='rover'&&state.mode==='settlement'&&state.rover?roverPoint(light,state.rover,true,true):sign&&angle?[light[0]*c+light[1]*sn,-light[0]*sn+light[1]*c,light[2]]:light;
      const selected=false;
      for(const face of info.faces){const indices=face.indices;let points;
        if(indices.some(i=>!p[i])){
          const polygon=indices.map(i=>pose(m.vertices[i])),clipped=[];
          for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=dot(sub(a,this.eye),this.forward),db=dot(sub(b,this.eye),this.forward);if(da>=.003)clipped.push(a);if((da>=.003)!==(db>=.003))clipped.push(add(a,mul(sub(b,a),(.003-da)/(db-da))));}
          if(clipped.length<3)continue;points=clipped.map(q=>this.project(q));if(points.some(q=>!q))continue;
        }else points=indices.map(i=>p[i]);
        if(points.every(q=>q[0]<-5)||points.every(q=>q[0]>w+5)||points.every(q=>q[1]<-5)||points.every(q=>q[1]>h+5))continue;
        const a=points[0],b=points[1],cc=points[2];if(Math.abs((b[0]-a[0])*(cc[1]-a[1])-(b[1]-a[1])*(cc[0]-a[0]))<.3)continue;
        faces.push({m,id:m.id,points,selected,palette:info.palette,depth:points.reduce((sum,q)=>sum+q[2],0)/points.length,lit:.48+.45*Math.abs(dot(face.normal,localLight))});
      }
    }
    faces.sort((a,b)=>b.depth-a.depth);this.hits=[];let alpha=1;ctx.globalAlpha=1;
    for(const f of faces){const selected=f.selected;ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(alpha!==f.m.opacity){alpha=f.m.opacity;ctx.globalAlpha=alpha;}ctx.fillStyle=f.palette[(selected?33:0)+Math.round(f.lit*32)];ctx.fill();
      if(f.m.opacity>.2)this.hits.push(f);
    }
    ctx.globalAlpha=1;
    this.softwareStats={sourceMeshes:scene.meshes.length,visibleMeshes,drawnFaces:faces.length};
    if(!this.insideView)for(let l of scene.lines)if(state.showRadiators!==false||l.id!=='radiators')this.line(angle&&scene.spinCentres?spinPoint(l.a,l.id,angle,spinCentres,false,scene.flat):l.a,angle&&scene.spinCentres?spinPoint(l.b,l.id,angle,spinCentres,false,scene.flat):l.b,l.color,l.width,l.dashed);
    this.annotations(scene,state);return faces.length;
  }
  annotations(scene,state){if(this.insideView||state.showLabels===false)return;const ctx=this.ctx;ctx.font='10px monospace';ctx.textAlign='center';for(let l of scene.labels){const point=l.id&&scene.spinCentres?spinPoint(l.p,l.id,state.spinAngle??0,scene.spinCentres,false,scene.flat):l.p;if(l.closeOnly&&state.deck!==undefined&&state.deck!=='all'&&deckGroup(l.id)!==+state.deck)continue;if(l.closeOnly&&Math.hypot(...sub(point,this.eye))>45&&state.selected!==l.id)continue;const p=this.project(point);if(!p)continue;ctx.fillStyle='#a3b9b6';ctx.fillText(l.text,p[0],p[1]);}
    for(let d of state.dimensions?scene.dimensions:[]){this.line(d.a,d.b,'#97aaa0',.7,true);const a=this.project(d.a),b=this.project(d.b);if(!a||!b)continue;ctx.fillStyle='#c4cdbb';const text=d.text;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];ctx.fillStyle='#11212a';const tw=ctx.measureText(text).width;ctx.fillRect(mid[0]-tw/2-5,mid[1]-12,tw+10,14);ctx.fillStyle='#bac8b9';ctx.fillText(text,mid[0],mid[1]-2);}
    ctx.textAlign='left';
  }
  hitDepth(x,y){for(let h=this.hits.length-1;h>=0;h--){const p=this.hits[h].points;if(!inside(x,y,p))continue;for(let i=1;i<p.length-1;i++){const [a,b,c]=[p[0],p[i],p[i+1]],den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-10)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;if(u>=-1e-8&&v>=-1e-8&&w>=-1e-8)return 1/(u/a[2]+v/b[2]+w/c[2]);}}return null;}
  pick(x,y){if(this.gpu)return this.gpu.pick(x,y,this);for(let i=this.hits.length-1;i>=0;i--)if(inside(x,y,this.hits[i].points))return this.hits[i].id;return null;}
  reset(mode){this.leaveInside();this.groundClamp=mode==='settlement'?1.5:null;this.camera=mode==='settlement'?{yaw:.85,pitch:.72,distance:520,target:[25,5,-5]}:{yaw:1.08,pitch:.42,distance:620,target:[150,0,5]};this.onChange();}
  view(name){if(name==='side'){this.camera.yaw=Math.PI/2;this.camera.pitch=.03;}if(name==='bow'){this.camera.yaw=Math.PI;this.camera.pitch=.01;}if(name==='top'){this.camera.yaw=Math.PI/2;this.camera.pitch=1.55;}this.onChange();}
}
