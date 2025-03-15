
/**
 * كود التخزين للبوكماركلت
 */

export const getStorageCode = (): string => {
  return `
    // ===== نظام التخزين =====
    const STORAGE_KEY = "bookmarklet_data_v1";
    
    // الحصول على البيانات من التخزين المحلي
    const getFromStorage = () => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        return JSON.parse(data);
      } catch (error) {
        console.error("[Storage] خطأ في قراءة البيانات:", error);
        return null;
      }
    };
    
    // حفظ البيانات في التخزين المحلي
    const saveToStorage = (data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("[Storage] خطأ في حفظ البيانات:", error);
        return false;
      }
    };
    
    // تحديث حالة عنصر
    const updateItemStatus = (id, status, message) => {
      const data = getFromStorage();
      if (!data || !data.items) return false;
      
      const updatedItems = data.items.map(item => {
        if (item.id === id) {
          return { ...item, status, message, lastUpdated: new Date().toISOString() };
        }
        return item;
      });
      
      return saveToStorage({
        ...data,
        items: updatedItems,
        lastUpdated: new Date().toISOString()
      });
    };
    
    // إضافة وظائف التخزين إلى النافذة
    window.bookmarkletStorage = {
      getFromStorage,
      saveToStorage,
      updateItemStatus
    };
    
    console.log("[Bookmarklet] تم تحميل نظام التخزين");
  `;
};
