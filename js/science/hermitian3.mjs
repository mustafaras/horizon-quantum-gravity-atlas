// Complex 3 x 3 Hermitian matrices: the analytic eigendecomposition and exp(-i H t). Pure arithmetic on {re, im}
// objects, no dependency.
//
// Eigenvalues come from the closed (trigonometric) solution of the characteristic cubic. An eigenvector of a simple
// eigenvalue is the bilinear cross product of two rows of H - lambda I (each row is orthogonal, in the bilinear sense, to
// the null vector). The best-separated eigenvalue and one of the other two get their vectors that way; the last vector
// completes the orthonormal basis as conj(v1 x v2), which stays accurate when two eigenvalues nearly coincide. An exactly
// (to rounding) degenerate pair gets any orthonormal pair in the plane orthogonal to the isolated vector.

const TWO_PI_OVER_3 = (2 * Math.PI) / 3;
/** Eigenvalues closer than this fraction of the spectral radius are one degenerate eigenvalue. */
const DEGENERACY = 1e-12;

export const cadd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
export const csub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });
export const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cconj = (a) => ({ re: a.re, im: -a.im });
export const cscale = (a, s) => ({ re: a.re * s, im: a.im * s });
export const cabs2 = (a) => a.re * a.re + a.im * a.im;
export const cexpi = (phase) => ({ re: Math.cos(phase), im: Math.sin(phase) });

const ZERO = Object.freeze({ re: 0, im: 0 });
const ONE = Object.freeze({ re: 1, im: 0 });

/** Bilinear cross product (no conjugation) of two complex 3-vectors. */
function cross(a, b) {
  return [
    csub(cmul(a[1], b[2]), cmul(a[2], b[1])),
    csub(cmul(a[2], b[0]), cmul(a[0], b[2])),
    csub(cmul(a[0], b[1]), cmul(a[1], b[0])),
  ];
}

const norm2 = (v) => cabs2(v[0]) + cabs2(v[1]) + cabs2(v[2]);
const normalise = (v) => { const n = Math.sqrt(norm2(v)); return v.map((x) => cscale(x, 1 / n)); };
/** Hermitian inner product <a, b> = sum conj(a_i) b_i. */
const inner = (a, b) => cadd(cadd(cmul(cconj(a[0]), b[0]), cmul(cconj(a[1]), b[1])), cmul(cconj(a[2]), b[2]));
/** b with its component along the unit vector a removed, normalised. */
const orthogonalised = (a, b) => { const o = inner(a, b); return normalise(b.map((x, i) => csub(x, cmul(a[i], o)))); };

/** Null vector of the (singular) Hermitian matrix M: the largest cross product of its rows, normalised. */
function nullVector(M) {
  const candidates = [cross(M[0], M[1]), cross(M[0], M[2]), cross(M[1], M[2])];
  let best = candidates[0], bestNorm = norm2(best);
  for (const c of candidates) { const n = norm2(c); if (n > bestNorm) { best = c; bestNorm = n; } }
  return normalise(best);
}

/** Eigenvalues (ascending) of a Hermitian matrix given as rows of {re, im}, by the trigonometric cubic solution. */
function eigenvalues(A) {
  const mean = (A[0][0].re + A[1][1].re + A[2][2].re) / 3;
  const d = [A[0][0].re - mean, A[1][1].re - mean, A[2][2].re - mean];
  const off = cabs2(A[0][1]) + cabs2(A[0][2]) + cabs2(A[1][2]);
  const p2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] + 2 * off;
  if (p2 === 0) return [mean, mean, mean];
  const p = Math.sqrt(p2 / 6);
  // B = (A - mean I) / p; det(B) / 2 = cos(3 phi)
  const b = A.map((row, i) => row.map((x, j) => cscale(i === j ? { re: x.re - mean, im: 0 } : x, 1 / p)));
  const minor = (i, j, k, l) => csub(cmul(b[i][k], b[j][l]), cmul(b[i][l], b[j][k]));
  const det = cadd(cadd(cmul(b[0][0], minor(1, 2, 1, 2)), cmul(cscale(b[0][1], -1), minor(1, 2, 0, 2))), cmul(b[0][2], minor(1, 2, 0, 1)));
  const r = Math.max(-1, Math.min(1, det.re / 2));
  const phi = Math.acos(r) / 3;
  const high = mean + 2 * p * Math.cos(phi);
  const low = mean + 2 * p * Math.cos(phi + TWO_PI_OVER_3);
  return [low, 3 * mean - high - low, high];
}

