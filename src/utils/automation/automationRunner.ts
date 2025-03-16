
/**
 * تشغيل سيناريوهات الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus, RENDER_ALLOWED_IPS } from "../automationServerUrl";
import { toast } from "sonner";
import { AutomationConfig, AutomationResponse } from "./types";
import { ConnectionManager } from "./connectionManager";

export class AutomationRunner {
  private static currentIpIndex = 0;
  
  /**
   * الحصول على عنوان IP القادم للمحاولة من القائمة الدورية
   */
  private static getNextIp(): string {
    const ip = RENDER_ALLOWED_IPS[this.currentIpIndex];
    this.currentIpIndex = (this.currentIpIndex + 1) % RENDER_ALLOWED_IPS.length;
    return ip;
  }
  
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
      const currentIp = this.getNextIp();
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const response = await fetch(`${serverUrl}/api/automate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Forwarded-For': currentIp,
          'X-Render-Client-IP': currentIp,
          'Origin': serverUrl,
          'Referer': serverUrl
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(configWithIp),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
