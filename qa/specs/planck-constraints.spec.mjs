import { test, expect } from 'playwright/test';
import { gotoReady } from './helpers.mjs';

test.setTimeout(120000);
async function open(page,context){
  await context.addInitScript(()=>{window.QGA_RENDER_OPTIONS={forceBackend:'webgl2'};sessionStorage.setItem('horizon-intro','1');});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await gotoReady(page,'/?view=planck&seed=42',['fonts','network-idle','view-mounted']);
  return errors;
}
test('source details, model warnings and Planck ladder crosshair',async({page,context})=>{
  const errors=await open(page,context);
  const plane=page.locator('.constraint-plane');
  await expect(plane.locator('.constraint-chip')).toHaveCount(11);
  await plane.getByRole('button',{name:'GWTC-3'}).click();
  await expect(plane.locator('.constraint-detail')).toContainText('2.420e-23');
  await expect(plane.locator('.constraint-detail')).toContainText('90% credible');
  await plane.getByRole('button',{name:'Fermi GRB 090510'}).click();
  await expect(plane.locator('.constraint-detail')).toContainText('Indirect');
  await expect(plane.locator('.constraint-detail a')).toHaveAttribute('href',/0908.1832/);
  await page.getByLabel('length scale',{exact:true}).fill('-25');
  await expect(plane.locator('.constraint-crosshair')).toContainText('10^-25');
  await expect.poll(()=>page.evaluate(()=>(()=>{const s=window.QGA_FIGURE_SCENES.get('planck-constraint-plane');return !!s && s.prims.some(p=>p.role==='rule' && Math.abs(p.pts[0][0]-s.sx.map(1e-25))<.01 && p.pts[0][0]===p.pts[1][0]);})())).toBe(true);
  expect(errors).toEqual([]);
});
test('spin spectra respond to the shared maximum spin',async({page,context})=>{
  const errors=await open(page,context);
  const spectra=page.locator('.planck-spectra');
  await spectra.scrollIntoViewIfNeeded();
  await expect(spectra.locator('[data-figure]')).toHaveCount(2);
  const count=()=>page.evaluate(()=>window.QGA_FIGURE_SCENES.get('planck-area-spectrum')?.prims?.filter(m=>m.k==='circle' && Number.isInteger(m.mark)).length);
  await page.getByLabel('max spin j').fill('2');
  await expect.poll(count).toBe(2);
  await page.getByLabel('max spin j').fill('4');
  await expect.poll(count).toBe(4);
  await expect(spectra).toContainText('schematic proxy');
  // The window follows the drawn levels, so the top stem stays visible at either setting.
  const topFraction=()=>page.evaluate(()=>{
    const s=window.QGA_FIGURE_SCENES.get('planck-volume-spectrum');
    const top=Math.max(...s.prims.filter(p=>p.role==='data'&&p.k==='circle').map(p=>p.y));
    return (s.plot.y+s.plot.h-top)/s.plot.h;
  });
  expect(await topFraction()).toBeGreaterThan(0.2);
  await page.getByLabel('max spin j').fill('2');
  await expect.poll(count).toBe(2);
  expect(await topFraction()).toBeGreaterThan(0.2);
  expect(errors).toEqual([]);
});
test('mobile controls fit and provide keyboard access to each observation',async({page,context})=>{
  await page.setViewportSize({width:390,height:844});
  const errors=await open(page,context);
  const plane=page.locator('.constraint-plane');
  await plane.scrollIntoViewIfNeeded();
  expect(await plane.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const chips=plane.locator('.constraint-chip');
  for(let i=0;i<await chips.count();i++){
    const chip=chips.nth(i), box=await chip.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await plane.getByRole('button',{name:'BICEP / Keck'}).focus();
  await expect(plane.locator('.constraint-detail')).toContainText('single-field slow-roll');
  expect(errors).toEqual([]);
});
