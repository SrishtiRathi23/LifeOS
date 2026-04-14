import jwt from "jsonwebtoken";
import { env } from "./env.js";

type AuthPayload = {
  sub: string;
  email: string;
  name: string;
};

export function signAuthToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}
