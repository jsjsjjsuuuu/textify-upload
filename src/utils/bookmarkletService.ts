
/**
 * خدمات البوكماركلت
 */

import { ImageData } from "@/types/ImageData";
import { saveToLocalStorage as storeData, getStorageStats as fetchStats, clearStoredItems as clearStorage, getStoredItemsCount as countItems } from "./bookmarklet";
import { generateBookmarkletCode as generateCode, generateEnhancedBookmarkletCode as generateEnhancedCode } from "./bookmarklet/generator";

// تصدير البيانات
export const saveToLocalStorage = (images: ImageData[]): number => {
  return storeData(images);
};

// الحصول على إحصائيات التخزين
export const getStorageStats = () => {
  return fetchStats();
};

// مسح العناصر المخزنة
export const clearStoredItems = () => {
  clearStorage();
};

// الحصول على عدد العناصر المخزنة
export const getStoredItemsCount = (): number => {
  return countItems();
};

// توليد شفرة البوكماركلت
export const generateBookmarkletCode = (): string => {
  return generateCode();
};

// توليد شفرة البوكماركلت المحسّن
export const generateEnhancedBookmarkletCode = (): string => {
  return generateEnhancedCode();
};
