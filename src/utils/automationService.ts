
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
    return ConnectionManager.checkServerStatus(showToasts);
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
    return AutomationRunner.runAutomation(config);
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig) {
    return AutomationRunner.validateAndRunAutomation(config);
  }
}
