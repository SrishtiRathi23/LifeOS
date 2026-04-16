import * as Sentry from "@sentry/node";
import { env } from "../utils/env.js";

export const initSentry = () => {
  if (env.NODE_ENV === "production" && env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: env.NODE_ENV,
    });
  }
};
