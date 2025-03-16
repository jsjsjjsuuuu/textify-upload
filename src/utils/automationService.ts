
/**
 * خدمة للتفاعل مع خادم الأتمتة
 */
import { getAutomationServerUrl } from "./automationServerUrl";

interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: any[];
}

export class AutomationService {
  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus() {
    const serverUrl = getAutomationServerUrl();
    
    try {
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      throw error;
    }
  }
  
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig) {
    const serverUrl = getAutomationServerUrl();
    
    try {
      const response = await fetch(`${serverUrl}/api/automate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectUrl: config.projectUrl,
          actions: config.actions.map(action => ({
            name: action.name,
            finder: action.finder,
            value: action.value,
            delay: action.delay
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تنفيذ الأتمتة: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      throw error;
    }
  }
}
