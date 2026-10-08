import connectDB from "@/lib/mongodb";
import { requireAdmin } from "@/middleware/auth";
import { AppError, ValidationError } from "@/utils/errors";
import { errorResponse, json } from "@/utils/apiResponse";
import { rateLimit as applyRateLimit, clientIp } from "@/utils/rateLimit";
import { assertPlainObject } from "@/utils/validators";

/**
 * Wraps a controller function so every API route gets the same behaviour:
 *   rate limit -> DB connection -> (optional) admin auth -> controller -> JSON / error mapping
 *
 * The controller receives { request, params, admin } and returns plain data (-> 200)
 * or a Response (e.g. created(...)).
 */
export function createHandler(controller, { auth = false, rateLimit } = {}) {
  return async function handler(request, context) {
    try {
      if (rateLimit) {
        applyRateLimit(`${rateLimit.name}:${clientIp(request)}`, rateLimit);
      }
      await connectDB();
      const params = context?.params ? await context.params : {};
      const admin = auth ? await requireAdmin() : null;

      const result = await controller({ request, params, admin });
      return result instanceof Response ? result : json(result);
    } catch (err) {
      return toErrorResponse(err, request);
    }
  };
}

export async function readJson(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  return assertPlainObject(body);
}

function toErrorResponse(err, request) {
  if (err instanceof AppError) {
    return errorResponse(err.message, err.status, err.details);
  }

  // Mongoose schema validation
  if (err?.name === "ValidationError" && err.errors) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return errorResponse("Validation failed", 400, errors);
  }
  if (err?.name === "CastError") {
    return errorResponse(`Invalid value for ${err.path}`, 400);
  }
  if (err?.code === 11000) {
    return errorResponse("A record with these details already exists", 409);
  }

  // Unknown: log details on the server, send nothing sensitive to the client.
  console.error(`[api] ${request?.method} ${request?.url} failed:`, err);
  return errorResponse("Something went wrong. Please try again.", 500);
}
