/** Convert Mongoose docs / lean objects (ObjectId, Date) into plain JSON-safe objects. */
export function serialize(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}
