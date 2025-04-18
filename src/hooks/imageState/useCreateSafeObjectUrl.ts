
export const useCreateSafeObjectUrl = () => {
  const createSafeObjectURL = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // إنشاء عنوان URL للملف باستخدام URL.createObjectURL
        const url = URL.createObjectURL(file);
        console.log("تم إنشاء عنوان URL للصورة بنجاح:", url);
        resolve(url);
      } catch (error) {
        console.error("خطأ في إنشاء عنوان URL للملف:", error);
        reject(error);
      }
    });
  };

  // دالة لإلغاء عنوان URL لمنع تسرب الذاكرة
  const revokeObjectURL = (url: string): void => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
        console.log("تم إلغاء عنوان URL للصورة");
      } catch (error) {
        console.error("خطأ في إلغاء عنوان URL للصورة:", error);
      }
    }
  };

  return {
    createSafeObjectURL,
    revokeObjectURL
  };
};
