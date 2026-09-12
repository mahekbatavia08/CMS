import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedUrl = url.replace(/\\/g, "/");
  const path = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
  
  return `${baseUrl}${path}`;
}
