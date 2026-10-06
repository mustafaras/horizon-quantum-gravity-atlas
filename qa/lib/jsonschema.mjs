// Minimal JSON Schema (2020-12 subset) validator.
// Supports exactly the keywords used by qa/manifest.schema.json:
// type, required, properties, additionalProperties, items, enum, const,
// pattern, minimum, maximum, minItems, minLength, maxLength, oneOf, $ref (#/$defs/...).
// Keeping this dependency-free preserves the repo's zero-build discipline.

const TYPES = {
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  string: (v) => typeof v === "string",
  integer: (v) => Number.isInteger(v),
  number: (v) => typeof v === "number" && Number.isFinite(v),
  boolean: (v) => typeof v === "boolean",
};

function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref: ${ref}`);
  let node = root;
  for (const part of ref.slice(2).split("/")) {
    if (node === null || typeof node !== "object" || !(part in node)) {
      throw new Error(`unresolvable $ref: ${ref}`);
    }
    node = node[part];
  }
  return node;
}

function validateNode(value, schema, root, path, errors) {
  if (schema.$ref) {
    return validateNode(value, resolveRef(root, schema.$ref), root, path, errors);
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter(
      (sub) => validateNode(value, sub, root, path, []).length === 0
    ).length;
    if (matches !== 1) {
      errors.push(`${path}: expected exactly one oneOf branch to match, got ${matches}`);
    }
    return errors;
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  if (schema.type) {
    const check = TYPES[schema.type];
    if (!check) throw new Error(`unsupported type: ${schema.type}`);
    if (!check(value)) {
      errors.push(`${path}: expected type ${schema.type}`);
      return errors; // deeper checks are meaningless on a type mismatch
    }
  }
  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: ${JSON.stringify(value)} fails pattern ${schema.pattern}`);
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: ${value} < minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: ${value} > maximum ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => validateNode(item, schema.items, root, `${path}[${i}]`, errors));
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}: missing required property "${key}"`);
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in value) validateNode(value[key], sub, root, `${path}.${key}`, errors);
    }
    for (const [key, val] of Object.entries(value)) {
      const known = schema.properties && key in schema.properties;
      if (!known) {
        if (schema.additionalProperties === false) {
          errors.push(`${path}: unexpected property "${key}"`);
        } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
          validateNode(val, schema.additionalProperties, root, `${path}.${key}`, errors);
        }
      }
    }
  }
  return errors;
}

/** Returns an array of human-readable validation errors (empty = valid). */
export function validateAgainstSchema(value, schema) {
  return validateNode(value, schema, schema, "$", []);
}
