const SCIENTIFIC_STATUS_LABELS = Object.freeze([
  "established",
  "effective",
  "conjectural",
  "schematic",
  "heuristic",
  "open",
]);

// What a drawn thing is: `data` is measured or tabulated, `model` is computed from the stated equations,
// `decoration` carries no quantity and may be hidden without changing any number.
const SCIENTIFIC_LAYER_CLASSES = Object.freeze(["data", "model", "decoration"]);

function typeError(message) {
  return new TypeError(message);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

function expectRecord(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw typeError(`${name} must be an object`);
  }
}

function expectString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw typeError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function expectArrayOfStrings(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw typeError(`${fieldName} must be a non-empty array`);
  }
  return value.map((entry, index) => expectString(entry, `${fieldName}[${index}]`));
}

function expectEnum(value, allowed, fieldName) {
  const normalized = expectString(value, fieldName);
  if (!allowed.includes(normalized)) {
    throw typeError(`${fieldName} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
}

function expectLayers(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw typeError(`${fieldName} must be a non-empty array`);
  }
  const seen = new Set();
  return value.map((layer, index) => {
    const at = `${fieldName}[${index}]`;
    expectRecord(layer, at);
    const name = expectString(layer.name, `${at}.name`);
    if (seen.has(name)) throw typeError(`${fieldName} has a duplicate layer name: ${name}`);
    seen.add(name);
    return { name, class: expectEnum(layer.class, SCIENTIFIC_LAYER_CLASSES, `${at}.class`) };
  });
}

export function validateScientificProvenance(value) {
  expectRecord(value, "ScientificProvenance");
  return deepFreeze({
    model: expectString(value.model, "ScientificProvenance.model"),
    status: expectEnum(value.status, SCIENTIFIC_STATUS_LABELS, "ScientificProvenance.status"),
    assumptions: expectArrayOfStrings(value.assumptions, "ScientificProvenance.assumptions"),
    validity: expectArrayOfStrings(value.validity, "ScientificProvenance.validity"),
    numericalMethod: expectString(value.numericalMethod, "ScientificProvenance.numericalMethod"),
    references: expectArrayOfStrings(value.references, "ScientificProvenance.references"),
    layers: expectLayers(value.layers, "ScientificProvenance.layers"),
    seed: expectString(value.seed, "ScientificProvenance.seed"),
  });
}

export {
  SCIENTIFIC_LAYER_CLASSES,
  SCIENTIFIC_STATUS_LABELS,
  deepFreeze,
};
