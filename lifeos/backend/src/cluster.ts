import cluster from "node:cluster";
import os from "node:os";
import { logger } from "./lib/logger.js";
import { env } from "./utils/env.js";

if (cluster.isPrimary && env.NODE_ENV === "production") {
  const numCPUs = os.cpus().length;
  logger.info(`Primary process ${process.pid} starting ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`);
    cluster.fork();
  });
} else {
  // Each worker runs the Express app or if not in production, the app runs normally
  import("./server.js");
}
