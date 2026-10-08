const SCIENTIFIC_STATUS_LABELS = Object.freeze([
  "established",
  "effective",
  "conjectural",
  "schematic",
  "heuristic",
  "open",
]);

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

export function validateScientificProvenance(value) {
  expectRecord(value, "ScientificProvenance");
  return deepFreeze({
    model: expectString(value.model, "ScientificProvenance.model"),
    status: expectEnum(value.status, SCIENTIFIC_STATUS_LABELS, "ScientificProvenance.status"),
    assumptions: expectArrayOfStrings(value.assumptions, "ScientificProvenance.assumptions"),
    validity: expectArrayOfStrings(value.validity, "ScientificProvenance.validity"),
    numericalMethod: expectString(value.numericalMethod, "ScientificProvenance.numericalMethod"),
    references: expectArrayOfStrings(value.references, "ScientificProvenance.references"),
  });
}

export {
  SCIENTIFIC_STATUS_LABELS,
  deepFreeze,
};
