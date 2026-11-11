import {sub,cross,norm,dot,spinSign,spinPoint,roverPoint} from './model.js';

const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec4 color;
layout(location=3) in float material;
layout(location=4) in float spinGroup;
layout(location=5) in vec2 selectionTags;
layout(location=6) in float deckGroup;
uniform float hiddenTag,visibleDeck;
uniform vec3 eye, cameraRight, cameraUp, cameraForward;
uniform vec2 projectionScale;
uniform vec2 depthRange;
uniform vec2 spinCentres;
uniform float spinAngle,flatView,roverTag;
uniform vec3 roverPosition,roverForward,roverUp,roverSide;
out vec3 worldNormal;
out vec4 surfaceColor;
out float surfaceMaterial;
void main(){
  vec3 vertexPosition=position,vertexNormal=normal;
  if(flatView>0.5){vertexPosition=vec3(position.x,position.z,-position.y);vertexNormal=vec3(normal.x,normal.z,-normal.y);}
  if(abs(spinGroup)>0.5){float cx=spinGroup<0.0?spinCentres.x:spinCentres.y;float a=spinAngle*spinGroup,c=cos(a),s=sin(a);vec2 q=vertexPosition.xy-vec2(cx,0.0);vertexPosition.xy=vec2(c*q.x-s*q.y,s*q.x+c*q.y)+vec2(cx,0.0);vertexNormal.xy=vec2(c*vertexNormal.x-s*vertexNormal.y,s*vertexNormal.x+c*vertexNormal.y);}
  if(flatView>0.5){vertexPosition=vec3(vertexPosition.x,-vertexPosition.z,vertexPosition.y);vertexNormal=vec3(vertexNormal.x,-vertexNormal.z,vertexNormal.y);}
  if(roverTag>0.0&&abs(selectionTags.x-roverTag)<0.1){vec3 q=vertexPosition-vec3(90.0,0.0,-42.0);vertexPosition=roverPosition+roverForward*q.x+roverUp*q.y+roverSide*q.z;vertexNormal=roverForward*vertexNormal.x+roverUp*vertexNormal.y+roverSide*vertexNormal.z;}
  // Sky (material -2) is positioned relative to the camera so it always lies inside the far plane.
  vec3 p=material<-1.5?position:vertexPosition-eye;
  float depth=dot(p,cameraForward);
  float nearPlane=depthRange.x,farPlane=depthRange.y;
  float z=(farPlane+nearPlane)/(farPlane-nearPlane)*depth-2.0*farPlane*nearPlane/(farPlane-nearPlane);
  gl_Position=vec4(dot(p,cameraRight)*projectionScale.x,dot(p,cameraUp)*projectionScale.y-0.02*depth,z,depth);
  if(abs(selectionTags.x-hiddenTag)<0.1||(visibleDeck>=0.0&&deckGroup>=0.0&&abs(visibleDeck-deckGroup)>0.1))gl_Position=vec4(2.0,2.0,2.0,1.0);
  worldNormal=vertexNormal;surfaceColor=color;surfaceMaterial=material;
}`;
const fragment=`#version 300 es
precision highp float;
in vec3 worldNormal;
in vec4 surfaceColor;
in float surfaceMaterial;
uniform vec3 lightDirection;
uniform vec3 lightTint;
out vec4 outputColor;
void main(){
  if(surfaceMaterial<0.0){outputColor=surfaceColor;return;}
  vec3 N=normalize(worldNormal);
  if(!gl_FrontFacing)N=-N;
  float diffuse=max(dot(N,lightDirection),0.0);
  float ambient=0.42+0.10*(0.5+0.5*N.y);
  outputColor=vec4(surfaceColor.rgb*(ambient+0.48*diffuse)*lightTint,surfaceColor.a);
}`;

// Compile in the geometry worker. Compact streams avoid keeping millions of JS arrays.
export const deckGroup=id=>id.startsWith('bay-')?+id.split('-')[2]:id.startsWith('cabin-')?0:-1;
export function compileScene(scene){
  const counts=[0,(50+scene.lines.length)*2,0],groups=[],pickEntries=[],ids=new Map();let faceCount=0;
  for(const m of scene.meshes)for(const f of m.faces)counts[m.opacity<.99?2:0]+=(f.length-2)*3;
  const pickStream=new Float32Array((counts[0]+counts[2])*3);let pickOffset=0;
  const streams=counts.map(n=>new Uint8Array(n*28)),views=streams.map(v=>new DataView(v.buffer)),cursor=[0,0,0];
  const attributes=new Map();
  const tag=id=>{if(!ids.has(id))ids.set(id,ids.size+1);return ids.get(id);};
  function push(stream,p,n,color,material,id){let tags=attributes.get(id);if(!tags){const sign=spinSign(id);tags=[deckGroup(id),scene.spinCentres?sign:0,tag(id),sign];attributes.set(id,tags);}const view=views[stream],offset=cursor[stream]*28;for(let i=0;i<3;i++){view.setFloat32(offset+i*4,p[i],true);view.setInt8(offset+12+i,Math.round(Math.max(-1,Math.min(1,n[i]))*127));}for(let i=0;i<4;i++)view.setUint8(offset+16+i,Math.round(color[i]*255));view.setInt8(offset+15,tags[0]);view.setInt8(offset+20,material);view.setInt8(offset+21,tags[1]);view.setInt16(offset+22,tags[2],true);view.setInt16(offset+24,tags[3],true);cursor[stream]++;}
  const rgba=(color,opacity=1)=>[...color.slice(1).match(/../g).map(x=>parseInt(x,16)/255),opacity];
  for(const m of scene.meshes){const stream=m.opacity<.99?2:0,start=cursor[stream],color=rgba(m.color,m.opacity),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let triangleCount=0;for(const f of m.faces)triangleCount+=f.length-2;const triangles=pickStream.subarray(pickOffset,pickOffset+triangleCount*9);pickOffset+=triangleCount*9;let ti=0;
    for(const p of m.vertices)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}
    for(const f of m.faces){const n=m.normals?null:norm(cross(sub(m.vertices[f[1]],m.vertices[f[0]]),sub(m.vertices[f[2]],m.vertices[f[0]])));for(let i=1;i<f.length-1;i++)for(const index of [f[0],f[i],f[i+1]]){const p=m.vertices[index];push(stream,p,m.normals?.[index]??n,m.colors?rgba(m.colors[index],m.opacity):color,m.material??(m.id.startsWith('hab')?2:m.id==='tanks'?3:0),m.id);triangles.set(p,ti);ti+=3;}faceCount++;}
    pickEntries.push({id:m.id,lo,hi,sign:scene.spinCentres?spinSign(m.id):0,opacity:m.opacity,deck:deckGroup(m.id),triangles});
    if(stream===2)groups.push({id:m.id,start,count:cursor[stream]-start,centre:lo.map((v,i)=>(v+hi[i])/2)});
  }
  const ground=scene.spinCentres?-40:0;
  const line=(a,b,color,id='')=>{const c=rgba(color);push(1,a,[0,0,0],c,-1,id);push(1,b,[0,0,0],c,-1,id);};
  // Reference grid only in the touchdown comparison; cruise is open space and the settlement has a ground surface.
  if(scene.grid)for(let x=-300;x<=300;x+=25)line([x,ground,-220],[x,ground,220],'#20343d');
  if(scene.grid)for(let z=-225;z<=225;z+=25)line([-300,ground,z],[300,ground,z],'#20343d');
  for(const l of scene.lines)line(l.a,l.b,l.color,l.id);
  counts[1]=cursor[1];return {streams:streams.map((v,i)=>v.subarray(0,cursor[i]*28)),counts,groups,pickEntries,pickStream,idMap:[...ids],faceCount};
}
export function exportableScene(scene,angle=0,state={}){const visible=m=>(state.showRadiators!==false||m.id!=='radiators')&&(state.deck===undefined||state.deck==='all'||deckGroup(m.id)<0||deckGroup(m.id)===+state.deck);if(!scene.gpuData)return {...scene,meshes:scene.meshes.filter(visible)};return {...scene,meshes:scene.gpuData.pickEntries.filter(visible).map(m=>{const vertices=[];for(let i=0;i<m.triangles.length;i+=3)vertices.push(spinPoint(Array.from(m.triangles.subarray(i,i+3)),m.id,angle,scene.spinCentres??[0,0]));const faces=[];for(let i=0;i<vertices.length;i+=3)faces.push([i,i+1,i+2]);return {id:m.id,vertices,faces};})};}

export class GPUScene{
  constructor(gl){
    this.gl=gl;
    const legacy=typeof gl.createVertexArray!=='function';
    if(legacy){
      const vao=gl.getExtension('OES_vertex_array_object');
      if(!vao)throw Error('Vertex array support is unavailable.');
      gl.createVertexArray=()=>vao.createVertexArrayOES();
      gl.bindVertexArray=value=>vao.bindVertexArrayOES(value);
    }
    const compatible=source=>!legacy?source:source.replace('#version 300 es','').replace(/layout\(location=\d+\) in /g,'attribute ').replace(/out vec3 /g,'varying vec3 ').replace(/out vec4 surfaceColor/g,'varying vec4 surfaceColor').replace(/out float /g,'varying float ').replace(/in (vec[34]) /g,'varying $1 ').replace(/in float /g,'varying float ').replace('out vec4 outputColor;','').replace(/outputColor/g,'gl_FragColor');

    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,compatible(source));gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader: '+gl.getShaderInfoLog(s));return s;};
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('3D program: '+gl.getProgramInfoLog(this.program));
    gl.deleteShader(vs);gl.deleteShader(fs);
    this.cache=new Map();this.cacheBytes=0;this.maxCacheBytes=128*1024*1024;this.buffers=[gl.createBuffer(),gl.createBuffer(),gl.createBuffer()];this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);
    this.uniforms=Object.fromEntries(['eye','cameraRight','cameraUp','cameraForward','projectionScale','depthRange','spinCentres','spinAngle','hiddenTag','visibleDeck','flatView','lightDirection','lightTint','roverTag','roverPosition','roverForward','roverUp','roverSide'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
  }
  bind(buffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [location,size,offset,type,normalised] of [[0,3,0,gl.FLOAT,false],[1,3,12,gl.BYTE,true],[2,4,16,gl.UNSIGNED_BYTE,true],[3,1,20,gl.BYTE,false],[4,1,21,gl.BYTE,false],[5,2,22,gl.SHORT,false],[6,1,15,gl.BYTE,false]]){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,type,normalised,28,offset);}}
  prepare(scene){
    if(this.cache.has(scene))return;
    const gl=this.gl,compiled=scene.gpuData??compileScene(scene),buffers=[gl.createBuffer(),gl.createBuffer(),gl.createBuffer()];
    for(const [i,values] of compiled.streams.entries()){this.bind(buffers[i]);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);}
    const bytes=compiled.streams.reduce((sum,v)=>sum+v.byteLength,0)+(compiled.pickStream?.byteLength??0);this.cacheBytes+=bytes;
    this.cache.set(scene,{buffers,bytes,counts:compiled.counts,faceCount:compiled.faceCount,groups:compiled.groups,pickEntries:compiled.pickEntries,idMap:new Map(compiled.idMap)});
    if(scene.gpuData)scene.gpuData.streams=null;
    while(this.cache.size>12||this.cacheBytes>this.maxCacheBytes){const oldest=[...this.cache.keys()].find(key=>key!==this.cachedScene&&key!==scene);if(!oldest)break;const old=this.cache.get(oldest);this.onEvict?.(oldest);for(const buffer of old.buffers)gl.deleteBuffer(buffer);this.cacheBytes-=old.bytes;this.cache.delete(oldest);}
  }
  draw(scene,state,camera){
    const gl=this.gl;if(this.cachedScene!==scene){this.prepare(scene);const cached=this.cache.get(scene);Object.assign(this,cached);this.cache.delete(scene);this.cache.set(scene,cached);this.cachedScene=scene;}
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);gl.uniform1f(this.uniforms.flatView,scene.flat?1:0);gl.bindVertexArray(this.vao);
    for(const [name,value] of [['eye',camera.eye],['cameraRight',camera.right],['cameraUp',camera.up],['cameraForward',camera.forward]])gl.uniform3fv(this.uniforms[name],value);
    gl.uniform2f(this.uniforms.projectionScale,camera.focal/(camera.width/2),camera.focal/(camera.height/2));
    {const l=state.mode==='settlement'?[-.6,.33,.73]:[-.35,.65,.7],n=Math.hypot(...l);gl.uniform3fv(this.uniforms.lightDirection,l.map(v=>v/n));gl.uniform3fv(this.uniforms.lightTint,state.mode==='settlement'?[1,.8,.64]:[1,1,1]);}gl.uniform2f(this.uniforms.depthRange,camera.insideView ? .04 : Math.max(.02,camera.camera.distance/2000),6000);
    this.hideRadiators=state.showRadiators===false;this.visibleDeck=state.deck===undefined||state.deck==='all'?-1:+state.deck;gl.uniform1f(this.uniforms.hiddenTag,this.hideRadiators?(this.idMap.get('radiators')??-1):-1);gl.uniform1f(this.uniforms.visibleDeck,this.visibleDeck);
    this.flat=!!scene.flat;this.spinAngle=state.spinAngle??0;this.spinCentres=scene.spinCentres??[0,0];gl.uniform2f(this.uniforms.spinCentres,...this.spinCentres);gl.uniform1f(this.uniforms.spinAngle,this.spinAngle);
    this.rover=state.mode==='settlement'?state.rover:null;gl.uniform1f(this.uniforms.roverTag,this.rover?(this.idMap.get('rover')??-1):-1);if(this.rover)for(const [key,value] of [['roverPosition',this.rover.position],['roverForward',this.rover.forward],['roverUp',this.rover.up],['roverSide',this.rover.side]])gl.uniform3fv(this.uniforms[key],value);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);
    this.bind(this.buffers[0]);gl.drawArrays(gl.TRIANGLES,0,this.counts[0]);
    if(!camera.insideView){this.bind(this.buffers[1]);gl.drawArrays(gl.LINES,0,this.counts[1]);}
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    const groups=this.groups.map(g=>({...g,depth:dot(sub(g.id==='rover'&&this.rover?roverPoint(g.centre,this.rover):spinPoint(g.centre,g.id,this.spinAngle,this.spinCentres,false,this.flat),camera.eye),camera.forward)})).sort((a,b)=>b.depth-a.depth);
    this.bind(this.buffers[2]);for(const group of groups)gl.drawArrays(gl.TRIANGLES,group.start,group.count);gl.depthMask(true);
    return {hits:[],faceCount:this.faceCount};
  }
  pick(x,y,camera){return this.pickHit(x,y,camera)?.id??null;}
  pickHit(x,y,camera){
    const direction=norm(camera.forward.map((v,i)=>v+camera.right[i]*(x-camera.width/2)/camera.focal-camera.up[i]*(y-camera.height*.51)/camera.focal));
    let nearest=Infinity,id=null;
    for(const entry of this.pickEntries??[]){
      const {lo,hi,sign,triangles,opacity}=entry;if(opacity<=.2||(this.hideRadiators&&entry.id==='radiators')||(this.visibleDeck>=0&&entry.deck>=0&&entry.deck!==this.visibleDeck))continue;
      const origin=entry.id==='rover'&&this.rover?roverPoint(camera.eye,this.rover,false,true):sign?spinPoint(camera.eye,entry.id,-this.spinAngle,this.spinCentres,false,this.flat):camera.eye,ray=entry.id==='rover'&&this.rover?roverPoint(direction,this.rover,true,true):sign?spinPoint(direction,entry.id,-this.spinAngle,this.spinCentres,true,this.flat):direction;
      if(!rayBox(origin,ray,lo,hi))continue;
      for(let i=0;i<triangles.length;i+=9){const t=rayTriangle(origin,ray,triangles.subarray(i,i+3),triangles.subarray(i+3,i+6),triangles.subarray(i+6,i+9));if(t!==null&&t<nearest){nearest=t;id=entry.id;}}
    }
    return id?{id,distance:nearest,point:camera.eye.map((v,i)=>v+direction[i]*nearest)}:null;
  }
}

export function rayBox(origin,direction,lo,hi){let near=0,far=Infinity;for(let i=0;i<3;i++){if(Math.abs(direction[i])<1e-12){if(origin[i]<lo[i]||origin[i]>hi[i])return false;continue;}const a=(lo[i]-origin[i])/direction[i],b=(hi[i]-origin[i])/direction[i];near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(far<near)return false;}return far>=0;}
export function rayTriangle(origin,direction,a,b,c){const edge1=sub(b,a),edge2=sub(c,a),p=cross(direction,edge2),det=dot(edge1,p);if(Math.abs(det)<1e-12)return null;const tvec=sub(origin,a),u=dot(tvec,p)/det;if(u<0||u>1)return null;const q=cross(tvec,edge1),v=dot(direction,q)/det;if(v<0||u+v>1)return null;const t=dot(edge2,q)/det;return t>.002?t:null;}
