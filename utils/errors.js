/** Application errors carry an HTTP status so the route handler can respond correctly. */
export class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request", details) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do this") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429);
  }
}
