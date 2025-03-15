
import { saveToLocalStorage, getStorageStats } from "@/utils/bookmarklet";
import { BookmarkletItem } from "@/utils/bookmarklet/types";

// استرجاع العناصر من التخزين المحلي
export const getFromLocalStorage = (): BookmarkletItem[] => {
  try {
    const storageData = localStorage.getItem("bookmarklet_data");
    if (storageData) {
      return JSON.parse(storageData);
    }
  } catch (error) {
    console.error("خطأ في استرجاع البيانات من التخزين المحلي:", error);
  }
  return [];
};

// استرجاع العناصر حسب الحالة
export const getItemsByStatus = (status: string): BookmarkletItem[] => {
  const allItems = getFromLocalStorage();
  return allItems.filter(item => item.status === status);
};

// تحديث حالة عنصر في التخزين المحلي
export const updateItemStatus = (id: string, newStatus: string): boolean => {
  try {
    const items = getFromLocalStorage();
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    );
    
    localStorage.setItem("bookmarklet_data", JSON.stringify(updatedItems));
    return true;
  } catch (error) {
    console.error("خطأ في تحديث حالة العنصر:", error);
    return false;
  }
};

// تصدير البيانات كملف JSON
export const exportDataAsJSON = (): string => {
  const items = getFromLocalStorage();
  return JSON.stringify(items, null, 2);
};

// تصدير البيانات كملف CSV
export const exportDataAsCSV = (): string => {
  const items = getFromLocalStorage();
  if (items.length === 0) return "";
  
  // استخراج أسماء الحقول من العنصر الأول
  const firstItem = items[0];
  const headers = Object.keys(firstItem).filter(key => 
    key !== "id" && key !== "status" && key !== "extractedText"
  );
  
  // إنشاء سطر العناوين
  const headerRow = headers.join(",");
  
  // إنشاء صفوف البيانات
  const dataRows = items.map(item => {
    return headers.map(header => {
      const value = item[header as keyof typeof item];
      // التعامل مع القيم التي تحتوي على فواصل أو أقواس مزدوجة
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || "";
    }).join(",");
  });
  
  // دمج الرأس مع الصفوف
  return [headerRow, ...dataRows].join("\n");
};

// وظائف مساعدة أخرى للتعامل مع البيانات
export const getReadyItemsCount = (): number => {
  return getItemsByStatus("ready").length;
};

export const getSuccessItemsCount = (): number => {
  return getItemsByStatus("success").length;
};

export const getErrorItemsCount = (): number => {
  return getItemsByStatus("error").length;
};

export { saveToLocalStorage, getStorageStats };
