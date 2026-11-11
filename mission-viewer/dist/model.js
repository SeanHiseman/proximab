// Dependency-free, metre-based geometry for a reference-informed design model; speculative mission hardware remains conceptual.
// Two decks per disc. Outer deck: four two-cell shared rooms between four berth bays. Inner deck: four three-cell rooms up to the hub.
export const sharedRooms = [
  ['Galley and hygiene', 'Medical and exercise', 'Lounge and control', 'Airlock and recovery'],
  ['Garden and water', 'Air and thermal plant', 'Power and workshop', 'Stores']
].map((names,deck)=>names.map((name,i)=>({name,cell:i*3+(deck===0?1:0)})));
export const CABINS_PER_DISC=4;
export const COLORS = {structure:'#a4b2b1',habitat:'#b8d8c8',cabin:'#d9e0c9',propulsion:'#df946b',tanks:'#b3c4cc',shield:'#beb8a4',radiators:'#536c73',power:'#d5ad68',farm:'#87ae86',rover:'#e1c7a0',exploration:'#afbdde',inflatable:'#d8cfb4'};
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,k)=>a.map(v=>v*k);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>mul(a,1/(Math.hypot(...a)||1));
export function spinSign(id){if(id==='habA'||id.startsWith('bay-A-'))return -1;if(id==='habB'||id.startsWith('bay-B-'))return 1;if(id.startsWith('cabin-'))return +id.slice(6)<=CABINS_PER_DISC?-1:1;return 0;}
export function spinPoint(p,id,angle,centres,vector=false,flat=false){if(flat){const q=rotate(p,[-Math.PI/2,0,0]);return rotate(spinPoint(q,id,angle,centres,vector),[Math.PI/2,0,0]);}const sign=spinSign(id);if(!sign||!angle)return [...p];const origin=vector?[0,0,0]:[centres[sign<0?0:1],0,0];return add(rotate(sub(p,origin),[0,0,angle*sign]),origin);}
export function poseScene(scene,angle){if(!angle||!scene.spinCentres)return scene;return {...scene,meshes:scene.meshes.map(m=>({...m,vertices:m.vertices.map(p=>spinPoint(p,m.id,angle,scene.spinCentres,false,scene.flat)),...(m.normals?{normals:m.normals.map(n=>spinPoint(n,m.id,angle,scene.spinCentres,true,scene.flat))}:{})})),lines:scene.lines.map(l=>({...l,a:spinPoint(l.a,l.id,angle,scene.spinCentres,false,scene.flat),b:spinPoint(l.b,l.id,angle,scene.spinCentres,false,scene.flat)}))};}
export function rotate(p,r=[0,0,0]){let [x,y,z]=p;let c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(r[1]);s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(r[2]);s=Math.sin(r[2]);return [x*c-y*s,x*s+y*c,z];}
export function scenarioMass(landedTonnes,exhaustFraction,thermalKmS,rapidity){const thermalRatio=Math.exp(thermalKmS*1000/(1800*9.80665));const interstellarRatio=Math.exp(2*rapidity/exhaustFraction);return {departureTonnes:landedTonnes*thermalRatio*interstellarRatio,hydrogenTonnes:landedTonnes*(thermalRatio-1),thermalRatio,interstellarRatio};}
// Bright-star reference: AstroPixels / Hipparcos summary, J2000 RA hours, declination degrees, V magnitude.
const brightStars=[[6.75,-16.7,-1.44],[6.4,-52.7,-.62],[14.6667,-60.8,-.28],[14.2667,19.2,-.05],[18.6167,38.8,.03],[5.2833,46,.08],[5.25,-8.2,.18],[7.65,5.2,.4],[5.9167,7.4,.45],[1.6333,-57.2,.45],[14.0667,-60.4,.61],[19.85,8.9,.76],[12.45,-63.1,.77],[4.6,16.5,.87],[13.4167,-11.2,.98],[16.4833,-26.4,1.06],[7.75,28,1.16],[22.9667,-29.6,1.17],[20.6833,45.3,1.25],[12.8,-59.7,1.25],[10.1333,12,1.36],[6.9833,-29,1.5],[7.5833,31.9,1.58],[12.5167,-57.1,1.59],[17.5667,-37.1,1.62],[5.4167,6.3,1.64],[5.4333,28.6,1.65],[9.2167,-69.7,1.67],[5.6,-1.2,1.69],[22.1333,-47,1.73],[5.6833,-1.9,1.74],[8.1667,-47.3,1.75],[12.9,56,1.76],[18.4,-34.4,1.79],[3.4,49.9,1.79],[11.0667,61.8,1.81],[7.1333,-26.4,1.83],[13.8,49.3,1.85],[17.6167,-43,1.86],[8.3833,-59.5,1.86],[6,44.9,1.9],[16.8167,-69,1.91],[8.75,-54.7,1.93],[6.6333,16.4,1.93],[20.4333,-56.7,1.94],[2.5333,89.3,1.97],[6.3833,-18,1.98],[9.4667,-8.7,1.99],[10.3333,19.8,2.01],[2.1167,23.5,2.01]];
const boxV=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const boxF=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]];

// Settlement terrain (metres): a graded pad under the base, dunes and low hills, rising to distant ridges.
export const SETTLEMENT_CENTRE=[50,-20];
export function settlementTerrain(x,z){const [cx,cz]=SETTLEMENT_CENTRE,d=Math.hypot(x-cx,z-cz),b=Math.min(1,Math.max(0,(d-260)/180)),s=b*b*(3-2*b);
  const dunes=1.3*Math.sin(x*.031+z*.017)*Math.sin(z*.023-x*.011)+.7*Math.sin(x*.07+1.3)*Math.cos(z*.05);
  const hills=9*Math.sin(x*.004+.5)*Math.cos(z*.0033-.2)+6*Math.sin((x+z)*.0061);
  const far=Math.min(1,Math.max(0,(d-1700)/900)),ang=Math.atan2(z-cz,x-cx);
  return -.05+s*(dunes+hills+9)+far*far*(140+60*Math.sin(ang*5+.7)+35*Math.sin(ang*13));}
