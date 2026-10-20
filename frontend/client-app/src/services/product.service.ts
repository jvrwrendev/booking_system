import type { Product, ProductStockStatus } from "@/types/product";
import { getProductStockStatus } from "@/types/product";
import { mockProducts } from "./mock/products";
import { sleep } from "@/lib/utils";
import { NETWORK_DELAY_MS } from "@/constants";

export async function listProducts(): Promise<Product[]> {
  await sleep(NETWORK_DELAY_MS);
  return mockProducts.filter((p) => p.status !== "inactive");
}

export async function getProduct(id: string): Promise<Product | null> {
  await sleep(NETWORK_DELAY_MS);
  return mockProducts.find((p) => p.id === id) ?? null;
}

export function computeStockStatus(p: Product): ProductStockStatus {
  return getProductStockStatus(p);
}
