
/**
 * خدمة الأتمتة - تتواصل مع خادم Puppeteer
 */

interface AutomationAction {
  id: string;
  name: string;
  finder: string;
  value: string;
  delay: string;
}

interface AutomationConfig {
  projectName: string;
  projectUrl: string;
  actions: AutomationAction[];
}

interface AutomationResult {
  success: boolean;
  message: string;
  results?: Array<{
    name: string;
    success: boolean;
    message: string;
  }>;
  screenshot?: string;
}

export class AutomationService {
  private static readonly API_URL = 'http://localhost:3001/api';

  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.API_URL}/status`);
      return await response.json();
    } catch (error) {
      console.error('خطأ في الاتصال بخادم الأتمتة:', error);
      return {
        status: 'error',
        message: 'فشل الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم.'
      };
    }
  }

  /**
   * تنفيذ تشغيل آلي باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig): Promise<AutomationResult> {
    try {
      // تحقق من عدم وجود بيانات مهمة مفقودة
      if (!config.projectUrl) {
        return {
          success: false,
          message: 'الرجاء تحديد عنوان URL للمشروع'
        };
      }

      if (!config.actions || config.actions.length === 0) {
        return {
          success: false,
          message: 'لا توجد إجراءات للتنفيذ'
        };
      }

      // إرسال طلب إلى خادم الأتمتة
      const response = await fetch(`${this.API_URL}/automate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectUrl: config.projectUrl,
          actions: config.actions
        })
      });

      // التحقق من استجابة الخادم
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل طلب الأتمتة');
      }

      // معالجة نتائج التشغيل الآلي
      return await response.json();
    } catch (error) {
      console.error('خطأ في تنفيذ التشغيل الآلي:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء تنفيذ التشغيل الآلي'
      };
    }
  }
}
