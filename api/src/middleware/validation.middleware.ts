import type { Request, RequestHandler } from "express";
import type { ZodSchema, z } from "zod";
import { Errors } from "../lib/app-error.js";

type Schema = ZodSchema<z.output<z.ZodTypeAny>>;

export function validateBody(schema: Schema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        Errors.badRequest("Invalid request body", {
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: Schema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        Errors.badRequest("Invalid query parameters", {
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      );
      return;
    }
    req.query = result.data as Request["query"];
    next();
  };
}

export function validateParams(schema: Schema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        Errors.badRequest("Invalid path parameters", {
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      );
      return;
    }
    req.params = result.data as Request["params"];
    next();
  };
}