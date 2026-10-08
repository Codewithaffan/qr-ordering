import { ConflictError } from "./errors.js";

/** Turn a Mongo duplicate-key error (E11000) into a friendly 409. Re-throws anything else. */
export function rethrowDuplicate(err, message) {
  if (err?.code === 11000) throw new ConflictError(message);
  throw err;
}
