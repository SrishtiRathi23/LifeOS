import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Some details need another look.",
      issues: error.flatten()
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if ((error as any).code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 10MB)" });
  }

  logger.error(error);
  return res.status(500).json({
    message: "Something went wrong on our side. Please try again."
  });
}
