
/**
 * تشغيل سيناريوهات الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus } from "../automationServerUrl";
import { toast } from "sonner";
import { AutomationConfig, AutomationResponse } from "./types";
import { ConnectionManager } from "./connectionManager";

export class AutomationRunner {
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig): Promise<AutomationResponse> {
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
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        mode: 'cors',
        credentials: 'same-origin',
        body: JSON.stringify({
          projectUrl: config.projectUrl,
          actions: config.actions.map(action => ({
            name: action.name,
            finder: action.finder,
            value: action.value,
            delay: action.delay
          }))
        }),
        signal: AbortSignal.timeout(90000)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل في تنفيذ الأتمتة: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("نتيجة تنفيذ الأتمتة:", result);
      
      // تحديث حالة الاتصال
      updateConnectionStatus(true);
      
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
      
      // تحديث حالة الاتصال
      updateConnectionStatus(false);
      
      // إظهار رسالة خطأ
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error.message}`, {
        duration: 5000,
      });
      
      // بدء إعادة المحاولات التلقائية
      ConnectionManager.startAutoReconnect();
      
      throw error;
    }
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    try {
      // التحقق من حالة الخادم أولاً
      await ConnectionManager.checkServerStatus();
      
      // إذا نجح التحقق، نقوم بتشغيل الأتمتة
      return await this.runAutomation(config);
    } catch (error) {
      console.error("فشل التحقق من الخادم:", error);
      
      // بدء إعادة المحاولات التلقائية
      ConnectionManager.startAutoReconnect();
      
      throw new Error(`تعذر الاتصال بخادم الأتمتة: ${error.message}`);
    }
  }
}
