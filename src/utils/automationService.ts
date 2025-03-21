/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { ConnectionManager } from './automation/connectionManager';
import { AutomationRunner } from './automation/automationRunner';
import { AutomationConfig } from './automation/types';
import { isPreviewEnvironment, createFetchOptions, fetchWithRetry } from './automationServerUrl';
import { toast } from "sonner";

export class AutomationService {
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    try {
      // في بيئة المعاينة، قم بمحاكاة نجاح الاتصال دائماً
      if (isPreviewEnvironment()) {
        if (showToasts) {
          toast.success("متصل بخادم Render (محاكاة بيئة المعاينة)");
        }
        return {
          status: "ok",
          message: "محاكاة اتصال ناجح في بيئة المعاينة",
          time: new Date().toISOString(),
          uptime: 1000,
          environment: "preview"
        };
      }
      
      // استخدام طريقة مباشرة للوصول إلى نقطة نهاية API
      console.log("استخدام طريقة مباشرة للتحقق من الاتصال...");
      const serverUrl = ConnectionManager.getServerUrl();
      
      // تجريب نقاط نهاية متعددة للتحقق من الاتصال
      const endpoints = [
        '/api/status',
        '/api/health',
        '/api/ping'
      ];
      
      // محاولة الاتصال عبر جميع النقاط النهائية المتاحة
      for (const endpoint of endpoints) {
        try {
          const options = createFetchOptions('GET', null, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          });
          
          console.log(`محاولة الاتصال عبر ${endpoint}...`);
          const response = await fetchWithRetry(`${serverUrl}${endpoint}`, options, 2, 1000);
          
          if (response.ok) {
            console.log(`تم الاتصال بنجاح عبر ${endpoint}`);
            const result = await response.json();
            
            // إيقاف محاولات إعادة الاتصال التلقائية إذا كان الاتصال ناجحاً
            this.stopReconnect();
            
            if (showToasts) {
              toast.success("تم الاتصال بخادم Render بنجاح");
            }
            
            return result;
          }
        } catch (endpointError) {
          console.warn(`فشل الاتصال عبر ${endpoint}:`, endpointError);
          // استمر في الحلقة لتجربة النقطة النهائية التالية
        }
      }
      
      // إذا وصلنا إلى هنا، فشلت جميع محاولات الاتصال المباشر
      console.warn("فشلت جميع محاولات الاتصال المباشر، محاولة استخدام ConnectionManager...");
      
