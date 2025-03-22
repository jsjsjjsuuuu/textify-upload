
/**
 * عنوان خادم الأتمتة واستراتيجية الاتصال
 */

// تعيين عنوان الخادم بناءً على البيئة
export const automationServerUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 
                                  "https://textify-upload.onrender.com";

// الطباعة للتشخيص
console.log(`⚡️ الاتصال بخادم الأتمتة على: ${automationServerUrl}, isProduction: ${import.meta.env.PROD}`);

// تحديد ما إذا كنا في بيئة معاينة
export const isPreviewEnvironment = (): boolean => {
  // تعديل المنطق ليعود false دائمًا في البيئة الحالية للتمكن من الاختبار الفعلي
  const inPreviewMode = false;
  
  // طباعة للتشخيص
  if (inPreviewMode) {
    console.log('⚡️ تعمل في وضع المعاينة، سيتم محاكاة الأتمتة دون اتصال بخادم فعلي');
  } else {
    console.log('⚡️ تم تعيين استخدام خادم Render الرسمي فقط');
  }
  
  return inPreviewMode;
};

// التحقق من اتصال الخادم
export const checkConnection = async (): Promise<{ isConnected: boolean, details?: any }> => {
  try {
    // إذا كنا في بيئة معاينة، نفترض أن الاتصال ناجح دائمًا
    if (isPreviewEnvironment()) {
      return { 
        isConnected: true,
        details: {
          message: "محاكاة اتصال ناجح في بيئة المعاينة",
          time: new Date().toISOString()
        }
      };
    }
    
    console.log("محاولة اتصال سريع:", `${automationServerUrl}/api/ping`);
    
    // محاولة الاتصال بالخادم مع تجنب التخزين المؤقت
    const response = await fetch(`${automationServerUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'x-request-time': Date.now().toString()
      }
    });
    
    // إذا كانت الاستجابة ناجحة
    if (response.ok) {
      // محاولة تحليل البيانات
      try {
        const data = await response.json();
        console.log("Ping response successful:", data);
        return { isConnected: true, details: data };
      } catch (parseError) {
        // إذا تعذر تحليل البيانات، نفترض أن الاتصال ناجح طالما أن الرد 200
        return { isConnected: true };
      }
    } else {
      // إذا كان هناك خطأ في الاستجابة
      console.error("Ping failed:", response.status, response.statusText);
      return { 
        isConnected: false,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
  } catch (error) {
    // في حالة حدوث خطأ في الاتصال
    console.error("Connection check error:", error);
    return { 
      isConnected: false,
      details: { error: error instanceof Error ? error.message : "خطأ غير معروف" }
    };
  }
};
