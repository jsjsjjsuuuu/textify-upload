
/**
 * خدمات البوكماركلت
 */

import { ImageData } from "@/types/ImageData";
import { saveToLocalStorage as storeData, getStorageStats as fetchStats, clearStoredItems as clearStorage, getStoredItemsCount as countItems, getFromLocalStorage as retrieveData, updateItemStatus as updateItemStatusImpl } from "./bookmarklet/storage";
import { generateBookmarkletCode as generateCode, generateEnhancedBookmarkletCode as generateEnhancedCode } from "./bookmarklet/generator";

// تصدير البيانات
export const saveToLocalStorage = (images: ImageData[]): number => {
  return storeData(images);
};

// الحصول على البيانات المخزنة
export const getFromLocalStorage = () => {
  return retrieveData();
};

// الحصول على إحصائيات التخزين
export const getStorageStats = () => {
  return fetchStats();
};

// مسح العناصر المخزنة
export const clearStoredItems = () => {
  clearStorage();
};

// تحديث حالة عنصر
export const updateItemStatus = (id: string, status: "ready" | "pending" | "success" | "error", message?: string): boolean => {
  return updateItemStatusImpl(id, status, message);
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