      // محاولة الاتصال الفعلي بالخادم مع زيادة المحاولات
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`محاولة فحص حالة الخادم ${attempt}/${maxRetries}`);
          const result = await ConnectionManager.checkServerStatus(showToasts && attempt === maxRetries);
          console.log("نتيجة فحص الخادم:", result);
          
          // إيقاف محاولات إعادة الاتصال التلقائية إذا كان الاتصال ناجحاً
          this.stopReconnect();
          
          return result;
        } catch (error) {
          console.error(`فشل المحاولة ${attempt}/${maxRetries}:`, error);
          lastError = error;
          
          // إذا لم تكن المحاولة الأخيرة، انتظر قبل إعادة المحاولة
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
      console.error("فشلت جميع محاولات التحقق من حالة الخادم");
      
      // إعادة محاولة الاتصال تلقائياً
      this.startAutoReconnect();
      
      if (showToasts) {
        toast.error(`تعذر الاتصال بخادم Render: ${lastError instanceof Error ? lastError.message : 'خطأ غير معروف'}`);
      }
      
      throw lastError;
    } catch (error) {
      console.error("فشل التحقق من حالة الخادم في AutomationService:", error);
      
      // إعادة محاولة الاتصال تلقائياً
      this.startAutoReconnect();
      
      if (showToasts) {
        toast.error(`تعذر الاتصال بخادم Render: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
      
      throw error;
    }
  }
  
  /**
   * بدء محاولات إعادة الاتصال التلقائية
   */
  static startAutoReconnect(callback?: (isConnected: boolean) => void): void {
    ConnectionManager.startAutoReconnect(callback);
    toast.info("جاري محاولة إعادة الاتصال بخادم Render...", {
      duration: 5000,
    });
  }
  
  /**
   * إيقاف محاولات إعادة الاتصال التلقائية
   */
  static stopReconnect(): void {
    ConnectionManager.stopReconnect();
  }
  
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig) {
    try {
      return await AutomationRunner.runAutomation(config);
    } catch (error) {
      console.error("فشل تنفيذ الأتمتة في AutomationService:", error);
      
      // التحقق إذا كان الخطأ بسبب عدم الاتصال بالخادم
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("فشل تنفيذ الأتمتة: تعذر الاتصال بخادم Render", {
          description: "تأكد من أن خادم Render يعمل أو انتظر إعادة محاولة الاتصال التلقائية",
          duration: 7000,
        });
        this.startAutoReconnect();
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
      
      throw error;
    }
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig) {
    try {
      // في بيئة المعاينة، تخطي التحقق من الخادم
      if (isPreviewEnvironment()) {
        toast.info("أنت في بيئة المعاينة. سيتم محاكاة تنفيذ الأتمتة.", {
          duration: 3000,
        });
        
        // محاكاة تأخير للتجربة الواقعية
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // إرجاع استجابة مزيفة مع إضافة خاصية details
        return {
          success: true,
          message: "تمت محاكاة تنفيذ الأتمتة بنجاح (بيئة المعاينة)",
          automationType: 'client',
          details: [
            `عدد الإجراءات: ${config.actions.length}`,
            `الرابط: ${config.projectUrl}`,
            `استخدام بيانات المتصفح: ${config.useBrowserData ? 'نعم' : 'لا'}`
          ]
        };
      }
      
      // التحقق من حالة الخادم أولاً بإصرار أكبر
      try {
        // استخدام checkServerStatus مع محاولات متعددة مدمجة
        await this.checkServerStatus(false);
      } catch (error) {
        console.warn("فشل التحقق من حالة الخادم، محاولة أخيرة مباشرة عبر ConnectionManager");
        
        // محاولة مباشرة أخيرة
        await ConnectionManager.checkServerStatus(true);
      }
      
      // إذا نجح التحقق، نقوم بتشغيل الأتمتة
      return await this.runAutomation(config);
    } catch (error) {
      console.error("فشل التحقق من الخادم:", error);
      
      // بدء إعادة المحاولات التلقائية
      this.startAutoReconnect();
      
      toast.error("تعذر تنفيذ الأتمتة: فشل الاتصال بخادم Render", {
        description: "سيتم محاولة إعادة الاتصال تلقائياً. يمكنك المحاولة مرة أخرى بعد استعادة الاتصال.",
        duration: 5000,
      });
      
      throw new Error(`تعذر الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }
  
  /**
   * الحصول على بيانات المتصفح المحفوظة (الكوكيز وبيانات التسجيل)
   */
  static async getBrowserData() {
    try {
      // في بيئة المعاينة، إرجاع بيانات وهمية
      if (isPreviewEnvironment()) {
        return {
          success: true,
          cookies: [],
          localStorage: {},
          sessionStorage: {}
        };
      }
      
      const serverUrl = ConnectionManager.getServerUrl();
      const response = await fetch(`${serverUrl}/api/browser-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل في الحصول على بيانات المتصفح: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("فشل في الحصول على بيانات المتصفح:", error);
      
      // إذا كان الخطأ بسبب فشل الاتصال، ابدأ إعادة المحاولة
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        this.startAutoReconnect();
      }
      
      throw error;
    }
  }
  
  /**
   * محاولة فورية لإعادة الاتصال بالخادم
   */
  static async forceReconnect(): Promise<boolean> {
    try {
      toast.info("جاري محاولة الاتصال بالخادم...", {
        duration: 3000,
      });
      
      // إعادة تعيين حالة الاتصال أولاً
      ConnectionManager.resetConnectionState();
      
      // استخدام طريقة مباشرة أولاً
      const serverUrl = ConnectionManager.getServerUrl();
      console.log("محاولة اتصال مباشر بـ:", serverUrl);
      
      try {
        const options = createFetchOptions('GET', null, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString() // لتجنب ذاكرة التخزين المؤقت
        });
        
        // استخدام نقطة نهاية /api/ping بدلاً من /api/status للتحقق بشكل أسرع
        const pingUrl = `${serverUrl}/api/ping`;
        console.log("محاولة اتصال سريع مع:", pingUrl);
        
        const response = await fetch(pingUrl, options);
        
        if (response.ok) {
          console.log("نجح الاتصال المباشر!");
          toast.success("تم الاتصال بخادم Render بنجاح!");
          ConnectionManager.updateLastSuccessfulConnection();
          return true;
        }
      } catch (directError) {
        console.error("فشل الاتصال المباشر:", directError);
      }
      
      // محاولة الاتصال من خلال ConnectionManager
      await ConnectionManager.checkServerStatus(true);
      
      // إذا وصلنا إلى هنا، فقد نجح الاتصال
      toast.success("تم الاتصال بخادم Render بنجاح!");
      return true;
    } catch (error) {
      console.error("فشلت محاولة إعادة الاتصال القسرية:", error);
      
      toast.error("فشلت محاولة الاتصال بالخادم", {
        description: "تأكد من تشغيل الخادم وصحة عنوان URL",
        duration: 5000,
      });
      
      // بدء إعادة محاولات الاتصال التلقائية
      this.startAutoReconnect();
      return false;
    }
  }
  
  /**
   * إجراء فحص الاتصال مع التحقق من وجود خادم الأتمتة
   */
  static async checkServerExistence(throwError = false): Promise<boolean> {
    try {
      const serverUrl = ConnectionManager.getServerUrl();
      if (!serverUrl) {
        console.warn("عنوان URL للخادم غير موجود");
        return false;
      }
      
      const response = await fetch(`${serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString()
        },
        // تقليل وقت الانتظار للاستجابة السريعة
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      console.error("خطأ في التحقق من وجود الخادم:", error);
      if (throwError) {
        throw error;
      }
      return false;
    }
  }
}
