
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
  createTimeoutSignal,
  resetAutomationServerUrl
} from "../automationServerUrl";
import { toast } from "sonner";
import { ServerStatusResponse } from "./types";

export class ConnectionManager {
  private static isCheckingStatus = false;
  private static reconnectInterval: number | null = null;
  private static maxRetries = 15;
  private static retryDelay = 10000;
  private static lastError: Error | null = null;
  private static reconnectAttempts = 0;
  private static lastSuccessfulConnection: Date | null = null;
  
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
    const serverUrl = this.getServerUrl();
    
    // إذا لم يكن هناك رابط محدد، قم بإعادة تعيين الرابط إلى القيمة الافتراضية
    if (!serverUrl) {
      console.warn("لم يتم العثور على رابط الخادم، جاري إعادة تعيينه إلى القيمة الافتراضية");
      resetAutomationServerUrl();
    }
    
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
        this.lastSuccessfulConnection = new Date();
        
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
      
      // إنشاء طلب مع رؤوس مخصصة وزيادة مهلة الانتظار لتجنب أخطاء المهلة
      const timeoutSignal = createTimeoutSignal(30000); // زيادة المهلة إلى 30 ثانية
      
      const headers = createBaseHeaders(currentIp);
      
      // إضافة رؤوس إضافية قد تساعد في تجاوز مشكلات CORS
      headers['Cache-Control'] = 'no-cache, no-store';
      headers['Pragma'] = 'no-cache';
      headers['X-Request-Time'] = Date.now().toString();
      
      console.log("الرؤوس المستخدمة:", headers);
      
      // إضافة محاولات إعادة المحاولة المدمجة
      let internalRetries = 0;
      const maxInternalRetries = 3;
      
