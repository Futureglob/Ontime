
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

// Browser-compatible hash function using Web Crypto API
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (typeof window === "undefined") {
    // Server-side fallback using a simple hash
    return btoa(`${pin}${salt}`).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${pin}${salt}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("Error hashing pin:", error);
    // Fallback to simple encoding
    return btoa(`${pin}${salt}`).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
  }
}

// Synchronous version for backward compatibility (less secure)
export function hashPinSync(pin: string, salt: string): string {
  return btoa(`${pin}${salt}`).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
}
