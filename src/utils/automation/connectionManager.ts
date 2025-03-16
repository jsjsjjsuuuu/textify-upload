
/**
 * إدارة الاتصال بخادم الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus, getLastConnectionStatus, RENDER_ALLOWED_IPS } from "../automationServerUrl";
import { toast } from "sonner";
import { ServerStatusResponse } from "./types";

export class ConnectionManager {
  private static isCheckingStatus = false;
  private static reconnectInterval: number | null = null;
  private static maxRetries = 15;
  private static retryDelay = 10000;
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
      
      // استخدام عنوان IP متناوب في كل محاولة
      const currentIp = this.getNextIp();
      console.log("استخدام عنوان IP:", currentIp);
      
      // إنشاء طلب مع رؤوس مخصصة لتجنب مشاكل CORS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
          'X-Forwarded-For': currentIp,
          'X-Render-Client-IP': currentIp,
          'Origin': serverUrl,
          'Referer': serverUrl
        },
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
        
        // استخدام IP مختلف في كل محاولة إعادة اتصال
        const rotatingIpIndex = connectionStatus.retryCount % RENDER_ALLOWED_IPS.length;
        const currentIp = RENDER_ALLOWED_IPS[rotatingIpIndex];
        console.log(`استخدام عنوان IP: ${currentIp} للمحاولة رقم ${connectionStatus.retryCount + 1}`);
        
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
}
