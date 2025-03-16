
/**
 * تشغيل سيناريوهات الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus, createBaseHeaders, getNextIp } from "../automationServerUrl";
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
      
      // استخدام عنوان IP متناوب في كل محاولة
      const currentIp = getNextIp();
      console.log("استخدام عنوان IP للطلب:", currentIp);
      
      console.log("بدء تنفيذ الأتمتة على الخادم:", serverUrl);
      console.log("بيانات الطلب:", {
        projectUrl: config.projectUrl,
        actionsCount: config.actions.length,
        ipAddress: currentIp
      });
      
      // إضافة عنوان IP إلى التكوين للاستخدام في الخادم
      const configWithIp = {
        ...config,
        ipAddress: currentIp
      };
      
      // إعداد معالجة المهلة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      // إعداد الرؤوس
      const headers = createBaseHeaders(currentIp);
      
      // محاولات متعددة للاتصال
      let retries = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      while (retries < maxRetries) {
        try {
          // إضافة رقم المحاولة إلى الرؤوس
          const headersWithRetry = {
            ...headers,
            'X-Retry-Count': retries.toString()
          };
          
          const response = await fetch(`${serverUrl}/api/automate`, {
            method: 'POST',
            headers: headersWithRetry,
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify(configWithIp),
            signal: controller.signal
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`فشل في تنفيذ الأتمتة: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log("نتيجة تنفيذ الأتمتة:", result);
          
          // تحديث حالة الاتصال
          updateConnectionStatus(true, currentIp);
          
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
          
          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`فشل في المحاولة ${retries + 1}/${maxRetries}:`, error);
          retries++;
          
          // تغيير عنوان IP في المحاولة التالية
          const newIp = getNextIp();
          console.log(`جاري تغيير عنوان IP إلى ${newIp} للمحاولة التالية`);
          
          if (retries < maxRetries) {
            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
      clearTimeout(timeoutId);
      throw lastError || new Error("فشلت جميع محاولات الاتصال");
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      // تحديث حالة الاتصال
      updateConnectionStatus(false);
      
      // إظهار رسالة خطأ
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`, {
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
      
      throw new Error(`تعذر الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }
}
