
/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { ConnectionManager } from './automation/connectionManager';
import { AutomationRunner } from './automation/automationRunner';
import { AutomationConfig } from './automation/types';

export class AutomationService {
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    try {
      return await ConnectionManager.checkServerStatus(showToasts);
    } catch (error) {
      console.error("فشل التحقق من حالة الخادم في AutomationService:", error);
      throw error;
    }
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
  
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig) {
    try {
      return await AutomationRunner.runAutomation(config);
    } catch (error) {
      console.error("فشل تنفيذ الأتمتة في AutomationService:", error);
      throw error;
    }
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig) {
    try {
      return await AutomationRunner.validateAndRunAutomation(config);
    } catch (error) {
      console.error("فشل التحقق والتنفيذ في AutomationService:", error);
      throw error;
    }
  }
}
