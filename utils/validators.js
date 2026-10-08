import { ValidationError } from "./errors.js";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{5,17}[0-9]$/;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function isObjectId(value) {
  return typeof value === "string" && OBJECT_ID_RE.test(value);
}

export function assertObjectId(value, label = "id") {
  if (!isObjectId(value)) {
    throw new ValidationError(`Invalid ${label}`, { [label]: "Must be a valid id" });
  }
  return value;
}

/** Trim + strip control characters. Rendering is escaped by React, this keeps stored data clean. */
export function cleanText(value) {
  return String(value).replace(CONTROL_CHARS_RE, "").trim();
}

function fail(label, message) {
  throw new ValidationError(`${label}: ${message}`, { [label]: message });
}

export function requireString(value, label, { min = 1, max = 200 } = {}) {
  if (typeof value !== "string") fail(label, "is required");
  const text = cleanText(value);
  if (text.length < min) fail(label, min === 1 ? "is required" : `must be at least ${min} characters`);
  if (text.length > max) fail(label, `must be at most ${max} characters`);
  return text;
}

/** Returns "" when empty/undefined, validated string otherwise. */
export function optionalString(value, label, { max = 500 } = {}) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") fail(label, "must be text");
  const text = cleanText(value);
  if (text.length > max) fail(label, `must be at most ${max} characters`);
  return text;
}

export function requireEmail(value, label = "email") {
  const email = requireString(value, label, { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) fail(label, "is not a valid email address");
  return email;
}

export function requirePhone(value, label = "phone") {
  const phone = requireString(value, label, { max: 20 });
  if (!PHONE_RE.test(phone)) fail(label, "is not a valid phone number");
  return phone;
}

export function optionalPhone(value, label = "phone") {
  const phone = optionalString(value, label, { max: 20 });
  if (phone && !PHONE_RE.test(phone)) fail(label, "is not a valid phone number");
  return phone;
}

export function requireNumber(value, label, { min = -Infinity, max = Infinity, maxDecimals } = {}) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) fail(label, "must be a number");
  if (n < min) fail(label, `must be at least ${min}`);
  if (n > max) fail(label, `must be at most ${max}`);
  if (maxDecimals !== undefined && Math.round(n * 10 ** maxDecimals) / 10 ** maxDecimals !== n) {
    fail(label, `can have at most ${maxDecimals} decimal places`);
  }
  return n;
}

export function requireInt(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = requireNumber(value, label, { min, max });
  if (!Number.isInteger(n)) fail(label, "must be a whole number");
  return n;
}

export function requireBoolean(value, label) {
  if (typeof value !== "boolean") fail(label, "must be true or false");
  return value;
}

export function requireEnum(value, label, allowed) {
  if (!allowed.includes(value)) fail(label, `must be one of: ${allowed.join(", ")}`);
  return value;
}

/** Accepts "", or an absolute http(s) URL. */
export function optionalUrl(value, label, { max = 2000 } = {}) {
  const text = optionalString(value, label, { max });
  if (!text) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    fail(label, "must be a valid URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) fail(label, "must start with http:// or https://");
  return text;
}

export function assertPlainObject(value, message = "Request body must be a JSON object") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(message);
  }
  return value;
}

export const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
