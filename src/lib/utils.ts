
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// إضافة وظيفة للحصول على مسار الصورة البديلة
export function getPlaceholderImagePath() {
  return '/placeholder-image.jpg';
}

// إضافة وظيفة للتحقق من صحة عنوان URL
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// إضافة وظيفة للحصول على عنوان URL آمن للصورة
export function getSafeImageUrl(url: string | null | undefined) {
  if (!url) return getPlaceholderImagePath();
  if (isValidUrl(url)) return url;
  return getPlaceholderImagePath();
}
