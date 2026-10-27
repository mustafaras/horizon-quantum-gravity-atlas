// The diagram descriptions of the Feynman builder (S16): which vertices and edges draw an s-, t- or u-channel exchange, and the Compton
// pair, for the four external particles the builder has chosen. The geometry is feynman-svg.mjs's job; this file only places vertices.
//
//   diagramFor({ topo, channel, boson, ends })
//     topo     "s" (annihilation), "t" (exchange) or "compton"
//     channel  "s", "t" or "u": which diagram of the process is wanted
//     boson    TeX of the exchanged boson, or null
//     ends     [in1, in2, out1, out2], each { tex, anti, photon }

export const DIAGRAM_SIZE = Object.freeze({ width: 560, height: 240 });

const X_IN = 56, X_OUT = 504;
const Y_TOP = 50, Y_BOTTOM = 190, Y_MID = 120;
const LEG_TOP = 70, LEG_BOTTOM = 170;

const legKind = (end) => (end.photon ? "photon" : end.anti ? "antifermion" : "fermion");
const external = (id, x, y) => ({ id, x, y, external: true });
const vertex = (id, x, y) => ({ id, x, y });
const incoming = (end, id, to, momentum) => ({ from: id, to, kind: legKind(end), label: end.tex, momentum: { tex: momentum } });
const outgoing = (end, id, from, momentum) => ({ from, to: id, kind: legKind(end), label: end.tex, momentum: { tex: momentum } });

function sChannel(ends, boson) {
  const [in1, in2, out1, out2] = ends;
  return {
    vertices: [external("i1", X_IN, Y_TOP), external("i2", X_IN, Y_BOTTOM), vertex("a", 215, Y_MID), vertex("b", 345, Y_MID),
      external("o1", X_OUT, Y_TOP), external("o2", X_OUT, Y_BOTTOM)],
    edges: [
      incoming(in1, "i1", "a", "p_1"), incoming(in2, "i2", "a", "p_2"),
      { from: "a", to: "b", kind: "photon", label: boson, momentum: { tex: "q" } },
      outgoing(out1, "o1", "b", "p_3"), outgoing(out2, "o2", "b", "p_4"),
    ],
  };
}

function exchange(ends, boson, crossed) {
  const [in1, in2, out1, out2] = ends;
  const upper = crossed ? out2 : out1, lower = crossed ? out1 : out2;
  return {
    vertices: [external("i1", X_IN, LEG_TOP), external("i2", X_IN, LEG_BOTTOM), vertex("a", 280, LEG_TOP), vertex("b", 280, LEG_BOTTOM),
      external("o1", X_OUT, crossed ? LEG_BOTTOM : LEG_TOP), external("o2", X_OUT, crossed ? LEG_TOP : LEG_BOTTOM)],
    edges: [
      incoming(in1, "i1", "a", "p_1"), incoming(in2, "i2", "b", "p_2"),
      { from: "a", to: "b", kind: "photon", label: boson, momentum: { tex: crossed ? "u" : "t", reverse: false } },
      outgoing(upper, crossed ? "o2" : "o1", "a", crossed ? "p_4" : "p_3"),
      outgoing(lower, crossed ? "o1" : "o2", "b", crossed ? "p_3" : "p_4"),
    ],
  };
}

function compton(ends, channel) {
  const photonIn = ends[0].photon ? ends[0] : ends[1];
  const fermionIn = ends[0].photon ? ends[1] : ends[0];
  const photonOut = ends[2].photon ? ends[2] : ends[3];
  const fermionOut = ends[2].photon ? ends[3] : ends[2];
  const fermionKind = fermionIn.anti ? "antifermion" : "fermion";
  if (channel === "u") {
    return {
      vertices: [external("gi", X_IN, 30), external("fi", X_IN, 210), vertex("a", 215, 170), vertex("b", 345, 170),
        external("go", X_OUT, 30), external("fo", X_OUT, 210)],
      edges: [
        incoming(fermionIn, "fi", "a", "p"), outgoing(photonOut, "go", "a", "k'"),
        { from: "a", to: "b", kind: fermionKind, momentum: { tex: "p - k'" } },
        incoming(photonIn, "gi", "b", "k"), outgoing(fermionOut, "fo", "b", "p'"),
      ],
    };
  }
  return {
    vertices: [external("gi", X_IN, Y_TOP), external("fi", X_IN, Y_BOTTOM), vertex("a", 215, 130), vertex("b", 345, 130),
      external("go", X_OUT, Y_TOP), external("fo", X_OUT, Y_BOTTOM)],
    edges: [
      incoming(photonIn, "gi", "a", "k"), incoming(fermionIn, "fi", "a", "p"),
      { from: "a", to: "b", kind: fermionKind, momentum: { tex: "p + k" } },
      outgoing(photonOut, "go", "b", "k'"), outgoing(fermionOut, "fo", "b", "p'"),
    ],
  };
}

const LEGEND_ROWS = Object.freeze([
  ["fermion", "\\mathrm{fermion}"], ["antifermion", "\\mathrm{antifermion}"], ["photon", "\\mathrm{photon}"],
  ["boson", "W,\\ Z\\ \\mathrm{boson}"], ["gluon", "\\mathrm{gluon}"], ["scalar", "\\mathrm{scalar}"],
]);
const LEGEND_X = [190, 500];
const LEGEND_TOP = 30, LEGEND_STEP = 36;

/** One line of every kind the drawing knows, labelled at its left end: the key to the conventions of the diagrams above it. */
export function legendDiagram() {
  const vertices = [], edges = [];
  LEGEND_ROWS.forEach(([kind, label], i) => {
    const y = LEGEND_TOP + i * LEGEND_STEP;
    vertices.push(external(`l${i}`, LEGEND_X[0], y), external(`r${i}`, LEGEND_X[1], y));
    edges.push({ from: `l${i}`, to: `r${i}`, kind, label });
  });
  return { vertices, edges };
}

export function diagramFor({ topo, channel, boson, ends }) {
  if (topo === "compton") return compton(ends, channel);
  if (topo === "s" && channel === "s") return sChannel(ends, boson);
  // Identical incoming particles (Moller): the t and u diagrams differ by which outgoing electron leaves each vertex. Distinguishable ones
  // follow the flavour: the line that comes in as e- must leave as e-, whatever order the builder lists the outgoing pair in.
  const identical = ends[0].tex === ends[1].tex;
  return exchange(ends, boson, identical ? channel === "u" : ends[0].tex !== ends[2].tex);
}

/** A sentence for the text alternative of a diagram. */
export function describeDiagram({ topo, channel, ends }) {
  const names = ends.map((e) => e.plain).join(", ");
  const kind = topo === "compton" ? `Compton ${channel}-channel diagram` : `${channel}-channel diagram`;
  return `Feynman diagram, ${kind}. External particles, left to right and top to bottom: ${names}. Time runs from left to right.`;
}
