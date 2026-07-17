import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const WHITESPACE_REGEX = /\s+/;

/**
 * Merge Tailwind class names, resolving conflicts (e.g. "p-2 p-4" -> "p-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date consistently across the app (server and client render the
 * same string, avoiding hydration mismatches from locale differences).
 */
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Small delay helper, useful for demoing pending/optimistic UI states.
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build initials from a display name for avatar fallbacks.
 */
export function getInitials(name: string | null | undefined) {
  if (!name) {
    return "?";
  }
  const parts = name.trim().split(WHITESPACE_REGEX);
  const first = parts.at(0)?.at(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.at(0) ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}
