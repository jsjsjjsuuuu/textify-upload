import { BookmarkletItem, BookmarkletExportData, StorageStats, ImageData } from "@/types/ImageData";
import { convertImagesToBookmarkletItems } from "./bookmarklet/converter";
import { generateBookmarkletCode as generateCode, generateEnhancedBookmarkletCode as generateEnhancedCode } from "./bookmarklet/generator";

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

// تصدير الوظائف المساعدة بأسماء مختلفة لتجنب الدائرية
export const saveToLocalStorage = (images: ImageData[]): number => {
  try {
    // تحويل بيانات الصور إلى صيغة bookmarklet
    const items = convertImagesToBookmarkletItems(images);

    if (items.length === 0) {
      console.log("لا توجد عناصر لحفظها بعد التحويل");
      return 0;
    }

    const exportData: BookmarkletExportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      items
    };

    // طباعة البيانات للتشخيص
    console.log("حفظ البيانات إلى localStorage:", exportData);
    console.log("عدد العناصر:", items.length);

    localStorage.setItem("bookmarklet_data", JSON.stringify(exportData));
    return items.length;
  } catch (error) {
    console.error("خطأ في حفظ البيانات:", error);
    return 0;
  }
};
export const getStorageStats = (): StorageStats => {
  try {
    const storageData = localStorage.getItem("bookmarklet_data");
    if (!storageData) {
      console.log("لا توجد بيانات في localStorage");
      return {
        total: 0,
        ready: 0,
        success: 0,
        error: 0,
        lastUpdate: null
      };
    }

    const data = JSON.parse(storageData) as BookmarkletExportData;
    const stats: StorageStats = {
      total: data.items.length,
      ready: data.items.filter(item => item.status === "ready").length,
      success: data.items.filter(item => item.status === "success").length,
      error: data.items.filter(item => item.status === "error").length,
      lastUpdate: data.exportDate ? new Date(data.exportDate) : null
    };
    return stats;
  } catch (error) {
    console.error("خطأ في استرجاع إحصائيات التخزين:", error);
    return {
      total: 0,
      ready: 0,
      success: 0,
      error: 0,
      lastUpdate: null
    };
  }
};
