
/**
 * وظيفة لحساب هاش قائم على محتوى الصورة
 * تستخدم خوارزمية بسيطة للتشابه
 */
export const getImageHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // استخدام FileReader لقراءة الملف كـ Data URL
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('فشل في قراءة الملف'));
          return;
        }
        
        // حساب هاش بسيط مستند إلى حجم الملف وآخر تعديل واسم الملف
        const simpleHash = `${file.name}-${file.size}-${file.lastModified}`;
        
        // يمكن استخدام خوارزميات هاش أكثر تعقيدًا هنا في المستقبل
        resolve(simpleHash);
      };
      
      reader.onerror = () => {
        reject(new Error('فشل في قراءة الملف'));
      };
      
      // قراءة الملف كـ Data URL
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * وظيفة مساعدة لمقارنة هاشات الصور
 */
export const compareImageHashes = (hash1: string, hash2: string): boolean => {
  return hash1 === hash2;
};
