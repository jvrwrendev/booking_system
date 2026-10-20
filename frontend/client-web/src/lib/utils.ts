import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function computeFullName(
  firstName: string,
  middleName: string,
  lastName: string,
  suffix: string = ""
): string {
  const parts = [firstName, middleName, lastName, suffix]
    .filter((p) => p && p.trim());
  return parts.join(" ");
}

export interface AddressRef {
  code: string;
  name: string;
}

export interface AddressParts {
  street: string;
  barangay: AddressRef;
  city: AddressRef;
  province: AddressRef;
  region: AddressRef;
}

export function emptyAddressRef(): AddressRef {
  return { code: "", name: "" };
}

export function emptyAddress(): AddressParts {
  return {
    street: "",
    barangay: emptyAddressRef(),
    city: emptyAddressRef(),
    province: emptyAddressRef(),
    region: emptyAddressRef(),
  };
}

export function formatAddress(addr: AddressParts | string | undefined | null): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.barangay.name, addr.city.name, addr.province.name, addr.region.name]
    .filter((p) => p && p.trim());
  return parts.join(", ");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function nameInitials(firstName: string, middleName: string, lastName: string): string {
  const parts = [firstName, middleName, lastName].filter((p) => p.trim());
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function truncate(text: string, max = 50): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function humanize(value: string): string {
  return value
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}