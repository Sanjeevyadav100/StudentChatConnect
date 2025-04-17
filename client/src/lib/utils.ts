import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatDepartment(department: string): string {
  switch (department) {
    case "computer-science":
      return "Computer Science";
    case "engineering":
      return "Engineering";
    case "business":
      return "Business";
    case "arts":
      return "Arts & Humanities";
    case "science":
      return "Science";
    case "other":
      return "Other";
    default:
      return department;
  }
}
