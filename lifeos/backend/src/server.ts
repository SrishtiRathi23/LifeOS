import { initSentry } from "./lib/sentry.js";
initSentry(); // Initialize early to capture bootstrap errors

import { app } from "./app.js";
import { env } from "./utils/env.js";
import { logger } from "./lib/logger.js";

const host = env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.listen(env.PORT, host, () => {
  logger.info(`LifeOS backend running on http://${host}:${env.PORT}`);
});
