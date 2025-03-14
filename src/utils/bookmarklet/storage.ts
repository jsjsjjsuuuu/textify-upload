
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
      console.log("لا توجد عناصر لحفظها بعد التحويل");
      return 0;
    }

    const exportData: BookmarkletExportData = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      items
    };

    // طباعة البيانات للتشخيص
    console.log("حفظ البيانات إلى localStorage:", exportData);
    console.log("عدد العناصر:", items.length);

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
    if (!data) {
      console.log("لا توجد بيانات مخزنة في localStorage");
      return null;
    }
    
    const parsedData = JSON.parse(data) as BookmarkletExportData;
    console.log("قراءة البيانات من localStorage:", parsedData);
    return parsedData;
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
  const count = data.items.length;
  console.log("عدد العناصر المخزنة:", count);
  return count;
};

/**
 * مسح البيانات المخزنة
 */
export const clearStoredItems = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log("تم مسح البيانات المخزنة");
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
    console.log("تم تحديث حالة العنصر:", id, status);
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
  
  const stats: StorageStats = {
    total: data.items.length,
    ready: data.items.filter(item => item.status === "ready").length,
    success: data.items.filter(item => item.status === "success").length,
    error: data.items.filter(item => item.status === "error").length,
    lastUpdate: data.exportDate ? new Date(data.exportDate) : null
  };
  
  console.log("إحصائيات التخزين:", stats);
  return stats;
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
