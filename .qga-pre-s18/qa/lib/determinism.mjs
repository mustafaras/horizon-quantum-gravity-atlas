// Installs the same deterministic random stream before any application script
// runs. The URL seed controls scientific data; this bootstrap additionally
// stabilizes decorative scene geometry that historically used Math.random().

export async function installDeterministicRandom(context, seed) {
  await context.addInitScript((initialSeed) => {
    let state = (Number(initialSeed) >>> 0) || 1;
    Math.random = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }, seed);
}
