export const APP_NAME = "Agrivet Admin";
export const APP_FULL_NAME = "Agrivet Supply Booking & Inventory";
export const BUSINESS_NAME = "Agrivet Supply Co.";

export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const STATUS_ACTIVE = "active";
export const STATUS_INACTIVE = "inactive";

export const CURRENCY = "₱";

/** Units of measure offered when creating or editing a product. */
export const PRODUCT_UNITS = [
  "Bottle",
  "Sack",
  "Piece",
  "Box",
  "Pack",
  "Bag",
  "Kit",
  "Set",
  "Roll",
  "Gallon",
  "Tablet",
  "Liter",
] as const;

export const DEFAULT_PRODUCT_UNIT = "Piece";

export const dateFormatPatterns = {
  short: "MMM dd, yyyy",
  long: "MMMM dd, yyyy",
  withTime: "MMM dd, yyyy HH:mm",
} as const;