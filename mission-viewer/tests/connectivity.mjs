// Structural connectivity check: meshes whose bounding boxes touch (within a tolerance) are joined; anything outside the
// largest group is a floating part. Bounding boxes are coarse (a hull's box contains its interior fittings), so this
// finds exterior parts that touch nothing, not fittings floating inside a pressure hull.
export function floatingParts(scene,{tol=.08,skip=/^(sky|beam)$/}={}){
  const items=scene.meshes.filter(m=>m.vertices?.length&&!skip.test(m.id)).map(m=>{const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const p of m.vertices)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[k]);hi[k]=Math.max(hi[k],p[k]);}return {m,lo,hi};});
  const parent=items.map((_,i)=>i),find=i=>{while(parent[i]!==i)i=parent[i]=parent[parent[i]];return i;};
  const order=items.map((_,i)=>i).sort((a,b)=>items[a].lo[0]-items[b].lo[0]);
  for(let a=0;a<order.length;a++){const A=items[order[a]];for(let b=a+1;b<order.length;b++){const B=items[order[b]];if(B.lo[0]>A.hi[0]+tol)break;
    if(B.lo[1]<=A.hi[1]+tol&&A.lo[1]<=B.hi[1]+tol&&B.lo[2]<=A.hi[2]+tol&&A.lo[2]<=B.hi[2]+tol){const x=find(order[a]),y=find(order[b]);if(x!==y)parent[x]=y;}}}
  const size=new Map();items.forEach((it,i)=>{const r=find(i);size.set(r,(size.get(r)??0)+it.m.vertices.length);});
  const main=[...size.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
  return items.filter((_,i)=>find(i)!==main).map(it=>({id:it.m.id,role:it.m.role??'',lo:it.lo,hi:it.hi}));
}
