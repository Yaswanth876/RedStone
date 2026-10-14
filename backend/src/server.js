import app from "./app.js";
import prisma from "./db.js";
import { config } from "./config.js";

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`RedStone API running on port ${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));