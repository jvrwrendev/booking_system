import type { Express } from "express";

export interface AppModule {
  name: string;
  basePath: string;
  router: unknown;
}

export function registerModules(
  app: Express,
  modules: readonly AppModule[],
): void {
  for (const module of modules) {
    app.use(module.basePath, module.router as import("express").Router);
  }
}