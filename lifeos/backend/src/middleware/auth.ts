import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler.js";
import { verifyAuthToken } from "../utils/jwtHelpers.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const headerToken = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.lifeos_token as string | undefined;
  const token = headerToken || cookieToken;

  if (!token) {
    throw new ApiError(401, "Please sign in to continue.");
  }

  const payload = verifyAuthToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name
  };
  next();
}
