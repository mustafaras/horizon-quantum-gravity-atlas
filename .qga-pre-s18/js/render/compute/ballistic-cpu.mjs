// CPU mirror of ballistic.mjs (S08): the reference system the GPU kit is tested against. Pure JS, imports in Node.

export const BALLISTIC = Object.freeze({ radius: 1.5, speed: 1.2, gravity: 0.8, drag: 0.35, lifeMin: 1, lifeSpan: 2 });

/** A fresh particle drawn from stream `draw` (same draws, same order as the GPU's spawn). */
function spawn(draw) {
  const cx = draw(0) * 2 - 1, cy = draw(1) * 2 - 1, cz = draw(2) * 2 - 1;
  const norm = Math.max(Math.hypot(cx, cy, cz), 1e-4);
  const dx = cx / norm, dy = cy / norm, dz = cz / norm;
  const radius = BALLISTIC.radius * (0.5 + 0.5 * draw(3)), speed = BALLISTIC.speed * (draw(4) + 0.5);
  return {
    position: [dx * radius, dy * radius, dz * radius], velocity: [dx * speed, dy * speed, dz * speed],
    life: draw(5) * BALLISTIC.lifeSpan + BALLISTIC.lifeMin, size: draw(6) + 0.5,
  };
}

const set = (target, [x, y, z], w) => { target.x = x; target.y = y; target.z = z; target.w = w; };

export function ballisticInit(p) {
  const fresh = spawn(p.rand);
  set(p.position, fresh.position, 1);
  set(p.velocity, fresh.velocity, 0);
  p.attr.x = fresh.life; p.attr.y = fresh.size; p.attr.z = 0; p.attr.w = 0;
  p.age = p.rand(7) * fresh.life;
}

export function ballisticUpdate(p) {
  const dt = Math.fround(p.dt);
  const life = p.attr.x;
  const damp = Math.max(0, 1 - dt * BALLISTIC.drag);
  const velocity = [p.velocity.x * damp, (p.velocity.y - dt * BALLISTIC.gravity) * damp, p.velocity.z * damp];
  const position = [p.position.x + velocity[0] * dt, p.position.y + velocity[1] * dt, p.position.z + velocity[2] * dt];
  const age = p.age + dt;
  if (age > life) {
    const fresh = spawn(p.randStep);
    set(p.position, fresh.position, 1); set(p.velocity, fresh.velocity, 0);
    p.attr.x = fresh.life; p.attr.y = fresh.size; p.age = 0;
  } else {
    set(p.position, position, 1); set(p.velocity, velocity, 0); p.age = age;
  }
}
