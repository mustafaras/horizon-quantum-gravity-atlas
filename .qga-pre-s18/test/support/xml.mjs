import assert from "node:assert/strict";

// A tiny XML well-formedness parser: balanced, correctly nested tags, quoted attributes, legal entities.
export function parseXml(src) {
  const stack = [];
  let seenRoot = false;
  const re = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let pos = 0, m;
  while ((m = re.exec(src))) {
    assert.equal(m.index, pos, `unexpected markup at ${pos}: ${src.slice(pos, pos + 40)}`);
    pos = re.lastIndex;
    if (m[5] !== undefined) {
      assert.ok(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(m[5]), "illegal entity");
      assert.ok(stack.length || !m[5].trim(), "text outside root");
      continue;
    }
    const [, close, name, , selfClose] = m;
    if (close) { assert.equal(stack.pop(), name, `mismatched </${name}>`); continue; }
    if (!stack.length) { assert.ok(!seenRoot, "single root"); seenRoot = true; }
    if (!selfClose) stack.push(name);
  }
  assert.equal(pos, src.length);
  assert.deepEqual(stack, []);
  return true;
}
