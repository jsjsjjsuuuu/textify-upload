
/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus, getLastConnectionStatus } from "./automationServerUrl";
import { toast } from "sonner";

interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: any[];
}

export class AutomationService {
  private static isCheckingStatus = false;
  private static reconnectInterval: number | null = null;
  private static maxRetries = 5;
  private static retryDelay = 10000; // 10 ثوانٍ
  
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    const serverUrl = getAutomationServerUrl();
    
    if (this.isCheckingStatus) {
      return Promise.reject(new Error("جاري بالفعل التحقق من حالة الخادم"));
    }
    
    this.isCheckingStatus = true;
    
    try {
      console.log("التحقق من حالة الخادم:", serverUrl);
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // إضافة خيار timeout لمنع الانتظار الطويل
        signal: AbortSignal.timeout(10000) // توقف بعد 10 ثوانٍ
      });
      
      if (!response.ok) {
        const errorMessage = `فشل الاتصال: ${response.status} ${response.statusText}`;
        updateConnectionStatus(false);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log("نتيجة التحقق من حالة الخادم:", result);
      
      // تحديث حالة الاتصال
      updateConnectionStatus(true);
      
      // إظهار رسالة نجاح (فقط إذا كان الاتصال غير ناجح في السابق)
      const connectionStatus = getLastConnectionStatus();
      if (showToasts && (!connectionStatus.isConnected || connectionStatus.retryCount > 0)) {
        toast.success("تم الاتصال بخادم الأتمتة بنجاح");
      }
      
      // تأكد من إيقاف إعادة المحاولة إذا كانت نشطة
      this.stopReconnect();
      
      return result;
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      
      // تحديث حالة الاتصال
      updateConnectionStatus(false);
      
      if (showToasts) {
        toast.error(`تعذر الاتصال بالخادم: ${error.message}`);
      }
      
      throw error;
    } finally {
      this.isCheckingStatus = false;
    }
  }
  
  /**
   * بدء محاولات إعادة الاتصال التلقائية
   */
  static startAutoReconnect(callback?: (isConnected: boolean) => void): void {
    // إيقاف أي محاولات سابقة
    this.stopReconnect();
    
    // بدء فاصل زمني جديد
    this.reconnectInterval = window.setInterval(async () => {
      try {
        const connectionStatus = getLastConnectionStatus();
        
        // إذا كان هناك الكثير من المحاولات، زيادة وقت الانتظار
        if (connectionStatus.retryCount > this.maxRetries) {
          console.log(`تم الوصول إلى الحد الأقصى من المحاولات (${this.maxRetries}). زيادة الفاصل الزمني.`);
          this.stopReconnect();
          this.retryDelay = Math.min(this.retryDelay * 2, 60000); // زيادة التأخير، ولكن ليس أكثر من دقيقة واحدة
          this.startAutoReconnect(callback);
          return;
        }
        
        console.log(`محاولة إعادة الاتصال #${connectionStatus.retryCount + 1}...`);
        const result = await this.checkServerStatus(false);
        
        if (callback) {
          callback(true);
        }
        
        console.log("تم إعادة الاتصال بنجاح:", result);
      } catch (error) {
        if (callback) {
          callback(false);
        }
        console.error("فشلت محاولة إعادة الاتصال:", error);
      }
    }, this.retryDelay);
  }
  
  /**
   * إيقاف محاولات إعادة الاتصال التلقائية
   */
  static stopReconnect(): void {
    if (this.reconnectInterval !== null) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
      this.retryDelay = 10000; // إعادة التعيين إلى القيمة الافتراضية
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
      this.startAutoReconnect();
      
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
      
      // بدء إعادة المحاولات التلقائية
      this.startAutoReconnect();
      
      throw new Error(`تعذر الاتصال بخادم الأتمتة: ${error.message}`);
    }
  }
}