      while (internalRetries < maxInternalRetries) {
        try {
          const response = await fetch(`${serverUrl}/api/status`, {
            method: 'GET',
            headers,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            signal: timeoutSignal
          });
          
          if (!response.ok) {
            console.error(`فشل الاتصال بالمحاولة ${internalRetries + 1}/${maxInternalRetries}: ${response.status}`);
            internalRetries++;
            if (internalRetries < maxInternalRetries) {
              // انتظار قبل إعادة المحاولة
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            
            const errorMessage = `فشل الاتصال: ${response.status} ${response.statusText}`;
            updateConnectionStatus(false);
            throw new Error(errorMessage);
          }
          
          const result = await response.json();
          console.log("نتيجة التحقق من حالة الخادم:", result);
          
          // تحديث حالة الاتصال
          updateConnectionStatus(true);
          this.lastError = null;
          this.reconnectAttempts = 0;
          this.lastSuccessfulConnection = new Date();
          
          // إظهار رسالة نجاح (فقط إذا كان الاتصال غير ناجح في السابق)
          const connectionStatus = getLastConnectionStatus();
          if (showToasts && (!connectionStatus.isConnected)) {
            toast.success("تم الاتصال بخادم الأتمتة بنجاح");
          }
          
          // تأكد من إيقاف إعادة المحاولة إذا كانت نشطة
          this.stopReconnect();
          
          return result;
        } catch (error) {
          if (internalRetries < maxInternalRetries - 1) {
            console.warn(`إعادة محاولة الاتصال ${internalRetries + 1}/${maxInternalRetries}...`);
            internalRetries++;
            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // إذا فشلت جميع المحاولات، رمي الخطأ
            throw error;
          }
        }
      }
      
      // هذا لن يتم الوصول إليه بسبب رمي الخطأ في الحلقة، ولكن TypeScript يتطلبه
      throw new Error("فشلت جميع محاولات الاتصال");
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      
      // التحقق مما إذا كنا في بيئة معاينة وتجاهل إظهار رسائل الخطأ
      if (this.isPreviewEnvironment()) {
        console.log("بيئة المعاينة: تجاهل خطأ الاتصال وإرجاع حالة ناجحة");
        // تحديث حالة الاتصال كما لو كانت ناجحة دائماً في بيئة المعاينة
        updateConnectionStatus(true);
        this.lastSuccessfulConnection = new Date();
        
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
      
      // رسالة خطأ أفضل للمستخدم
      if (showToasts) {
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
          toast.error("تعذر الاتصال بخادم Render", {
            description: "يبدو أن خادم Render غير متاح حالياً أو قد يكون في وضع السكون. يرجى الانتظار قليلاً وسيتم إعادة المحاولة تلقائياً.",
            duration: 5000,
          });
        } else {
          toast.error(`تعذر الاتصال بالخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
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
    
    // زيادة عداد المحاولات
    this.reconnectAttempts++;
    
    // تحديد فاصل زمني متغير بناءً على عدد المحاولات
    let currentDelay = this.retryDelay;
    
    // إذا زادت المحاولات عن 3، زيادة الفاصل الزمني
    if (this.reconnectAttempts > 3) {
      currentDelay = this.retryDelay * 2;
    }
    
    // إذا زادت المحاولات عن 10، زيادة الفاصل الزمني أكثر
    if (this.reconnectAttempts > 10) {
      currentDelay = this.retryDelay * 4;
    }
    
    console.log(`بدء محاولة إعادة الاتصال ${this.reconnectAttempts} بعد ${currentDelay/1000} ثوانٍ`);
    
    // بدء فاصل زمني جديد
    this.reconnectInterval = window.setInterval(async () => {
      try {
        const connectionStatus = getLastConnectionStatus();
        
        // استخدام IP مختلف في كل محاولة إعادة اتصال
        const rotatingIpIndex = Math.floor(Math.random() * RENDER_ALLOWED_IPS.length);
        const currentIp = RENDER_ALLOWED_IPS[rotatingIpIndex];
        console.log(`استخدام عنوان IP: ${currentIp} للمحاولة ${this.reconnectAttempts}`);
        
        const result = await this.checkServerStatus(false);
        
        if (callback) {
          callback(true);
        }
        
        // إظهار رسالة نجاح إعادة الاتصال
        toast.success("تم إعادة الاتصال بخادم Render بنجاح", {
          description: "يمكنك الآن استخدام ميزات الأتمتة",
          duration: 3000,
        });
        
        console.log("تم إعادة الاتصال بنجاح:", result);
        
        // إيقاف إعادة المحاولة بعد النجاح
        this.stopReconnect();
      } catch (error) {
        if (callback) {
          callback(false);
        }
        console.error(`فشلت محاولة إعادة الاتصال ${this.reconnectAttempts}:`, error);
        
        // زيادة عداد المحاولات
        this.reconnectAttempts++;
        
        // إذا تجاوزت المحاولات الحد الأقصى، قم بتغيير الفاصل الزمني
        if (this.reconnectAttempts > 10 && this.reconnectInterval !== null) {
          clearInterval(this.reconnectInterval);
          
          // إعادة تعيين الفاصل الزمني لمحاولات أقل تكراراً
          const longerDelay = 60000; // دقيقة واحدة
          console.log(`تغيير فاصل إعادة المحاولة إلى ${longerDelay/1000} ثانية بعد ${this.reconnectAttempts} محاولة`);
          
          this.reconnectInterval = window.setInterval(async () => {
            try {
              const result = await this.checkServerStatus(false);
              
              if (callback) {
                callback(true);
              }
              
              toast.success("تم إعادة الاتصال بخادم Render بنجاح", {
                duration: 3000,
              });
              
              this.stopReconnect();
            } catch (error) {
              if (callback) {
                callback(false);
              }
              console.error(`استمرار فشل إعادة الاتصال (محاولة طويلة المدى):`, error);
            }
          }, longerDelay);
        }
      }
    }, currentDelay);
    
    console.log(`بدء محاولات إعادة الاتصال التلقائية كل ${currentDelay / 1000} ثوانٍ`);
  }
  
  /**
   * إيقاف محاولات إعادة الاتصال التلقائية
   */
  static stopReconnect(): void {
    if (this.reconnectInterval !== null) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
      this.retryDelay = 10000; // إعادة التعيين إلى القيمة الافتراضية
      console.log("تم إيقاف محاولات إعادة الاتصال التلقائية");
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
    this.reconnectAttempts = 0;
    updateConnectionStatus(false);
  }
  
  /**
   * الحصول على عدد محاولات إعادة الاتصال
   */
  static getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  /**
   * تحديث آخر اتصال ناجح
   */
  static updateLastSuccessfulConnection(): void {
    this.lastSuccessfulConnection = new Date();
    updateConnectionStatus(true);
    this.reconnectAttempts = 0;
  }
  
  /**
   * الحصول على تاريخ آخر اتصال ناجح
   */
  static getLastSuccessfulConnection(): Date | null {
    return this.lastSuccessfulConnection;
  }
}
