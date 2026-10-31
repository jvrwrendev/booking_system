import type { AppModule } from "../../app.module.js";
import { bookingsRouter } from "./bookings.routes.js";

export const bookingsModule: AppModule = {
  name: "bookings",
  basePath: "/api/v1/bookings",
  router: bookingsRouter,
};
