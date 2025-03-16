
/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { getAutomationServerUrl } from "./automationServerUrl";
import { toast } from "sonner";

interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: any[];
}

export class AutomationService {
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus() {
    const serverUrl = getAutomationServerUrl();
    
    try {
      console.log("التحقق من حالة الخادم:", serverUrl);
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // إضافة خيار timeout لمنع الانتظار الطويل
        signal: AbortSignal.timeout(5000) // توقف بعد 5 ثوانٍ
      });
      
      if (!response.ok) {
        throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("نتيجة التحقق من حالة الخادم:", result);
      return result;
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      throw error;
    }
  }
  
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig) {
    const serverUrl = getAutomationServerUrl();
    
    try {
      // إظهار رسالة توضح أن الأتمتة قيد التنفيذ
      toast.info("جاري تنفيذ سيناريو الأتمتة...", {
        duration: 3000,
      });
      
      console.log("بدء تنفيذ الأتمتة على الخادم:", serverUrl);
      console.log("بيانات الطلب:", {
        projectUrl: config.projectUrl,
        actionsCount: config.actions.length
      });
      
      const response = await fetch(`${serverUrl}/api/automate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          projectUrl: config.projectUrl,
          actions: config.actions.map(action => ({
            name: action.name,
            finder: action.finder,
            value: action.value,
            delay: action.delay
          }))
        }),
        // إضافة خيار timeout لمنع الانتظار الطويل
        signal: AbortSignal.timeout(60000) // توقف بعد دقيقة واحدة
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل في تنفيذ الأتمتة: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("نتيجة تنفيذ الأتمتة:", result);
      
      // إظهار رسالة نجاح
      if (result.success) {
        toast.success("تم تنفيذ سيناريو الأتمتة بنجاح!", {
          duration: 5000,
        });
      } else {
        toast.error(`فشل في تنفيذ الأتمتة: ${result.message}`, {
          duration: 5000,
        });
      }
      
      return result;
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      // إظهار رسالة خطأ
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error.message}`, {
        duration: 5000,
      });
      
      throw error;
    }
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig) {
    try {
      // التحقق من حالة الخادم أولاً
      await this.checkServerStatus();
      
      // إذا نجح التحقق، نقوم بتشغيل الأتمتة
      return await this.runAutomation(config);
    } catch (error) {
      console.error("فشل التحقق من الخادم:", error);
      throw new Error(`تعذر الاتصال بخادم الأتمتة: ${error.message}`);
    }
  }
}
