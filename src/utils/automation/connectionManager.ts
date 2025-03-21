
/**
 * إدارة الاتصال بخادم الأتمتة
 */
import { 
  getAutomationServerUrl, 
  updateConnectionStatus, 
  getLastConnectionStatus, 
  RENDER_ALLOWED_IPS, 
  getNextIp, 
  createBaseHeaders,
  isPreviewEnvironment,
  createTimeoutSignal
} from "../automationServerUrl";
import { toast } from "sonner";
import { ServerStatusResponse } from "./types";

export class ConnectionManager {
  private static isCheckingStatus = false;
  private static reconnectInterval: number | null = null;
  private static maxRetries = 15;
  private static retryDelay = 10000;
  private static lastError: Error | null = null;
  
  /**
   * الحصول على رابط خادم الأتمتة
   */
  static getServerUrl(): string {
    return getAutomationServerUrl();
  }
  
  /**
   * التحقق مما إذا كنا في بيئة معاينة (Lovable)
   */
  private static isPreviewEnvironment(): boolean {
    return isPreviewEnvironment();
  }
  
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<ServerStatusResponse> {
    const serverUrl = getAutomationServerUrl();
    
    if (this.isCheckingStatus) {
      return Promise.reject(new Error("جاري بالفعل التحقق من حالة الخادم"));
    }
    
    this.isCheckingStatus = true;
    
    try {
      console.log("التحقق من حالة الخادم:", serverUrl);
      
      // التحقق من بيئة المعاينة وتوفير محاكاة للاتصال
      if (this.isPreviewEnvironment()) {
        console.log("بيئة المعاينة: محاكاة اتصال ناجح بالخادم");
        
        // تحديث حالة الاتصال (مع محاكاة النجاح بشكل دائم في بيئة المعاينة)
        updateConnectionStatus(true);
        this.lastError = null;
        
        // إيقاف إعادة المحاولة إذا كانت نشطة
        this.stopReconnect();
        
        // إظهار إشعار نجاح الاتصال عند الطلب
        if (showToasts) {
          toast.success("تم الاتصال بخادم الأتمتة بنجاح (بيئة معاينة)");
        }
        
        // إرجاع بيانات مُحاكاة
        return {
          status: "ok",
          message: "محاكاة اتصال ناجح في بيئة المعاينة",
          time: new Date().toISOString(),
          uptime: 1000,
          environment: "preview"
        };
      }
      
      // استخدام عنوان IP متناوب في كل محاولة
      const currentIp = getNextIp();
      console.log("استخدام عنوان IP:", currentIp);
      
      // إنشاء طلب مع رؤوس مخصصة
      const timeoutSignal = createTimeoutSignal(15000);
      
      const headers = createBaseHeaders(currentIp);
      console.log("الرؤوس المستخدمة:", headers);
      
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        signal: timeoutSignal
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
      this.lastError = null;
      
      // إظهار رسالة نجاح (فقط إذا كان الاتصال غير ناجح في السابق)
      const connectionStatus = getLastConnectionStatus();
      if (showToasts && (!connectionStatus.isConnected)) {
        toast.success("تم الاتصال بخادم الأتمتة بنجاح");
      }
      
      // تأكد من إيقاف إعادة المحاولة إذا كانت نشطة
      this.stopReconnect();
      
      return result;
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      
      // التحقق مما إذا كنا في بيئة معاينة وتجاهل إظهار رسائل الخطأ
      if (this.isPreviewEnvironment()) {
        console.log("بيئة المعاينة: تجاهل خطأ الاتصال وإرجاع حالة ناجحة");
        // تحديث حالة الاتصال كما لو كانت ناجحة دائماً في بيئة المعاينة
        updateConnectionStatus(true);
        
        // إرجاع بيانات مُحاكاة
        return {
          status: "ok",
          message: "محاكاة اتصال ناجح في بيئة المعاينة",
          time: new Date().toISOString(),
          uptime: 1000,
          environment: "preview"
        };
      }
      
      // تحديث حالة الاتصال وتخزين الخطأ الأخير
      updateConnectionStatus(false);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      if (showToasts) {
        toast.error(`تعذر الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
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
        
        // استخدام IP مختلف في كل محاولة إعادة اتصال
        const rotatingIpIndex = Math.floor(Math.random() * RENDER_ALLOWED_IPS.length);
        const currentIp = RENDER_ALLOWED_IPS[rotatingIpIndex];
        console.log(`استخدام عنوان IP: ${currentIp} للمحاولة`);
        
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
    
    console.log(`بدء محاولات إعادة الاتصال التلقائية كل ${this.retryDelay / 1000} ثوانٍ`);
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
   * الحصول على الخطأ الأخير
   */
  static getLastError(): Error | null {
    return this.lastError;
  }
  
  /**
   * إعادة تعيين حالة الاتصال
   */
  static resetConnectionState(): void {
    this.stopReconnect();
    this.lastError = null;
    updateConnectionStatus(false);
  }
}
