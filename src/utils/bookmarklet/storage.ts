
import { ImageData } from "@/types/ImageData";
import { STORAGE_KEY, STORAGE_VERSION, BookmarkletExportData, BookmarkletItem, StorageStats } from "./types";
import { convertImagesToBookmarkletItems } from "./converter";

/**
 * حفظ بيانات الصور في localStorage
 */
export const saveToLocalStorage = (images: ImageData[]): number => {
  try {
    // استخدام وظيفة التحويل المحسنة
    const items = convertImagesToBookmarkletItems(images);

    if (items.length === 0) {
      return 0;
    }

    const exportData: BookmarkletExportData = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      items
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportData));
    return items.length;
  } catch (error) {
    console.error("خطأ في حفظ البيانات:", error);
    return 0;
  }
};

/**
 * قراءة البيانات المخزنة من localStorage
 */
export const getFromLocalStorage = (): BookmarkletExportData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    return JSON.parse(data) as BookmarkletExportData;
  } catch (error) {
    console.error("خطأ في قراءة البيانات:", error);
    return null;
  }
};

/**
 * تحديد عدد العناصر المخزنة وجاهزة للاستخدام
 */
export const getStoredItemsCount = (): number => {
  const data = getFromLocalStorage();
  if (!data) return 0;
  return data.items.length;
};

/**
 * مسح البيانات المخزنة
 */
export const clearStoredItems = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * تحديث حالة عنصر محدد
 */
export const updateItemStatus = (id: string, status: "ready" | "pending" | "success" | "error", message?: string): boolean => {
  try {
    const data = getFromLocalStorage();
    if (!data) return false;

    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        return { ...item, status, message, lastUpdated: new Date().toISOString() };
      }
      return item;
    });

    const updatedData = {
      ...data,
      items: updatedItems,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error("خطأ في تحديث حالة العنصر:", error);
    return false;
  }
};

/**
 * الحصول على معلومات حول البيانات المخزنة للعرض
 */
export const getStorageStats = (): StorageStats => {
  const data = getFromLocalStorage();
  if (!data) {
    return {
      total: 0,
      ready: 0,
      success: 0,
      error: 0,
      lastUpdate: null
    };
  }
  
  return {
    total: data.items.length,
    ready: data.items.filter(item => item.status === "ready").length,
    success: data.items.filter(item => item.status === "success").length,
    error: data.items.filter(item => item.status === "error").length,
    lastUpdate: new Date(data.exportDate)
  };
};

/**
 * استرداد البيانات المخزنة حسب الحالة
 */
export const getItemsByStatus = (status?: "ready" | "pending" | "success" | "error"): BookmarkletItem[] => {
  const data = getFromLocalStorage();
  if (!data) return [];
  
  if (!status) return data.items;
  
  return data.items.filter(item => item.status === status);
};
