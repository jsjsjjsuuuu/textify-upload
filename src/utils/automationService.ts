
/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { ConnectionManager } from './automation/connectionManager';
import { AutomationRunner } from './automation/automationRunner';
import { AutomationConfig } from './automation/types';
import { isPreviewEnvironment } from './automationServerUrl';
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
      
      // محاولة الاتصال الفعلي بالخادم
      return await ConnectionManager.checkServerStatus(showToasts);
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
        
        // إرجاع استجابة مزيفة
        return {
          success: true,
          message: "تمت محاكاة تنفيذ الأتمتة بنجاح (بيئة المعاينة)",
          automationType: 'client'
        };
      }
      
      // التحقق من حالة الخادم أولاً
      await ConnectionManager.checkServerStatus();
      
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
}