/**
 * Orthonormal eigenpairs of a Hermitian matrix: `{ values: [l0, l1, l2], vectors: [v0, v1, v2] }` with H v_k = l_k v_k
 * and each v_k an array of three {re, im}. The first pair is the isolated eigenvalue (the extreme root farthest from the
 * others, which the trigonometric solution gives to rounding even when the other two coincide); the other two come from
 * the 2 x 2 problem H restricted to the plane orthogonal to its vector, which is exact for a degenerate pair.
 */
export function eigenHermitian3(H) {
  const estimate = eigenvalues(H);
  const radius = Math.max(Math.abs(estimate[0]), Math.abs(estimate[2]), Number.MIN_VALUE);
  if (estimate[2] - estimate[0] <= DEGENERACY * radius) {
    return { values: estimate, vectors: [[ONE, ZERO, ZERO], [ZERO, ONE, ZERO], [ZERO, ZERO, ONE]] };
  }
  const isolated = estimate[1] - estimate[0] >= estimate[2] - estimate[1] ? estimate[0] : estimate[2];
  const shifted = H.map((row, i) => row.map((x, j) => (i === j ? { re: x.re - isolated, im: x.im } : x)));
  const first = nullVector(shifted);
  // Rayleigh quotient: second-order accurate in the vector error.
  const Hv = H.map((row) => row.reduce((acc, x, j) => cadd(acc, cmul(x, first[j])), ZERO));
  const lambdaFirst = inner(first, Hv).re;
  // Orthonormal basis (e1, e2) of the plane orthogonal to the first vector.
  const axis = [0, 1, 2].reduce((best, i) => (cabs2(first[i]) < cabs2(first[best]) ? i : best), 0);
  const e1 = orthogonalised(first, [0, 1, 2].map((i) => (i === axis ? ONE : ZERO)));
  const e2 = cross(first, e1).map(cconj);
  const apply = (v) => H.map((row) => row.reduce((acc, x, j) => cadd(acc, cmul(x, v[j])), ZERO));
  const He1 = apply(e1), He2 = apply(e2);
  const b11 = inner(e1, He1).re, b22 = inner(e2, He2).re, b12 = inner(e1, He2);
  const mean = (b11 + b22) / 2, half = (b11 - b22) / 2;
  const radius2 = Math.hypot(half, Math.sqrt(cabs2(b12)));
  const combine = (x1, x2) => normalise(e1.map((_, i) => cadd(cscale(e1[i], 0), cadd(cmul(x1, e1[i]), cmul(x2, e2[i])))));
  let upper, lower;
  if (radius2 <= DEGENERACY * radius) {
    upper = e1; lower = e2;
  } else {
    const lambda = mean + radius2;
    const a = [b12, { re: lambda - b11, im: 0 }], b = [{ re: lambda - b22, im: 0 }, cconj(b12)];
    const x = cabs2(a[0]) + cabs2(a[1]) >= cabs2(b[0]) + cabs2(b[1]) ? a : b;
    upper = combine(x[0], x[1]);
    lower = combine(cscale(cconj(x[1]), -1), cconj(x[0]));
  }
  return { values: [lambdaFirst, mean - radius2, mean + radius2], vectors: [first, lower, upper] };
}

/** exp(-i H t) as three rows of {re, im}; H in the units whose inverse is the unit of t. */
export function expMinusIHt(H, t) {
  const { values, vectors } = eigenHermitian3(H);
  const S = [0, 1, 2].map(() => [ZERO, ZERO, ZERO]);
  for (let k = 0; k < 3; k += 1) {
    const phase = cexpi(-values[k] * t);
    const v = vectors[k];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) S[r][c] = cadd(S[r][c], cmul(phase, cmul(v[r], cconj(v[c]))));
    }
  }
  return S;
}
