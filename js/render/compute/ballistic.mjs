// The reference particle behaviour (S08): a seeded burst on a shell that flies out under gravity and drag and respawns when its
// life ends. It is the system the GPU kit is tested against (ballistic-cpu.mjs is its CPU mirror) and the template the migrated
// systems follow: positions in `position.xyz`, velocity in `velocity.xyz`, `age`, and per-particle constants in `attr`.
//
// Contract (see particles.mjs): init and update return the particle's new state and never assign; the kit assigns each buffer once.
// A branch is a `select` of two computed values.

import { float, length, max, select, vec3, vec4 } from "three/tsl";
import { BALLISTIC } from "./ballistic-cpu.mjs";

/**
 * A fresh particle drawn from stream `draw`: { position, velocity, life, size } as nodes. The direction is a normalised cube sample
 * (not uniform on the sphere, which does not matter here) because normalisation is exact on every backend where sin and cos are only
 * accurate to about 1e-4 on software rasterisers.
 */
const spawn = (draw) => {
  const cube = vec3(draw(0), draw(1), draw(2)).mul(2).sub(1);
  const direction = cube.div(max(length(cube), 1e-4));
  const radius = draw(3).mul(0.5).add(0.5).mul(BALLISTIC.radius);
  const speed = draw(4).add(0.5).mul(BALLISTIC.speed);
  return {
    position: direction.mul(radius), velocity: direction.mul(speed),
    life: draw(5).mul(BALLISTIC.lifeSpan).add(BALLISTIC.lifeMin), size: draw(6).add(0.5),
  };
};

export function ballisticInit(ctx) {
  const fresh = spawn(ctx.rand);
  return {
    position: vec4(fresh.position, 1), velocity: vec4(fresh.velocity, 0), attr: vec4(fresh.life, fresh.size, 0, 0),
    age: ctx.rand(7).mul(fresh.life),                       // stagger the generations
  };
}

export function ballisticUpdate(ctx) {
  const dt = ctx.dt;
  const life = ctx.attr.x;
  const damp = max(float(0), float(1).sub(dt.mul(BALLISTIC.drag)));
  const v0 = ctx.velocity.xyz;
  const velocity = vec3(v0.x, v0.y.sub(dt.mul(BALLISTIC.gravity)), v0.z).mul(damp);
  const position = ctx.position.xyz.add(velocity.mul(dt));
  const age = ctx.age.add(dt);
  const respawn = age.greaterThan(life);
  const fresh = spawn(ctx.randStep);
  return {
    position: vec4(select(respawn, fresh.position, position), 1),
    velocity: vec4(select(respawn, fresh.velocity, velocity), 0),
    attr: vec4(select(respawn, fresh.life, life), select(respawn, fresh.size, ctx.attr.y), 0, 0),
    age: select(respawn, float(0), age),
  };
}
