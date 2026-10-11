import { renderStarfield } from "./js/visualizations/kerr/starfield-sampler.mjs";
import fs from "node:fs";
const sky = renderStarfield({ seed: 42, quality: "balanced" });
const L = sky.levels[0]; const N = 360; const out = Buffer.alloc(N*N*3);
const maxAng = 25*Math.PI/180;
for (let j=0;j<N;j++) for (let i=0;i<N;i++){
  const x=(i+0.5)/N*2-1, y=(j+0.5)/N*2-1, rho=Math.hypot(x,y);
  let v=[0,0,0];
  if (rho<=1){ const ang=rho*maxAng, az=Math.atan2(y,x); const d=[Math.sin(ang)*Math.cos(az), Math.cos(ang), Math.sin(ang)*Math.sin(az)];
    const u=Math.atan2(d[2],d[0])/(2*Math.PI)+0.5, vv=Math.acos(d[1])/Math.PI; const tx=Math.min(L.width-1,Math.floor(u*L.width)), ty=Math.min(L.height-1,Math.floor(vv*L.height)); const idx=(ty*L.width+tx)*4; v=[L.data[idx],L.data[idx+1],L.data[idx+2]]; }
  for (let c=0;c<3;c++) out[(j*N+i)*3+c]=v[c];
}
fs.writeFileSync("/tmp/polemap.ppm", Buffer.concat([Buffer.from(`P6\n${N} ${N}\n255\n`), out]));
