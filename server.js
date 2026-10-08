// Custom Node server: runs Next.js AND Socket.IO on the same HTTP server / port.
//   npm run dev    -> node server.js --dev
//   npm run build  -> next build
//   npm start      -> node server.js   (production)

import { createServer } from "node:http";
import dotenv from "dotenv";

// Load environment variables before importing Next.js or Socket.IO.
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

if (missing.length) {
  console.error(
    `\n✖ Missing required environment variable(s): ${missing.join(", ")}`
  );
  console.error(
    "  Make sure your .env.local contains the required values.\n"
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

const port = parseInt(process.env.PORT || "3000", 10);

// 0.0.0.0 allows devices on the same Wi-Fi network
// to access the application.
const host = process.env.HOST || "0.0.0.0";

// IMPORTANT:
// Use the same host for Next.js and the HTTP server.
// Previously Next.js was forced to "localhost", which
// caused problems when accessing the application through
// 192.168.0.112.
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
  console.log("\n==============================================");
  console.log("      QR ORDERING SYSTEM");
  console.log("==============================================");

  console.log(
    `\n> Environment: ${dev ? "development" : "production"}`
  );

  console.log(
    `> Local:      http://localhost:${port}`
  );

  console.log(
    `> Network:    http://192.168.0.112:${port}`
  );

  console.log(
    "> Socket.IO:  /socket.io"
  );

  console.log("\n==============================================\n");
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