"use client";

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || payload?.success === false) {
    throw new ApiError(payload?.message || `Request failed (${res.status})`, res.status, payload?.errors);
  }
  return payload?.data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body = {}) => request("POST", url, body),
  patch: (url, body = {}) => request("PATCH", url, body),
  del: (url) => request("DELETE", url),
};
