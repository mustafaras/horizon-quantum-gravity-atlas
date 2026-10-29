import { figure, axis, line, rule, points, region, callout } from '../spec.mjs';
import { CONSTRAINTS, energyFromLength, lengthFromEnergy, PLANCK_LENGTH_M, PLANCK_ENERGY_EV } from '../../science/data/constraints.mjs';
import { areaSpectrum, tetrahedronVolumeSpectrum } from '../../science/spin-networks.mjs';
const X=[1e-35,2e26], Y=[1e-3,2e28];
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export function constraintPosition(entry) {
  const length=entry.scaleKind==='length' ? entry.lo : lengthFromEnergy(entry.lo);
  const energy=entry.scaleKind==='energy' ? entry.lo : energyFromLength(entry.lo);
  return { length,energy,x:clamp(length,...X),y:clamp(energy,...Y), clipped: length<X[0]||length>X[1]||energy<Y[0]||energy>Y[1] };
}
/**
 * The hatched guide for one entry. A published range (Eöt-Wash 52 μm–3 mm, IceCube 6.3–980 TeV)
 * is drawn at its quoted extent, converted to both axes; a single quoted scale gets a symmetric
 * locator box and is disclosed as a guide, never as an exclusion contour.
 */
export function constraintRegion(entry) {
  const [lo,hi]=entry.hi>entry.lo?[entry.lo,entry.hi]:[entry.lo/3,entry.lo*3];
  const lengths=entry.scaleKind==='length'?[lo,hi]:[lengthFromEnergy(hi),lengthFromEnergy(lo)];
  const energies=entry.scaleKind==='energy'?[lo,hi]:[energyFromLength(hi),energyFromLength(lo)];
  return { x:[clamp(lengths[0],...X),clamp(lengths[1],...X)],y:[clamp(energies[0],...Y),clamp(energies[1],...Y)], exactRange:entry.hi>entry.lo };
}
export function constraintSpec({ logLength=-10, selected='lhc' }={}) {
  const marks=[
    region({x:[1e-35,1e-33],y:[1e26,2e28],layer:'model',style:'hatch',color:'ink-dim',opacity:.12}),
    callout({x:2e-34,y:3e26,dx:44,dy:16,layer:'model',color:'ink-dim',text:{text:'no direct data'}}),
    line({x:[1e-35,1e-4],y:[energyFromLength(1e-35),energyFromLength(1e-4)],layer:'model',color:'ink-strong',focal:true,label:{tex:'E=\\hbar c/L'}}),
    rule({axis:'x',value:PLANCK_LENGTH_M,layer:'model',color:'ink-dim',text:{tex:'\\ell_P'}}),
    rule({axis:'y',value:PLANCK_ENERGY_EV,layer:'model',color:'ink-dim',text:{tex:'E_P'}}),
    rule({axis:'x',value:10**logLength,layer:'model',color:'cat-2'}),
  ];
  for(let i=0;i<CONSTRAINTS.length;i++) {
    const entry=CONSTRAINTS[i], p=constraintPosition(entry), color=`cat-${i%8+1}`;
    const isSelected=entry.id===selected;
    const box=constraintRegion(entry);
    if(box.x[0]<box.x[1]&&box.y[0]<box.y[1]) marks.push(region({x:box.x,y:box.y,style:'hatch',layer:'model',color}));
    marks.push(points({x:[p.x],y:[p.y],layer:'data',color,radius:isSelected?5.5:3.5,shape:p.clipped?'triangle-down':'circle'}));
  }
  const cursor=10**logLength, e=energyFromLength(cursor);
  if(e>=Y[0]&&e<=Y[1]) marks.push(points({x:[cursor],y:[e],layer:'model',color:'ink-strong',radius:4}));
  return figure({id:'planck-constraint-plane',title:'The map of the unseen',status:'effective',provenanceId:'planck-constraint-plane',height:440,legend:false,
    x:axis({scale:{type:'log',domain:X},ticks:[1e-35,1e-25,1e-15,1e-5,1e5,1e15,1e25],label:{text:'length'},unit:'m'}),
    y:axis({scale:{type:'log',domain:Y},ticks:[1e-3,1e3,1e9,1e15,1e21,1e27],label:{text:'energy'},unit:'eV'}),marks,
    summary:'A scale map of published limits and observed scales. Points on the diagonal use the reduced-wavelength conversion; triangle points are clipped to an axis boundary. Model-dependent indirect bounds are not direct measurements at the equivalent length.'});
}
function spectrumSpec(kind, jMaxHalf) {
  const spins=[.5,1,1.5,2].filter(j=>j<=jMaxHalf/2), marks=[], drawn=[];
  for(const j of spins){
    const values=kind==='area'?[areaSpectrum(j)]:tetrahedronVolumeSpectrum(j);
    for(const value of [...new Set(values.map(v=>Number(v.toPrecision(10))))]) {
      drawn.push(value);
      marks.push(line({x:[j,j],y:[0,value],layer:'model',color:kind==='area'?'cat-1':'cat-2'}));
      marks.push(points({x:[j],y:[value],layer:'model',color:kind==='area'?'cat-1':'cat-2',radius:3.5}));
    }
  }
  // The window follows the spins actually drawn, so the highest level keeps its headroom at
  // every maximum-spin setting instead of sitting in the bottom quarter of a fixed axis.
  const maximum=Math.max(...drawn);
  return figure({id:`planck-${kind}-spectrum`,title:kind==='area'?'Area quanta':'Four-valent volume levels',status:'conjectural',provenanceId:'planck-spin-spectra',height:240,legend:false,
    x:axis({scale:{type:'linear',domain:[0.25,2.25]},ticks:[.5,1,1.5,2],label:{tex:'j'}}),
    y:axis({scale:{type:'linear',domain:[0,maximum*1.35]},label:{tex:kind==='area'?'A/\\ell_P^2':'V/\\ell_P^3'}}),marks,
    summary:kind==='area'?'Area per link for the selected half-integer spins, with Immirzi parameter one.':'Volume eigenvalues of a four-valent quantum tetrahedron whose four links carry equal spin. Repeated eigenvalues are drawn once.'});
}
export const areaSpectrumSpec=(jMaxHalf)=>spectrumSpec('area',jMaxHalf);
export const volumeSpectrumSpec=(jMaxHalf)=>spectrumSpec('volume',jMaxHalf);
