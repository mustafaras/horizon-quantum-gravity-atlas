import { renderStarfield } from "./js/visualizations/kerr/starfield-sampler.mjs";
import fs from "node:fs";
const sky = renderStarfield({ seed:42, quality:"balanced" });
const L = sky.levels[0]; const W=512,H=256, x0=700, y0=380;
const out = Buffer.alloc(W*H*3);
for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const i=((y0+y)*L.width+(x0+x))*4; for(let c=0;c<3;c++) out[(y*W+x)*3+c]=L.data[i+c]; }
fs.writeFileSync("/tmp/sky.ppm", Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), out]));
// pole crop
const out2 = Buffer.alloc(W*64*3);
for (let y=0;y<64;y++) for (let x=0;x<W;x++){ const i=(y*L.width+(x))*4; for(let c=0;c<3;c++) out2[(y*W+x)*3+c]=L.data[i+c]; }
fs.writeFileSync("/tmp/pole.ppm", Buffer.concat([Buffer.from(`P6\n${W} 64\n255\n`), out2]));
