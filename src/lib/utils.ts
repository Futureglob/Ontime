
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

// Consistent hash function for both browser and Node.js environments
async function consistentBase64Hash(pin: string, salt: string): Promise<string> {
  const combined = `${pin}${salt}`;
  let base64String: string;

  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    // Browser environment
    base64String = window.btoa(combined);
  } else {
    // Node.js environment
    base64String = Buffer.from(combined).toString("base64");
  }
  
  return base64String.replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
}


export async function hashPin(pin: string, salt: string): Promise<string> {
    return consistentBase64Hash(pin, salt);
}

export function hashPinSync(pin: string, salt: string): string {
  const combined = `${pin}${salt}`;
  let base64String: string;

  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    base64String = window.btoa(combined);
  } else {
    base64String = Buffer.from(combined).toString("base64");
  }
  
  return base64String.replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
}
