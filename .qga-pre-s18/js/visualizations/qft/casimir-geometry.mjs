/**
 * The pure geometry of the Casimir cavity scene (S15): where the plates stand for a gap, and the segment pairs of the standing modes
 * between them and of the continuum outside. The scene (casimir-cavity.mjs) only uploads these arrays; nothing here touches three.js.
 *
 * Scales. The true gap runs over three decades, 10 nm to 10 um, and is drawn on a log scale between DRAWN_GAP_RANGE scene units: the
 * drawn width is a display mapping, not a length. The modes are drawn at the scene's own amplitude unit: mode n has the zero-point
 * amplitude 1/sqrt(n) of the first mode's, because the amplitude of a mode of angular frequency omega_n = n pi c / a goes as 1/sqrt(omega_n)
 * (the true amplitude also scales as sqrt(a), which the drawing leaves out).
 *
 * All arrays are flat xyz segment pairs (a0, b0, a1, b1, ...), the layout of an engraved segment set, written in place.
 */

export const GAP_RANGE = Object.freeze([1e-8, 1e-5]);
const DRAWN_GAP_RANGE = Object.freeze([2.2, 7.0]);
const DECADES = Math.log10(GAP_RANGE[1] / GAP_RANGE[0]);

export const MODE_COUNT = 8;
export const MODE_SAMPLES = 96;
export const CONTINUUM_PER_MODE = 3;
export const CONTINUUM_SAMPLES = 64;
export const PLATE = Object.freeze({ thickness: 0.45, height: 5.6, depth: 1.8 });

const LEVEL_PITCH = 0.62; // vertical spacing of the mode lines
const AMPLITUDE_UNIT = 0.29; // the first mode's amplitude; below half the pitch so neighbouring lines never touch
const CONTINUUM_LENGTH = 3.0; // how far the outside lines run beyond a plate
const CONTINUUM_OFFSET = 1 / CONTINUUM_PER_MODE; // the outside lines of level n have wave number n - 1/3, n and n + 1/3
const Z = 0;

export const gapFromLog = (log10Gap) => 10 ** log10Gap;
export const logFromGap = (gap) => Math.log10(gap);

/** The drawn width of the gap in scene units, from the true gap in metres. */
export function drawnGap(gap) {
  if (!(gap >= GAP_RANGE[0] && gap <= GAP_RANGE[1])) throw new RangeError(`gap ${gap} m is outside ${GAP_RANGE[0]}..${GAP_RANGE[1]} m`);
  const t = Math.log10(gap / GAP_RANGE[0]) / DECADES;
  return DRAWN_GAP_RANGE[0] + t * (DRAWN_GAP_RANGE[1] - DRAWN_GAP_RANGE[0]);
}

/** x of the centres of the two plates for a drawn gap; their inner faces are at -+g/2. */
export function plateCenters(drawn) {
  const offset = drawn / 2 + PLATE.thickness / 2;
  return { left: -offset, right: offset };
}

/** y of the line of mode n (mode 1 at the top). */
export const modeLevel = (n) => ((MODE_COUNT + 1) / 2 - n) * LEVEL_PITCH;

/** The gap as TeX: nanometres below 1 um with three significant figures, micrometres from there. */
export function gapTex(gap) {
  return gap < 1e-6 ? `a = ${(gap * 1e9).toPrecision(3)}\\,\\mathrm{nm}` : `a = ${(gap * 1e6).toPrecision(3)}\\,\\mu\\mathrm{m}`;
}

/** A pressure in pascal as TeX in scientific notation with three significant figures. */
export function pressureTex(pressure) {
  const [mantissa, exponent] = pressure.toExponential(2).split("e");
  return `P = ${mantissa}\\times10^{${Number(exponent)}}\\,\\mathrm{Pa}`;
}

export const insideLength =() => MODE_COUNT * MODE_SAMPLES * 6;
export const outsideLength = () => 2 * MODE_COUNT * CONTINUUM_PER_MODE * CONTINUUM_SAMPLES * 6;

function checkTarget(out, length) {
  if (!(out instanceof Float32Array) || out.length !== length) throw new RangeError(`target must be a Float32Array of ${length} numbers`);
}

function writePair(out, at, x0, y0, x1, y1) {
  out[at] = x0; out[at + 1] = y0; out[at + 2] = Z; out[at + 3] = x1; out[at + 4] = y1; out[at + 5] = Z;
}

/** The standing modes n = 1..MODE_COUNT between the plates: sin(n pi (x + g/2) / g), zero at both plates, amplitude 1/sqrt(n). */
export function insideSegments(drawn, out) {
  checkTarget(out, insideLength());
  const left = -drawn / 2;
  const at = (n, i) => {
    const s = i / MODE_SAMPLES;
    return [left + s * drawn, modeLevel(n) + (AMPLITUDE_UNIT / Math.sqrt(n)) * Math.sin(n * Math.PI * s)];
  };
  for (let n = 1; n <= MODE_COUNT; n += 1) {
    for (let i = 0; i < MODE_SAMPLES; i += 1) {
      const [x0, y0] = at(n, i), [x1, y1] = at(n, i + 1);
      writePair(out, 6 * ((n - 1) * MODE_SAMPLES + i), x0, y0, x1, y1);
    }
  }
  return out;
}

/**
 * The continuum outside, left side first: for each level, three lines of wave number nu - 1/3, nu, nu + 1/3 starting on the outer
 * face of the plate and running away from the gap, amplitude 1/sqrt(nu). Too dense to count, which is the point of the drawing.
 */
export function outsideSegments(drawn, out) {
  checkTarget(out, outsideLength());
  const face = drawn / 2 + PLATE.thickness;
  let at = 0;
  for (const side of [-1, 1]) {
    for (let n = 1; n <= MODE_COUNT; n += 1) {
      for (let k = 0; k < CONTINUUM_PER_MODE; k += 1) {
        const nu = n + (k - (CONTINUUM_PER_MODE - 1) / 2) * CONTINUUM_OFFSET;
        const point = (i) => {
          const d = (i / CONTINUUM_SAMPLES) * CONTINUUM_LENGTH;
          return [side * (face + d), modeLevel(n) + (AMPLITUDE_UNIT / Math.sqrt(nu)) * Math.sin((nu * Math.PI * d) / drawn)];
        };
        for (let i = 0; i < CONTINUUM_SAMPLES; i += 1) {
          const [x0, y0] = point(i), [x1, y1] = point(i + 1);
          writePair(out, at, x0, y0, x1, y1);
          at += 6;
        }
      }
    }
  }
  return out;
}
