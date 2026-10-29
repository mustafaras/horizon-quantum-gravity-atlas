// A single S08 compute-particle system displays the pre-integrated tidal axes.
import { cos, float, sin, vec4 } from 'three/tsl';
import { createParticleSystem } from '../../render/compute/particles.mjs';
import { tagLayer } from '../../render/scene-layers.mjs';
import * as TK from '../../design/tokens.mjs';

export async function buildTidalRing(ctx, state) {
  const count = 96;
  const position = new Float32Array(count * 4);
  const velocity = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) velocity[i * 4] = i * 2 * Math.PI / count;
  const system = createParticleSystem({
    count, initial: { position, velocity }, params: { radial: 3, transverse: 3 },
    update: ({ velocity: v, params }) => ({ position: vec4(cos(v.x).mul(params.radial), sin(v.x).mul(params.transverse), float(0), float(1)) }),
    render: { sizePx: 0.48, sizeAttenuation: true, profile: 'disc', opacity: 1, color: TK.linear('cat-1') },
  });
  system.object.frustumCulled = false;
  ctx.scene.add(tagLayer(system.object, 'model'));
  const axis = ctx.engraved.line([-3.7, 0, 0, 3.7, 0, 0], { color: 'ink-dim', widthPx: 1, layer: 'model' });
  const cross = ctx.engraved.line([0, -3.7, 0, 0, 3.7, 0], { color: 'ink-dim', widthPx: 1, layer: 'model' });
  ctx.scene.add(axis, cross);
  let lastRadial = NaN, lastTransverse = NaN, settleFrames = 0;
  return {
    isAnimated() { return settleFrames > 0; },
    state() { return { radial: lastRadial, transverse: lastTransverse, steps: system.steps, settleFrames, targetRadial: state.current.radialScale, targetTransverse: state.current.transverseScale }; },
    prepare(renderer) { system.init(renderer); },
    compute(renderer) {
      const current = state.current;
      const norm = Math.max(Math.abs(current.radialScale), Math.abs(current.transverseScale));
      const radial = 3 * current.radialScale / norm, transverse = 3 * current.transverseScale / norm;
      // Allow compute and presentation to settle after a scrub, then return to on-demand rendering.
      settleFrames = radial !== lastRadial || transverse !== lastTransverse ? 3 : Math.max(0, settleFrames - 1);
      lastRadial = radial; lastTransverse = transverse;
      system.params.radial.value = radial;
      system.params.transverse.value = transverse;
      system.step(renderer, 0);
    },
    update() {},
    dispose() { system.dispose(); },
  };
}
