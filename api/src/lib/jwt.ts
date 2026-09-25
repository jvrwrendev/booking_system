import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  role: string;
};

export function signAccessToken(user: {
  id: string;
  role: string;
}): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    issuer: "agrivet-api",
    audience: "agrivet-client",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "agrivet-api",
    audience: "agrivet-client",
  });

  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as AccessTokenPayload;
}

export function accessTokenTtlMs(): number {
  const unit = env.ACCESS_TOKEN_TTL.slice(-1);
  const value = Number.parseInt(env.ACCESS_TOKEN_TTL.slice(0, -1), 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error("Invalid ACCESS_TOKEN_TTL");
  }
  return value * multiplier;
}