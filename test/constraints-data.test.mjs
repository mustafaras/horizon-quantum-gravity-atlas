import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSTRAINTS, energyFromLength, lengthFromEnergy, HBAR_C_EV_M, PLANCK_LENGTH_M, PLANCK_ENERGY_EV, inflationEnergyBound } from '../js/science/data/constraints.mjs';
import { areaSpectrum, tetrahedronVolumeSpectrum } from '../js/science/spin-networks.mjs';
import { constraintRegion } from '../js/figure/plots/planck-constraints.mjs';
const near=(a,b,tolerance)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
test('all scales carry primary sources, units, bounds and uncertainty',()=>{
  assert.equal(CONSTRAINTS.length,11);
  const ids=new Set();
  for(const row of CONSTRAINTS){
    assert.ok(!ids.has(row.id)); ids.add(row.id);
    assert.ok(['length','energy'].includes(row.scaleKind));
    assert.ok(['range','upper','lower','scale'].includes(row.bound));
    assert.ok(Number.isFinite(row.lo)&&row.lo>0&&Number.isFinite(row.hi)&&row.hi>=row.lo);
    assert.match(row.reference.url,/^https:\/\//); assert.match(row.reference.retrieved,/^2026-\d\d-\d\d$/);
    assert.ok(row.reference.citation && row.uncertainty && row.note);
  }
});
test('inverse wavelength-energy conversion and Planck quantities',()=>{
  near(HBAR_C_EV_M,1.9732698e-7,2e-14);
  near(energyFromLength(PLANCK_LENGTH_M)/PLANCK_ENERGY_EV,1,1e-12);
  for(const x of [1e-35,1e-19,1,1e25]) near(lengthFromEnergy(energyFromLength(x))/x,1,1e-14);
  assert.throws(()=>energyFromLength(0)); assert.throws(()=>lengthFromEnergy(Infinity));
});
test('inflation energy limit and revised GWTC-3 graviton mass',()=>{
  near(inflationEnergyBound()/1e25,1.40859,0.00002);
  assert.equal(CONSTRAINTS.find(x=>x.id==='gwtc3').lo,2.42e-23);
  assert.equal(CONSTRAINTS.find(x=>x.id==='fermi').lo/PLANCK_ENERGY_EV,1.19);
});
test('tetrahedron volume reproduces Bianchi and Haggard Appendix C, including degeneracy',()=>{
  const unit=(8*Math.PI)**1.5;
  const v05=tetrahedronVolumeSpectrum(.5).map(x=>x/unit);
  const v1=tetrahedronVolumeSpectrum(1).map(x=>x/unit);
  const v15=tetrahedronVolumeSpectrum(1.5).map(x=>x/unit);
  near(v05[0],.310,0.0005); near(v05[1],v05[0],1e-13);
  near(v1[0],0,1e-13); near(v1[1],.620,0.0005);
  near(v15[0],.537,0.0005); near(v15[2],.993,0.0005);
  near(areaSpectrum(.5,{immirzi:1}),8*Math.PI*Math.sqrt(.75),1e-12);
  assert.throws(()=>tetrahedronVolumeSpectrum(.25));
});

test('the scale map keeps source scales distinct and exposes clipped positions', async()=>{
  const { constraintPosition, constraintRegion, constraintSpec, areaSpectrumSpec, volumeSpectrumSpec }=await import('../js/figure/plots/planck-constraints.mjs');
  for(const item of CONSTRAINTS){
    const p=constraintPosition(item);
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(item.scaleKind==='length') near(p.length/item.lo,1,1e-14);
    else near(p.energy/item.lo,1,1e-14);
  }
  assert.equal(constraintPosition(CONSTRAINTS.find(x=>x.id==='gwtc3')).clipped,true);
  assert.equal(constraintPosition(CONSTRAINTS.find(x=>x.id==='fermi')).clipped,false);
  const spec=constraintSpec({logLength:-25});
  assert.ok(spec.marks.some(m=>m.type==='rule'&&m.axis==='x'&&m.value===1e-25));
  assert.equal(areaSpectrumSpec(2).marks.filter(m=>m.type==='points').length,2);
  assert.ok(volumeSpectrumSpec(4).marks.some(m=>m.type==='points'&&m.y[0]===0));
});
test('a published range is hatched at its quoted extent, not a fixed multiple of one end',()=>{
  const eot=CONSTRAINTS.find(x=>x.id==='eotwash'), ice=CONSTRAINTS.find(x=>x.id==='icecube');
  const eotBox=constraintRegion(eot);
  near(eotBox.x[0]/eot.lo,1,1e-12); near(eotBox.x[1]/eot.hi,1,1e-12);
  assert.equal(eotBox.exactRange,true);
  const iceBox=constraintRegion(ice);
  near(iceBox.y[0]/ice.lo,1,1e-12); near(iceBox.y[1]/ice.hi,1,1e-12);
  const single=constraintRegion(CONSTRAINTS.find(x=>x.id==='lhc'));
  assert.equal(single.exactRange,false);
  near(single.x[1]/single.x[0],9,1e-12); // a disclosed locator box: 3× on each side in length
});
test('the spectrum window follows the drawn spins, so the top level keeps its headroom',async()=>{
  const { areaSpectrumSpec, volumeSpectrumSpec }=await import('../js/figure/plots/planck-constraints.mjs');
  const { areaSpectrum, tetrahedronVolumeSpectrum }=await import('../js/science/spin-networks.mjs');
  for(const state of [1,2,3,4]){
    const spins=[.5,1,1.5,2].filter(j=>j<=state/2);
    const areaMax=Math.max(...spins.map(areaSpectrum));
    const volMax=Math.max(...spins.flatMap(j=>tetrahedronVolumeSpectrum(j)));
    for(const [spec,expected] of [[areaSpectrumSpec(state),areaMax],[volumeSpectrumSpec(state),volMax]]){
      const top=Math.max(...spec.marks.filter(m=>m.type==='points').map(m=>m.y[0]));
      assert.ok(spec.y.scale.domain[1]>top,'domain clears the highest drawn level');
      assert.ok(spec.y.scale.domain[1]<top*2,'domain does not leave the highest level in a fixed far-off axis');
      near(top/expected,1,1e-9);
    }
  }
});
test('Planck ConceptBus event validates a finite scale and delivers it', async()=>{
  const { createConceptBus }=await import('../js/linking/concept-bus.mjs');
  const bus=createConceptBus({diagnostic:()=>{}}),received=[];
  const off=bus.on('planck-scale',p=>received.push(p.logLength));
  bus.publish('planck-scale',{logLength:-25}); off();
  assert.deepEqual(received,[-25]);
  assert.throws(()=>bus.publish('planck-scale',{logLength:Infinity}));
});
