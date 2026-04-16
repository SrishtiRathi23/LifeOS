import { initSentry } from "./lib/sentry.js";
initSentry(); // Initialize early to capture bootstrap errors

import { app } from "./app.js";
import { env } from "./utils/env.js";
import { logger } from "./lib/logger.js";

app.listen(env.PORT, () => {
  logger.info(`LifeOS backend running on http://localhost:${env.PORT}`);
});
