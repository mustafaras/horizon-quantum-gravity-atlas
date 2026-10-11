import * as K from "./js/visualizations/kerr/kerr-observatory.mjs";
import { renderStarfield } from "./js/visualizations/kerr/starfield-sampler.mjs";
import fs from "node:fs";
const [a, incl, dist, W, H] = [Number(process.argv[2]??0.9), Number(process.argv[3]??75), Number(process.argv[4]??40), Number(process.argv[5]??240), Number(process.argv[6]??120)];
const t0=performance.now(); const sky = renderStarfield({ seed:42, quality:"performance" }); console.log("sky ms", (performance.now()-t0).toFixed(0), "checksum", sky.checksum, sky.meanLinear.map(v=>v.toFixed(4)));
const n = K.normalizeKerrState({ bhSpin: a, bhInclination: incl, bhObserverDistance: dist });
const rs = K.buildKerrRenderState(n, { budget: K.kerrQualityBudget("balanced", { detail3d: "ultra" }), observer: { r0: dist, theta0: incl*Math.PI/180, phi0: 0 } });
const tanH = Math.tan(20*Math.PI/180), aspect = W/H;
const out = Buffer.alloc(W*H*3);
const tone = (x)=> { const v = x/(1+x); return Math.round(255*Math.pow(Math.max(0,Math.min(1,v)), 1/2.2)); };
const t1=performance.now();
for (let j=0;j<H;j++) for (let i=0;i<W;i++) {
  const x=((i+0.5)/W)*2-1, y=1-((j+0.5)/H)*2;
  const tr = K.traceKerrReferenceRay(rs, K.kerrLocalDirection(x,y,tanH,aspect));
  const sh = K.shadeKerrReferenceRay(rs, tr);
  let rgb = sh.rgb;
  if (sh.escaped && sh.transmit>0) { // nearest sky texel at level 0
    const d = tr.escapeDirection; const u = Math.atan2(d[2],d[0])/(2*Math.PI)+0.5, v = Math.acos(Math.max(-1,Math.min(1,d[1])))/Math.PI;
    const L = sky.levels[2]; const tx = Math.min(L.width-1, Math.floor(u*L.width)), ty = Math.min(L.height-1, Math.floor(v*L.height));
    const idx=(ty*L.width+tx)*4; const s=[0,1,2].map(c=> (L.data[idx+c]/255)**2*sky.vmax);
    rgb = rgb.map((c,k)=>c+sh.transmit*s[k]);
  }
  for (let c=0;c<3;c++) out[(j*W+i)*3+c]=tone(rgb[c]);
}
console.log("trace ms", (performance.now()-t1).toFixed(0));
fs.writeFileSync("/tmp/cpu.ppm", Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), out]));
