import {createRoverState,stepRover,roverPoint,add,sub,mul,dot,cross,norm,spinPoint,spinSign,faceNormal,settlementCameraFloor} from './model.js';
import {GPUScene,deckGroup,meshPickEntries,pickGeometry} from './gpu.js';
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))yes=!yes;}return yes;}
export class Renderer{
  constructor(canvas,onChange){this.canvas=canvas;const gl=canvas.getContext('webgl2',{antialias:true,alpha:false})||canvas.getContext('webgl',{antialias:true,alpha:false});if(gl){try{this.gpu=new GPUScene(gl);}catch(error){this.fallbackReason=error.message;const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;this.canvas=canvas;}}if(this.gpu){this.overlay=canvas.ownerDocument.createElement('canvas');this.overlay.className='scene-overlay';this.overlay.setAttribute('aria-hidden','true');canvas.parentElement.append(this.overlay);this.ctx=this.overlay.getContext('2d');}else this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas rendering is unavailable in this browser.');this.camera={yaw:1.08,pitch:.42,distance:620,target:[150,0,5]};this.hits=[];this.softwareCache=new WeakMap();this.softwarePalettes=new Map();this.onChange=onChange;this.pointer=null;this.moved=false;this.roverPose=createRoverState();
    canvas.addEventListener('keyup',e=>this.walkKeys?.delete(e.key.toLowerCase()));
    canvas.addEventListener('blur',()=>{this.endDrag();this.walkKeys?.clear();this.roverPose.parked=true;});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{
      if(this.pointer||(e.button!==0&&e.button!==2))return;
      e.preventDefault();canvas.focus?.({preventScroll:true});this.zoomSpeed=null;this.setup();
      this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,button:e.button};
      this.moved=false;canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      const p=this.pointer;
      if(!p||p.id!==e.pointerId)return;
      const dx=e.clientX-p.x,dy=e.clientY-p.y;
      if(!dx&&!dy)return;
      if(Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>3)this.moved=true;
      this.zoomSpeed=null;this.setup();
      const {left,top}=canvas.getBoundingClientRect?.()??{left:0,top:0};
      if(p.button===2){
        const planet=this.systemMode?this.systemOrbitCentre?.():null;
        if(planet)this.orbitAbout(planet,dx*.007,-dy*.007,true);
        else{
          const {ray,depth}=this.sampleCursor(e.clientX-left,e.clientY-top,false,true);
          const distance=this.systemMode
            ? depth!==null&&(!p.depth||depth<=p.depth*2)?depth:p.depth??0
            : depth??p.depth??(this.insideView?1:this.camera.distance);
          p.depth=distance;
          const anchor=add(this.eye,mul(ray,distance));
          if(this.insideView)this.orbitAbout(anchor,-dx*.004,dy*.004);
          else this.orbitAbout(anchor,dx*.007,-dy*.007);
        }
      }else if(this.insideView){
        const v=this.insideView;v.offsetX=(v.offsetX??0)+dx;v.offsetY=(v.offsetY??0)+dy;
      }else{
        // Pull the point beneath the previous pointer position to the new pixel.
        const {depth}=this.sampleCursor(p.x-left,p.y-top);
        p.depth=depth??p.depth??this.camera.distance;
        const scale=p.depth/this.focal;
        const shift=add(mul(this.right,-dx*scale),mul(this.up,dy*scale));
        const limit=this.systemMode?this.systemTravelLimit?.(this.eye,add(this.eye,shift))??1:1;
        this.camera.target=add(this.camera.target,mul(shift,limit));
      }
      p.x=e.clientX;p.y=e.clientY;onChange();
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']){
      canvas.addEventListener(name,e=>{if(this.pointer?.id===e.pointerId)this.endDrag();});
    }
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();this.setup();
      const {left,top}=canvas.getBoundingClientRect?.()??{left:0,top:0};
      const x=(e.clientX??left+this.width/2)-left,y=(e.clientY??top+this.height*.51)-top;
      const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?this.height:1);
      if(pixels)this.zoomAt(x,y,Math.exp(Math.max(-1.2,Math.min(1.2,pixels*.0015))));
    },{passive:false});
    canvas.addEventListener('keydown',e=>{if(this.insideView&&('wasdeq '.includes(e.key.toLowerCase())&&e.key.length===1||e.key==='Shift')){e.preventDefault();this.walkKeys.add(e.key.toLowerCase());onChange();return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();this.zoomSpeed=null;if(e.key==='ArrowLeft')this.camera.yaw+=.1;if(e.key==='ArrowRight')this.camera.yaw-=.1;if(e.key==='ArrowUp')this.camera.pitch+=.1;if(e.key==='ArrowDown')this.camera.pitch-=.1;if(['+','=','-'].includes(e.key)){this.setup();this.zoomAt(this.width/2,this.height*.51,e.key==='-'?1/.9:.9);return;}onChange();}});
  }
  endDrag(){const p=this.pointer;this.pointer=null;if(p&&this.canvas.hasPointerCapture?.(p.id))this.canvas.releasePointerCapture(p.id);}
  enterInside(room,meshes=[]){this.zoomSpeed=null;this.endDrag();this.savedCamera=structuredClone(this.camera);this.setColliders(meshes);this.walkKeys=new Set();const g=room.gravity;this.insideView={eye:[...room.eye],up:norm(room.up),forward:norm(room.forward),yaw:room.yaw??0,pitch:0,height:dot(room.eye,norm(room.up)),gravity:g,habitat:g?.habitat??'A',frame:g?.type==='float'?null:g?g.habitat??'A':null,label:room.label,driver:!!room.driver,surfaceMap:room.surfaceMap,mode:g?.type==='float'?'float':'walk',deck:g?.deck??0,radius:g?.radius,level:g?.level??null,ladder:null};if(!g)this.prepareWalkingWalls();this.canvas.focus?.();this.onChange();}
  setColliders(meshes){this.colliders=meshes.filter(m=>['inflatable-envelope','hull-boundary','porthole-glass','farm-pressure-envelope','rover-pressure-hull','rover-window','ring-window-glass','room-bulkhead','room-front','cabin-divider'].includes(m.role)).map(m=>({...m,lo:[0,1,2].map(i=>Math.min(...m.vertices.map(v=>v[i]))),hi:[0,1,2].map(i=>Math.max(...m.vertices.map(v=>v[i])))}));if(this.insideView&&!this.insideView.gravity)this.prepareWalkingWalls();}
  leaveInside(){if(!this.insideView)return;this.zoomSpeed=null;this.endDrag();this.insideView=null;this.roverPose.parked=true;this.walkKeys?.clear();this.camera=this.savedCamera;this.onChange();}
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
  // Angle of a point about the habitat axis, measured as in the model (basis = native disc x carried through the display turn, side = axis × basis).
  axisAngle(p){const h=this.hab(),axis=h.axis,basis=h.basis??[1,0,0],side=cross(axis,basis);return Math.atan2(dot(p,side),dot(p,basis));}
  radialPoint(angle,radius,z){const h=this.hab(),basis=h.basis??[1,0,0],side=cross(h.axis,basis),radial=add(mul(basis,Math.cos(angle)),mul(side,Math.sin(angle)));return {radial,point:add(h.centre,add(mul(radial,radius),mul(h.axis,z)))};}
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
    for(const hab of m.habitats){const dx=x-hab.centre[0],dz=z-hab.centre[1],r=Math.hypot(dx,dz),a=(Math.atan2(dz,dx)-(hab.turn??0)+2*Math.PI)%(2*Math.PI),ring=hab.rings.find(k=>r>=k.r0-.15&&r<=k.r1+.15);if(!ring)continue;
      const cabin=ring.deck===0?hab.cabins.find(c=>wrap(a-c.angle)<c.half&&r>=c.r0&&r<=c.r1):null,place=cabin??hab.rooms.find(q=>q.deck===ring.deck&&a>=q.a0&&a<q.a1);
      return {text:`Proxima b · Habitat ${hab.name} · Ring ${ring.deck+1} · ${place?.name??''}`,id:place?.id??null};}
    return null;
  }
  roomLocation(){
    const v=this.insideView,g=v?.gravity;if(!v)return null;if(v.driver)return {id:'rover',text:`Rover / ${(Math.abs(this.roverPose.speed)*3.6).toFixed(1)} km/h / W accelerate / S brake-reverse / A D steer / Space brake`};if(!g)return (v.surfaceMap&&this.surfaceLocation(v.surfaceMap,v.eye))||(v.label?{text:'Proxima b · '+v.label,id:null}:null);
    if(g.type==='linear')return {id:g.roomId,text:`Habitat ${g.habitat} · Burn ${g.g.toFixed(2)} g · ${g.roomName} · ${v.ladder?`Ladder · level ${v.ladder.from+1} → ${v.ladder.to+1}`:`Level ${v.level+1} of ${g.levels.length}`}`};
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
  resize(){this.endDrag();this.zoomSpeed=null;const rect=this.canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);this.width=rect.width;this.height=rect.height;this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=Math.round(rect.height*ratio);if(this.overlay){this.overlay.width=this.canvas.width;this.overlay.height=this.canvas.height;}this.ctx.setTransform(ratio,0,0,ratio,0,0);}
  cursorRay(x,y){
    return add(this.forward,add(mul(this.right,(x-this.centreX)/this.focal),mul(this.up,(this.centreY-y)/this.focal)));
  }
  sampleCursor(x,y,approaching=false,orbiting=false){
    const ray=this.cursorRay(x,y);let depth,aim;
    if(this.systemMode){
      const direction=norm(ray),hit=this.systemPick?.(direction,orbiting);
      if(hit!=null){
        const range=typeof hit==='number'?hit:hit.distance;
        aim=approaching?hit.aim:undefined;
        depth=range*1000/this.systemKm*dot(aim??direction,this.forward);
      }
    }else if(!this.renderedMode||this.renderedMode===this.mode){
      const pick=(px,py)=>{
        if(this.gpu)return this.gpu.pickHit(px,py,this);
        if(!this.pickScene)return null;
        this.softwarePickEntries??=meshPickEntries(this.pickScene);
        return pickGeometry(this.softwarePickEntries,this,norm(this.cursorRay(px,py)),this.pickOptions);
      };
      let hit=pick(x,y);
      // Thin silhouettes can leave a few pixels of empty space between visible parts.
      if(!hit&&!this.insideView&&this.camera.distance>200&&(this.pickScene||this.gpu)&&x>=0&&x<=this.width&&y>=0&&y<=this.height){
        for(const radius of [3,7]){
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[.707,-.707],[-.707,.707],[-.707,-.707]]){
            hit=pick(x+dx*radius,y+dy*radius);
            if(hit)break;
          }
          if(hit)break;
        }
      }
      if(hit)depth=dot(sub(hit.point,this.eye),this.forward);
    }
    return {ray,aim,depth:Number.isFinite(depth)&&depth>(this.systemMode?1e-8:.002)?depth:null};
  }
  zoomAt(x,y,factor){
    const requested=Math.log(factor);
    if(this.insideView){
      const v=this.insideView,zoom=v.zoom??1;
      const lensStep=Math.max(-.42,Math.min(.42,requested));
      const next=Math.max(.2,Math.min(20,zoom*Math.exp(-lensStep))),k=next/zoom;
      v.offsetX=x+(this.centreX-x)*k-this.width/2;
      v.offsetY=y+(this.centreY-y)*k-this.height*.51;
      v.zoom=next;this.onChange();return;
    }
    const c=this.camera,system=this.systemMode,zoomingIn=factor<1;
    let {ray,depth:hitDepth,aim}=this.sampleCursor(x,y,zoomingIn);
    if(aim){
      // A small silhouette adjustment puts the real surface beneath the cursor.
      const direction=norm(ray),axis=cross(direction,aim),den=1+dot(direction,aim);
      const turn=v=>{const offset=cross(axis,v);return add(add(v,offset),mul(cross(axis,offset),1/den));};
      const forward=turn(this.forward),right=turn(this.right),eye=this.eye;
      c.yaw=Math.atan2(-forward[2],-forward[0]);c.pitch=Math.asin(Math.max(-1,Math.min(1,-forward[1])));
      const levelRight=[Math.sin(c.yaw),0,-Math.cos(c.yaw)];
      c.roll=Math.atan2(dot(right,cross(levelRight,forward)),dot(right,levelRight));
      c.target=add(eye,mul(forward,c.distance));this.setup();
      ({ray,depth:hitDepth}=this.sampleCursor(x,y));
    }
    const depth=hitDepth??c.distance,unit=system?this.systemKm:1;
    const now=performance.now(),previous=this.zoomSpeed;
    // Carry only a speed limit between wheel packets. Every packet uses the newly picked ray.
    const measured=depth*unit;
    const speedDepth=previous&&now-previous.time<180?Math.min(measured,previous.depth*1.5):measured;
    if(!system&&hitDepth!==null&&depth<c.distance/8){
      c.distance=Math.max(.05,depth);c.target=add(this.eye,mul(this.forward,c.distance));
    }
    const scale=system?this.systemKm:c.distance;
    const orbitBlend=this.surfaceMode?Math.max(0,Math.min(1,(c.distance-15000)/165000)):0;
    const deepSpace=Math.max(0,Math.min(1,(speedDepth/1000-25000)/375000));
    const response=(.3+.7*Math.min(1,speedDepth/8))*(system?.48+.37*deepSpace:1-.65*orbitBlend);
    const maxLogStep=system?.42+.6*deepSpace:.42+.78*Math.min(1,speedDepth/40);
    const logStep=Math.max(-maxLogStep,Math.min(maxLogStep,requested*response));
    const next=Math.max(system?.00005:.05,Math.min(system?8e8:1e8,scale*Math.exp(logStep)));
    const step=1-next/scale;
    let travel=step*speedDepth/unit;
    const candidate=()=>add(this.eye,mul(ray,travel));
    if(system&&zoomingIn&&this.systemTravelLimit){
      const limit=this.systemTravelLimit(this.eye,candidate());travel*=limit;
    }
    if(this.surfaceMode&&!this.aboveTerrain(candidate())){
      let lo=0,hi=1;
      for(let i=0;i<16;i++){
        const t=(lo+hi)/2;
        if(this.aboveTerrain(add(this.eye,mul(ray,travel*t))))lo=t;else hi=t;
      }
      travel*=lo;
    }
    const k=step===0?1:1-travel/(speedDepth/unit);
    const eye=candidate(),target=add(eye,mul(this.forward,c.distance*k));
    this.zoomSpeed={time:now,depth:Math.max(.001,speedDepth-travel*unit)};
    if(system){
      this.onSystemZoom?.(this.eye,eye,zoomingIn);
      this.systemKm=scale*k;c.target=mul(target,1/k);
    }else{
      c.distance=scale*k;c.target=target;
    }
    this.onChange();
  }
  orbitAbout(anchor,dYaw,dPitch,fixedPlanet=false){
    const c=this.insideView??this.camera,offset=sub(this.eye,anchor);
    const right=dot(offset,this.right),up=dot(offset,this.up),depth=dot(offset,this.forward);
    const yaw=c.yaw,pitch=c.pitch;
    const position=t=>{
      c.yaw=yaw+dYaw*t;c.pitch=pitch+dPitch*t;this.setup(false);
      return add(anchor,add(mul(this.right,right),add(mul(this.up,up),mul(this.forward,depth))));
    };
    let eye;
    if(this.systemMode&&this.systemTravelLimit){
      const origin=this.eye;
      const steps=Math.ceil(Math.max(Math.abs(dYaw),Math.abs(dPitch))/.075);
      let safe=0;eye=origin;
      for(let i=1;i<=steps;i++){
        const end=i/steps,next=position(end);
        if(this.systemTravelLimit(eye,next,fixedPlanet)<1){
          let lo=safe,hi=end;
          for(let j=0;j<14;j++){
            const t=(lo+hi)/2;
            if(this.systemTravelLimit(eye,position(t),fixedPlanet)===1)lo=t;else hi=t;
          }
          eye=position(lo);break;
        }
        eye=next;safe=end;
      }
    }else{
      eye=position(1);
      if(this.surfaceMode&&!this.aboveTerrain(eye)){
        let lo=0,hi=1;
        for(let i=0;i<14;i++){
          const t=(lo+hi)/2;if(this.aboveTerrain(position(t)))lo=t;else hi=t;
        }
        eye=position(lo);
      }
    }
    if(this.insideView){
      const delta=sub(eye,this.eye);
      const local=c.driver?roverPoint(delta,this.roverPose,true,true):this.spinFrame(delta,c.frame,-1,true);
      c.viewOffset=add(c.viewOffset??[0,0,0],local);
    }else c.target=add(eye,mul(this.forward,c.distance));
    this.setup();
  }
  aboveTerrain([x,y,z]){return y>=settlementCameraFloor(x,z)+1.2-1e-8;}
  setup(respectTerrain=true){this.centreX=this.width/2;this.centreY=this.height*.51;if(this.insideView){const v=this.insideView,r=norm(cross(v.forward,v.up)),flat=add(mul(v.forward,Math.cos(v.yaw)),mul(r,Math.sin(v.yaw)));this.localForward=add(mul(flat,Math.cos(v.pitch)),mul(v.up,Math.sin(v.pitch)));this.localRight=norm(cross(flat,v.up));this.localUp=cross(this.localRight,this.localForward);const eye=v.viewOffset?add(v.eye,v.viewOffset):v.eye;this.eye=v.driver?roverPoint(eye,this.roverPose):this.spinFrame(eye,v.frame,1);this.forward=v.driver?roverPoint(this.localForward,this.roverPose,true):this.spinFrame(this.localForward,v.frame,1,true);this.right=v.driver?roverPoint(this.localRight,this.roverPose,true):this.spinFrame(this.localRight,v.frame,1,true);this.up=v.driver?roverPoint(this.localUp,this.roverPose,true):this.spinFrame(this.localUp,v.frame,1,true);this.skyFocal=Math.min(this.width,this.height)*.8;this.focal=this.skyFocal*(v.zoom??1);this.centreX+=v.offsetX??0;this.centreY+=v.offsetY??0;return;}
    const c=this.camera,cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),cp=Math.cos(c.pitch);
    if(this.systemMode)c.distance=1000;
    this.forward=[-cy*cp,-Math.sin(c.pitch),-sy*cp];this.right=[sy,0,-cy];this.up=cross(this.right,this.forward);
    if(c.roll){
      this.right=add(mul(this.right,Math.cos(c.roll)),mul(this.up,Math.sin(c.roll)));
      this.up=cross(this.right,this.forward);
    }
    this.eye=sub(c.target,mul(this.forward,c.distance));
    if(respectTerrain&&this.surfaceMode&&!this.aboveTerrain(this.eye)){
      const y=settlementCameraFloor(this.eye[0],this.eye[2])+1.2;
      c.target[1]+=y-this.eye[1];this.eye[1]=y;
    }
    this.skyFocal=this.focal=Math.min(this.width,this.height)*1.45;
  }
  project(p,sky=false){
    const x=p[0]-this.eye[0],y=p[1]-this.eye[1],z=p[2]-this.eye[2];
    const depth=x*this.forward[0]+y*this.forward[1]+z*this.forward[2];if(depth<.002)return null;
    const scale=(sky?this.skyFocal:this.focal)/depth;
    return [(sky?this.width/2:this.centreX)+(x*this.right[0]+y*this.right[1]+z*this.right[2])*scale,
      (sky?this.height*.51:this.centreY)-(x*this.up[0]+y*this.up[1]+z*this.up[2])*scale,depth];
  }
  line(a,b,color,width=1,dashed=false){const p=this.project(a),q=this.project(b);if(!p||!q)return;const ctx=this.ctx;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[4,4]:[]);ctx.stroke();ctx.setLineDash([]);}
  render(scene,state){
    this.renderedMode=state.mode;this.mode=state.mode;
    if(!this.gpu){
      if(this.pickScene!==scene){this.pickScene=scene;this.softwarePickEntries=null;}
      this.pickOptions={hideRadiators:state.showRadiators===false,visibleDeck:state.deck==='all'?-1:+state.deck,
        rover:state.mode==='settlement'?state.rover:null,spinAngle:state.spinAngle,spinCentres:scene.spinCentres,flat:scene.flat};
    }
    const ctx=this.ctx,w=this.width,h=this.height;this.airlocks=scene.airlocks??[];this.driveObstacles=scene.driveObstacles??[];this.surfaceMode=state.mode==='settlement';this.spinState={angle:state.spinAngle??0,centres:scene.spinCentres,flat:scene.flat};this.setup();ctx.clearRect(0,0,w,h);ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    if(this.gpu){ctx.clearRect(0,0,w,h);const result=this.gpu.draw(scene,state,this);this.hits=result.hits;this.annotations(scene,state);return result.faceCount;}
    const meshes=state.sky?[...state.sky.meshes,...(this.surfaceMode?scene.meshes.filter(m=>m.id!=='sky'):scene.meshes)]:scene.meshes;
    const ground=state.mode==='cruise'?-40:0;
    if(!this.insideView&&scene.grid)for(let x=-300;x<=300;x+=25)this.line([x,ground,-220],[x,ground,220],'#223840',.6);
    if(!this.insideView&&scene.grid)for(let z=-225;z<=225;z+=25)this.line([-300,ground,z],[300,ground,z],'#223840',.6);
    const light=norm([-.25,.7,.65]),faces=[],angle=state.spinAngle??0,spinCentres=scene.spinCentres??[0,0];let visibleMeshes=0;
    const outcode=([x,y])=>(x<-5?1:0)|(x>w+5?2:0)|(y<-5?4:0)|(y>h+5?8:0);
    for(const m of meshes){
      if((state.showRadiators===false&&m.id==='radiators')||(state.deck!==undefined&&state.deck!=='all'&&deckGroup(m.id)>=0&&deckGroup(m.id)!==+state.deck))continue;
      let info=this.softwareCache.get(m);
      if(!info){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const p of m.vertices)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],p[i]);hi[i]=Math.max(hi[i],p[i]);}const centre=lo.map((v,i)=>(v+hi[i])/2);let palette=this.softwarePalettes.get(m.color);if(!palette){const rgb=m.color.slice(1).match(/../g).map(x=>parseInt(x,16));palette=Array.from({length:66},(_,i)=>`rgb(${rgb.map((v,k)=>Math.min(255,Math.round(v*(i%33)/32+(i>=33?[24,13,0][k]:0)))).join(',')})`);this.softwarePalettes.set(m.color,palette);}info={centre,radius:Math.hypot(...hi.map((v,i)=>(v-lo[i])/2)),faces:null,palette};this.softwareCache.set(m,info);}
      const sign=scene.spinCentres?spinSign(m.id):0,c=Math.cos(angle*sign),sn=Math.sin(angle*sign);
      const sky=m.material===-2,pose=sky?p=>add(p,this.eye):m.id==='rover'&&state.mode==='settlement'&&state.rover?p=>roverPoint(p,state.rover):sign&&angle?p=>spinPoint(p,m.id,angle,spinCentres,false,scene.flat):p=>p;
      const centre=pose(info.centre),depth=dot(sub(centre,this.eye),this.forward),radius=info.radius;
      if(depth+radius<.002)continue;
      if(depth>radius){const q=this.project(centre,sky),screenRadius=radius*(sky?this.skyFocal:this.focal)/(depth-radius);if(!q)continue;if((screenRadius<.2&&m.id!=='sky')||q[0]+screenRadius<0||q[0]-screenRadius>w||q[1]+screenRadius<0||q[1]-screenRadius>h)continue;}
      visibleMeshes++;
      if(!info.faces){
        const colors=m.colors?.map(c=>parseInt(c.slice(1),16));
        info.faces=m.faces.map(indices=>{
          let color;
          if(colors){
            let r=0,g=0,b=0;
            for(const i of indices){const value=colors[i];r+=value>>16;g+=value>>8&255;b+=value&255;}
            color='rgb('+[r,g,b].map(channel=>Math.round(channel/indices.length)).join(',')+')';
          }
          return {indices,normal:m.material<0||colors?null:faceNormal(m.vertices,indices),color};
        });
      }
      const codes=new Uint8Array(m.vertices.length),p=m.vertices.map((v,i)=>{
        const point=this.project(pose(v),sky);if(point)codes[i]=outcode(point);return point;
      }),localLight=m.id==='rover'&&state.mode==='settlement'&&state.rover?roverPoint(light,state.rover,true,true):sign&&angle?[light[0]*c+light[1]*sn,-light[0]*sn+light[1]*c,light[2]]:light;
      const selected=false;
      for(const face of info.faces){
        const indices=face.indices;let clippedAtNear=false,offscreen=15,points;
        for(const i of indices){if(p[i])offscreen&=codes[i];else clippedAtNear=true;}
        if(clippedAtNear){
          const polygon=indices.map(i=>pose(m.vertices[i])),clipped=[];
          for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=dot(sub(a,this.eye),this.forward),db=dot(sub(b,this.eye),this.forward);if(da>=.003)clipped.push(a);if((da>=.003)!==(db>=.003))clipped.push(add(a,mul(sub(b,a),(.003-da)/(db-da))));}
          if(clipped.length<3)continue;points=clipped.map(q=>this.project(q,sky));
          if(points.some(q=>!q)||points.reduce((mask,q)=>mask&outcode(q),15))continue;
        }else{
          if(offscreen)continue;
          points=indices.map(i=>p[i]);
        }
        const a=points[0],b=points[1],cc=points[2];if(Math.abs((b[0]-a[0])*(cc[1]-a[1])-(b[1]-a[1])*(cc[0]-a[0]))<.3)continue;
        const lit=face.normal? .48+.45*Math.abs(dot(face.normal,localLight)):1;
        const color=face.color??(m.material<0?m.color:info.palette[(selected?33:0)+Math.round(lit*32)]);
        faces.push({m,sky,id:m.id,points,color,stitch:!!m.colors&&m.opacity>=.99,depth:points.reduce((sum,q)=>sum+q[2],0)/points.length});
      }
    }
    faces.sort((a,b)=>Number(b.sky)-Number(a.sky)||b.depth-a.depth);this.hits=[];let alpha=1;ctx.globalAlpha=1;
    if(this.systemMode)for(const l of state.sky?.lines??[])this.line(add(this.eye,l.a),add(this.eye,l.b),l.color);
    for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(alpha!==f.m.opacity){alpha=f.m.opacity;ctx.globalAlpha=alpha;}ctx.fillStyle=f.color;ctx.fill();
      if(f.stitch){ctx.strokeStyle=f.color;ctx.lineWidth=.8;ctx.stroke();}
      if(!f.sky&&f.m.opacity>.2)this.hits.push(f);
    }
    ctx.globalAlpha=1;
    this.softwareStats={sourceMeshes:meshes.length,visibleMeshes,drawnFaces:faces.length};
    if(!this.insideView)for(let l of scene.lines)if(state.showRadiators!==false||l.id!=='radiators')this.line(angle&&scene.spinCentres?spinPoint(l.a,l.id,angle,spinCentres,false,scene.flat):l.a,angle&&scene.spinCentres?spinPoint(l.b,l.id,angle,spinCentres,false,scene.flat):l.b,l.color,l.width,l.dashed);
    this.annotations(scene,state);return faces.length;
  }
  annotations(scene,state){if(state.showLabels===false)return;const ctx=this.ctx;ctx.font='10px monospace';ctx.textAlign='center';for(let l of scene.labels){const point=l.id&&scene.spinCentres?spinPoint(l.p,l.id,state.spinAngle??0,scene.spinCentres,false,scene.flat):l.p;if(l.closeOnly&&state.deck!==undefined&&state.deck!=='all'&&deckGroup(l.id)!==+state.deck)continue;if(this.insideView&&(!l.closeOnly||Math.hypot(...sub(point,this.eye))>6))continue;if(l.closeOnly&&Math.hypot(...sub(point,this.eye))>(l.item?25:45)&&state.selected!==l.id)continue;const p=this.project(point);if(!p)continue;ctx.fillStyle='#a3b9b6';ctx.fillText(l.text,p[0],p[1]);}
    for(let d of state.dimensions?scene.dimensions:[]){this.line(d.a,d.b,'#97aaa0',.7,true);const a=this.project(d.a),b=this.project(d.b);if(!a||!b)continue;ctx.fillStyle='#c4cdbb';const text=d.text;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];ctx.fillStyle='#11212a';const tw=ctx.measureText(text).width;ctx.fillRect(mid[0]-tw/2-5,mid[1]-12,tw+10,14);ctx.fillStyle='#bac8b9';ctx.fillText(text,mid[0],mid[1]-2);}
    ctx.textAlign='left';
  }
  pick(x,y){if(this.gpu)return this.gpu.pick(x,y,this);for(let i=this.hits.length-1;i>=0;i--)if(inside(x,y,this.hits[i].points))return this.hits[i].id;return null;}
  reset(mode){this.mode=mode;this.leaveInside();this.endDrag();this.zoomSpeed=null;this.surfaceMode=mode==='settlement';this.camera=mode==='settlement'?{yaw:.85,pitch:.72,distance:520,target:[25,5,-5]}:mode==='cargo'?{yaw:1.08,pitch:.42,distance:110,target:[25,0,0]}:mode==='descent'?{yaw:1.15,pitch:.3,distance:170,target:[22,-4,-28]}:{yaw:1.08,pitch:.42,distance:150,target:[22,0,0]};this.home=[...this.camera.target];this.onChange();}
}
