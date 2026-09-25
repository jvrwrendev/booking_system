import type { Express, Router } from "express";

export interface AppModule {
  name: string;
  basePath: string;
  router: Router;
}

export function registerModules(
  app: Express,
  modules: readonly AppModule[],
): void {
  for (const module of modules) {
    app.use(module.basePath, module.router);
  }
}