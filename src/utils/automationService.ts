
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
  // السماح بتكوين عنوان API ديناميكيًا
  private static API_URL = 'http://localhost:3001/api';

  /**
   * تعيين عنوان URL للواجهة البرمجية
   */
  static setApiUrl(url: string) {
    this.API_URL = url;
    localStorage.setItem('automation_api_url', url);
    console.log(`تم تعيين عنوان خادم الأتمتة إلى: ${url}`);
  }

  /**
   * الحصول على عنوان URL للواجهة البرمجية
   */
  static getApiUrl(): string {
    // استرجاع العنوان المخزن أو استخدام القيمة الافتراضية
    const savedUrl = localStorage.getItem('automation_api_url');
    if (savedUrl) {
      this.API_URL = savedUrl;
    }
    return this.API_URL;
  }

  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(): Promise<{ status: string; message: string; time?: string; systemInfo?: any }> {
    try {
      const apiUrl = this.getApiUrl();
      console.log(`التحقق من حالة الخادم على: ${apiUrl}/status`);
      
      const response = await fetch(`${apiUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // إضافة خيارات وقت انتهاء الطلب للتعامل مع حالة عدم استجابة الخادم
        signal: AbortSignal.timeout(5000) // 5 ثوانٍ كحد أقصى
      });
      
      if (!response.ok) {
        throw new Error(`فشل الطلب بحالة: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('خطأ في الاتصال بخادم الأتمتة:', error);
      return {
        status: 'error',
        message: 'فشل الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم على المنفذ 3001.'
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

      const apiUrl = this.getApiUrl();
      console.log(`إرسال طلب أتمتة إلى: ${apiUrl}/automate`);

      // إعداد إشارة لإلغاء الطلب بعد مهلة زمنية
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // مهلة دقيقتين

      try {
        // إرسال طلب إلى خادم الأتمتة
        const response = await fetch(`${apiUrl}/automate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
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

        // إلغاء مؤقت المهلة الزمنية
        clearTimeout(timeoutId);

        // التحقق من استجابة الخادم
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `فشل طلب الأتمتة بحالة: ${response.status}`);
        }

        // معالجة نتائج التشغيل الآلي
        return await response.json();
      } finally {
        // تأكد من إلغاء المؤقت في جميع الحالات
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('خطأ في تنفيذ التشغيل الآلي:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء تنفيذ التشغيل الآلي'
      };
    }
  }
}
