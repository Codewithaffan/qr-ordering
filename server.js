// Custom Node server: runs Next.js + Socket.IO on the same HTTP server.
// Development: npm run dev
// Production:  npm start

import { createServer } from "node:http";
import dotenv from "dotenv";

// Load local environment variables when running locally.
// On Render, environment variables are provided by Render.
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const dev = process.argv.includes("--dev");

process.env.NODE_ENV = dev ? "development" : "production";

// --------------------------------------------------
// Environment validation
// --------------------------------------------------

const missing = ["MONGODB_URI", "AUTH_SECRET"].filter(
  (key) => !process.env[key]
);

if (missing.length > 0) {
  console.error(
    `\n✖ Missing required environment variable(s): ${missing.join(", ")}`
  );
  console.error(
    "  Configure the required environment variables in Render or .env.local.\n"
  );
  process.exit(1);
}

if (process.env.AUTH_SECRET.length < 32) {
  console.error(
    "\n✖ AUTH_SECRET must be at least 32 characters."
  );
  console.error(
    "  Generate one with: openssl rand -base64 48\n"
  );
  process.exit(1);
}

// --------------------------------------------------
// Import Next.js and Socket.IO
// --------------------------------------------------

const { default: next } = await import("next");
const { createSocketServer } = await import("./lib/socketServer.js");

// --------------------------------------------------
// Server configuration
// --------------------------------------------------

// Render automatically provides PORT.
// Locally it falls back to 3000.
const port = parseInt(process.env.PORT || "3000", 10);

// Render requires the application to listen on 0.0.0.0.
// Locally this also allows other devices on the same network
// to access the application.
const host = process.env.HOST || "0.0.0.0";

// --------------------------------------------------
// Next.js application
// --------------------------------------------------

const app = next({
  dev,
  hostname: host,
  port,
});

const handle = app.getRequestHandler();

// --------------------------------------------------
// Prepare Next.js
// --------------------------------------------------

await app.prepare();

// --------------------------------------------------
// Create HTTP server
// --------------------------------------------------

const httpServer = createServer((req, res) => {
  handle(req, res);
});

// --------------------------------------------------
// Attach Socket.IO
// --------------------------------------------------

const io = createSocketServer(httpServer);

// --------------------------------------------------
// Start server
// --------------------------------------------------

httpServer.listen(port, host, () => {
  console.log("==============================================");
  console.log("        QR ORDERING SYSTEM");
  console.log("==============================================");

  console.log(`Environment: ${dev ? "development" : "production"}`);
  console.log(`Port:        ${port}`);
  console.log(`Host:        ${host}`);
  console.log("Socket.IO:   /socket.io");

  if (dev) {
    console.log(`Local:       http://localhost:${port}`);
  }

  console.log("==============================================");
});

// --------------------------------------------------
// Graceful shutdown
// --------------------------------------------------

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);

  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));