
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

export async function rateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.timestamp + windowMs) {
    record = { count: 1, timestamp: now };
    rateLimitStore.set(key, record);
  } else {
    record.count++;
  }

  if (record.count > limit) {
    if (now < record.timestamp + windowMs) {
      throw new Error("Too many attempts. Please try again later.");
    } else {
      record = { count: 1, timestamp: now };
      rateLimitStore.set(key, record);
    }
  }
}

export function hashPin(pin: string, salt: string): string {
  return createHash("sha256").update(`${pin}${salt}`).digest("hex");
}