// Concept surface vehicle: 3 m/s forward, 1 m/s reverse; controlled acceleration and braking.
export function placeRover(r){
  const c=Math.cos(r.heading),s=Math.sin(r.heading),slope=(dx,dz)=>(settlementTerrain(r.x+dx,r.z+dz)-settlementTerrain(r.x-dx,r.z-dz))/2;
  r.forward=norm([c,slope(c,-s),-s]);const side=norm([s,slope(s,c),c]);r.up=norm(cross(side,r.forward));r.side=cross(r.forward,r.up);r.position=[r.x,settlementTerrain(r.x,r.z)-.15,r.z];return r;
}
export function createRoverState(){return placeRover({x:90,z:-42,heading:0,speed:0,parked:true});}
export function roverPoint(p,r,vector=false,inverse=false){
  if(!r)return [...p];if(inverse){const q=vector?p:sub(p,r.position);const v=[dot(q,r.forward),dot(q,r.up),dot(q,r.side)];return vector?v:add(v,[90,0,-42]);}
  const q=vector?p:sub(p,[90,0,-42]),v=add(add(mul(r.forward,q[0]),mul(r.up,q[1])),mul(r.side,q[2]));return vector?v:add(r.position,v);
}
export function stepRover(r,keys,dt,obstacles=[]){
  const before=[r.x,r.z,r.speed,r.heading],n=Math.max(1,Math.ceil(Math.min(dt,1)/.02)),h=Math.min(dt,1)/n,approach=(v,target,d)=>v<target?Math.min(target,v+d):Math.max(target,v-d);
  for(let i=0;i<n;i++){
    const throttle=Number(keys.has('w'))-Number(keys.has('s')),brake=r.parked||keys.has(' ')||(throttle&&r.speed*throttle<-.02);
    if(brake)r.speed=approach(r.speed,0,1*h);
    else{const c=Math.cos(r.heading),s=Math.sin(r.heading),grade=(settlementTerrain(r.x+c,r.z-s)-settlementTerrain(r.x-c,r.z+s))/2,gravity=9.80665*grade;
      if(throttle){const force=Math.max(-2,Math.min(2,throttle*.45+gravity));r.speed+=(force-gravity)*h;}
      else{r.speed=approach(r.speed,0,(.15+.01*r.speed*r.speed)*h);r.speed-=gravity*h;}
      r.speed=Math.max(-1,Math.min(3,r.speed));
    }
    const steer=Number(keys.has('a'))-Number(keys.has('d')),angle=Math.min(.5,Math.atan(.8*6/Math.max(.1,r.speed*r.speed))),heading=r.heading+steer*r.speed/6*Math.tan(angle)*h,x=r.x+Math.cos(heading)*r.speed*h,z=r.z-Math.sin(heading)*r.speed*h;
    const blocked=obstacles.some(o=>o.r?Math.hypot(x-o.x,z-o.z)<o.r:x>o.x0&&x<o.x1&&z>o.z0&&z<o.z1);
    if(blocked)r.speed=0;else{r.x=x;r.z=z;r.heading=heading;}
  }
  placeRover(r);return before.some((v,i)=>Math.abs(v-[r.x,r.z,r.speed,r.heading][i])>1e-9);
}
export function createScene(state,data,time=0){
  const ship=state.mode==='cruise'||state.mode==='engine',engine=state.mode==='engine';
  const scene={grid:false,meshes:[],lines:[],labels:[],dimensions:[],zones:[],spinCentres:state.mode==='cruise'?data.layout.disc_centres_x_m:null};
  const surface=state.mode==='settlement';
  const body=p=>add(p,[0,surface?25:0,0]);
  function mesh(id,v,f,color,opacity=1,transform=p=>p){const item={id,vertices:v.map(transform),faces:f,color,opacity};scene.meshes.push(item);return item;}
  function smooth(item){const normals=item.vertices.map(()=>[0,0,0]);for(const f of item.faces){const n=cross(sub(item.vertices[f[1]],item.vertices[f[0]]),sub(item.vertices[f[2]],item.vertices[f[0]]));for(const i of f)normals[i]=add(normals[i],n);}item.normals=normals.map(norm);return item;}
  function box(id,p,size,color,rotation=[0,0,0],opacity=1,transform=body){if(state.detail==='overview'&&Math.max(...size)<.45)return {};return mesh(id,boxV.map(v=>add(p,rotate(v.map((x,i)=>x*size[i]/2),rotation))),boxF,color,opacity,transform);}
  function line(id,a,b,color=COLORS.structure,transform=body,width=1,dashed=false){scene.lines.push({id,a:transform(a),b:transform(b),color,width,dashed});}
  function sphere(id,p,r,color,opacity=1,transform=body){if(state.detail==='overview'&&Math.max(...r)<.3)return {};const v=[],f=[],ns=[],n=state.detail==='high'?32:state.detail==='overview'?8:16,m=state.detail==='high'?16:state.detail==='overview'?4:8;for(let j=0;j<=m;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=j/m*Math.PI;v.push(add(p,[r[0]*Math.sin(b)*Math.cos(a),r[1]*Math.cos(b),r[2]*Math.sin(b)*Math.sin(a)]));ns.push(norm([Math.sin(b)*Math.cos(a)/r[0],Math.cos(b)/r[1],Math.sin(b)*Math.sin(a)/r[2]]));}for(let j=0;j<m;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);const obj=mesh(id,v,f,color,opacity,transform);const origin=transform(p);obj.normals=ns.map(n=>norm(sub(transform(add(p,n)),origin)));return obj;}
  function cylinder(id,p,r,length,color,axis='x',opacity=1,transform=body,topRadius=r){if(state.detail==='overview'&&Math.max(r,topRadius)<.18)return {};const v=[],f=[],n=state.detail==='high'?48:state.detail==='overview'?12:Math.max(r,topRadius)<.5?10:24;for(let k=0;k<2;k++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=k?topRadius:r;const q=axis==='x'?[(k-.5)*length,rr*Math.cos(a),rr*Math.sin(a)]:axis==='y'?[rr*Math.cos(a),(k-.5)*length,rr*Math.sin(a)]:[rr*Math.cos(a),rr*Math.sin(a),(k-.5)*length];v.push(add(p,q));}for(let i=0;i<n;i++)f.push([i,(i+1)%n,(i+1)%n+n,i+n]);f.push(Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i));return mesh(id,v,f,color,opacity,transform);}
  function sector(id,r0,r1,a0,a1,depth,color,opacity,transform,n=8){const v=[],f=[];for(let z of [-depth/2,depth/2])for(let r of [r0,r1])for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;v.push([r*Math.cos(a),r*Math.sin(a),z]);}const row=n+1;for(let i=0;i<n;i++){f.push([i,i+1,row+i+1,row+i],[2*row+i,3*row+i,3*row+i+1,2*row+i+1],[i,2*row+i,2*row+i+1,i+1],[row+i,row+i+1,3*row+i+1,3*row+i]);}f.push([0,row,3*row,2*row],[n,2*row-1,4*row-1,3*row-1]);return mesh(id,v,f,color,opacity,transform);}
  // Folding floor panel pierced by ladder hatches: pierced top/bottom faces plus edge caps.
  function floorSlab(id,r0,r1,a0,a1,depth,color,transform,n,holes){
    const vertices=[],faces=[],half=depth/2;
    curvedPanel(vertices,faces,r0,a0,a1,-half,half,n,holes);curvedPanel(vertices,faces,r1,a0,a1,-half,half,n,holes,true);
    const p=(r,a,z)=>vertices.push([r*Math.cos(a),r*Math.sin(a),z])-1;
    for(const a of [a0,a1])faces.push([p(r0,a,-half),p(r1,a,-half),p(r1,a,half),p(r0,a,half)]);
    for(const z of [-half,half])for(let i=0;i<n;i++){const b0=a0+(a1-a0)*i/n,b1=a0+(a1-a0)*(i+1)/n;faces.push([p(r0,b0,z),p(r0,b1,z),p(r1,b1,z),p(r1,b0,z)]);}
    return mesh(id,vertices,faces,color,1,transform);
  }
  function pipe(id,a,b,r,color,transform=body){if(state.detail==='overview'&&r<.06)return {};const direction=norm(sub(b,a)),u=norm(cross(direction,Math.abs(direction[2])<.9?[0,0,1]:[0,1,0])),v=cross(direction,u),vertices=[],faces=[],n=state.detail==='medium'&&r<.2?4:8;for(const p of [a,b])for(let i=0;i<n;i++)vertices.push(add(p,add(mul(u,r*Math.cos(i*2*Math.PI/n)),mul(v,r*Math.sin(i*2*Math.PI/n)))));for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);return mesh(id,vertices,faces,color,1,transform);}
  function torus(id,p,major,minor,color,axis='x',transform=body){if(state.detail==='overview'&&minor<.08&&major<1.8)return {};const vertices=[],faces=[],n=major>3.5?(state.detail==='overview'?32:Math.min(72,Math.round(major*9))):state.detail==='high'?(major>2?40:16):state.detail==='overview'?8:major<.5?8:12,m=state.detail==='overview'?3:state.detail==='medium'&&minor<.15?3:minor>.15?8:4;for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i/n*2*Math.PI,b=j/m*2*Math.PI,R=major+minor*Math.cos(b);const q=axis==='x'?[minor*Math.sin(b),R*Math.cos(a),R*Math.sin(a)]:[R*Math.cos(a),R*Math.sin(a),minor*Math.sin(b)];vertices.push(add(p,q));}for(let i=0;i<n;i++)for(let j=0;j<m;j++)faces.push([i*m+j,((i+1)%n)*m+j,((i+1)%n)*m+(j+1)%m,i*m+(j+1)%m]);return smooth(mesh(id,vertices,faces,color,1,transform));}
  // Curved surface at radius r over [a0,a1]x[z0,z1], pierced by any rectangular openings {a0,a1,z0,z1}.
  function curvedPanel(vertices,faces,r,a0,a1,z0,z1,n,holes=[],flip=false,zSteps=1){
    const as=[...new Set([...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...holes.flatMap(h=>[h.a0,h.a1]).filter(a=>a>a0&&a<a1)])].sort((x,y)=>x-y);
    const zs=[...new Set([...Array.from({length:zSteps+1},(_,i)=>z0+(z1-z0)*i/zSteps),...holes.flatMap(h=>[h.z0,h.z1]).filter(z=>z>z0&&z<z1)])].sort((x,y)=>x-y);
    const base=vertices.length,row=as.length;for(const z of zs)for(const a of as)vertices.push([r*Math.cos(a),r*Math.sin(a),z]);
    for(let j=0;j<zs.length-1;j++)for(let i=0;i<row-1;i++){
      const am=(as[i]+as[i+1])/2,zm=(zs[j]+zs[j+1])/2;
      if(holes.some(h=>am>h.a0&&am<h.a1&&zm>h.z0&&zm<h.z1))continue;
      const q=[base+j*row+i,base+j*row+i+1,base+(j+1)*row+i+1,base+(j+1)*row+i];faces.push(flip?q.reverse():q);
    }
  }
  // Tube along axis from origin; u/w span the cross-section. Cells whose centre satisfies cut(p) are left open.
  function tube(id,origin,axis,u,w,radius,ss,n,color,transform,cut=()=>false,endShift=null){
    const phis=Array.from({length:n+1},(_,i)=>-Math.PI+2*Math.PI*i/n),vertices=[],faces=[],row=phis.length;
    const at=(s,p)=>add(origin,add(mul(axis,s),add(mul(u,radius*Math.cos(p)),mul(w,radius*Math.sin(p)))));
    ss.forEach((s,j)=>{for(const p of phis){const q=at(s,p);vertices.push(endShift&&j===ss.length-1?add(q,mul(axis,endShift(q))):q);}});
    for(let j=0;j<ss.length-1;j++)for(let i=0;i<row-1;i++){if(cut(at((ss[j]+ss[j+1])/2,(phis[i]+phis[i+1])/2)))continue;faces.push([j*row+i,j*row+i+1,(j+1)*row+i+1,(j+1)*row+i]);}
    return mesh(id,vertices,faces,color,1,transform);
  }
  function pressureOutline(p,depth){
    const r=Math.hypot(p[0],p[1]),outer=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+(surface?.65:.02),bulge=Math.abs(r-outer)<1e-5?.75*Math.sqrt(Math.max(0,1-(p[2]/(depth/2))**2)):0;
    return [p[0]*(1+bulge/r),p[1]*(1+bulge/r),p[2]];
  }
  function pressureCell(id,r0,r1,a0,a1,depth,color,transform,span=1,{windows=[(a0+a1)/2],innerHoles=[],outerHoles=[],hatchAngle=null,outerWall=true,innerWall=true}={}){
    const half=depth/2,rm=(r0+r1)/2,n=(state.detail==='overview'?6:state.detail==='medium'?12:16)*span,vertices=[],faces=[];
    if(innerWall)curvedPanel(vertices,faces,r0,a0,a1,-half,half,n,innerHoles,false,state.detail==='overview'?2:8);
    if(outerWall)curvedPanel(vertices,faces,r1,a0,a1,-half,half,n,outerHoles,true,state.detail==='overview'?2:8);
    // Both axial covers are removed in cutaway so the radial decks can be inspected from either side.
    if(!state.cutaway){
      const angles=[...new Set([...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...(hatchAngle!==null&&!surface?[hatchAngle-.75/rm,hatchAngle+.75/rm]:[])])].filter(a=>a>=a0&&a<=a1).sort((a,b)=>a-b),rs=hatchAngle!==null&&!surface?[r0,r1-.13-2.3,r1-.13,r1]:[r0,r1];
      for(let j=0;j<rs.length-1;j++)for(let i=0;i<angles.length-1;i++){
        const a=(angles[i]+angles[i+1])/2,r=(rs[j]+rs[j+1])/2;
        if(hatchAngle!==null&&!surface&&Math.abs(a-hatchAngle)<.75/rm&&r>r1-.13-2.3&&r<r1-.13)continue;
        const b=vertices.length;for(const [r,a] of [[rs[j],angles[i]],[rs[j+1],angles[i]],[rs[j+1],angles[i+1]],[rs[j],angles[i+1]]])vertices.push([r*Math.cos(a),r*Math.sin(a),half]);faces.push([b,b+1,b+2,b+3]);
      }
    }
    // Internal deck edges remain flush with the common covers.
    const rounded=p=>transform(pressureOutline(p,depth));
    const shell=vertices.length?mesh(id,vertices,faces,color,1,rounded):{vertices:[],faces:[]};shell.material=2;
    const visibleWindow=!state.cutaway,height=(r1-r0)/2;
    // The window-side cover is split between portholes; each porthole is centred on its own window angle.
    const ws=[...windows].sort((x,y)=>x-y);
    if(visibleWindow)ws.forEach((w,k)=>{
      const b0=k?(ws[k-1]+w)/2:a0,b1=k<ws.length-1?(w+ws[k+1])/2:a1,xl=(b0-w)*rm,xr=(b1-w)*rm;
      const point=(x,y)=>{const r=rm+y,a=w+x/rm;return [r*Math.cos(a),r*Math.sin(a),-half];};
      const v=[],f=[],count=32,edge=extra=>[...new Set([b0,b1,...Array.from({length:n+1},(_,i)=>a0+(a1-a0)*i/n),...extra])].filter(a=>a>=b0&&a<=b1).sort((x,y)=>x-y).map(a=>(a-w)*rm);
      const bottom=edge(innerHoles.flatMap(h=>[h.a0,h.a1])),top=edge(outerHoles.flatMap(h=>[h.a0,h.a1])).reverse(),sides=[-.5,0,.5].map(k=>k*2*height);
      const boundary=[...bottom.map(x=>[x,-height]),...sides.map(y=>[xr,y]),...top.map(x=>[x,height]),...[...sides].reverse().map(y=>[xl,y])];
      for(const [x,y] of boundary){const a=Math.atan2(y,x);v.push(point(x,y),point(.36*Math.cos(a),.36*Math.sin(a)));}
      for(let i=0;i<boundary.length;i++){const j=(i+1)%boundary.length;f.push([2*i,2*j,2*j+1,2*i+1]);}
      mesh(id,v,f,color,1,rounded).role='window-wall';
      mesh(id,Array.from({length:count},(_,i)=>point(.36*Math.cos(i/count*2*Math.PI),.36*Math.sin(i/count*2*Math.PI))),[Array.from({length:count},(_,i)=>i)],'#90b6c4',.12,transform).role='porthole-glass';
      torus(id,point(0,0),.39,.045,'#cad2ce','z',transform).role='porthole-frame';
    });
    return shell;
  }
  function pressureCaps(id,p,r,halfLength,capLength,color,opacity,transform,port=.7){
    const n=state.detail==='overview'?12:24,m=8;
    for(const sign of [-1,1]){const v=[],f=[],end=Math.acos(port/r);for(let j=0;j<=m;j++)for(let i=0;i<n;i++){const t=end*j/m,a=i/n*2*Math.PI;v.push(add(p,[sign*(halfLength+capLength*Math.sin(t)),r*Math.cos(t)*Math.cos(a),r*Math.cos(t)*Math.sin(a)]));}for(let j=0;j<m;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);smooth(mesh(id,v,f,color,opacity,transform)).role=id==='refuge'?'refuge-end-dome':'pressure-end-dome';}
    return halfLength+capLength*Math.sqrt(1-(port/r)**2);
  }
  function roverCabin(p,transform,through=false){
    const t=q=>transform(add(p,q));
    const windowAt=p=>p[0]>-.5&&p[0]<3&&p[1]>.15&&Math.abs(p[2])>1.7,ss=[0,3,3.5,4.5,5.5,6.5,7],n=state.detail==='overview'?24:48;
    const roverHull=tube('rover',[-3.5,0,0],[1,0,0],[0,1,0],[0,0,1],2.3,ss,n,COLORS.rover,t,windowAt);roverHull.role='rover-pressure-hull';
    const sideGlass=tube('rover',[-3.5,0,0],[1,0,0],[0,1,0],[0,0,1],2.3,ss,n,'#90b6c4',t,p=>!windowAt(p));sideGlass.role='rover-window';sideGlass.opacity=.18;
    if(through)pressureCaps('rover',[0,0,0],2.3,3.5,.35,COLORS.rover,state.cutaway?.18:1,t);
    else{
      cylinder('rover',[-3.49,0,0],2.3,.02,COLORS.rover,'x',1,t).role='hull-boundary';
      const v=[],f=[],centre=.55;for(let i=0;i<64;i++){const a=i/64*2*Math.PI,c=Math.cos(a),sn=Math.sin(a),outer=-centre*c+Math.sqrt(2.3**2-centre**2*sn**2),inner=Math.min(.65/Math.max(1e-9,Math.abs(c)),1.4/Math.max(1e-9,Math.abs(sn)));v.push([3.5,centre+outer*c,outer*sn],[3.5,centre+inner*c,inner*sn]);}for(let i=0;i<64;i++){const j=(i+1)%64;f.push([2*i,2*j,2*j+1,2*i+1]);}mesh('rover',v,f,COLORS.rover,1,t).role='hull-boundary';
      mesh('rover',[[3.51,-.1,-1.4],[3.51,1.2,-1.4],[3.51,1.2,1.4],[3.51,-.1,1.4]],[[0,1,2,3]],'#90b6c4',.18,t).role='rover-window';
    }
    for(const x of [-3.3,3.3])torus('rover',[x,0,0],2.32,.07,'#a6b4ad','x',t);
    if(!through)cylinder('rover',[-3.55,0,0],1.1,.12,'#afbdaf','x',1,t);if(!through)torus('rover',[-3.65,0,0],1.12,.1,'#778e8d','x',t);
    box('rover',[0,-1.55,0],[6.6,.12,3],'#b8c2b2',[0,0,0],1,t);
    // Interior is always fitted; the opaque hull hides it unless cut away or entered.
    {
      for(const z of [-.85,.85]){box('rover',[1.6,-.9,z],[.8,.65,.8],'#8ba79c',[0,0,0],1,t);box('rover',[1.25,-.2,z],[.15,1.1,.8],'#9eb3a6',[0,0,0],1,t);box('rover',[2.5,-.5,z],[.55,.2,.9],'#6d929b',[0,0,0],1,t);box('rover',[-1.4,-1.1,z],[2.1,.4,.85],'#c4ae8b',[0,0,0],1,t);box('rover',[-2.1,-.85,z],[.45,.1,.7],'#d9d7bd',[0,0,0],1,t);}
      box('rover',[-.3,0,-1.8],[1.2,2.1,.7],'#8baba4',[0,0,0],1,t);
    }
  }
  function assembly(name,fn){fn();}
  function seat(id,p,t,color='#688e92'){
    const tr=q=>t(add(p,q));box(id,[0,0,0],[.48,.12,.48],color,[0,0,0],1,tr).role='seat';box(id,[0,-.3,-.23],[.48,.55,.1],color,[0,0,0],1,tr).role='seat-back';
    for(const x of [-.2,.2])pipe(id,[x,.05,-.2],[x,.48,.2],.025,'#b5beb1',tr);
  }
  function table(id,p,width,t){const tr=q=>t(add(p,q));box(id,[0,0,0],[width,.07,.85],'#d6d3be',[0,0,0],1,tr).role='shared-table';for(const x of [-width*.35,width*.35])pipe(id,[x,0,0],[x,.75,0],.045,'#8faaa7',tr);}
  function rack(id,purpose,x,z,t){
    const tr=q=>t(add([x,0,z],q)),front=z<0?1:-1,face=q=>tr([q[0],q[1],q[2]*front]);
    // ISS rack proportions, front service access and a clear central aisle.
    for(const xx of [-.5,.5])pipe(id,[xx,-.88,-.4],[xx,1.12,-.4],.028,'#b4c0bc',face);
    for(const y of [-.88,1.12])box(id,[0,y,0],[1.05,.06,.82],'#b7c3bd',[0,0,0],1,face);
    box(id,[0,.1,-.405],[1.05,2,.045],'#e0dfd0',[0,0,0],1,face).role='rack-backplane';
    if(state.detail!=='overview'){
      for(const xx of [-.46,.46]){
        pipe(id,[xx,-.78,.39],[xx,1.02,.39],.022,'#6c8387',face);
        pipe(id,[xx,-.2,.45],[xx,.15,.45],.025,'#d6d7c5',face);
      }
      for(const y of [-.75,.98])for(const xx of [-.43,.43])
        cylinder(id,[xx,y,.42],.025,.025,'#586e73','z',1,face);
      box(id,[-.15,.97,.43],[.4,.08,.015],'#cbb789',[0,0,0],1,face);
    }
    const water=/Water|water|Pump|Plumbing|plumbing/.test(purpose),air=/Life support|Oxygen|CO2|Pressure|Filter|Heat|Thermal/.test(purpose),science=/Science|Medical|Seed|Optical/.test(purpose);
    if(water||air){
      for(const xx of [-.27,.27]){cylinder(id,[xx,.12,-.1],.17,1.25,air?'#b9c6bc':'#9cb5bf','y',1,face).role=air?'air-treatment-canister':'filter-column';for(const y of [-.5,.74])cylinder(id,[xx,y,-.1],.2,.07,'#b9ac8d','y',1,face);}
      cylinder(id,[0,.94,.12],.12,.55,'#738e93','x',1,face).role='pump-motor';
      for(const xx of [-.27,.27]){pipe(id,[xx,.65,.1],[xx,.65,.32],.025,'#a1b1b1',face);torus(id,[xx,.65,.32],.075,.014,'#b97861','z',face);pipe(id,[xx,.85,.15],[xx,-.72,.15],.022,'#c0b18d',face);}
      for(const y of [-.65,.85])pipe(id,[-.4,y,.1],[.4,y,.1],.03,'#9baead',face);
      box(id,[0,-.73,.36],[.9,.22,.05],'#d3d9cf',[0,0,0],1,face);box(id,[.23,-.73,.4],[.28,.1,.02],'#507c8a',[0,0,0],1,face);
    }else if(science){
      box(id,[0,0,0],[.92,.85,.67],'#c7cfca',[0,0,0],1,face).role='science-glovebox';box(id,[0,-.18,.35],[.8,.35,.035],'#81abb1',[0,0,0],.7,face);
      for(const xx of [-.22,.22]){torus(id,[xx,.18,.36],.12,.025,'#708c91','z',face);cylinder(id,[xx,.18,.25],.08,.23,'#b0b6a9','z',1,face);}
      box(id,[0,.65,.08],[.9,.35,.55],'#d9d9ca',[0,0,0],1,face);for(const xx of [-.32,0,.32])box(id,[xx,.65,.37],[.05,.08,.02],'#769397',[0,0,0],1,face);
    }else{
      const food=/Food|food|Bulk|stock|stores|reserves|consumables|textiles|envelopes/i.test(purpose);
      for(let j=0;j<4;j++){const y=-.6+j*.45;box(id,[0,y,.0],[.92,.39,.7],food?'#dbd8c1':'#d4dad1',[0,0,0],1,face).role=food?'cargo-transfer-bag':'avionics-unit';
        if(food){for(const xx of [-.3,.3])pipe(id,[xx,y-.17,.36],[xx,y+.17,.36],.015,'#9da791',face);pipe(id,[-.1,y,.38],[.1,y,.38],.018,'#7b918c',face);box(id,[.25,y,.365],[.22,.1,.015],'#f0edda',[0,0,0],1,face);}
        else{for(let k=0;k<4;k++)box(id,[-.3+k*.2,y,.365],[.11,.035,.015],'#6b8c8b',[0,0,0],1,face);cylinder(id,[.36,y,.38],.025,.025,'#c5a16c','z',1,face);}}
    }
    for(const y of [-.8,.95])pipe(id,[-.36,y,.46],[.36,y,.46],.025,'#78a6b0',face);
    pipe(id,[.43,-.75,-.23],[.43,.95,-.23],.035,'#baa879',face);
  }
  function machine(id,purpose,x,z,t){
    const tr=q=>t(add([x,0,z],q));
    if(/workshop|Fabrication tools|Precision tools|Clean workshop/i.test(purpose)){
      box(id,[0,.85,0],[1.2,.13,.85],'#d0d3c7',[0,0,0],1,tr).role='fabrication-bed';for(const xx of [-.52,.52])for(const zz of [-.34,.34])pipe(id,[xx,-.8,zz],[xx,1.1,zz],.035,'#a9bbb8',tr);
      for(const xx of [-.5,.5])pipe(id,[xx,-.45,-.34],[xx,-.45,.34],.035,'#c9c5ab',tr);pipe(id,[-.5,-.45,0],[.5,-.45,0],.035,'#a9bbb8',tr);cylinder(id,[.05,-.25,0],.06,.3,'#c6a26c','y',1,tr);torus(id,[.43,-.5,-.3],.21,.05,'#8eaca9','x',tr);box(id,[0,1.05,0],[1.15,.2,.8],'#667f7e',[0,0,0],1,tr);
    }else rack(id,purpose,x,z,t);
  }
  function communal(id,purpose,width,t){
    if(purpose==='Fresh-food garden'){
      for(const y of [1.05,.05]){const tray=box(id,[0,y,0],[3.75,.12,2],'#879e7b',[0,0,0],1,t);tray.role='fresh-food-tray';tray.cropAreaM2=7.5;box(id,[0,y-.75,0],[3.75,.05,1.8],'#dae5c4',[0,0,0],1,t);for(const x of [-1.4,-.7,0,.7,1.4])for(const z of [-.6,.6])sphere(id,[x,y-.3,z],[.25,.23,.25],'#649365',1,t);}
    }else if(/Galley|dining/.test(purpose)){
      const seats=purpose==='Second dining room'?6:10,columns=seats/2,pitch=Math.min(1.1,(width-3)/columns);
      for(let i=0;i<columns;i++){const x=(i-(columns-1)/2)*pitch;assembly('dining-'+i,()=>{table(id,[x,.5,0],1.02,t);for(const z of [-.95,.95])seat(id,[0,0,0],q=>t(add([x,.75,z],rotate(q,[0,z>0?Math.PI:0,0]))));});}
      for(const x of [-width*.37,width*.37])assembly('galley-'+x,()=>{const tr=q=>t(add([x,0,-1.15],q));box(id,[0,.3,0],[1.1,1.5,.65],'#dde0d2',[0,0,0],1,tr).role='galley-unit';box(id,[0,-.48,0],[1.15,.08,.7],'#b9bba6',[0,0,0],1,tr);cylinder(id,[.25,-.4,.37],.11,.035,'#8fa7a8','z',1,tr);for(const yy of [0,.4,.8]){box(id,[0,yy,.34],[.9,.27,.04],'#9bada6',[0,0,0],1,tr);pipe(id,[-.12,yy,.39],[.12,yy,.39],.018,'#6d8585',tr);}});
    }else if(/lounge|recreation|Arts|Quiet|telepresence|Counselling|Training/.test(purpose)){
      const quiet=/Quiet|telepresence|Counselling/.test(purpose);
      for(const x of [-1.7,1.7])assembly('social-'+x,()=>{for(const xx of [-.55,0,.55])seat(id,[x+xx,.78,-.85],t,quiet?'#8a9f9e':'#6e9d96');table(id,[x,.65,.3],1.7,t);});
      if(/Training/.test(purpose))box(id,[0,-.2,-1.55],[2.7,1.4,.08],'#4c7783',[0,0,0],1,t).role='conference-display';
      else if(/Arts/.test(purpose)){box(id,[0,.8,.8],[1.4,.12,.5],'#bcc7bc',[0,0,0],1,t).role='music-keyboard';for(let k=0;k<12;k++)box(id,[-.63+k*.115,.71,.82],[.09,.04,.35],k%3?'#e1e1cf':'#526966',[0,0,0],1,t);}
      else{box(id,[0,-.1,-1.55],[2.8,1.3,.08],'#648d93',[0,0,0],1,t).role='virtual-window';for(const x of [-Math.min(2.7,width/2-.7),Math.min(2.7,width/2-.7)])machine(id,'Books and personal equipment',x,1.1,t);}
    }else if(/Exercise/.test(purpose)){
      assembly('treadmill',()=>{const tr=q=>t(add([-2.2,0,0],q));box(id,[0,1,0],[2,.2,.85],'#6f8a8d',[0,0,0],1,tr).role='treadmill';for(let j=0;j<10;j++)box(id,[-.8+j*.18,.88,0],[.04,.025,.72],'#b3b8ab',[0,0,0],1,tr);for(const z of [-.38,.38])pipe(id,[-.75,.85,z],[-.75,-.45,z],.035,'#d0d4c4',tr);box(id,[-.75,-.5,0],[.15,.3,.65],'#577c89',[0,0,0],1,tr);});
      assembly('resistive-device',()=>{const tr=q=>t(add([.5,0,0],q));box(id,[0,1.05,0],[1.4,.15,1.1],'#a6b5b0',[0,0,0],1,tr).role='resistive-exercise-device';for(const x of [-.55,.55]){pipe(id,[x,1,-.3],[x,-.9,-.3],.05,'#76a1ae',tr);cylinder(id,[x,.3,-.3],.14,.9,'#c1ac79','y',1,tr);pipe(id,[x,-.2,-.3],[x,-.5,.4],.04,'#b9c4bc',tr);}pipe(id,[-.7,-.5,.4],[.7,-.5,.4],.045,'#c6c9b7',tr);});
      assembly('cycle-ergometer',()=>{const tr=q=>t(add([2.8,0,0],q));cylinder(id,[0,.7,0],.28,.2,'#9dafa6','z',1,tr).role='cycle-ergometer';pipe(id,[0,.6,0],[-.2,-.05,0],.04,'#b4c6bd',tr);box(id,[-.2,-.1,0],[.45,.12,.35],'#67878a',[0,0,0],1,tr);for(const side of [-1,1])pipe(id,[0,.7,side*.12],[side*.23,.6,side*.28],.035,'#bdc6b9',tr);pipe(id,[.3,.8,0],[.5,-.1,0],.04,'#b4c6bd',tr);pipe(id,[.5,-.1,-.3],[.5,-.1,.3],.035,'#779b9e',tr);});
    }else if(/Hygiene|Sanitation/.test(purpose)){
      for(const x of [-1.6,1.6])assembly('hygiene-'+x,()=>{const tr=q=>t(add([x,0,0],q));cylinder(id,[0,.65,-.5],.32,.6,'#d4d9cf','y',1,tr).role='waste-management-toilet';torus(id,[0,.3,-.5],.24,.06,'#9aafa9','z',q=>tr(add([0,.3,-.5],rotate(sub(q,[0,.3,-.5]),[Math.PI/2,0,0]))));box(id,[0,.1,.85],[.9,.1,.5],'#c4cdc4',[0,0,0],1,tr);pipe(id,[.25,.05,.85],[.25,-.15,.7],.035,'#9badad',tr);for(const side of [-1,1])box(id,[side*.65,.05,0],[.04,2,2.8],'#b8c9be',[0,0,0],1,tr);});
    }else return false;
    return true;
  }
  // Fittings for one cell's function in a room frame (cruise cell, settlement ring or burn level).
  // Five-column lettering is real wall geometry, visible with labels disabled.
  const glyphs={'1':[0,66,127,64,0],'2':[98,81,73,73,70],'3':[34,65,73,73,54],'4':[24,20,18,127,16],'5':[39,69,69,69,57],'6':[62,73,73,73,50],'7':[1,113,9,5,3],'8':[54,73,73,73,54],'9':[38,73,73,73,62],A:[126,9,9,9,126],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[65,65,127,65,65],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,48,64,63],X:[99,20,8,20,99],Y:[3,4,120,4,3],Z:[97,81,73,69,67]};
  function wallSign(id,text,p,t,width=1.0){
    if(state.detail==='overview')return;
    const o=t(p),a=sub(t(add(p,[1,0,0])),o),b=sub(t(add(p,[0,1,0])),o),c=sub(t(add(p,[0,0,1])),o),hand=Math.sign(dot(cross(a,b),c))||1,tr=q=>t(add(p,[-hand*q[0],q[1],q[2]])),size=Math.min(.015,(width-.08)/(text.length*6));
    box(id,[0,0,0],[width,.18,.012],'#173b41',[0,0,0],1,tr).role='room-sign-panel';
    const v=[],f=[];
    [...text.toUpperCase()].forEach((c,k)=>(glyphs[c]??[]).forEach((bits,x)=>{for(let y=0;y<7;y++)if(bits&(1<<y)){const first=y;while(y<6&&(bits&(1<<(y+1))))y++;const xx=(k*6+x-text.length*3)*size,yy=(first-3)*size,h=(y-first+.85)*size,b=v.length;v.push([xx,yy,.009],[xx+size*.85,yy,.009],[xx+size*.85,yy+h,.009],[xx,yy+h,.009]);f.push([b,b+1,b+2,b+3]);}}));
    const letters=mesh(id,v,f,'#edf2cf',1,tr);letters.role='room-sign';letters.text=text;
  }
  function corridorArrow(id,p,t){
    if(state.detail==='overview')return;
    const v=[[-.2,-.018,0],[.08,-.018,0],[.08,-.07,0],[.22,0,0],[.08,.07,0],[.08,.018,0],[-.2,.018,0]];
    mesh(id,v,[v.map((_,i)=>i)],'#e4c775',1,q=>t(add(p,q))).role='corridor-arrow';
  }
  function furnishCell(room,purpose,arcWidth,t){
    if(/Airlock/i.test(purpose))return;
    const inset=Math.min(1,Math.max(.25,(arcWidth-1.4)/7));
    const fit=t;t=q=>fit([q[0]*inset,q[1],q[2]*.65]);
    if(/Medical and/.test(purpose)){
      for(let side of [-1,1]){box(room,[side*1.5,.8,0],[2.2,.5,1],'#d7d8c5',[0,0,0],1,t);box(room,[side*1.5,.45,-.25],[.5,.08,.6],'#b6d5cf',[0,0,0],1,t);box(room,[side*2.7,0,-.8],[.25,.6,.8],'#739eaa',[0,0,0],1,t);}
    }else if(!communal(room,purpose,arcWidth,t)){
      const count=Math.max(1,Math.min(5,Math.floor(arcWidth/1.6)));
      for(let j=0;j<count;j++)for(const side of [-1,1])machine(room,purpose,(j-(count-1)/2)*1.4,side*1.08,t);
    }
  }
  // Small local antimatter store for the touchdown heaters: a cryostat vacuum vessel around a trap coil stack, with
  // cryocooler heads, a dense shield plate toward the crew, support saddles and a feed line.
  function antimatterStore(p,s,role,transform=body){
    const t=q=>transform(add(p,mul(q,s))),k=v=>v*s;
    const vessel=cylinder('propulsion',[0,0,0],k(2),k(4),'#c8ced0','x',1,t);vessel.role=role;
    for(const x of [-2,2])sphere('propulsion',[x,0,0],[k(.9),k(2),k(2)],'#bcc4c6',1,t).role='store-end-dome';
    for(const x of [-1.5,-.75,0,.75,1.5])torus('propulsion',[x,0,0],k(2.04),k(.13),'#b37a48','x',t).role='trap-coil';
    for(const x of [-1,1]){cylinder('propulsion',[x,0,2.35],k(.32),k(.9),'#8e9ea2','z',1,t).role='cryocooler';box('propulsion',[x,0,2.9],[k(.7),k(.7),k(.3)],'#6f8085',[0,0,0],1,t);}
    box('propulsion',[-3.05,0,0],[k(.35),k(4.2),k(4.2)],'#5d6466',[0,0,0],1,t).role='gamma-shield-plate';
    for(const x of [-1.3,1.3])box('propulsion',[x,0,-2.15],[k(.5),k(3.2),k(.4)],'#8d9a97',[0,0,0],1,t).role='store-saddle';
    pipe('propulsion',[2.9,0,0],[4.2,0,0],k(.12),'#b5c9c6',t).role='antimatter-feed';box('propulsion',[0,2.1,.6],[k(1.2),k(.3),k(.8)],'#9aa5a0',[0,0,0],1,t).role='trap-electronics';
  }
  // Exploration package (exploration_manifest.json): shared antimatter scout carrier, four CubeSat-class daughter probes,
  // three microlanders, two robotic micro-rovers and shared deployment/relay hardware, held in an open carrier frame.
  function microRover(p,transform){
    const t=q=>transform(add(p,q));
    box('exploration',[0,0,.17],[.62,.4,.16],'#c9c2a8',[0,0,0],1,t).role='micro-rover';box('exploration',[0,0,.27],[.58,.36,.02],'#2f4a63',[0,0,0],1,t).role='micro-rover-solar';
    for(const x of [-.24,0,.24])for(const y of [-.25,.25])cylinder('exploration',[x,y,.09],.09,.06,'#3e4648','y',1,t);
    pipe('exploration',[.2,0,.25],[.2,0,.55],.015,'#9aa5a0',t);box('exploration',[.2,0,.58],[.08,.12,.06],'#5b6467',[0,0,0],1,t);
  }
  function scoutBay(p,transform){
    const t=q=>transform(add(p,q));
    const mount=(a,b)=>{b=[b[0],b[1]*1.25,b[2]*1.25];pipe('exploration',a,b,.075,'#9fb0ad',t).role='scout-frame-mount';box('exploration',b,[.28,.28,.28],'#bdc8bb',[0,0,0],1,t).role='scout-mount-clamp';};
    for(const side of [-1,1])mount([0,side*.35,1.4],[0,side*2,2]);
    for(let i=0;i<4;i++)mount([-1.8+i*1.2,1.6,-1.9],[-1.8+i*1.2,2,-2]);
    for(let i=0;i<3;i++)mount([-1.5+i*1.5,-1.3,-1.7],[-1.5+i*1.5,-2,-2]);
    for(const x of [-1.2,1.2])mount([x,-1.2,.55],[x,-2,2]);
    mount([1.8,1.4,1.6],[1.8,2,2]);
    // Antimatter scout carrier (150 kg): bus, micro-containment sphere, magnetic nozzle, radiator fins, high-gain dish.
    {const c=q=>t(add([0,0,1.4],q));box('exploration',[0,0,0],[1,.8,.8],'#c9c2a8',[0,0,0],1,c).role='scout-carrier';sphere('exploration',[-.62,0,0],[.3,.3,.3],'#b8c0c3',1,c).role='scout-containment';
     cylinder('exploration',[.85,0,0],.15,.6,'#8f9c9a','x',1,c,.45).role='scout-nozzle';torus('exploration',[.95,0,0],.42,.04,'#b37a48','x',c);for(const y of [-.62,.62])box('exploration',[0,y,0],[.8,.03,.6],'#354c53',[0,0,0],1,c).role='scout-radiator';
     cylinder('exploration',[0,0,.55],.45,.05,'#d6d8cc','z',1,c).role='scout-dish';pipe('exploration',[0,0,.4],[0,0,.75],.02,'#9aa5a0',c);}
    // Four CubeSat-class daughter probes (8 kg) in spring dispensers.
    for(let i=0;i<4;i++){const c=q=>t(add([-1.8+i*1.2,1.6,-1.9],q));box('exploration',[0,0,0],[.42,.3,.3],'#7f8d8e',[0,0,0],1,c).role='cubesat-dispenser';box('exploration',[.02,0,0],[.34,.22,.11],'#d2c9a6',[0,0,0],1,c).role='cubesat-probe';}
    // Three microlanders (25 kg): six-sided body, three legs, small engine, solar top.
    for(let i=0;i<3;i++){const c=q=>t(add([-1.5+i*1.5,-1.3,-2.2],q));cylinder('exploration',[0,0,.5],.34,.32,'#b8b39a','z',1,c).role='microlander';box('exploration',[0,0,.68],[.55,.55,.03],'#2f4a63',[0,0,0],1,c);
     cylinder('exploration',[0,0,.27],.07,.16,'#6d7779','z',1,c,.14);for(let k=0;k<3;k++){const a=k*2*Math.PI/3;pipe('exploration',[.25*Math.cos(a),.25*Math.sin(a),.4],[.48*Math.cos(a),.48*Math.sin(a),0],.02,'#c7c9bd',c).role='microlander-leg';}}
    // Two robotic micro-rovers (15 kg) on their release cradles.
    for(const x of [-1.2,1.2]){microRover([x,-1.2,.6],t);box('exploration',[x,-1.2,.55],[.8,.6,.06],'#8d9a97',[0,0,0],1,t).role='rover-cradle';}
    // Shared deployment, relay and support hardware.
    box('exploration',[1.8,1.4,1.6],[.6,.5,.5],'#9aa5a0',[0,0,0],1,t).role='relay-transceiver';cylinder('exploration',[1.8,1.4,2.05],.25,.04,'#d6d8cc','z',1,t);
  }
  function cargoModule(p,transform,vented=false){
    if(vented){const t=q=>transform(add(p,q));box('cargo',[0,-3.25,0],[10.4,.15,6.4],'#8f9f9b',[0,0,0],1,t).role='cargo-container';for(const x of [-5.2,5.2])for(const y of [-3.2,3.2])pipe('cargo',[x,y,-3.2],[x,y,3.2],.1,'#a8b9b0',t);for(const x of [-5.2,5.2])for(const z of [-3.2,3.2])pipe('cargo',[x,-3.2,z],[x,3.2,z],.1,'#a8b9b0',t);for(const y of [-3.2,3.2])for(const z of [-3.2,3.2])pipe('cargo',[-5.2,y,z],[5.2,y,z],.1,'#a8b9b0',t);for(const x of [-3.5,-1.2,1.2,3.5])for(const z of [-1.6,1.6])box('cargo',[x,-.5,z],[1.9,5,2.8],'#a3ada0',[0,0,0],1,t).role='unpressurised-cargo';return;}
    // Logistics carrier: ribbed cylindrical pressure hull with end domes, berthing ring and hatch, MMOD panel stringers,
    // trunnion pins into the carrying frame, a grapple fixture and EVA handrails.
    const t=q=>transform(add(p,q)),skin=state.cutaway?.12:1;
    const hull=cylinder('cargo',[0,0,0],3.6,10.4,'#b9bcad','x',skin,t);hull.role='cargo-container';hull.faces?.splice(-2);
    for(const x of [-5.2,5.2])sphere('cargo',[x,0,0],[.9,3.6,3.6],'#adb1a2',skin,t).role='cargo-end-dome';
    for(let x=-4.5;x<=4.6;x+=1.5)torus('cargo',[x,0,0],3.63,.07,'#8f9586','x',t).role='cargo-rib';
    for(let k=0;k<8;k++){const a=k*Math.PI/4;pipe('cargo',[-5.2,3.64*Math.cos(a),3.64*Math.sin(a)],[5.2,3.64*Math.cos(a),3.64*Math.sin(a)],.04,'#9ca192',t);}
    torus('cargo',[6.05,0,0],1.1,.16,'#8a9391','x',t).role='berthing-ring';cylinder('cargo',[6.1,0,0],.9,.12,'#6f7d7f','x',1,t).role='cargo-hatch';
    for(const x of [-3,3])for(const y of [-1,1])cylinder('cargo',[x,y*3.85,0],.22,.6,'#c7c9bd','y',1,t).role='trunnion-pin';
    box('cargo',[0,0,3.78],[.6,.6,.3],'#59666a',[0,0,0],1,t).role='grapple-fixture';cylinder('cargo',[0,0,4.05],.08,.4,'#c7c9bd','z',1,t);
    for(const y of [-.7,.7]){pipe('cargo',[-4,y,3.85],[4,y,3.85],.03,'#d4b77a',t).role='eva-handrail';for(const x of [-4,0,4])pipe('cargo',[x,y,3.6],[x,y,3.85],.025,'#d4b77a',t);}
    for(const x of [-2.5,2.5])box('cargo',[x,-3.62,-1.2],[1.6,.04,1],'#d8d5c0',[0,0,0],1,t).role='cargo-manifest-plate';
    if(state.cutaway){
      for(const x of [-3,0,3]){const tr=q=>t(add([x,-1.6,0],q));machine('cargo','Clean workshop',0,0,tr);for(const z of [-1.8,1.8])machine('cargo','Precision tools',0,z,tr);}
      for(const x of [-4,0,4])for(const z of [-1.6,1.6]){cylinder('cargo',[x,1.4,z],.6,2.2,'#9aaeb1','y',1,t);for(const y of [.5,2.3])cylinder('cargo',[x,y,z],.64,.09,'#c5b594','y',1,t);}
    }
  }
  // Half-cylinder on the ground along local z (length) with semicircular end walls.
  function vault(id,length,radius,color,opacity,transform,n=18,caps=[1,1]){const v=[],f=[];for(let i=0;i<=n;i++){const a=Math.PI*i/n;for(const s of [-length/2,length/2])v.push([radius*Math.cos(a),radius*Math.sin(a),s]);}for(let i=0;i<n;i++)f.push([2*i,2*i+1,2*i+3,2*i+2]);for(const k of [0,1])if(caps[k])f.push(Array.from({length:n+1},(_,i)=>2*i+k));return mesh(id,v,f,color,opacity,transform);}
  function farmBay(p,transform,bayIndex,hall=false){
    const farm=data.settlement.cruise_agriculture,t=q=>transform(add(p,q));
    if(!hall){const shell=sphere('farm',[0,0,0],farm.bay_semi_axes_m,COLORS.farm,state.cutaway?.14:1,t);shell.role='farm-pressure-envelope';shell.farmBay=bayIndex;shell.builtLocally=surface;}
    const length=farm.tray_length_m,width=farm.tray_width_m;
    for(let tier=0;tier<farm.tiers;tier++){
      const y=(tier-(farm.tiers-1)/2)*farm.tier_pitch_m;
      const tray=box('farm',[0,y,0],[length,.12,width],'#879e7b',[0,0,0],1,t);tray.role='crop-tray';tray.cropAreaM2=length*width;tray.farmBay=bayIndex;
      for(const z of [-width/4,width/4]){
        box('farm',[0,y+.1,z],[length-.1,.13,width/2-.1],'#766d4f',[0,0,0],1,t);
        pipe('farm',[-length/2,y+.2,z+width/4],[length/2,y+.2,z+width/4],.035,'#93b5ae',t);
        box('farm',[0,y+.95,z],[length-.1,.06,.18],'#d9e5c2',[0,0,0],1,t);
        for(let j=0;j<7;j++){const x=-length/2+.7+j*(length-1.4)/6;mesh('farm',[[x-.45,y+.2,z],[x,y+.7,z],[x+.45,y+.2,z],[x,y+.3,z-.45],[x,y+.75,z],[x,y+.3,z+.45]],[[0,1,2],[3,4,5]],tier%2?'#84a873':'#649365',1,t);}
      }
    }
    for(const x of [-length/2+.1,0,length/2-.1])for(const z of [-width/2+.1,width/2-.1])pipe('farm',[x,-2,z],[x,2,z],.055,'#b6c4b1',t);
    for(const x of [-6.8,6.8]){cylinder('farm',[x,-.5,0],.3,2.6,'#91aaa4','y',1,t);pipe('farm',[x,-1.5,0],[x,2,0],.05,'#b8b08d',t);}
  }
  const L=data.layout,GEO=data.design.geometry,HAB=data.design.habitat,crewModules=[];
  const SPIN_RATE=Math.sqrt(L.spin_gravity_g*9.80665/L.cabin_floor_radius_m);
  // Cruise and burn use the flight layout; the settlement lays the discs flat on the surface.
  const C=ship,DISC_X=C?L.disc_centres_x_m:L.surface_disc_centres_x_m,DISC_Z=C?L.disc_centres_z_m:[0,0],SPINE=L.service_spine_z_offset_m_study;
  // Habitat-local point to ship coordinates (no spin). In flight B is turned 180° about x, so its hub faces the spine.
  const place=(d,q)=>C&&d?[q[0]+DISC_X[d],-q[1],DISC_Z[d]-q[2]]:[q[0]+DISC_X[d],q[1],q[2]+DISC_Z[d]];
  if(ship){
    // Every dimension of the tanks, store, boom, shield and fins comes from calculations/ship_design.py.
    const around=(x,r,a)=>[x,r*Math.cos(a),SPINE+r*Math.sin(a)];
    // Thin plate through four corner points, given a real thickness so both faces shade.
    const slab=(id,q,thick,color,opacity=1)=>{const n=mul(norm(cross(sub(q[1],q[0]),sub(q[3],q[0]))),thick/2);return mesh(id,[...q.map(p=>sub(p,n)),...q.map(p=>add(p,n))],boxF,color,opacity,body);};
    // Square lattice truss: longerons, battens and alternating diagonals. half(x) gives the half-width, so it may taper.
    const truss=(x0,x1,half,bays,r,role)=>{
      const at=i=>{const x=x0+(x1-x0)*i/bays,h=half(x);return [[x,-h,SPINE-h],[x,h,SPINE-h],[x,h,SPINE+h],[x,-h,SPINE+h]];};
      for(let i=0;i<=bays;i++){const a=at(i),b=i<bays?at(i+1):null;for(let k=0;k<4;k++){
        pipe('structure',a[k],a[(k+1)%4],r*.7,'#8a9f9d').role=role;
        if(b){pipe('structure',a[k],b[k],r,'#a4b2b1').role=role;pipe('structure',i%2?a[k]:a[(k+1)%4],i%2?b[(k+1)%4]:b[k],r*.6,'#8a9f9d').role=role;}}}
    };
    // Capsule along the spine: hemispherical ends on a cylinder. With open, a wedge on the viewer's side is left out.
    const capsule=(id,x0,x1,r,color,open=false)=>{
      const n=state.detail==='overview'?24:48,m=state.detail==='overview'?4:8,profile=[],v=[],f=[];
      for(let j=0;j<=m;j++){const t=Math.PI/2*j/m;profile.push([x0+r-r*Math.cos(t),Math.max(.02,r*Math.sin(t))]);}
      for(let j=m;j>=0;j--){const t=Math.PI/2*j/m;profile.push([x1-r+r*Math.cos(t),Math.max(.02,r*Math.sin(t))]);}
      for(const [x,rr] of profile)for(let i=0;i<n;i++)v.push(around(x,rr,i/n*2*Math.PI));
      for(let j=0;j<profile.length-1;j++)for(let i=0;i<n;i++){const a=(i+.5)/n*2*Math.PI;if(open&&a>Math.PI*1.2&&a<Math.PI*1.8)continue;f.push([j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n]);}
      return smooth(mesh(id,v,f,color,1,body));
    };
    const XS=GEO.source_x,cone=s=>GEO.cone.source_radius_m+(GEO.cone.protected_radius_m-GEO.cone.source_radius_m)*s/GEO.cone.boom_length_m;

    // ---- Thrust spine: narrow between the discs, wider aft where it carries the crew modules.
    const S=GEO.screen,W=S.width_m,H=S.height_m,bow=S.catcher_x,TK=GEO.hydrogen_tank,ST=GEO.antimatter_store;
    truss(bow,12,()=>2,6,.12,'cruise-support-frame');
    for(const sy of [-1,1])for(const sz of [-1,1])pipe('structure',[12,sy*2,SPINE+sz*2],[13,sy*2.5,SPINE+sz*2.5],.12,'#a4b2b1').role='cruise-support-frame';
    truss(13,TK.x0,()=>2.5,10,.14,'cruise-support-frame');
    // Attitude-control thruster quads at both ends of the spine, kept within the gap between the two discs.
    for(const [x,h] of [[bow+3,2],[TK.x0-3,2.5]])for(const sy of [-1,1])for(const sz of [-1,1]){
      const p=[x,sy*(h+.4),SPINE+sz*1.2];box('structure',p,[.8,.6,.6],'#8d9a97').role='rcs-quad';
      for(const dx of [-1,1])cylinder('structure',[x+dx*.6,p[1],p[2]],.1,.45,'#5d6466','x',1,body,dx>0?.24:.1).role='rcs-nozzle';
      cylinder('structure',[x,p[1]+sy*.5,p[2]],.1,.45,'#5d6466','y',1,body,sy>0?.24:.1).role='rcs-nozzle';
    }
    // Earth-pointing high-gain antenna on an outrigger, looking aft past the tanks from inside the shield's shadow.
    {const p=[14.5,-(W/2-1),SPINE];pipe('structure',[14.5,-2.5,SPINE-2.5],p,.1,'#a4b2b1').role='antenna-boom';pipe('structure',[14.5,-2.5,SPINE+2.5],p,.1,'#a4b2b1');
     cylinder('structure',[p[0]+.45,p[1],p[2]],.12,.9,'#d6d8cc','x',1,body,.95).role='high-gain-antenna';pipe('structure',[p[0]+.9,p[1],p[2]],[p[0]+1.5,p[1],p[2]],.03,'#9aa5a0');box('structure',[p[0]-.25,p[1],p[2]],[.5,.5,.5],'#8d9a97').role='antenna-gimbal';}

    // ---- Forward wind screen. Three thin films ionise the oncoming gas and a weak dipole field steers the ions clear
    // of the ship; the catcher plate at the bow takes dust debris and whatever leaks through film punctures.
    for(const [dx,color,role] of [[0,COLORS.shield,'dust-catcher-plate'],[-.45,'#8b978f','dust-bumper-sheet']])box('shield',[bow+dx,0,SPINE],[.08,W,H],color).role=role;
    for(let i=0;i<4;i++)for(let j=0;j<3;j++)box('shield',[bow-.52,-W/2+(i+.5)*W/4,SPINE-H/2+(j+.5)*H/3],[.05,W/4-.25,H/3-.25],(i+j)%2?'#b3b39f':'#c2bfaa').role='dust-bumper-tile';
    for(const sy of [-1,1])for(const sz of [-1,1]){
      // Ribs lie in the plate's own plane, clear of the spinning discs behind it.
      for(const dx of [.12,.62])pipe('shield',[bow+dx,sy*(W/2-.3),SPINE+sz*(H/2-.3)],[bow+dx,sy*2,SPINE+sz*2],.09,'#9aa8a0').role='shield-rib';
      pipe('shield',[bow+.12,sy*(W/2-.3),SPINE+sz*(H/2-.3)],[bow+.62,sy*(W/2-.3),SPINE+sz*(H/2-.3)],.07,'#9aa8a0');pipe('shield',[bow+.62,sy*W/4,SPINE+sz*H/4],[bow+.12,sy*2,SPINE+sz*2],.07,'#9aa8a0');
      pipe('shield',[bow-.45,sy*W/2,SPINE+sz*H/2],[bow,sy*W/2,SPINE+sz*H/2],.07,'#9aa8a0');
    }
    for(const sy of [-1,1]){pipe('shield',[bow+.12,sy*(W/2-.3),SPINE],[bow+.12,sy*2,SPINE],.09,'#9aa8a0').role='shield-rib';pipe('shield',[bow+.12,0,SPINE+sy*(H/2-.3)],[bow+.12,0,SPINE+sy*2],.09,'#9aa8a0').role='shield-rib';}
    for(const sz of [-1,1])pipe('shield',[bow-.2,-W/2,SPINE+sz*H/2],[bow-.2,W/2,SPINE+sz*H/2],.1,'#9aa8a0');
    for(const sy of [-1,1])pipe('shield',[bow-.2,sy*W/2,SPINE-H/2],[bow-.2,sy*W/2,SPINE+H/2],.1,'#9aa8a0');
    const fw=W+1.4,fh=H+1.4;
    // Racetrack deflector coils above and below the stream give a dipole field across it.
    const deflector=x=>{for(const sz of [-1,1]){const z=SPINE+sz*(fh/2+.5),c=[[x,-fw/2,z],[x+3.2,-fw/2,z],[x+3.2,fw/2,z],[x,fw/2,z]];
      for(let e=0;e<4;e++)pipe('shield',c[e],c[(e+1)%4],.16,'#b37a48').role='deflector-coil';
      box('shield',[x+1.6,0,z],[1.2,1.2,.5],'#8e9ea2').role='coil-cryocooler';}};
    {// Mast: a light three-longeron lattice carries the films and coils far ahead of the crew.
      const x0=bow-.5,x1=S.x+4,n=Math.round((x0-x1)/10),tri=x=>[0,1,2].map(k=>around(x,S.mast_radius_m,Math.PI/2+k*2*Math.PI/3));
      for(let i=0;i<n;i++){const a=tri(x0+(x1-x0)*i/n),b=tri(x0+(x1-x0)*(i+1)/n);for(let k=0;k<3;k++){
        pipe('shield',a[k],b[k],.09,'#a4b2b1').role='screen-mast';pipe('shield',a[k],a[(k+1)%3],.06,'#8a9f9d');pipe('shield',a[k],b[(k+1)%3],.06,'#8a9f9d');}}
      for(let k=0;k<S.films;k++){const x=S.x+k*1.6,q=[[x,-fw/2,SPINE-fh/2],[x,fw/2,SPINE-fh/2],[x,fw/2,SPINE+fh/2],[x,-fw/2,SPINE+fh/2]];
        mesh('shield',q,[[0,1,2,3]],'#d8c48a',.3,body).role='stripper-film';
        for(let e=0;e<4;e++)pipe('shield',q[e],q[(e+1)%4],.08,'#b7bea9').role='film-frame';}
      for(const sy of [-1,1])for(const sz of [-1,1]){const corner=[S.x+3.4,sy*fw/2,SPINE+sz*fh/2];
        pipe('shield',[S.x,corner[1],corner[2]],corner,.08,'#b7bea9');pipe('shield',corner,[S.x+4,sy*.5,SPINE+sz*.5],.07,'#a4b2b1').role='film-frame-strut';
        pipe('shield',[corner[0],corner[1],corner[2]],[corner[0],corner[1],SPINE+sz*(fh/2+.5)],.07,'#a4b2b1');
        line('shield',corner,[S.x+45,0,SPINE],'#c9d2cc',body,.6);}
      deflector(S.x+3.4);
    }

    // ---- Two isolated food-production trains remain operable during burns and coast.
    for(const [train,p] of L.food_factory_modules_study.cruise_centres_m.entries()){
      const t=q=>body(add(p,q)),hull=cylinder('farm',[0,0,0],1.5,6,COLORS.farm,'x',state.cutaway?.12:1,t);hull.role='food-factory-hull';hull.trainIndex=train;hull.faces.splice(-2);
      const half=pressureCaps('farm',[0,0,0],1.5,3,.35,COLORS.farm,state.cutaway?.12:1,t);crewModules.push({id:`food-factory-${train+1}`,select:'farm',name:`Food factory ${train+1}`,centre:p,r:1.5,x0:p[0]-half,x1:p[0]+half});
      for(const x of [-2,2])for(const side of [-1,1])pipe('farm',[x,side*1.1,1],[x,side*2.5,2.5],.08,'#9aaea4',t).role='food-factory-mount';
      for(const x of [-3,0,3])torus('farm',[x,0,0],1.51,.05,'#afc3b2','x',t);
      if(state.cutaway){for(const x of [-1.9,-.6,.7]){cylinder('farm',[x,0,-1],.3,1.2,'#b9c8bc','y',1,t).role='food-bioreactor';for(const y of [-.55,.55])torus('farm',[x,y,-1],.31,.035,'#8da9a1','z',t);pipe('farm',[x,-.8,-1],[x,-.8,.65],.04,'#7ea7ad',t);}for(const y of [-.55,.55])box('farm',[2,y,.95],[.8,.6,.55],'#a6b9af',[0,0,0],1,t).role='food-processing-unit';pipe('farm',[-2.5,1,0],[2.5,1,0],.07,'#a2c2b4',t);}
    }
    // ---- Descent refuge, rover cabin, cargo racks and scouts along the spine.
    const refuge=L.refuge_study,RX=refuge.cruise_centre_m[0],VX=L.rover_centre_x_m,CX=L.cargo_centre_x_m;
    const crewBody=q=>body(add(q,[0,-7,0]));
    const refugeHull=cylinder('refuge',[RX,7,8],refuge.radius_m,refuge.length_m,'#c1ccc1','x',state.cutaway?.12:1,crewBody);refugeHull.faces?.splice(-2);refugeHull.role='refuge-pressure-hull';
    const refugeHalf=pressureCaps('refuge',[RX,7,8],refuge.radius_m,refuge.length_m/2,.65,'#c1ccc1',state.cutaway?.12:1,crewBody,.7);
    crewModules.push({id:'refuge',select:'refuge',name:'Descent refuge',centre:[RX,0,8],r:refuge.radius_m,x0:RX-refugeHalf,x1:RX+refugeHalf});
    if(state.cutaway){
      for(const y of [5.6,7.45])box('refuge',[RX,y,8],[4.6,.1,2.8],'#c4cabb',[0,0,0],1,crewBody).role='refuge-tier-floor';
      for(const tier of [0,1])for(let row=0;row<4;row++)for(const z of (tier?[-1.05,-.5,.5,1.05]:[-1.15,-.55,.55,1.15])){
        const tr=q=>crewBody(add([RX-1.725+row*1.15,6.12+tier*1.86,8+z],rotate(q,[Math.PI,Math.PI/2,0])));
        seat('refuge',[0,0,0],tr);box('refuge',[0,-.2,-.16],[.035,.35,.04],'#c1a782',[0,0,0],1,tr).role='descent-seat-restraint';
      }
    }
    roverCabin([VX,0,8],body,true);
    {const half=3.5+.35*Math.sqrt(1-(.7/2.3)**2);crewModules.push({id:'rover',select:'rover',name:'Rover cabin',centre:[VX,0,8],r:2.3,x0:VX-half,x1:VX+half});}
    for(const [id,cx,half] of [['refuge',RX,1.8],['rover',VX,2.6]])for(const dx of [-half,half])for(const z of [6.6,9.4]){
      pipe(id,[cx+dx,id==='refuge'?-1.5:-1.8,z],[cx+dx,-2.5,z],.18,'#8da29f').role='equipment-mount';
      pipe('structure',[cx+dx,-2.5,5.5],[cx+dx,-2.5,10.5],.16,'#a9b6ab');
    }
    for(const sy of [-1,1]){cargoModule([CX,sy*5.9,SPINE],body,true);for(const dx of [-4,4])for(const sz of [-1,1])pipe('cargo',[CX+dx,sy*2.7,SPINE+sz*2.4],[CX+dx,sy*2.5,SPINE+sz*2.5],.14,'#a8b9b0').role='cargo-rack-mount';}
    scoutBay([CX,0,SPINE],body);
    {// Packed surface residences: strapped bales on the spine's upper and lower faces, either side of the scout bay.
      const SI=data.design.surface_inflatables,side=Math.cbrt(SI.packed_volume_m3/SI.packed_bales/1.6);
      for(let k=0;k<SI.packed_bales;k++){const sz=k%2?1:-1,x=CX+(Math.floor(k/2)-(SI.packed_bales/2-1)/2)*(side*1.6+.5),p=[x,0,SPINE+sz*(2.5+side/2+.15)];
        const bale=box('inflatable',p,[side*1.6,side,side],'#cdbb8c');bale.role='stowed-surface-habitat';bale.massKg=SI.bale_mass_kg;
        for(const dx of [-side*.45,side*.45])box('inflatable',[x+dx,0,p[2]],[.1,side+.06,side+.06],'#7c6b4c').role='bale-strap';
        for(const sy of [-1,1])pipe('inflatable',[x,sy*side/2,p[2]-sz*side/2],[x,sy*2.5,SPINE+sz*2.5],.07,'#a8b9b0').role='bale-mount';}
    }
    // ---- Retained touchdown hardware: two hydrogen tanks beside the rover, a small local antimatter store and two
    // antimatter-heated hydrogen engines. The main engine brakes the stack until the last kilometre.
    const tankStudy=L.hydrogen_tanks_study,tankLength=tankStudy.semi_axis_x_m,tankRadius=Math.sqrt(data.design.nominal.thermal_hydrogen_kg*(1+tankStudy.capacity_margin_over_nominal_load)/(tankStudy.count*4/3*Math.PI*tankLength*(1-tankStudy.ullage_fraction)*tankStudy.hydrogen_density_kg_m3));
    const TE=CX+1;
    for(const sy of [-1,1]){
      const y=sy*(2.9+tankRadius),tank=sphere('tanks',[VX,y,SPINE],[tankLength,tankRadius,tankRadius],COLORS.tanks);tank.role='hydrogen-tank';tank.usableHydrogenCapacityKg=4/3*Math.PI*tankLength*tankRadius**2*(1-tankStudy.ullage_fraction)*tankStudy.hydrogen_density_kg_m3;
      for(const dx of [-.6,0,.6].map(v=>v*tankLength))torus('tanks',[VX+dx,y,SPINE],Math.sqrt(1-(dx/tankLength)**2)*tankRadius+.05,.06,'#dce0d2');
      for(const dx of [-tankLength*.5,tankLength*.5])for(const sz of [-1,1])pipe('tanks',[VX+dx,y-sy*tankRadius*.6,SPINE+sz*tankRadius*.6],[VX+dx,sy*2.5,SPINE+sz*2.5],.09,'#829793').role='tank-mount';
      pipe('tanks',[VX+tankLength*.9,y,SPINE],[TE-2.2,sy*2.5,SPINE],.1,'#b5c9c6').role='fuel-feed';
      cylinder('tanks',[VX+tankLength+.6,y*.82,SPINE],.2,.5,'#b99e76','x').role='isolation-valve';
    }
    antimatterStore([VX+6.1,0,SPINE],.42,'descent-containment');
    for(const sz of [-1,1]){
      const z=SPINE+sz*6.1;cylinder('propulsion',[TE,0,z],1,4,'#718582').role='thermal-touchdown-engine';cylinder('propulsion',[TE+3,0,z],.6,2.5,'#a89372','x',1,body,1.35).role='thermal-engine-nozzle';
      for(const dx of [-1.5,1.5])for(const sy of [-1,1])pipe('structure',[TE+dx,sy*.7,z-sz*.75],[TE+dx,sy*2.5,SPINE+sz*2.5],.12,'#9aafa5').role='engine-mount';
      pipe('propulsion',[TE-2.2,0,SPINE+sz*2.5],[TE-2,0,z-sz*.2],.1,'#a2c0bd').role='fuel-feed';
    }

    // ---- Propellant. Liquid hydrogen forward, antihydrogen ice aft; both sized from the mass budget.
    capsule('tanks',TK.x0,TK.x1,TK.radius_m,'#dcdfd6').role='hydrogen-propellant-tank';
    for(let k=0;k<4;k++)torus('tanks',[TK.x0+TK.radius_m+k*(TK.x1-TK.x0-2*TK.radius_m)/3,0,SPINE],TK.radius_m+.06,.11,'#b4bbb0').role='tank-ring-frame';
    // Thrust adapter from the spine onto the forward dome.
    {const x=TK.x0+1.6,r=Math.sqrt(TK.radius_m**2-(TK.radius_m-1.6)**2);torus('structure',[x,0,SPINE],r+.1,.14,'#9aa8a0').role='thrust-ring';
     for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4;pipe('structure',[TK.x0-.2,Math.sign(Math.cos(a))*2.5,SPINE+Math.sign(Math.sin(a))*2.5],around(x,r+.1,a),.13,'#a4b2b1').role='thrust-strut';}}
    // Open lattice skirts carry thrust round the facing domes and from the store onto the boom.
    const skirt=(xa,ra,xb,rb,n)=>{for(let k=0;k<n;k++){const a=k*2*Math.PI/n,b=(k+1)*2*Math.PI/n;pipe('structure',around(xa,ra,a),around(xb,rb,a),.12,'#a4b2b1').role='thrust-skirt';pipe('structure',around(xa,ra,a),around(xb,rb,b),.08,'#8a9f9d').role='thrust-skirt';}};
    skirt(TK.x1-TK.radius_m,TK.radius_m+.06,ST.x0+ST.radius_m,ST.radius_m+.06,12);
    const store=capsule('propulsion',ST.x0,ST.x1,ST.radius_m,'#c9bd94',state.cutaway);store.role='bulk-antimatter-store';
    const layerPitch=4.3,layers=Math.round((ST.x1-ST.x0-2*ST.radius_m)/layerPitch);
    for(let k=0;k<=layers;k++)torus('propulsion',[ST.x0+ST.radius_m+k*layerPitch,0,SPINE],ST.radius_m+.06,.11,'#a59a78').role='store-ring-frame';
    // Cryocooler heads sit on the forward dome, inside the skirt between the two vessels.
    for(let k=0;k<6;k++){const p=around(ST.x0+1.3,5.2,k*Math.PI/3+Math.PI/6);cylinder('propulsion',p,.3,1.6,'#8e9ea2','x').role='cryocooler';box('propulsion',add(p,[-1,0,0]),[.5,.6,.6],'#6f8085');}
    if(state.cutaway){
      // Antihydrogen ice logs on a hexagonal lattice, each held clear of the walls by electrostatic levitation.
      const pitch=2.4,sites=[];for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const y=pitch*(i+j/2),z=pitch*j*Math.sqrt(3)/2;sites.push([y,z,Math.hypot(y,z)]);}
      const layer=(x,limit)=>{for(const [y,z,r] of sites)if(r<=limit)cylinder('propulsion',[x,y,SPINE+z],ST.log_radius_m,ST.log_length_m,'#e4f1f4','x').role='antihydrogen-ice';
        torus('propulsion',[x,0,SPINE],limit+ST.log_radius_m+.25,.07,'#b37a48').role='levitation-electrode';};
      for(let k=0;k<layers;k++)layer(ST.x0+ST.radius_m+(k+.5)*layerPitch,ST.radius_m-1.1);
      for(const x of [ST.x0+ST.radius_m-2.15,ST.x1-ST.radius_m+2.15])layer(x,4.9);
    }
    // Feed lines: hydrogen along the outside of the store, antimatter down the boom axis.
    {const a=Math.PI*.75,r=ST.radius_m+.45,B=GEO.boom;
     pipe('tanks',around(TK.x1-TK.radius_m,r,a),around(ST.x1-ST.radius_m,r,a),.14,'#b5c9c6').role='hydrogen-feed';
     pipe('tanks',around(ST.x1-ST.radius_m,r,a),[B.x0,-2.6,SPINE+2.6],.14,'#b5c9c6').role='hydrogen-feed';
     pipe('tanks',[B.x0,-2.6,SPINE+2.6],[XS-36,-1.5,SPINE+1.5],.12,'#b5c9c6').role='hydrogen-feed';pipe('tanks',[XS-36,-1.5,SPINE+1.5],[XS-33.5,-1,SPINE+1],.12,'#b5c9c6');
     pipe('propulsion',[ST.x1-.1,0,SPINE],[XS-33.5,0,SPINE],.16,'#d7a35f').role='antimatter-feed';}
    for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,corner=[GEO.boom.x0,Math.sign(Math.cos(a))*2.6,SPINE+Math.sign(Math.sin(a))*2.6];for(const da of [-.4,0,.4])pipe('structure',around(ST.x1-ST.radius_m,ST.radius_m+.06,a+da),corner,da?.09:.13,'#a4b2b1').role='thrust-skirt';}

    // ---- Engine boom: a tapered truss that stays inside the shield's shadow cone all the way to the engine.
    truss(GEO.boom.x0,GEO.boom.x1,x=>Math.min(2.6,.6*cone(XS-x)),30,.14,'engine-boom');
    {// Aft wind screen for the braking burn: a film ring and deflector round the base of the boom.
      const x=GEO.aft_screen_x+2.5,rin=ST.radius_m+.3,n=48,v=[],f=[],edge=a=>Math.min(fw/2/Math.abs(Math.cos(a)||1e-9),fh/2/Math.abs(Math.sin(a)||1e-9));
      for(let i=0;i<n;i++){const a=(i+.5)/n*2*Math.PI;v.push(around(x,rin,a),around(x,edge(a),a));}
      for(let i=0;i<n;i++){const j=(i+1)%n;f.push([2*i,2*i+1,2*j+1,2*j]);}
      mesh('shield',v,f,'#d8c48a',.3,body).role='stripper-film';torus('shield',[x,0,SPINE],rin,.08,'#b7bea9').role='film-frame';
      const q=[[x,-fw/2,SPINE-fh/2],[x,fw/2,SPINE-fh/2],[x,fw/2,SPINE+fh/2],[x,-fw/2,SPINE+fh/2]];
      for(let e=0;e<4;e++){pipe('shield',q[e],q[(e+1)%4],.08,'#b7bea9').role='film-frame';pipe('shield',q[e],around(ST.x1-ST.radius_m,ST.radius_m+.06,Math.atan2(q[e][2]-SPINE,q[e][1])),.07,'#a4b2b1').role='film-frame-strut';}
      deflector(x-3.4);
    }
    // Tungsten shadow shield, then the pellet injectors: both propellants are steered round the shield's edge.
    const SH=GEO.shield;
    cylinder('shield',[SH.x-SH.thickness_m/2,0,SPINE],SH.radius_m,SH.thickness_m,'#44484b').role='shadow-shield';
    for(const dx of [0,-SH.thickness_m])torus('shield',[SH.x+dx,0,SPINE],SH.radius_m+.04,.06,'#8e9ea2').role='shield-retainer';
    cylinder('propulsion',[XS-30,0,SPINE],1.7,7,'#718582').role='propellant-injector';for(const dx of [-3.5,0,3.5])torus('propulsion',[XS-30+dx,0,SPINE],1.72,.09,'#c2ab86');
    for(const [sy,color] of [[-1,'#b5c9c6'],[1,'#d7a35f']]){const path=[[XS-26.5,sy*.5,SPINE],[SH.x-SH.thickness_m-.6,sy*.45,SPINE],[SH.x-SH.thickness_m,sy*(SH.radius_m+.3),SPINE],[SH.x+.6,sy*(SH.radius_m+.3),SPINE],[XS-.9,sy*.3,SPINE]];
      for(let i=0;i<path.length-1;i++)pipe('propulsion',path[i],path[i+1],.08,color).role='injector-guide';}
    // Open magnetic nozzle: superconducting coil rings on struts; nothing solid sits behind the annihilation point.
    const rings=[[-1.5,3.2],[2.5,4.4],[7,5.8],[11.5,7.2]];
    for(const [dx,r] of rings){torus('propulsion',[XS+dx,0,SPINE],r,.32,'#c2ab86').role='nozzle-coil';torus('propulsion',[XS+dx+.45,0,SPINE],r,.12,'#6f8589').role='coil-heat-shield';}
    for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8;let p=around(SH.x-3,.8,a);for(const [dx,r] of rings){const q=around(XS+dx,r,a);pipe('propulsion',p,q,.13,'#a7b5b1').role='nozzle-strut';p=q;}}
    if(state.showRadiators!==false){
      // Service radiators: four fins toward the corners of the frontal silhouette, beside the modules and the tanks.
      const F=GEO.service_fins,ha=F.half_angle_deg*Math.PI/180;
      for(const sec of F.sections)for(const a of [ha,Math.PI-ha,Math.PI+ha,-ha]){
        const n=Math.max(1,Math.round((sec.x1-sec.x0)/7)),step=(sec.x1-sec.x0)/n,r0=sec.inner_radius_m+.5;
        for(let i=0;i<n;i++){const xa=sec.x0+i*step+.12,xb=sec.x0+(i+1)*step-.12;
          slab('radiators',[around(xa,r0,a),around(xb,r0,a),around(xb,F.outer_radius_m,a),around(xa,F.outer_radius_m,a)],.1,'#354c53').role='radiator-panel';
          for(let k=1;k<4;k++)line('radiators',around(xa+.2,r0+(F.outer_radius_m-r0)*k/4,a),around(xb-.2,r0+(F.outer_radius_m-r0)*k/4,a),'#6f8586',body,.4);
          const root=sec.inner_radius_m>5?around(xa,sec.inner_radius_m-.25,a):[xa,Math.sign(Math.cos(a))*2.5,SPINE+Math.sign(Math.sin(a))*2.5];
          pipe('radiators',root,around(xa,r0,a),.1,'#a6b3a8').role='radiator-root-strut';}
        pipe('radiators',around(sec.x0,r0,a),around(sec.x1,r0,a),.17,'#88aeb0').role='radiator-header';
        pipe('radiators',around(sec.x0,F.outer_radius_m,a),around(sec.x1,F.outer_radius_m,a),.09,'#a1aca0').role='radiator-edge';
      }
      // Engine hot fins: three tapered fins that fill the shadow cone along the boom.
      const HF=GEO.hot_fins,outer=s=>HF.inner_radius_m+HF.width_scale*Math.max(0,cone(s)-.4-HF.inner_radius_m),s0=HF.start_from_source_m,s1=GEO.cone.boom_length_m-1.5,n=16;
      for(let k=0;k<HF.count;k++){const a=k*2*Math.PI/HF.count;
        for(let i=0;i<n;i++){const sa=s0+(s1-s0)*i/n+.15,sb=s0+(s1-s0)*(i+1)/n-.15;if(outer(sb)-HF.inner_radius_m<.4)continue;
          slab('radiators',[around(XS-sa,HF.inner_radius_m,a),around(XS-sb,HF.inner_radius_m,a),around(XS-sb,outer(sb),a),around(XS-sa,Math.max(HF.inner_radius_m+.1,outer(sa)),a)],.12,'#5f4138').role='hot-radiator-fin';
          pipe('radiators',around(XS-sb,Math.min(2.6,.6*cone(sb)),a),around(XS-sb,HF.inner_radius_m,a),.08,'#a6b3a8').role='radiator-root-strut';}
        pipe('radiators',around(XS-s0-8,HF.inner_radius_m,a),around(XS-s1,HF.inner_radius_m,a),.2,'#be9470').role='hot-loop-header';
      }
    }
    if(engine){
      // Burn braces: carbon struts from rim hardpoints to spine nodes carry each locked disc's inertial load under thrust,
      // so the hub bearing is not the only load path. Retracted while the discs spin in cruise.
      const rim=HAB.envelope_radius_m;
      for(const [d,cz] of DISC_Z.entries())for(const sx of [-1,1])for(const sy of [-1,1]){
        const a=(sx>0?0:Math.PI)+sx*sy*25*Math.PI/180,hard=[DISC_X[d]+rim*Math.cos(a),rim*Math.sin(a),cz],node=[DISC_X[d]+sx*(rim+1),sy*2,cz<SPINE?SPINE-2:SPINE+2];
        pipe('structure',hard,node,.12,'#3f4a4c').role='burn-brace';box('structure',hard,[.6,.6,.6],'#59666a').role='burn-brace-hardpoint';}
      if(state.showBeam!==false){
        // Antimatter exhaust: a collimated stream of ~0.94c charged pions and their decay products leaving the magnetic nozzle.
        // Drawn as a glowing column 4 km long (the view's depth limit); the real stream extends far beyond.
        const x0=XS+12,len=4000;
        for(const [r0,r1,color,opacity] of [[.7,3,'#ffffff',1],[2.4,14,'#b9a8ff',.35],[6,40,'#6f5cf0',.12]]){const b=cylinder('beam',[x0+len/2,0,SPINE],r0,len,color,'x',opacity,body,r1);b.faces?.splice(-2);b.material=-1;b.role='exhaust-beam';}
        const throat=sphere('beam',[XS,0,SPINE],[3,3,3],'#ffffff',1,body);throat.material=-1;throat.role='exhaust-beam';
      }
    }
    scene.labels.push(...[[[S.x,0,SPINE+11],`WIND SCREEN · ${S.films} STRIPPER FILMS + DEFLECTOR COILS`],[[bow,12,SPINE],'DUST CATCHER PLATE'],[[0,3,SPINE],'HUB TRANSFER TUBE'],
      [[RX,0,11.5],'DESCENT REFUGE · 32 SEATS'],[[L.food_factory_modules_study.cruise_centres_m[0][0]+3.5,0,11],'FOOD FACTORY'],[[VX,0,11.5],'ROVER CABIN'],[[CX,0,12.5],'CARGO RACKS · SCOUTS'],[[TE,0,SPINE+9],'TOUCHDOWN ENGINES'],[[CX,0,SPINE+5],'PACKED SURFACE RESIDENCES'],
      [[(TK.x0+TK.x1)/2,0,SPINE+9],`LIQUID HYDROGEN · ${Math.round(data.design.storage.matching_hydrogen_kg/1000)} t`],[[(ST.x0+ST.x1)/2,0,SPINE+9],`ANTIHYDROGEN ICE · ${Math.round(data.design.storage.antimatter_kg/1000)} t`],
      [[30,9,SPINE+7],'SERVICE RADIATORS'],[[XS-80,0,SPINE+8],'ENGINE HOT FINS'],[[(GEO.boom.x0+GEO.boom.x1)/2,0,SPINE+4.5],`ENGINE BOOM · ${GEO.cone.boom_length_m} m`],
      [[SH.x,0,SPINE+3],`SHADOW SHIELD · ${Math.round(SH.thickness_m*100)} cm TUNGSTEN`],[[XS+6,0,SPINE+9.5],'MAGNETIC NOZZLE'],...(engine?[[[12,11,SPINE],'BURN BRACES'],[[XS+60,0,SPINE+6],'ANTIMATTER EXHAUST']]:[])].map(([p,text])=>({p:body(p),text})));
  }
  // Room frame: fittings occupy z ±1.5 m; the remaining axial depth is a single walk-through aisle on +z.
  const AXIAL_SHIFT=.6,HULL_Z0=-L.disc_axial_depth_m/2+AXIAL_SHIFT+.1,HULL_Z1=L.disc_axial_depth_m/2+AXIAL_SHIFT-.1,CABIN_FRONT_Z=1.6,DOOR_Z=1.65,AISLE_Z=2.2,LADDER_Z=2.6;
  // Walking data per disc deck (radius, partitions, named rooms and cabins) and the ladders between decks.
  const deckInfo=new Map(),ladders=new Map(),HATCH_Z0=LADDER_Z-AXIAL_SHIFT-.65,HUB_R=3,HUB_HALF=C?L.disc_axial_depth_m/2:3.5,TUBE_R=1;
  // Four vertical shafts per disc, one inside every communal room on every deck, continuing to the hub.
  const SHAFTS=[2,5,8,11].map(c=>c*Math.PI/6);
  // Deck plan: merged communal rooms from sharedRooms, plus single-cell private cabin pods on the outer deck.
  const deckRooms=deck=>{
    const pods=deck===0?[...new Set(data.habitats.cabin_bay_layout.map(p=>p.cell))].map(cell=>({cell,name:'Private cabins',residential:true})):[];
    const rooms=[...sharedRooms[deck],...pods].sort((a,b)=>a.cell-b.cell);
    return rooms.map((room,i)=>({...room,span:((rooms[(i+1)%rooms.length].cell-room.cell+11)%12)+1}));
  };
  // ---- Burn configuration (engine mode). Thrust gives a steady pull toward the engine (+x in disc coordinates); the discs are locked and
  // each room's folding floor panels re-set at right angles to the thrust, turning rooms into stacked levels joined by ladders.
  const burnRooms=new Map(),burnCache=new Map(),discFrames=[];
  // Levels for a room wedge: floors are planes x = f; a level needs 2.3 m of clear height above a run at least 2.4 m long.
  const burnLevels=(key,rin,rout,a0,a1)=>{
    if(burnCache.has(key))return burnCache.get(key);
    const span=a1-a0,inside=(x,y)=>{const r=Math.hypot(x,y);if(r<rin+.08||r>rout-.08)return false;const t=((Math.atan2(y,x)-a0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);return t>.12/r&&t<span-.12/r;};
    const pts=[];for(let i=0;i<=36;i++){const t=a0+span*i/36;for(const r of [rin,rout])pts.push([r*Math.cos(t),r*Math.sin(t)]);}
    const xmax=Math.max(...pts.map(p=>p[0])),xmin=Math.min(...pts.map(p=>p[0])),ymin=Math.min(...pts.map(p=>p[1])),ymax=Math.max(...pts.map(p=>p[1]));
    // Longest run along the floor plane x = f with 2.1 m of clear height above it.
    const run=f=>{let best=null,start=null;for(let y=ymin;y<=ymax+1e-9;y+=.15){const ok=[0,.7,1.4,2.1].every(h=>inside(f-h,y)),last=y+.15>ymax+1e-9;
      if(ok&&start===null)start=y;if(start!==null&&(!ok||last)){const end=ok?y:y-.15;if(!best||end-start>best.u1-best.u0)best={u0:start,u1:end};start=null;}}return best;};
    // Choose floors (at least 2.35 m apart, runs of 1.2 m or more) that maximise total floor length.
    const cand=[];for(let f=xmax-.05;f-2.1>xmin;f-=.15){const rr=run(f);if(rr&&rr.u1-rr.u0>=1.2)cand.push({f,...rr,len:rr.u1-rr.u0});}
    const best=new Array(cand.length+1).fill(0),pick=new Array(cand.length).fill(null);
    for(let i=cand.length-1;i>=0;i--){let j=i+1;while(j<cand.length&&cand[j].f>cand[i].f-2.35)j++;const take=cand[i].len+best[j];if(take>best[i+1]){best[i]=take;pick[i]=j;}else best[i]=best[i+1];}
    const levels=[];for(let i=0;i<cand.length;){if(pick[i]!==null&&best[i]!==best[i+1]){levels.push({...cand[i],uc:(cand[i].u0+cand[i].u1)/2});i=pick[i];}else i++;}
    burnCache.set(key,levels);return levels;
  };
  // Ladder from a lower level to the next one up: vertical where the floors overlap, otherwise an inclined ship's ladder
  // from the near end of the lower floor to the near end of the upper one.
  const ladderBetween=(a,b)=>{const lo=Math.max(a.u0,b.u0),hi=Math.min(a.u1,b.u1);if(hi-lo>=.8)return {uA:(lo+hi)/2,uB:(lo+hi)/2};
    const up=b.u0>=a.u1-.8,uA=up?a.u1-.35:a.u0+.35,uB=up?b.u0+.35:b.u1-.35;return Math.abs(uB-uA)<4?{uA,uB}:null;};
  // Settlement: pressurised links meet habitat A's outer ring (to B and to the greenhouse) and habitat B's (to A).
  // Surface rings share their boundary walls; the innermost rooms continue to the hub.
  const FLOORS=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m,SURF_HALF=2.35,SURF_RC=[FLOORS[0]+.65-SURF_HALF],SURF_CORE=SURF_RC[0]-SURF_HALF,RES_X=5.3,SURF_Z=L.surface_disc_centres_z_m??[-45,-45],LINK_Z=(SURF_Z[0]+SURF_Z[1])/2;
  const surfaceRing=r=>{const k=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m.findIndex(F=>Math.abs(F-1.3-r)<1e-6);return k<0?r:SURF_RC[k];};
  const ROUT=surface?SURF_RC[0]+SURF_HALF:data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m[0]+.02,LINK_HW=1.2,LINK_FLOOR=1.75,LINK_ROOF=4.35,GH_ANGLE=255*Math.PI/180;
  const surfaceRooms=[[],[]],surfaceCabins=[[],[]];
  const linkHole=pts=>{const as=pts.map(([x,y])=>(Math.atan2(y,x)+2*Math.PI)%(2*Math.PI));const mid=(Math.min(...as)+Math.max(...as))/2,half=(Math.max(...as)-Math.min(...as))*.35;return {a0:mid-half,a1:mid+half,z0:3-LINK_ROOF,z1:3-LINK_FLOOR};};
  const ringPoint=(y,sign)=>[sign*Math.sqrt(ROUT*ROUT-y*y),y],ghx=ROUT*Math.cos(GH_ANGLE);
  const resHole=()=>linkHole([RES_X-LINK_HW,RES_X+LINK_HW].map(x=>[x,Math.sqrt(ROUT*ROUT-x*x)]));
  const surfaceLinks=surface?[[linkHole([ringPoint(LINK_Z-SURF_Z[0]-LINK_HW,1),ringPoint(LINK_Z-SURF_Z[0]+LINK_HW,1)]),linkHole([ghx-LINK_HW,ghx+LINK_HW].map(x=>[x,-Math.sqrt(ROUT*ROUT-x*x)])),resHole()],[linkHole([ringPoint(LINK_Z-SURF_Z[1]-LINK_HW,-1),ringPoint(LINK_Z-SURF_Z[1]+LINK_HW,-1)]),resHole()]]:[[],[]];
  for(let d=0;d<2;d++){
    const id=d?'habB':'habA',cx=DISC_X[d],spin=state.spin&&!surface?(d?1:-1)*time*SPIN_RATE:0;
    const furnish=state.interiorHabitat===undefined||state.interiorHabitat==='all'||state.interiorHabitat===(d?'B':'A');
    const scale=1;
    const transform=p=>{
      let q=rotate([p[0]*scale,p[1]*scale,p[2]],[0,0,spin]);
      if(surface){q=rotate(q,[Math.PI/2,0,0]);return add(q,[cx,3,SURF_Z[d]]);}
      return body(place(d,q));
    };
    const floors=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m;
    if(!surface){
      const v=[],f=[];curvedPanel(v,f,HUB_R,0,2*Math.PI,-HUB_HALF,HUB_HALF,32,SHAFTS.map(a=>({a0:a-.5/HUB_R,a1:a+.5/HUB_R,z0:HATCH_Z0,z1:L.disc_axial_depth_m/2})));
      const ring=(r,z)=>{const b=v.length;for(let i=0;i<32;i++){const a=i/32*2*Math.PI;v.push([r*Math.cos(a),r*Math.sin(a),z]);}return b;};
      const closed=ring(HUB_R,-HUB_HALF);f.push(Array.from({length:32},(_,i)=>closed+31-i));
      const outer=ring(HUB_R,HUB_HALF),inner=ring(TUBE_R,HUB_HALF);for(let i=0;i<32;i++)f.push([outer+i,outer+(i+1)%32,inner+(i+1)%32,inner+i]);
      mesh(id,v,f,'#a5b7b1',1,transform).role='service-hub';
      for(const z of [-1.6,-.4])torus(id,[0,0,z],HUB_R-.12,.035,'#c3bf9f','z',transform).role='hub-handhold';
    }
    {
      // In flight the dome caps the hub; on the surface it roofs the central hall at ring-roof height.
      const z=-(surface?2.15:HUB_HALF),hubR=surface?SURF_CORE+.05:3,origin=transform([0,0,z]),out=norm(sub(transform([0,0,z-1]),origin)),dome=sphere(id,[0,0,z],[hubR,hubR,surface?1.2:.5],'#a5b7b1',surface&&state.cutaway?.18:1,transform);
      dome.faces=dome.faces.filter(f=>f.reduce((n,i)=>n+dot(sub(dome.vertices[i],origin),out),0)>=-1e-8);dome.role='service-hub';
    }
    if(!surface)torus(id,[0,0,0],3.2,.18,'#c8c7ad','z',transform).role='service-hub';
    const programmes=data.habitats.deck_programmes;
    const entries=[];
    const roomTransform=(r,a)=>q=>{
      if(surface){
        // Follow the curved floor plan so rectangular fittings do not pierce radial walls.
        const rc=surfaceRing(r),radius=rc-(q[2]-AXIAL_SHIFT),angle=a-q[0]/rc;
        return transform([radius*Math.cos(angle),radius*Math.sin(angle),q[1]]);
      }
      const radius=r+q[1],angle=a-q[0]/r;
      return transform([radius*Math.cos(angle),radius*Math.sin(angle),q[2]-AXIAL_SHIFT]);
    };

    function addEntry(id,t,privateRoom=false){
      const room={id,eye:t([0,-.1,privateRoom?0:AISLE_Z]),up:sub(t([0,-1,0]),t([0,0,0])),forward:sub(t([1,0,0]),t([0,0,0]))};
      (scene.rooms??=[]).push(room);entries.push({room,t,privateRoom});
      return room;
    }
    // Burn frames: q[1] runs with the thrust gravity (+x), q[0] along the level, q[2] axial as in the cruise frame.
    const tE=lv=>q=>transform([lv.f-1.19+q[1],lv.uc-q[0],q[2]-AXIAL_SHIFT]);
    {const o=transform([0,0,0]);discFrames[d]={origin:o,down:norm(sub(transform([1,0,0]),o)),u:norm(sub(transform([0,1,0]),o)),w:norm(sub(transform([0,0,1]),o))};}
    function burnRoom(room,name,functions,residential,R,a0,a1,deck,cell){
      const levels=burnLevels(`${deck}-${cell}`,(deck+1<floors.length?floors[deck+1]+.02:HUB_R),R+.15,a0,a1),ladderList=[],wL=LADDER_Z-AXIAL_SHIFT,hatchQ2=HATCH_Z0+AXIAL_SHIFT,colour=deck%2?'#a7b4a7':'#b9c1aa';
      levels.forEach((lv,k)=>{
        const t=tE(lv),below=levels[k-1],above=levels[k+1],hatchU=below?ladderBetween(below,lv)?.uB??null:null;
        // Floor panel; a hatch is left where the ladder from the level below arrives.
        const slab=(q0a,q0b,q2a,q2b)=>{if(q0b-q0a>.05&&q2b-q2a>.05)box(room,[(q0a+q0b)/2,1.25,(q2a+q2b)/2],[q0b-q0a,.12,q2b-q2a],colour,[0,0,0],1,t).role='folding-deck';};
        if(hatchU===null)slab(-lv.len/2,lv.len/2,HULL_Z0,HULL_Z1);
        else{const h=lv.uc-hatchU;slab(-lv.len/2,lv.len/2,HULL_Z0,hatchQ2);slab(-lv.len/2,h-.55,hatchQ2,HULL_Z1);slab(h+.55,lv.len/2,hatchQ2,HULL_Z1);}
        const lad=above?ladderBetween(lv,above):null;
        if(lad){ladderList.push({...lad,w:wL,from:k,to:k+1});
          const rise=lv.f-above.f,at=t=>[lv.f-rise*t,lad.uA+(lad.uB-lad.uA)*t,wL],end=1+1/rise;
          for(const du of [-.25,.25])pipe(room,add(at(0),[0,du,0]),add(at(end),[0,du,0]),.035,'#9fb2ad',transform).role='access-ladder';
          for(let i=1;i*.3<rise;i++){const p=at(i*.3/rise);pipe(room,add(p,[0,-.25,0]),add(p,[0,.25,0]),.025,'#c3c6b2',transform);}}
        wallSign(room,name,[0,-.3,HULL_Z1+.085],q=>t([-q[0],q[1],-q[2]+2*(HULL_Z1+.085)]),1);corridorArrow(room,[-.7,-.3,HULL_Z1+.07],t);
        if(!residential&&furnish)furnishCell(room,functions[k%functions.length],Math.max(2,lv.len-.4),t);
      });
      burnRooms.set(room,{levels,ladders:ladderList,name,d});
      if(!residential&&levels.length){const e=addEntry(room,tE(levels[0]));e.burn={room,level:0,d};}
    }
    // Cabins take 3.3 m slots along their pod's levels, two per pod, 4 m across the disc's axial depth.
    const burnCabinFrame=(placement,cabin)=>{
      const pod=`bay-${d?'B':'A'}-0-${placement.cell}`,info=burnRooms.get(pod);if(!info?.levels.length)return null;
      const slots=info.levels.flatMap((lv,k)=>{const n=Math.floor(lv.len/2.6),w=lv.len/Math.max(1,n);return Array.from({length:n},(_,i)=>({k,lv,w,u:lv.u0+w*(i+.5)}));});
      const index=data.habitats.cabin_bay_layout.slice(0,cabin).filter(p=>p.cell===placement.cell).length,slot=slots[index]??slots[index%Math.max(1,slots.length)]??{k:0,lv:info.levels[0],u:info.levels[0].uc};
      // Burn-configuration cabins are shorter along the floor and wider across the disc, keeping about the same area.
      const q0=slot.lv.uc-slot.u,te=tE(slot.lv),k=Math.min(1,((slot.w??3.3)-.05)/3.3),kz=Math.min(1.1,1/k);
      return {t:q=>te([q0-q[2]*k,q[1],q[0]*kz+AXIAL_SHIFT]),burn:{room:pod,level:slot.k,d,cabinName:`Berth bay ${cabin+1}`}};
    };

    for(let deck=0;deck<floors.length;deck++){
      if(surface&&deck>0)continue;
      const R=floors[deck],visible=state.deck===undefined||state.deck==='all'||+state.deck===deck;
      if(!visible)continue;
      const RIN=deck===floors.length-1?HUB_R:surface?SURF_RC[deck]-SURF_HALF:floors[deck+1]+.02,ROUT_R=surface?SURF_RC[deck]+SURF_HALF:R+.02,fyR=surface?1.25:R-.11-(R-1.3),cyR=surface?-2.05:RIN-(R-1.3);
      const r=R-1.3,ceilingY=RIN-r,floorY=R-.11-r,walls=[],info={radius:R-1.4,gravity:L.spin_gravity_g*R/floors[0],walls,rooms:[],cabins:[]};deckInfo.set(`${d}-${deck}`,info);
      // Hatch openings: this deck's ladders pierce its ceiling; the deck below's ladders pierce this floor and outer shell.
      const hatches=k=>k<0||k>=floors.length||surface?[]:SHAFTS.map(angle=>({angle,z0:HATCH_Z0,z1:L.disc_axial_depth_m/2+.01}));
      // On the surface the rings lie flat: ring k opens to ring k+1 through doorways 2.1 m high above the 1.75 m floor.
      const doorways=k=>surface&&k>=0&&k<floors.length-1?SHAFTS.map(angle=>({angle,z0:3-1.75-2.1,z1:3-1.75})):[];
      const at=(list,a0,a1,rs)=>list.filter(h=>h.angle>a0&&h.angle<a1).map(h=>({...h,a0:h.angle-.5/rs,a1:h.angle+.5/rs}));
      for(const {cell,span,name,residential} of deckRooms(deck)){
        // Merged rooms span several 30° cells; each cell keeps its function's fittings.
        const a0=cell*Math.PI/6,a1=(cell+span)*Math.PI/6,a=(a0+a1)/2;
        const room=`bay-${d?'B':'A'}-${deck}-${cell}`,functions=programmes[deck].slice(cell,cell+span);
        if(!residential&&!engine)addEntry(room,roomTransform(r,a));
        scene.zones.push({id:room,habitat:d?'B':'A',deck:deck+1,radius_m:R,purpose:name,functions,gravity_g:L.spin_gravity_g*R/floors[0],status:'Proposed room/stowage zoning; inventory and net usable area unvalidated'});
        info.rooms.push({a0,a1,name,id:room});if(surface)surfaceRooms[d].push({deck,a0,a1,name,id:residential?null:room});
        // Outer-ring windows: in cruise this wall is the floor, so they only matter once the habitat lies flat on the surface.
        const ringWindows=deck===0?(residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>(p.cell+.5)*Math.PI/6+p.offset_m/(floors[0]-1.3)):Array.from({length:span},(_,i)=>a0+(i+.5)*Math.PI/6)).map(c=>({angle:c,a0:c-.6/ROUT_R,a1:c+.6/ROUT_R,z0:-1.05,z1:.35})).filter(w=>!surfaceLinks[d].some(h=>w.a1>h.a0&&w.a0<h.a1)):[];
        const lockAngle=deck===0&&/airlock/i.test(name)?a:null;
        const lockHole=surface&&lockAngle!==null?[{a0:a-.75/ROUT_R,a1:a+.75/ROUT_R,z0:-1.05,z1:1.25}]:[];
        const windows=residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>(p.cell+.5)*Math.PI/6+p.offset_m/(floors[0]-1.3)):[a];
        const ceilingHoles=at(surface?doorways(deck):hatches(deck),a0,a1,RIN),floorHoles=at(hatches(deck-1),a0,a1,R);
        const shell=pressureCell(room,RIN,ROUT_R,a0,a1,surface?4.3:L.disc_axial_depth_m,'#b8cbb5',transform,span,{windows,innerHoles:ceilingHoles,outerHoles:at(surface?doorways(deck-1):hatches(deck-1),a0,a1,ROUT_R).concat(deck===0?surfaceLinks[d].filter(h=>h.a0>=a0&&h.a1<=a1):[],ringWindows,lockHole),hatchAngle:lockAngle,outerWall:deck===0,innerWall:surface||deck===floors.length-1});
        for(const w of ringWindows.filter(w=>lockAngle===null||Math.abs(w.angle-lockAngle)>.1)){
          const depth=surface?4.3:L.disc_axial_depth_m,half=depth/2,step=2*Math.PI/(state.detail==='overview'?72:state.detail==='medium'?144:192),angles=[w.a0,...Array.from({length:Math.ceil(w.a1/step)-Math.floor(w.a0/step)+1},(_,i)=>(Math.floor(w.a0/step)+i)*step).filter(a=>a>w.a0&&a<w.a1),w.a1],zs=[w.z0,...Array.from({length:9},(_,i)=>-half+i*depth/8).filter(z=>z>w.z0&&z<w.z1),w.z1],v=[],f=[],point=(a,z)=>pressureOutline([ROUT_R*Math.cos(a),ROUT_R*Math.sin(a),z],depth);
          for(const z of zs)for(const a of angles)v.push(point(a,z));
          for(let j=0;j<zs.length-1;j++)for(let i=0;i<angles.length-1;i++){const b=j*angles.length+i;f.push([b,b+1,b+angles.length+1,b+angles.length]);}
          smooth(mesh(room,v,f,'#90b6c4',.25,transform)).role='ring-window-glass';
          const frameStart=scene.meshes.length;
          for(const a of [w.a0,w.a1])for(let j=0;j<zs.length-1;j++)pipe(room,point(a,zs[j]),point(a,zs[j+1]),.04,'#cad2ce',transform).role='ring-window-frame';
          for(const z of [w.z0,w.z1])for(let i=0;i<angles.length-1;i++)pipe(room,point(angles[i],z),point(angles[i+1],z),.04,'#cad2ce',transform).role='ring-window-frame';
          const parts=scene.meshes.splice(frameStart),fv=[],ff=[];for(const part of parts){const offset=fv.length;fv.push(...part.vertices);ff.push(...part.faces.map(f=>f.map(i=>i+offset)));}if(parts.length)mesh(room,fv,ff,'#cad2ce',1,p=>p).role='ring-window-frame';
        }
        if(surface&&deck>0)for(const {angle} of at(doorways(deck-1),a0,a1,ROUT_R)){
          // A shallow frame lines the doorway through the shared wall.
          const rIn=ROUT_R,rOut=SURF_RC[deck-1]-SURF_HALF,pt=q=>transform([q[1]*Math.cos(angle)+q[0]*Math.sin(angle),q[1]*Math.sin(angle)-q[0]*Math.cos(angle),3-q[2]]),len=rOut-rIn+.12,mid=(rIn+rOut)/2;
          for(const x of [-.53,.53])box(room,[x,mid,2.8],[.06,len,2.1],'#9aaba6',[0,0,0],1,pt).role='hull-boundary';
          box(room,[0,mid,3.88],[1.12,len,.06],'#9aaba6',[0,0,0],1,pt).role='doorway-passage';box(room,[0,mid,1.75],[1.12,len,.12],'#a7b4a7',[0,0,0],1,pt).role='doorway-passage';
        }shell.opacity=1;shell.role='inflatable-envelope';smooth(shell);
        if(lockAngle!==null){
          const baseLt=roomTransform(r,lockAngle),lt=surface?baseLt:q=>baseLt([q[0],q[1],1.2-q[2]]),lockId=d?'habB':'habA',outerOpen=state.airlockOutside===lockId,z0=surface?1.1:2.2,z1=-1.55,centre=lt([0,-.1,(z0+z1)/2]);
          (scene.airlocks??=[]).push({id:lockId,centre,angle:lockAngle,outerOpen,inner:lt([0,-.1,z0]),outer:lt([0,-.1,z1])});
          for(const x of [-1.15,1.15])box(room,[x,.1,(z0+z1)/2],[.12,2.3,z0-z1],'#9aaba7',[0,0,0],1,lt).role='hull-boundary';
          for(const y of [-1.05,1.25])box(room,[0,y,(z0+z1)/2],[2.4,.12,z0-z1],'#a7b8ac',[0,0,0],1,lt).role='hull-boundary';
          for(const [z,open,side] of [[z0,!outerOpen,'inner'],[z1,outerOpen,'outer']]){
            for(const x of [-.8,.8])box(room,[x,.1,z],[.12,2.3,.16],'#d5b678',[0,0,0],1,lt).role='airlock-door-frame';
            box(room,[0,-1.05,z],[1.7,.12,.16],'#d5b678',[0,0,0],1,lt).role='airlock-door-frame';
            const door=box(room,[open?1.65:0,.1,z],[1.5,2.2,.1],'#6e9297',[0,0,0],1,lt);door.role=open?'airlock-door-open':'hull-boundary';door.airlockDoor=side;
          }
          for(const x of [-.85,.85]){
            box(room,[x,-.05,(z0+z1)/2],[.45,.85,.35],'#dddcc7',[0,0,0],1,lt).role='spacesuit';
            sphere(room,[x,-.73,(z0+z1)/2],[.25,.27,.25],'#d6d9c5',1,lt).role='suit-helmet';
            box(room,[x,-.72,(z0+z1)/2+.23],[.31,.17,.04],'#486c7a',[0,0,0],1,lt).role='suit-visor';
            for(const dx of [-.13,.13])box(room,[x+dx,.7,(z0+z1)/2],[.17,.65,.2],'#d7d9c4',[0,0,0],1,lt).role='spacesuit';
          }
          wallSign(room,'AIRLOCK',[0,-.8,z0+.1],lt);wallSign(room,'F CYCLE DOORS',[0,-.55,(z0+z1)/2-.1],lt,.8);
          if(surface){box(room,[0,1.25,-2.7],[2,.12,1.6],'#a9b4a5',[0,0,0],1,lt).role='airlock-exterior-landing';for(let i=0;i<5;i++)box(room,[0,1.4+i*.3,-3.4-i*.4],[1.8,.18,.45],'#a9b4a5',[0,0,0],1,lt).role='airlock-exterior-step';}
        }
        if(engine)burnRoom(room,name,functions,residential,R,a0,a1,deck,cell);
        else{
        const floor=surface?sector(room,RIN,ROUT_R,a0,a1,.12,deck%2?'#a7b4a7':'#b9c1aa',1,q=>transform(add(q,[0,0,1.25])),8*span):floorHoles.length?floorSlab(room,R-.11,R+.02,a0,a1,L.disc_axial_depth_m-.2,deck%2?'#a7b4a7':'#b9c1aa',transform,8*span,floorHoles):sector(room,R-.11,R+.02,a0,a1,L.disc_axial_depth_m-.2,deck%2?'#a7b4a7':'#b9c1aa',1,transform,8*span);
        floor.role='folding-deck';floor.packedEnvelopeVolumeM3=.5*((R+.02)**2-(R-.11)**2)*(a1-a0)*3.4;
        }
        scene.labels.push({id:room,p:roomTransform(r,a)([0,-.8,0]),text:name.toUpperCase(),closeOnly:true});
        if(surface){
          const tb=roomTransform(r,a0),z0=SURF_RC[deck]+AXIAL_SHIFT-ROUT_R,z1=SURF_RC[deck]+AXIAL_SHIFT-RIN,top=fyR-2.1;
          for(const [lo,hi] of [[z0,1.2],[2.4,z1]])box(room,[0,(cyR+fyR)/2,(lo+hi)/2],[.08,fyR-cyR,hi-lo],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          box(room,[0,(cyR+top)/2,1.8],[.08,top-cyR,1.2],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
        }
        if(!engine){
          const tb=roomTransform(r,a0),z=surface?1.8:(DOOR_Z+HULL_Z1)/2,top=(surface?fyR:floorY)-2.1,plan=deckRooms(deck),previous=plan[(plan.findIndex(x=>x.cell===cell)+plan.length-1)%plan.length].name;
          for(const side of [-1,1]){const face=q=>tb([side*(.056+q[2]),q[1],z-side*q[0]]);wallSign(room,side>0?name:previous,[0,top-.15,0],face,.95);wallSign(room,'CORRIDOR',[-.85,-.4,0],face,.55);corridorArrow(room,[-.85,-.15,.01],face);}
        }
        if(!surface){
          // Bulkhead at the room's leading edge; its doorway sits in the aisle so rooms are walked through in sequence.
          const tb=roomTransform(r,a0),doorTop=floorY-2.1,height=floorY-ceilingY;
          box(room,[0,(ceilingY+floorY)/2,(HULL_Z0+DOOR_Z)/2],[.1,height,DOOR_Z-HULL_Z0],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          box(room,[0,(ceilingY+doorTop)/2,(DOOR_Z+HULL_Z1)/2],[.1,doorTop-ceilingY,HULL_Z1-DOOR_Z],'#a6b7ad',[0,0,0],1,tb).role='room-bulkhead';
          walls.push({angle:a0,half:.05/r,z0:HULL_Z0-AXIAL_SHIFT,z1:DOOR_Z-AXIAL_SHIFT});
          if(!residential){
            // Ladder in this room's shaft: up to the deck above, or to the hub from the innermost deck.
            const la=SHAFTS.find(x=>x>a0&&x<a1),hub=deck+1>=floors.length,top=(hub?HUB_R:floors[deck+1])-r;
            // Straight frame along the shaft so rails and walls stay parallel rather than converging toward the axis.
            const tl=q=>transform([(r+q[1])*Math.cos(la)+q[0]*Math.sin(la),(r+q[1])*Math.sin(la)-q[0]*Math.cos(la),q[2]-AXIAL_SHIFT]);
            // Rails continue 1 m above the upper floor as handholds when stepping off.
            for(const x of [-.25,.25])pipe(room,[x,floorY,LADDER_Z],[x,hub?top:top-1,LADDER_Z],.035,'#9fb2ad',tl).role='access-ladder';
            for(let y=floorY-.3;y>top;y-=.3)pipe(room,[-.25,y,LADDER_Z],[.25,y,LADDER_Z],.025,'#c3c6b2',tl);
            // Hatch rims frame the openings in this ceiling and in the floor (or hub wall) above.
            const zc=(HATCH_Z0+AXIAL_SHIFT+HULL_Z1)/2,zl=HULL_Z1-HATCH_Z0-AXIAL_SHIFT;
            for(const y of [ceilingY,top]){for(const x of [-.54,.54])box(room,[x,y,zc],[.08,.06,zl],'#8ea19c',[0,0,0],1,tl).role='access-hatch';box(room,[0,y,HATCH_Z0+AXIAL_SHIFT-.04],[1.16,.06,.08],'#8ea19c',[0,0,0],1,tl).role='access-hatch';}
            // Shaft lining closes the gap between this ceiling and the deck or hub above.
            {const h=ceilingY-top,yc=(ceilingY+top)/2,z0=HATCH_Z0+AXIAL_SHIFT;for(const x of [-.54,.54])box(room,[x,yc,(z0+HULL_Z1)/2],[.04,h,HULL_Z1-z0],'#9aaba6',[0,0,0],1,tl).role='access-shaft';for(const z of [z0,HULL_Z1])box(room,[0,yc,z],[1.12,h,.04],'#9aaba6',[0,0,0],1,tl).role='access-shaft';}
            const ladder={angle:la,z:LADDER_Z-AXIAL_SHIFT-.4,from:deck,to:hub?null:deck+1,topRadius:HUB_R-.6};
            ladders.has(d)?ladders.get(d).push(ladder):ladders.set(d,[ladder]);
          }
        }
        for(let i=0;i<span;i++){
          const ac=a0+(i+.5)*Math.PI/6,purpose=functions[i],t=roomTransform(r,ac),arcWidth=(surface?surfaceRing(r):r)*Math.PI/6;
          // Rigid fittings still pack per 30° cell so each assembly fits a transport rack.
          if(!engine&&residential){
            // Private cabins open onto a short aisle that links the communal rooms on either side.
            const doors=residential?data.habitats.cabin_bay_layout.filter(p=>p.cell===cell).map(p=>-p.offset_m).sort((a,b)=>a-b):[0];
            let edge=-arcWidth/2;
            for(const x of [...doors,arcWidth/2+.7]){
              const end=x-.7;
              if(end>edge)box(room,[(edge+end)/2,(cyR+fyR)/2,CABIN_FRONT_Z],[end-edge,fyR-cyR,.08],'#a6b7ad',[0,0,0],1,t).role='room-front';
              if(x<arcWidth/2)box(room,[x,(cyR+fyR-2.1)/2,CABIN_FRONT_Z],[1.4,fyR-2.1-cyR,.08],'#a6b7ad',[0,0,0],1,t).role='door-lintel';
              edge=x+.7;
            }
          }
          if(residential||!furnish||engine)continue;
          furnishCell(room,purpose,arcWidth,t);
        }
      }
    }
    if(surface){
      // Central hall: with the hub and bearings left in orbit, the middle of the disc becomes the shared hall. The inner
      // deck's plant, workshop and store racks stand round its wall; dining and commons fill the floor.
      const H=d?'B':'A',hall=q=>transform([q[0],q[2],1.25+q[1]-1.19]),ids=sharedRooms[1].map(room=>`bay-${H}-1-${room.cell}`);
      sector(ids[0],.05,SURF_CORE,0,2*Math.PI,.12,'#b9c1aa',1,q=>transform(add(q,[0,0,1.25])),48).role='folding-deck';
      cylinder(ids[0],[0,0,-.45],.22,3.4,'#a5b7b1','z',1,transform).role='hall-roof-post';
      for(const angle of SHAFTS){const pt=q=>transform([q[1]*Math.cos(angle)+q[0]*Math.sin(angle),q[1]*Math.sin(angle)-q[0]*Math.cos(angle),3-q[2]]);
        for(const x of [-.53,.53])box(ids[0],[x,SURF_CORE,2.8],[.06,.16,2.1],'#9aaba6',[0,0,0],1,pt).role='hull-boundary';
        box(ids[0],[0,SURF_CORE,3.88],[1.12,.16,.06],'#9aaba6',[0,0,0],1,pt).role='doorway-passage';}
      programmes[1].forEach((purpose,cell)=>{const a=(cell+.5)*Math.PI/6,room=ids[Math.floor(cell/3)];
        machine(room,purpose,0,-.1,q=>hall([(SURF_CORE-.55-q[2])*Math.cos(a)-q[0]*Math.sin(a),q[1],(SURF_CORE-.55-q[2])*Math.sin(a)+q[0]*Math.cos(a)]));});
      for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,t=q=>hall([1.75*Math.cos(a)+q[0]*Math.cos(a)-q[2]*Math.sin(a),q[1],1.75*Math.sin(a)+q[0]*Math.sin(a)+q[2]*Math.cos(a)]);
        wallSign(ids[k],sharedRooms[1][k].name,[0,-.75,0],q=>{const b=(3*k+1.5)*Math.PI/6,rho=SURF_CORE-.1-q[2];return hall([rho*Math.cos(b)-q[0]*Math.sin(b),q[1],rho*Math.sin(b)+q[0]*Math.cos(b)]);},.95);
        table(ids[k],[0,.44,0],1.5,t);for(const dx of [-.4,.4])for(const sz of [-1,1])seat(ids[k],[0,0,0],q=>t(add([dx,.71,sz*.9],rotate(q,[0,sz>0?Math.PI:0,0]))));
        const eye=hall([.8*Math.cos(a+.6),-.1,.8*Math.sin(a+.6)]);
        (scene.rooms??=[]).push({id:ids[k],eye,up:[0,1,0],forward:norm(sub(hall([Math.cos(a),-.1,Math.sin(a)]),hall([0,-.1,0])))});}
      surfaceRooms[d].push({deck:1,a0:0,a1:2*Math.PI,name:'Central hall',id:ids[0]});
      scene.zones.push({id:ids[0],habitat:H,deck:2,purpose:'Central hall',functions:programmes[1],status:'Proposed surface use of the disc centre; fit and services unvalidated'});
    }
    // Four berth bays per disc, each with two two-tier convertible sleep/torpor berths.
    if(state.deck===undefined||state.deck==='all'||+state.deck===0)for(let cabin=0;cabin<data.habitats.couples_per_disc;cabin++){
      const placement=data.habitats.cabin_bay_layout[cabin],theta=(placement.cell+.5)*Math.PI/6+placement.offset_m/(floors[0]-1.3),cabinId=`cabin-${d*data.habitats.couples_per_disc+cabin+1}`,bc=engine?burnCabinFrame(placement,cabin):null,t=bc?bc.t:roomTransform(floors[0]-1.3,theta);
      {const entry=addEntry(cabinId,t,true);if(bc)entry.burn=bc.burn;}
      if(surface)surfaceCabins[d].push({angle:theta,half:2.05/SURF_RC[0],r0:SURF_RC[0]-1.05,r1:SURF_RC[0]+SURF_HALF,name:`Berth bay ${cabin+1}`,id:cabinId});
      if(!surface){const rr=floors[0]-1.3,front=CABIN_FRONT_Z-AXIAL_SHIFT;deckInfo.get(`${d}-0`).cabins.push({angle:theta,half:2.05/rr,front,name:`Berth bay ${cabin+1}`,id:cabinId});if(placement.offset_m<0)deckInfo.get(`${d}-0`).walls.push({angle:(placement.cell+.5)*Math.PI/6,half:.035/rr,z0:HULL_Z0-AXIAL_SHIFT,z1:front});deckInfo.get(`${d}-0`).walls.push(...[-1,1].map(side=>({angle:theta+side*1.35/rr,half:.65/rr,z0:front-.04,z1:front+.04}))); }
      box(cabinId,[0,surface?1.16:1.12,0],[4,.04,3],COLORS.cabin,[0,0,0],1,t);
      if(furnish){
        wallSign(cabinId,`BERTHS ${d?'B':'A'} ${cabin+1}`,[0,surface||engine?-1.08:-1.45,1.647],t,.75);
        // Bunks run front-to-back along the side partitions, heads at the hull, leaving the doorway clear.
        for(let side of [-1,1]){
          const tb=q=>t([side*1.4-q[2],q[1],-.35+q[0]]);
          box(cabinId,[0,.9,0],[2.2,.4,.85],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,tb);
          box(cabinId,[-.7,.64,0],[.45,.12,.65],'#e6e6d5',[0,0,0],1,tb);
          box(cabinId,[.2,.64,0],[1.3,.07,.75],side<0?'#a3c0ae':'#c9af91',[0,0,0],1,tb);
          box(cabinId,[-1.08,.35,0],[.12,.8,.8],'#7199a0',[0,0,0],1,tb);
          box(cabinId,[-1.16,.25,0],[.04,.3,.45],'#b9ded6',[0,0,0],1,tb);
          for(let yy of [.95,.55])pipe(cabinId,[-1,yy,side*.35],[1,yy,side*.35],.02,'#d2d9cc',tb);
          // Upper berth on corner posts, with its own monitor and a guard rail on the open side.
          box(cabinId,[0,-.28,0],[2.2,.12,.85],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,tb).role='upper-berth';
          box(cabinId,[-.7,-.4,0],[.45,.12,.65],'#e6e6d5',[0,0,0],1,tb);box(cabinId,[.2,-.37,0],[1.3,.07,.75],side<0?'#a3c0ae':'#c9af91',[0,0,0],1,tb);
          for(const x of [-1.05,1.05])for(const z of [-.38,.38])pipe(cabinId,[x,-.3,z],[x,1.1,z],.025,'#b5beb1',tb);
          pipe(cabinId,[-.6,-.55,-side*.4],[1,-.55,-side*.4],.02,'#d2d9cc',tb);box(cabinId,[-1.16,-.75,0],[.04,.3,.45],'#b9ded6',[0,0,0],1,tb);
        }
        // Low cabinet sits under the porthole so the window stays clear.
        box(cabinId,[0,.72,-1.22],[1,.9,.5],'#a6b1a2',[0,0,0],1,t).role='cabin-wardrobe';
        for(let yy of [.4,.62,.85])box(cabinId,[0,yy,-.955],[.9,.025,.035],'#d7d9c9',[0,0,0],1,t);
        box(cabinId,[-1.3,.55,1.28],[1.1,.1,.5],'#c6b89a',[0,0,0],1,t).role='cabin-desk';
        box(cabinId,[-1.3,.03,1.53],[.9,.65,.05],'#638e96',[0,0,0],1,t);
        const cabinCeiling=surface?-2.05:engine?1.19-2.4:(floors[1]+.02)-(floors[0]-1.3),cabinFloor=surface?1.3:floors[0]-.11-(floors[0]-1.3);
        for(const side of (engine?[-1,1]:placement.offset_m<0?[-1]:[]))box(cabinId,[engine?side*1.95:0,(cabinCeiling+cabinFloor)/2,(HULL_Z0+CABIN_FRONT_Z)/2],[.07,cabinFloor-cabinCeiling,CABIN_FRONT_Z-HULL_Z0],'#9bada4',[0,0,0],1,engine?t:roomTransform(floors[0]-1.3,(placement.cell+.5)*Math.PI/6)).role='cabin-divider';
        // In the burn configuration each cabin carries its own front wall and door (the pod front wall is folded away).
        if(engine){for(const [x0,x1] of [[-1.95,-.7],[.7,1.95]])box(cabinId,[(x0+x1)/2,(cabinCeiling+cabinFloor)/2,CABIN_FRONT_Z],[x1-x0,cabinFloor-cabinCeiling,.08],'#a6b7ad',[0,0,0],1,t).role='room-front';box(cabinId,[0,(cabinCeiling+cabinFloor-2.1)/2,CABIN_FRONT_Z],[1.4,cabinFloor-2.1-cabinCeiling,.08],'#a6b7ad',[0,0,0],1,t).role='door-lintel';}
      }
    }
    // Check entry clearance in each room's own frame, including nearby fittings and partitions.
    const fittings=scene.meshes.filter(m=>m.id.startsWith(`bay-${d?'B':'A'}-`)||m.id.startsWith('cabin-')&&Math.floor((+m.id.slice(6)-1)/CABINS_PER_DISC)===d)
      .filter(m=>!['inflatable-envelope','folding-deck','window-wall','porthole-glass','porthole-frame'].includes(m.role))
      .map(m=>({mesh:m,lo:[0,1,2].map(i=>Math.min(...m.vertices.map(p=>p[i]))),hi:[0,1,2].map(i=>Math.max(...m.vertices.map(p=>p[i])))}));
    for(const {room,t,privateRoom} of entries){
      const origin=t([0,0,0]),axes=[norm(room.forward),norm(room.up),norm(cross(room.forward,room.up))],project=p=>axes.map(axis=>dot(sub(p,origin),axis));
      const bounds=fittings.filter(b=>origin.every((v,i)=>v>b.lo[i]-3&&v<b.hi[i]+3)).map(({mesh:m})=>{const points=m.vertices.map(project);return {lo:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),hi:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};});
      const zs=privateRoom?[1,.9,1.1]:[AISLE_Z,AISLE_Z-.2,AISLE_Z+.2];
      let found=false;
      for(const z of zs){for(const x of privateRoom?[0,.3,-.3]:[-1.5,1.5,-2,2,-1,1,-2.5,2.5,0]){
        const eye=t([x,-.1,z]),p=project(eye);
        if(bounds.some(b=>p.every((v,i)=>v>b.lo[i]-.2&&v<b.hi[i]+.2)))continue;
        room.eye=eye;
        // Recompute the radial frame at the selected position on the curved deck.
        room.up=sub(t([x,-1,z]),t([x,0,z]));room.forward=sub(t([x+1,0,z]),t([x,0,z]));
        if(privateRoom&&!surface){const fn=norm(room.forward),rn=norm(cross(fn,norm(room.up))),into=norm(sub(t([x,-.1,z-1]),t([x,-.1,z])));room.yaw=Math.atan2(dot(into,rn),dot(into,fn));}
        found=true;break;
      }if(found)break;}
    }
    if(!surface){{const fixed=q=>body(place(d,q)),frameZ=Math.abs(L.service_spine_z_offset_m_study-DISC_Z[d])-2,b0=HUB_HALF,b1=C?frameZ+1.7:7.75;const sleeve=cylinder(id,[0,0,(b0+b1)/2],1.4,b1-b0,'#94a9a3','z',1,fixed);sleeve.faces?.splice(-2);sleeve.role='spin-bearing';for(const z of [b0+.1,(b0+b1)/2,b1-.1])torus(id,[0,0,z],1.5,.12,'#c3bf9f','z',fixed).role='spin-bearing';for(const sx of [-6,6])for(const y of [-2,2])pipe('structure',[sx,y,C?frameZ:6],[0,y*.8,C?(b0+b1)/2:b0+1],.15,'#a8b8ac',fixed);}}
    else {
      sector(id,.5,ROUT,0,2*Math.PI,.9,'#9d9d8a',1,q=>[cx+q[0],.4+q[2],SURF_Z[d]+q[1]],192).role='habitat-foundation';

    }
  }
  if(ship&&data.settlement.cruise_agriculture.active)data.settlement.cruise_agriculture.cruise_centres_m.forEach((p,i)=>{farmBay(p,body,i);pipe('farm',[p[0],0,8],[p[0],Math.sign(p[1])*6.5,p[2]],.35,'#a2b3a6');});
  if(surface){
    // ---- Pressurised links at the ring floor height (1.75 m): habitat A to B, and habitat A to the greenhouse spine.
    // Destination bounds remain rectangular; the pressure tunnels follow smooth centrelines.
    const [ax,bx]=DISC_X,[az,bz]=SURF_Z,hz=az,gx=ax+ROUT*Math.cos(GH_ANGLE),xm=(ax+bx)/2,spineZ=-72,hallR=6,hallL=16,hallX=[-96,-82,-68,-54];
    const ringDepth=y=>Math.sqrt(ROUT*ROUT-y*y);
    const rects=[
      {x0:ax+Math.min(ringDepth(LINK_Z-LINK_HW-az),ringDepth(LINK_Z+LINK_HW-az)),x1:bx-Math.min(ringDepth(LINK_Z-LINK_HW-bz),ringDepth(LINK_Z+LINK_HW-bz)),z0:LINK_Z-LINK_HW,z1:LINK_Z+LINK_HW,open:['x0','x1'],name:'A–B pressurised link'},
      {x0:gx-LINK_HW,x1:gx+LINK_HW,z0:spineZ-LINK_HW,z1:hz-Math.min(...[gx-ax-LINK_HW,gx-ax+LINK_HW].map(ringDepth)),open:'z1',name:'Greenhouse link'},
      {x0:hallX[0]-hallR-.5,x1:gx+LINK_HW,z0:spineZ-LINK_HW,z1:spineZ+LINK_HW,name:'Greenhouse spine'}];
    // Rounded pressure tunnels follow a tangent bend instead of a square elbow.
    const bend=3,elbow=[gx-bend,spineZ+bend],greenPath=[[rects[2].x0,spineZ],[gx-bend,spineZ]];
    for(let i=1;i<=12;i++){const a=-Math.PI/2+i*Math.PI/24;greenPath.push([elbow[0]+bend*Math.cos(a),elbow[1]+bend*Math.sin(a)]);}
    greenPath.push([gx,rects[1].z1+.6]);
    const paths=[[[rects[0].x0-.6,LINK_Z],[rects[0].x1+.6,LINK_Z]],greenPath];
    function pressureTunnel(path,closedStart=false){
      const v=[],f=[],profile=state.detail==='overview'?12:24,cy=3.15,ry=1.6,rx=1.25,frames=path.map((p,i)=>{
        const dir=norm([path[Math.min(i+1,path.length-1)][0]-path[Math.max(0,i-1)][0],0,path[Math.min(i+1,path.length-1)][1]-path[Math.max(0,i-1)][1]]);
        return {p:[p[0],cy,p[1]],side:[-dir[2],0,dir[0]],dir};
      }),shape=(frame,a,scale=1,offset=0)=>add(add(frame.p,mul(frame.dir,offset)),add(mul(frame.side,rx*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**(2/3)*scale),[0,ry*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**(2/3)*scale,0]));
      const dense=[];for(let i=0;i<frames.length-1;i++){const a=frames[i],b=frames[i+1],n=Math.max(1,Math.ceil(Math.hypot(...sub(b.p,a.p))/.5));for(let j=0;j<n;j++)dense.push({p:add(a.p,mul(sub(b.p,a.p),j/n)),side:norm(add(mul(a.side,1-j/n),mul(b.side,j/n))),dir:a.dir});}dense.push(frames.at(-1));
      for(const frame of dense)for(let j=0;j<profile;j++)v.push(shape(frame,j/profile*2*Math.PI));
      for(let i=0;i<dense.length-1;i++)for(let j=0;j<profile;j++){
        const ids=[i*profile+j,i*profile+(j+1)%profile,(i+1)*profile+(j+1)%profile,(i+1)*profile+j],c=[0,1,2].map(k=>ids.reduce((n,id)=>n+v[id][k],0)/4);
        if(path===greenPath&&hallX.some(x=>Math.abs(c[0]-x)<1.02)&&Math.abs(c[2]-spineZ)>.65&&c[1]>LINK_FLOOR&&c[1]<LINK_FLOOR+2.3)continue;
        f.push(ids);
      }
      if(closedStart){const base=v.length;for(let k=0;k<=8;k++)for(let j=0;j<profile;j++){const a=k*Math.PI/16;v.push(shape(frames[0],j/profile*2*Math.PI,Math.cos(a),-rx*Math.sin(a)));}for(let k=0;k<8;k++)for(let j=0;j<profile;j++)f.push([base+k*profile+j,base+k*profile+(j+1)%profile,base+(k+1)*profile+(j+1)%profile,base+(k+1)*profile+j]);}
      const shell=smooth(mesh('structure',v,f,'#a9b3ae',1,p=>p));shell.role='hull-boundary';shell.systemRole='pressurised-corridor';shell.centreline=path;
      const fv=[],ff=[];for(const frame of dense){fv.push(add(frame.p,add(mul(frame.side,-.85),[0,LINK_FLOOR-cy,0])),add(frame.p,add(mul(frame.side,.85),[0,LINK_FLOOR-cy,0])));}for(let i=0;i<dense.length-1;i++)ff.push([i*2,i*2+1,i*2+3,i*2+2]);mesh('structure',fv,ff,'#9ea596',1,p=>p).role='corridor-floor';
      for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1],mid=[(a[0]+b[0])/2,.8,(a[1]+b[1])/2],len=Math.hypot(b[0]-a[0],b[1]-a[1]);box('structure',mid,[1.8,1.6,len],'#7b6a5c',[0,Math.atan2(b[0]-a[0],b[1]-a[1]),0],1,p=>p).role='foundation';}
    }
    for(const path of paths)pressureTunnel(path,path===greenPath);
    // Greenhouse: eight glazed vault halls on foundations either side of the spine. The glazing transmits Proxima's light;
    // it is drawn semi-opaque so the material reads as a surface.
    const glazing='#d9e6e2',glazingOpacity=.42,hallRects=[];
    for(let bay=0;bay<8;bay++){
      const x=hallX[bay%4],side=bay<4?1:-1,z=spineZ+side*(LINK_HW+hallL/2),place=q=>add(q,[x,LINK_FLOOR,z]),near=-side*hallL/2;
      box('farm',[x,LINK_FLOOR/2-.06,z],[2*hallR+.4,LINK_FLOOR-.12,hallL+.4],'#7b6a5c',[0,0,0],1,p=>p).role='foundation';
      box('farm',[0,-.06,0],[2*hallR,.12,hallL],'#9ea596',[0,0,0],1,place).role='greenhouse-floor';
      hallRects.push({x0:x-hallR,x1:x+hallR,z0:z-hallL/2,z1:z+hallL/2,name:`Greenhouse hall ${bay+1}`,id:`greenhouse-${bay+1}`});
      const shell=vault('farm',hallL,hallR,glazing,glazingOpacity,place,18,side>0?[0,1]:[1,0]);shell.role='farm-pressure-envelope';shell.farmBay=bay;shell.builtLocally=true;
      // End wall toward the spine, glazed, with a 2 m x 2.3 m doorway.
      const ev=[],ef=[],n=16;for(let i=0;i<n;i++){const x0=-hallR+2*hallR*i/n,x1=-hallR+2*hallR*(i+1)/n,h=x=>Math.sqrt(Math.max(0,hallR*hallR-x*x)),door=Math.abs((x0+x1)/2)<1,b=ev.length,y0=door?2.3:0;
        if(h(x0)<=y0&&h(x1)<=y0)continue;ev.push([x0,y0,near],[x1,y0,near],[x1,Math.max(y0,h(x1)),near],[x0,Math.max(y0,h(x0)),near]);ef.push([b,b+1,b+2,b+3]);}
      mesh('farm',ev,ef,glazing,glazingOpacity,place).role='hull-boundary';
      // Arched ribs carry the glazing.
      for(let k=0;k<=4;k++){const zz=-hallL/2+hallL*k/4;for(let i=0;i<9;i++){const a0=Math.PI*i/9,a1=Math.PI*(i+1)/9;pipe('farm',[hallR*Math.cos(a0),hallR*Math.sin(a0),zz],[hallR*Math.cos(a1),hallR*Math.sin(a1),zz],.07,'#6f7c7a',place).role='greenhouse-rib';}}
      // Trays run along the hall; the lowest tier sits 0.5 m above the floor.
      farmBay([0,0,0],q=>place(add(rotate(q,[0,Math.PI/2,0]),[0,2.3,0])),bay,true);
      // Entry just inside the door, looking down the hall.
      (scene.rooms??=[]).push({id:`greenhouse-${bay+1}`,select:'farm',label:`Greenhouse hall ${bay+1}`,eye:[x,LINK_FLOOR+1.35,z-side*(hallL/2-1.5)],up:[0,1,0],forward:[0,0,side]});
    }
    // ---- Power island: antimatter converter in a regolith-bermed hall at a fixed standoff, hot-loop radiators,
    // switchyard, critical-load solar backup and a buried cable to the settlement substation.
    const P=data.power,PX=183,PZ=104,stand=Math.min(...DISC_X.map(cx=>Math.hypot(PX-cx,PZ-hz)))-ROUT;
    box('power',[PX,3.5,PZ],[18,7,12],'#8d877c',[0,0,0],1,p=>p).role='converter-hall';
    {const v=[],f=[];for(const [hx,hzz,y] of [[17,13,0],[10,7.3,6.5]])for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]])v.push([PX+sx*hx,y,PZ+sz*hzz]);for(let i=0;i<4;i++)f.push([i,(i+1)%4,4+(i+1)%4,4+i]);mesh('power',v,f,'#7a5c47',1,p=>p).role='regolith-berm';}
    cylinder('power',[PX,7.1,PZ],1.6,.25,'#5f6d6f','y',1,p=>p).role='containment-vault-hatch';
    for(const dx of [-5,0,5])box('power',[PX+dx,8.2,PZ-3],[2.2,2.2,2.2],'#9aa59d',[0,0,0],1,p=>p).role='converter-heat-exchanger';
    // Hot loop: two-sided 4 x 12 m panels at about 600 K, sized to the converter's waste heat.
    const panelArea=2*4*12,panels=Math.ceil(P.ideal_hot_loop_emitting_area_m2_at_600K/panelArea);
    for(let i=0;i<panels;i++){const x=158+4.4*(i%Math.ceil(panels/2)),z=PZ+30+Math.floor(i/Math.ceil(panels/2))*14;
      box('radiators',[x,6.5,z],[4,12,.12],'#354c53',[0,0,0],1,p=>p).role='surface-radiator-panel';pipe('radiators',[x,.5,z],[x,.5,z-6],.12,'#be9470',p=>p);}
    for(const z of [PZ+30,PZ+44])pipe('radiators',[156,.6,z],[158+4.4*Math.ceil(panels/2),.6,z],.22,'#be9470',p=>p).role='radiator-header';
    pipe('radiators',[PX,.6,PZ+6],[PX,.6,PZ+44],.25,'#be9470',p=>p);
    for(let i=0;i<3;i++){box('power',[PX-22,1.6,PZ-6+i*6],[3.5,3.2,3],'#6d7f80',[0,0,0],1,p=>p).role='switchyard-transformer';for(const dz of [-.8,.8])cylinder('power',[PX-22,3.8,PZ-6+i*6+dz],.12,1.2,'#c7b98f','y',1,p=>p);}
    for(let x=148;x<204;x+=10)box('power',[x,1.5,PZ-48],[8,.15,10],'#3f5a6b',[.15,0,0],1,p=>p).role='backup-solar';
    // Exclusion fence around the converter.
    for(let i=0;i<36;i++){const a=i/36*2*Math.PI,b=(i+1)/36*2*Math.PI;pipe('power',[PX+48*Math.cos(a),0,PZ+48*Math.sin(a)],[PX+48*Math.cos(a),1.8,PZ+48*Math.sin(a)],.05,'#b7a77f',p=>p).role='exclusion-fence';line('power',[PX+48*Math.cos(a),1.6,PZ+48*Math.sin(a)],[PX+48*Math.cos(b),1.6,PZ+48*Math.sin(b)],'#d4b77a',p=>p);}
    // Buried cable to the substation beside the habitat link.
    box('power',[xm,1.4,-30],[4,2.8,3],'#6d7f80',[0,0,0],1,p=>p).role='settlement-substation';
    line('power',[PX-22,.3,PZ],[100,.3,8],'#c99e67',p=>p,2);line('power',[100,.3,8],[44,.3,-4],'#c99e67',p=>p,2);line('power',[44,.3,-4],[xm,.3,-30],'#c99e67',p=>p,2);
    scene.powerIsland={thermalMW:P.source_power_MW_at_reference_load,electricalMW:P.working_operating_load_MW_not_selected_generator_rating,standoffM:stand,radiatorPanels:panels,hotLoopAreaM2:panels*panelArea};
    for(let i=0;i<2;i++)cargoModule([44,4,-55-i*12],p=>p);
    // ---- Inflatable residences: two closed two-storey cylinders unpacked from the disc lofts, one behind each disc.
    // Together with the discs' berth bays they house all 32 people awake; each joins its disc through a short tunnel.
    const SI=data.design.surface_inflatables,IS=L.surface_inflatables_study,IR=SI.radius_m,IL=SI.cylinder_length_m,resRects=[];
    for(const [k,cx] of DISC_X.entries()){
      const cz=SURF_Z[k]+ROUT+5.5+IR,cy=LINK_FLOOR-IS.lower_floor_y_m,z0=SURF_Z[k]+Math.sqrt(ROUT*ROUT-RES_X*RES_X),skin=state.cutaway?.16:1,id='inflatable';
      // World frame at the module centre; down() is the same frame with y measured downward, as the furniture helpers expect.
      const t=q=>add(q,[cx,cy,cz]),down=q=>t([q[0],-q[1],q[2]]),lowerY=-IS.lower_floor_y_m,upperY=-IS.upper_floor_y_m,chord=y=>2*Math.sqrt(IR*IR-y*y);
      const hull=cylinder(id,[0,0,0],IR,IL,COLORS.inflatable,'x',skin,t);hull.faces?.splice(-2);hull.role='inflatable-habitat-shell';hull.residence=k+1;
      pressureCaps(id,[0,0,0],IR,IL/2,IR,COLORS.inflatable,skin,t,0);
      for(let x=-IL/2;x<=IL/2+.01;x+=2)torus(id,[x,0,0],IR+.03,.05,'#b3a279','x',t).role='restraint-hoop';
      for(let j=0;j<12;j++){const a=j*Math.PI/6;pipe(id,[-IL/2,IR*Math.cos(a)*1.01,IR*Math.sin(a)*1.01],[IL/2,IR*Math.cos(a)*1.01,IR*Math.sin(a)*1.01],.035,'#b3a279',t).role='restraint-strap';}
      for(const x of [-IL/2+1,IL/2-1])for(const side of [-1,1]){pipe(id,[x,-IR*.55,side*IR*.84],[x,-cy+.1,side*(IR+1.3)],.04,'#8d7f5e',t).role='ground-anchor';box(id,[x,-cy+.1,side*(IR+1.3)],[.5,.2,.5],'#7b6a5c',[0,0,0],1,t);}
      // Lower deck: dining and commons for sixteen, a galley wall and hygiene; upper deck: eight couple cabins.
      box(id,[0,lowerY+.06,0],[IL+1.5,.12,chord(IS.lower_floor_y_m)-.2],'#b9c1aa',[0,0,0],1,down).role='residence-floor';
      box(id,[-.9,upperY+.05,0],[IL-.3,.1,chord(IS.upper_floor_y_m)-.2],'#a7b4a7',[0,0,0],1,down).role='residence-floor';
      for(const x of [-4.5,-1.5,1.5,4.5]){table(id,[x,lowerY-.75,-1.25],1.7,down);for(const dx of [-.45,.45])for(const sz of [-1,1])seat(id,[0,0,0],q=>down(add([x+dx,lowerY-.48,-1.25+sz*.95],rotate(q,[0,sz>0?Math.PI:0,0]))));}
      for(const x of [-4,-1.6,.8]){box(id,[x,lowerY-.95,2.55],[2.2,1.9,.6],'#dde0d2',[0,0,0],1,down).role='galley-unit';box(id,[x,lowerY-.48,2.2],[2.2,.06,.75],'#b9bba6',[0,0,0],1,down);}
      for(const x of [3.6,5.2]){box(id,[x,lowerY-1.05,2.2],[1.4,2.1,.06],'#b8c9be',[0,0,0],1,down).role='hygiene-cubicle';box(id,[x+.7,lowerY-1.05,2.6],[.06,2.1,.8],'#b8c9be',[0,0,0],1,down);cylinder(id,[x,lowerY-.3,2.65],.28,.55,'#d4d9cf','y',1,down);}
      for(const side of [-1,1])for(const x of [-5.4,-2.4,.6,3.6]){
        box(id,[x,upperY-.25,side*2.1],[1.95,.4,1.45],side<0?'#7eb6aa':'#d2a079',[0,0,0],1,down).role='couple-bed';box(id,[x-.7,upperY-.5,side*2.1],[.4,.12,1.2],'#e6e6d5',[0,0,0],1,down);
        box(id,[x+1.5,upperY-.95,side*1.9],[.06,1.9,2.6],'#c9c2a8',[0,0,0],1,down).role='fabric-partition';box(id,[x+.9,upperY-.5,side*.72],[1.2,1,.05],'#c9c2a8',[0,0,0],1,down).role='fabric-partition';
        box(id,[x-.2,upperY-.45,side*3],[.9,.9,.4],'#a6b1a2',[0,0,0],1,down).role='cabin-locker';}
      for(const z of [-.25,.25])pipe(id,[IL/2-.4,lowerY,z],[IL/2-.4,upperY-1,z],.035,'#9fb2ad',down).role='access-ladder';
      for(let y=lowerY-.3;y>upperY;y-=.3)pipe(id,[IL/2-.4,y,-.25],[IL/2-.4,y,.25],.025,'#c3c6b2',down);
      torus(id,[RES_X,-lowerY+1.4,-IR+.25],1.3,.1,'#8a9391','z',t).role='berthing-ring';
      pressureTunnel([[cx+RES_X,z0-.6],[cx+RES_X,cz-IR+.9]]);
      rects.push({x0:cx+RES_X-LINK_HW,x1:cx+RES_X+LINK_HW,z0:z0-.4,z1:cz-IR+1,name:`Residence ${k+1} link`});
      resRects.push({x0:cx-IL/2-IR+.8,x1:cx+IL/2+IR-.8,z0:cz-3,z1:cz+3,name:`Residence ${k+1}`,id:`residence-${k+1}`});
      scene.rooms.push({id:`residence-${k+1}`,select:'inflatable',label:`Residence ${k+1}`,eye:[cx-5.6,LINK_FLOOR+1.35,cz+.6],up:[0,1,0],forward:[1,0,0]});
      scene.labels.push({p:[cx,cy+IR+3,cz],text:`INFLATABLE RESIDENCE ${k+1} · ${Math.round(SI.floor_area_m2_per_module.lower+SI.floor_area_m2_per_module.upper)} m²`});
    }
    scene.inflatables={count:SI.count,grossFloorAreaM2:SI.gross_floor_area_m2,hardwareKg:SI.hardware_kg};
    scene.surfaceMap={habitats:[0,1].map(d=>({name:d?'B':'A',centre:[DISC_X[d],SURF_Z[d]],rings:[...SURF_RC.map((rc,deck)=>({deck,r0:rc-SURF_HALF,r1:rc+SURF_HALF})),{deck:1,r0:0,r1:SURF_CORE}],rooms:surfaceRooms[d],cabins:surfaceCabins[d]})),
      corridors:rects.map(({x0,x1,z0,z1,name})=>({x0,x1,z0,z1,name})),halls:[...hallRects,...resRects],rover:{x0:86.5,x1:93.5,z0:-44.3,z1:-39.7}};
    for(const room of scene.rooms)room.surfaceMap=scene.surfaceMap;
    scene.driveObstacles=[...scene.surfaceMap.habitats.map(h=>({x:h.centre[0],z:h.centre[1],r:24})),...[...hallRects,...resRects].map(r=>({x0:r.x0-4.5,x1:r.x1+4.5,z0:r.z0-4.5,z1:r.z1+4.5})),...rects.map(r=>({x0:r.x0-4.5,x1:r.x1+4.5,z0:r.z0-4.5,z1:r.z1+4.5})),{x0:33,x1:55,z0:-76,z1:-46},{x:183,z:104,r:77}];
    const roverOrigin=[90,0,-42],roverTransform=p=>add(p,roverOrigin);
    roverCabin([0,3.5,0],roverTransform);
    // The rover cabin can be entered; its floor is 1.55 m below the hull axis.
    scene.rooms.push({id:'rover',select:'rover',label:'Crewed rover cabin',driver:true,eye:add(roverOrigin,[2.3,4.05,0]),up:[0,1,0],forward:[1,0,0]});
    box('rover',[0,1.2,0],[8,.6,5],'#8f9c91',[0,0,0],1,roverTransform);
    for(const x of [-3,0,3])for(const z of [-2.6,2.6]){cylinder('rover',[x,1,z],.85,.5,'#374548','z',1,roverTransform);cylinder('rover',[x,1,z+Math.sign(z)*.26],.5,.05,'#adb8a9','z',1,roverTransform);pipe('rover',[x,1,z],[0,1.5,0],.1,'#a2afa8',roverTransform);}
    // The two robotic micro-rovers, deployed (modelled z-up, turned so z is vertical on the ground).
    for(const x of [-5,4])microRover([0,0,0],q=>add(rotate(q,[-Math.PI/2,0,0]),[x,0,-80]));
    scene.labels.push({p:[ax,8,az],text:'HABITAT A / REDEPLOYED'},{p:[bx,8,bz],text:'HABITAT B / REDEPLOYED'},{p:[-75,10,spineZ-22],text:'GREENHOUSE · 8 GLAZED HALLS'},{p:[xm,7,LINK_Z],text:'A–B PRESSURISED LINK'},{p:[gx,7,(spineZ+az-19)/2],text:'GREENHOUSE LINK'},{p:[90,8,-42],text:'CREWED ROVER'},{p:[44,11,-61],text:'CARGO MODULES'},{p:[xm,5,-30],text:'SUBSTATION'},{p:[PX,14,PZ],text:`POWER ISLAND · ${scene.powerIsland.thermalMW} MW ANTIMATTER CONVERTER → ${scene.powerIsland.electricalMW} MWe · ${Math.round(scene.powerIsland.standoffM/10)*10} m STANDOFF, BERMED`});
  }else{
    scene.labels.push({p:body(place(0,[0,24,0])),text:'HABITAT A'},{p:body(place(1,[0,-24,0])),text:'HABITAT B'});
  }
  if(state.dimensions){
    if(ship)scene.dimensions.push({a:body([GEO.screen.catcher_x,-20,8]),b:body([GEO.source_x+14,-20,8]),text:`${Math.round(GEO.ship_length_m)} m · BOW PLATE TO NOZZLE`},{a:body([GEO.screen.x,-20,8]),b:body([GEO.screen.catcher_x,-20,8]),text:`${Math.round(GEO.screen.catcher_x-GEO.screen.x)} m · SCREEN MAST`},
      {a:body([L.disc_centres_x_m[0],-HAB.envelope_radius_m,-5]),b:body([L.disc_centres_x_m[0],HAB.envelope_radius_m,-5]),text:`DIAMETER ${(HAB.envelope_radius_m*2).toFixed(1)} m`});
    if(surface)scene.dimensions.push({a:[-96,.2,-132],b:[-42,.2,-132],text:'GREENHOUSE HALLS: GEOMETRY STUDY'});
  }
  if(state.showRadiators===false){scene.meshes=scene.meshes.filter(m=>m.id!=='radiators');scene.lines=scene.lines.filter(l=>l.id!=='radiators');}
  for(const m of scene.meshes){
    if(m.material===undefined)m.material=m.role==='porthole-glass'||m.id==='radiators'||['#507c8a','#739eaa','#638e96'].includes(m.color)?5:m.role==='folding-deck'||(m.id.startsWith('cabin-')&&m.color===COLORS.cabin)?4:m.id==='tanks'?3:m.role==='seat'||['#7eb6aa','#d2a079','#e6e6d5','#a3c0ae','#c9af91'].includes(m.color)?2:0;
  }
  let world=null;
  if(ship){
    const floors=data.habitats.geometry_study_not_selected_dimensions.deck_floor_radii_m,x=DISC_X[0],z0=DISC_Z[0]+HUB_HALF,z1=DISC_Z[1]-HUB_HALF,length=z1-z0;
    tube('transfer',[x,0,z0],[0,0,1],[1,0,0],[0,1,0],TUBE_R,Array.from({length:Math.ceil(length/.5)+1},(_,i)=>Math.min(length,i*.5)),24,'#b9c6bf',body,p=>p[0]>0&&Math.hypot(p[1],p[2]-8)<.65);
    for(let z=z0+1.5;z<z1-1;z+=1.5)torus('transfer',[x,0,z],TUBE_R-.06,.03,'#d0cdb4','z').role='corridor-handhold';
    world={segments:[...[0,1].map(h=>{const a=place(h,[0,0,-HUB_HALF+.4]),b=place(h,[0,0,HUB_HALF-.1]);return {a,b,r:HUB_R-.4};}),{a:[x,0,z0-.5],b:[x,0,z1+.5],r:TUBE_R-.25}],
      habitats:Object.fromEntries([0,1].map(h=>[h?'B':'A',{centre:place(h,[0,0,0]),axis:sub(place(h,[0,0,1]),place(h,[0,0,0])),decks:[0,1,2].map(k=>deckInfo.get(`${h}-${k}`)??null),ladders:ladders.get(h)??[],hubTop:HUB_HALF,hubRadius:HUB_R-.4,hubGravity:L.spin_gravity_g*(HUB_R-1)/floors[0]}]))};
    crewModules.sort((a,b)=>a.x0-b.x0);
    const segments=[];let start=0;
    for(const module of crewModules){
      const a=[start,0,8],b=[module.x0+.02,0,8],length=b[0]-a[0];
      const passage=tube('transfer',a,[1,0,0],[0,1,0],[0,0,1],.7,start===0?[0,.5,1,length]:[0,length],24,'#b9c6bf',body,p=>start===0&&p[0]<1&&Math.hypot(p[0],p[1])<TUBE_R);passage.role='crew-passage';
      segments.push({a:[start-.1,0,8],b:[module.x0+.1,0,8],r:.54,name:'Crew transfer passage'});
      segments.push({a:[module.x0-.05,0,8],b:[module.x1+.05,0,8],r:module.r-.3,name:module.name,id:module.id});
      (scene.rooms??=[]).push({id:module.id,select:module.select,label:module.name,pressurizedModule:true,eye:[...module.centre],up:[0,1,0],forward:[1,0,0]});
      start=module.x1-.02;
    }
    world.segments.push(...segments);scene.crewModules=crewModules;
    scene.world=world;
    for(const room of scene.rooms??[])if(room.pressurizedModule)room.gravity={type:'float',world};
  }
  if(state.mode==='cruise')for(const room of scene.rooms??[]){
    if(room.pressurizedModule)continue;
    const habitat=room.id.startsWith('cabin-')?(+room.id.slice(6)<=CABINS_PER_DISC?0:1):(room.id.split('-')[1]==='A'?0:1);
    const centre=place(habitat,[0,0,0]);
    const deck=room.id.startsWith('cabin-')?0:+room.id.split('-')[2];
    room.gravity={world,habitat:habitat?'B':'A',deck,decks:[0,1,2].map(k=>deckInfo.get(`${habitat}-${k}`)??null),ladders:ladders.get(habitat)??[],walls:deckInfo.get(`${habitat}-${deck}`)?.walls??[],centre,axis:sub(place(habitat,[0,0,1]),centre),radius:Math.hypot(room.eye[0]-centre[0],room.eye[1]),axialMin:-L.disc_axial_depth_m/2+.3,axialMax:L.disc_axial_depth_m/2-.3};
  }
  if(state.mode==='engine')for(const room of scene.rooms??[]){const b=room.burn;if(!b)continue;const info=burnRooms.get(b.room),fr=discFrames[b.d];
    room.gravity={type:'linear',roomId:room.id,habitat:b.d?'B':'A',frame:{origin:[...fr.origin],down:[...fr.down],u:[...fr.u],w:[...fr.w]},levels:info.levels,ladders:info.ladders,level:b.level,wMin:-L.disc_axial_depth_m/2+.3,wMax:L.disc_axial_depth_m/2-.3,g:data.design.nominal.main_acceleration_g,roomName:b.cabinName??info.name};}
  if(state.flat&&ship){
    const turn=p=>rotate(p,[Math.PI/2,0,0]);
    for(const m of scene.meshes){m.vertices=m.vertices.map(turn);if(m.normals)m.normals=m.normals.map(turn);}
    for(const l of scene.lines){l.a=turn(l.a);l.b=turn(l.b);}
    for(const l of scene.labels)l.p=turn(l.p);
    for(const lock of scene.airlocks??[])for(const key of ['centre','inner','outer'])lock[key]=turn(lock[key]);
    for(const r of scene.rooms??[]){r.eye=turn(r.eye);r.up=turn(r.up);r.forward=turn(r.forward);if(r.gravity?.centre){r.gravity.centre=turn(r.gravity.centre);r.gravity.axis=turn(r.gravity.axis);}if(r.gravity?.frame){const fr=r.gravity.frame;for(const k of ['origin','down','u','w'])fr[k]=turn(fr[k]);}}
    if(world){for(const g of world.segments){g.a=turn(g.a);g.b=turn(g.b);}for(const h of Object.values(world.habitats)){h.centre=turn(h.centre);h.axis=turn(h.axis);}}
    scene.flat=true;
  }
  // ---- Sky. Ship views use real star positions rotated so Proxima lies dead ahead (-x), with relativistic
  // aberration and Doppler brightening at the ship's speed. The settlement has its own daytime sky.
  const starDir=(ra,dec)=>{const a=ra*Math.PI/12,d=dec*Math.PI/180;return [Math.cos(d)*Math.cos(a),Math.sin(d),Math.cos(d)*Math.sin(a)];};
  const skyDisc=(centre,r,color,opacity=1,n=24)=>{const nn=norm(centre),u=norm(cross(nn,Math.abs(nn[1])<.9?[0,1,0]:[1,0,0])),w=cross(nn,u);const m=mesh('sky',Array.from({length:n},(_,i)=>add(centre,add(mul(u,r*Math.cos(i/n*2*Math.PI)),mul(w,r*Math.sin(i/n*2*Math.PI))))),[Array.from({length:n},(_,i)=>i)],color,opacity,p=>p);m.material=-2;return m;};
  const starSize=mag=>Math.min(40,12*Math.pow(10,-mag*.13));
  if(ship){
    const engineView=state.mode==='engine',cfg=data.mission_config,c=299792458,LY_AU=63241.1;
    // Engine view: halfway through the departure burn (proper acceleration, proper time). Cruise view: midpoint coast at peak speed.
    const accel=data.design.nominal.main_acceleration_g*9.80665,tau=data.trajectory.each_burn_onboard_days*86400/2,rapidity=accel*tau/c;
    const beta=engineView?Math.tanh(rapidity):data.trajectory.peak_speed_c,gamma=1/Math.sqrt(1-beta*beta),ahead=[-1,0,0];
    const burnDistanceAU=c*c/accel*(Math.cosh(rapidity)-1)/1.495978707e11,PROXIMA_LY=4.2465,midLY=PROXIMA_LY/2;
    const P=starDir(14.4953,-62.679),k=norm(cross(P,ahead)),cosA=dot(P,ahead),sinA=Math.hypot(...cross(P,ahead));
    const toShip=n=>add(add(mul(n,cosA),mul(cross(k,n),sinA)),mul(k,dot(k,n)*(1-cosA)));
    const observe=n=>{const ct=dot(n,ahead),ctp=(ct+beta)/(1+beta*ct),perp=sub(n,mul(ahead,ct)),pl=Math.hypot(...perp);
      const dir=pl<1e-9?(ct>0?ahead:mul(ahead,-1)):add(mul(ahead,ctp),mul(perp,Math.sqrt(Math.max(0,1-ctp*ctp))/pl));return {dir,dmag:-10*Math.log10(gamma*(1+beta*ct))};};
    const star=(n,mag,color='#e4eaf0',glow=0)=>{const o=observe(n),m=mag+o.dmag,centre=mul(o.dir,5000),size=starSize(m);
      const s=skyDisc(centre,size,color,1,4);s.role='star';s.apparentMagnitude=m;
      if(glow)for(const [r,a] of [[size*2.2,.12],[size*5,.035]])skyDisc(mul(o.dir,5000+r*.01),r,color,a,24).role='star-glow';return s;};
    const AB=[14.66,-60.835];
    for(const [ra,dec,mag] of brightStars){if(!engineView&&Math.abs(ra-AB[0])<.02&&Math.abs(dec+60.8)<.1)continue;star(toShip(starDir(ra,dec)),mag);}
    if(engineView){
      // The Sun ~290 AU behind: about magnitude -14, drawn just off the exhaust axis so the beam does not hide it.
      const sunMag=-26.74+5*Math.log10(burnDistanceAU),s=star(norm([1,.03,.015]),sunMag,'#fff3dc',1);s.role='sun';s.distanceAU=burnDistanceAU;
    }else{
      // Halfway: Alpha Centauri A+B ahead (Proxima itself is ~mag 9.6, invisible) and the Sun behind.
      const shipPos=mul(P,midLY),ab=mul(starDir(...AB),4.37),toAB=sub(ab,shipPos),abLY=Math.hypot(...toAB);
      star(toShip(norm(toAB)),-.27+5*Math.log10(abLY/4.37),'#fff1d8',1).role='alpha-centauri';
      const sun=star(toShip(mul(P,-1)),-26.74+5*Math.log10(midLY*LY_AU),'#fff3dc',1);sun.role='sun';
    }
    // Faint background field (positions only), aberrated like the bright stars.
    let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
    for(const [count,size,color] of [[900,6,'#7d8790'],[300,9,'#b9c3cc']]){const v=[],f=[];
      for(let i=0;i<count;i++){const y=2*random()-1,phi=2*Math.PI*random(),q=Math.sqrt(1-y*y),n=observe([q*Math.cos(phi),y,q*Math.sin(phi)]).dir,cc=mul(n,5000),u=norm(cross(n,Math.abs(n[1])<.9?[0,1,0]:[1,0,0])),w=cross(n,u),b=v.length;
        v.push(add(cc,mul(u,-size)),add(cc,mul(w,size)),add(cc,mul(u,size)),add(cc,mul(w,-size)));f.push([b,b+1,b+2,b+3]);}
      mesh('sky',v,f,color,1,p=>p).material=-2;}
  }
  if(surface){
    const env=data.settlement.proxima_b_sky,C0=SETTLEMENT_CENTRE,terrain=settlementTerrain;
    const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),toHex=a=>'#'+a.map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0')).join(''),lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
    // Terrain: a graded pad under the settlement, then dunes and low hills rising to distant ridges.
    // Wind and a thin atmosphere erode small craters, so only two old, softened ones remain in view.
    scene.terrain={centre:C0,flatRadius:260};
    const radii=[0,40,80,120,160,200,240,280,320,360,400,450,500,560,620,700,800,900,1000,1150,1300,1450,1600,1800,2000,2250,2500,2800,3100,3500,4000,4500],segs=96,gv=[],gf=[];
    gv.push([C0[0],terrain(C0[0],C0[1]),C0[1]]);
    for(const r of radii.slice(1))for(let i=0;i<segs;i++){const a=i/segs*2*Math.PI,x=C0[0]+r*Math.cos(a),z=C0[1]+r*Math.sin(a);gv.push([x,terrain(x,z),z]);}
    for(let i=0;i<segs;i++)gf.push([0,1+(i+1)%segs,1+i]);
    for(let k=0;k<radii.length-2;k++)for(let i=0;i<segs;i++){const a=1+k*segs,b=1+(k+1)*segs;gf.push([a+i,a+(i+1)%segs,b+(i+1)%segs,b+i]);}
    const ground=mesh('ground',gv,gf,'#8b5d42',1,p=>p);ground.role='regolith';
    ground.colors=gv.map(([x,y,z])=>toHex(lerp(hex('#74492f'),hex('#a2704f'),Math.min(1,Math.max(0,.5+.35*Math.sin(x*.011+Math.cos(z*.009)*2)+.15*Math.sin(z*.05-x*.02)-.004*Math.max(0,y-9))))));
    // Scattered rocks, kept clear of buildings, links and the rover yard.
    let seed=11;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const keepOut=[[DISC_X[0],SURF_Z[0],24],[DISC_X[1],SURF_Z[1],24],[DISC_X[0],SURF_Z[0]+20,16],[DISC_X[1],SURF_Z[1]+20,16],[0,LINK_Z,14],[-75,-72,42],[-29,-67,10],[183,112,72],[90,-42,10],[44,-61,16],[0,-80,8],[-1,-30,6]];
    const rockGroups=[['#6e4b38',[],[]],['#7d5a45',[],[]],['#5a3d2f',[],[]]];
    for(let i=0;i<700;i++){const r=30+1500*Math.pow(random(),1.6),a=random()*2*Math.PI,x=C0[0]+r*Math.cos(a),z=C0[1]+r*Math.sin(a),size=.25+1.6*Math.pow(random(),3);
      if(keepOut.some(([kx,kz,kr])=>Math.hypot(x-kx,z-kz)<kr+size))continue;
      const [,v,f]=rockGroups[i%3],b=v.length,y=terrain(x,z)-size*.25,j=()=>.75+.5*random();
      for(const p of [[1,0,0],[-1,0,0],[0,1,0],[0,-.4,0],[0,0,1],[0,0,-1]])v.push([x+p[0]*size*j(),y+p[1]*size*j(),z+p[2]*size*j()]);
      for(const [p,q,s] of [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]])f.push([b+p,b+q,b+s]);}
    for(const [color,v,f] of rockGroups)mesh('ground',v,f,color,1,p=>p).role='rock';
    for(const [x,z,r] of [[-700,520,70],[950,-600,110]]){const y=terrain(x,z);
      mesh('ground',Array.from({length:32},(_,i)=>[x+r*Math.cos(i/32*2*Math.PI),y+.3,z+r*Math.sin(i/32*2*Math.PI)]),[Array.from({length:32},(_,i)=>31-i)],'#7a523b',1,p=>p).role='crater';
      torus('ground',[x,y,z],r,r*.05,'#94684d','y',p=>add(rotate(sub(p,[x,y,z]),[Math.PI/2,0,0]),[x,y,z])).role='crater-rim';}
    // Daytime sky with a thin dusty atmosphere (assumed): rust haze at the horizon to a dark zenith.
    // Smooth sky: dusty horizon haze to a dark zenith, forward-scattered glow around Proxima, and regolith-coloured
    // haze below the horizon so the distant ground never ends at an edge. Drawn relative to the camera.
    {const toward=norm([-.6,.33,.73]),R=4900,rings=40,n=72,v=[],f=[],colors=[],H=hex('#946652'),Z=hex('#110e17'),G=hex('#5a3a29'),S=hex('#e09466');
     for(let j=0;j<=rings;j++){const e=-Math.PI/2+Math.PI*j/rings;for(let i=0;i<n;i++){const a=i/n*2*Math.PI,d=[Math.cos(e)*Math.cos(a),Math.sin(e),Math.cos(e)*Math.sin(a)];v.push(mul(d,R));
       let c=e<0?lerp(H,G,Math.min(1,-e/.12)):lerp(H,Z,Math.pow(Math.sin(e),.45));const psi=Math.acos(Math.max(-1,Math.min(1,dot(d,toward))));colors.push(toHex(lerp(c,S,.55*Math.exp(-psi/.3)*(e<0?.3:1))));}}
     for(let j=0;j<rings;j++)for(let i=0;i<n;i++)f.push([j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i]);
     const dome=mesh('sky',v,f,'#946652',1,p=>p);dome.colors=colors;dome.material=-2;dome.role='sky-dome';}
    // Proxima Centauri: a 0.154 solar-radius red dwarf 0.0486 AU away spans about 1.7°, roughly three times the Sun seen from Earth.
    const proximaAngle=2*Math.atan(env.star_radius_solar*695700/(env.orbit_au*149597870.7)),sunDir=norm([-.6,.33,.73]),proximaR=4500*Math.tan(proximaAngle/2);
    for(const [r,color,opacity,shift] of [[proximaR*5,'#ff7a3d',.07,40],[proximaR*2.2,'#ff8448',.22,20],[proximaR,'#ff9257',1,0]]){const d=skyDisc(mul(sunDir,4500+shift),r,color,opacity,48);d.role=r===proximaR?'proxima':'proxima-glow';if(r===proximaR)d.angularDiameterDeg=proximaAngle*180/Math.PI;}
    // Alpha Centauri A and B from about 13,000 AU: a bright pair, magnitudes about -6.6 and -5.3, roughly 0.13° apart.
    const abDir=norm([.45,.62,-.64]),abU=norm(cross(abDir,[0,1,0])),sep=env.alpha_cen_separation_au/env.alpha_cen_distance_au;
    for(const [name,m0,offset,size] of [['A',env.alpha_cen_A_mag_from_earth,0,7],['B',env.alpha_cen_B_mag_from_earth,sep,5]]){const dir=norm(add(abDir,mul(abU,offset))),mag=m0+5*Math.log10(env.alpha_cen_distance_au/env.alpha_cen_earth_distance_au);
      const s=skyDisc(mul(dir,4600),size,'#fff3dc',1,12);s.role='alpha-centauri-'+name;s.apparentMagnitude=mag;skyDisc(mul(dir,4601),size*3,'#fff3dc',.15,16).role='star-glow';}
  }
  return scene;
}

export function exportOBJ(scene){let offset=1,normalOffset=1;const rows=['# PROXIMA — metre-based detailed layout; not validated engineering geometry'];for(let m of scene.meshes){rows.push(`o ${m.id}`);for(let v of m.vertices)rows.push(`v ${v.map(x=>x.toFixed(4)).join(' ')}`);if(m.normals){for(let n of m.normals)rows.push(`vn ${n.map(x=>x.toFixed(6)).join(' ')}`);rows.push('s 1');}else rows.push('s off');for(let f of m.faces)rows.push(`f ${f.map(i=>m.normals?`${i+offset}//${i+normalOffset}`:i+offset).join(' ')}`);offset+=m.vertices.length;if(m.normals)normalOffset+=m.normals.length;}return rows.join('\n');}
