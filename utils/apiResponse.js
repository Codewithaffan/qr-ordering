export function json(data, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export const created = (data) => json(data, 201);

export function errorResponse(message, status = 500, errors) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return Response.json(body, { status });
}
