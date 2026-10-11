import * as K from "./js/visualizations/kerr/kerr-observatory.mjs";
const n = K.normalizeKerrState({ bhSpin: 0.9, bhInclination: 75, bhObserverDistance: 40 });
const rs = K.buildKerrRenderState(n, { budget: K.kerrQualityBudget("balanced",{detail3d:"ultra"}), observer: { r0: 40, theta0: 75*Math.PI/180, phi0: 0.35 } });
const tanH = Math.tan(20*Math.PI/180), asp = 998/460;
let prev=null;
for (let j=0;j<=40;j++){ const y=0.95-j*0.0043*1.5; const t=K.traceKerrReferenceRay(rs,K.kerrLocalDirection(0,y,tanH,asp));
  const d=t.escapeDirection; const ang = prev? Math.acos(Math.max(-1,Math.min(1,d[0]*prev[0]+d[1]*prev[1]+d[2]*prev[2])))*180/Math.PI : 0; prev=d;
  console.log(y.toFixed(3), t.status, "steps",t.steps, "dir y", d[1].toFixed(4), "jump(deg)", ang.toFixed(3), "rmin", t.rMin.toFixed(2)); }
