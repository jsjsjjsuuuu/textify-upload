import { AutomationConfig, AutomationResponse } from './automation/types';
import { AutomationRunner } from './automation/automationRunner';
import { ConnectionManager } from './automation/connectionManager';

export class AutomationService {
  /**
   * التحقق من الخادم وتنفيذ سيناريو الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    // تعديل نوع automationType ليكون "server" | "client" بشكل صريح
    if (config.automationType && typeof config.automationType === 'string') {
      config.automationType = config.automationType as "server" | "client";
    }
    
    // تأكد من إجبار التنفيذ الفعلي دائمًا
    config.forceRealExecution = true;
    
    return await AutomationRunner.validateAndRunAutomation(config);
  }
  
  /**
   * إجبار إعادة الاتصال بالخادم
   */
  static async forceReconnect(): Promise<boolean> {
    try {
      const status = await ConnectionManager.checkServerStatus(true);
      return status.status === 'ok';
    } catch (error) {
      console.error("فشل في إجبار إعادة الاتصال:", error);
      return false;
    }
  }
  
  /**
   * التحقق من وجود الخادم
   * تعديل التوقيع ليكون serverUrl اختياريًا
   */
  static async checkServerExistence(serverUrl?: string): Promise<boolean> {
    try {
      if (serverUrl) {
        // التحقق من وجود خادم محدد
        const response = await fetch(`${serverUrl}/api/ping`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          credentials: 'omit',
        });
        return response.ok;
      } else {
        // التحقق من الخادم المحدد حاليًا
        const status = await ConnectionManager.checkServerStatus(false);
        return status.status === 'ok';
      }
    } catch (error) {
      console.error("فشل في التحقق من وجود الخادم:", error);
      return false;
    }
  }
  
  /**
   * تبديل وضع التنفيذ الفعلي
   * تم تعديله لإجبار التنفيذ الفعلي دائمًا
   */
  static toggleRealExecution(force?: boolean): boolean {
    // إجبار التنفيذ الفعلي دائمًا بغض النظر عن المدخلات
    const newValue = true;
    
    localStorage.setItem('force_real_execution', newValue.toString());
    console.log(`تم تعيين وضع التنفيذ الفعلي إلى: ${newValue}`);
    
    return newValue;
  }
  
  /**
   * التحقق من حالة وضع التنفيذ الفعلي
   * تم تعديله ليرجع true دائمًا
   */
  static isRealExecutionEnabled(): boolean {
    // تحديث localStorage للتأكد من أن القيمة محفوظة
    localStorage.setItem('force_real_execution', 'true');
    return true;
  }
  
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    return await ConnectionManager.checkServerStatus(showToasts);
  }
  
  /**
   * بدء محاولات إعادة الاتصال التلقائية
   */
  static startAutoReconnect(callback?: (isConnected: boolean) => void): void {
    ConnectionManager.startAutoReconnect(callback);
  }
  
  /**
   * إيقاف محاولات إعادة الاتصال التلقائية
   */
  static stopReconnect(): void {
    ConnectionManager.stopReconnect();
  }
}
