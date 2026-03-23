import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCSSVariable(variable: string): string {
  if (typeof window === "undefined") return "#000000";

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

  // If it's an HSL value, convert it
  if (value && !value.startsWith("#")) {
    const [h, s, l] = value.split(" ");
    return `hsl(${h} ${s} ${l})`;
  }

  return value || "#000000";
}
