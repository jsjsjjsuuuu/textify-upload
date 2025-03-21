
import { AutomationAction, AutomationConfig, AutomationResponse, ActionResult } from './automation/types';
import { getAutomationServerUrl, isPreviewEnvironment, checkConnection } from './automationServerUrl';

/**
 * خدمة الأتمتة - تتعامل مع تنفيذ سيناريوهات الأتمتة عبر الخادم
 */
export class AutomationService {
  /**
   * وظيفة مساعدة لتحويل أسماء الإجراءات
   */
  private static translateActionName(name: string): string {
    // تحويل أسماء الإجراءات الإنجليزية إلى ما يفهمه الخادم
    const actionMap: Record<string, string> = {
      'click': 'انقر',
      'type': 'أدخل نص',
      'input': 'أدخل نص',
      'select': 'اختر من قائمة'
    };
    
    return actionMap[name.toLowerCase()] || name;
  }

  /**
   * التحقق من صحة وتنفيذ الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    console.log("بدء التحقق من صحة وتنفيذ الأتمتة:", config);
    
    // 1. التحقق من إعدادات الأتمتة
    if (!config.projectUrl) {
      return {
        success: false,
        message: "URL المشروع مطلوب",
        automationType: 'server'
      };
    }
    
    if (!config.actions || config.actions.length === 0) {
      return {
        success: false,
        message: "يجب إضافة إجراء واحد على الأقل",
        automationType: 'server'
      };
    }
    
    // 2. تحسين الإعدادات قبل الإرسال
    const enhancedConfig: AutomationConfig = {
      ...config,
      // تأكد من استخدام محرك المتصفح الحقيقي وتمكين البيانات المستمرة
      forceRealExecution: true,
      useBrowserData: true,
      // تكوين مهلة طويلة للعمليات الكبيرة
      timeout: config.timeout || 60000,
      retries: config.retries || 2,
      // تحويل أسماء الإجراءات لتناسب ما يتوقعه الخادم
      actions: config.actions.map(action => ({
        ...action,
        name: AutomationService.translateActionName(action.name),
        // زيادة التأخير بين الإجراءات لتجنب مشاكل كشف البوت
        delay: action.delay < 300 ? 300 : action.delay,
        // إضافة وصف للإجراء إذا لم يكن موجوداً
        description: action.description || `${action.name} - ${action.finder}`,
      }))
    };
    
    // طباعة الإعدادات المحسنة للتشخيص
    console.log("الإعدادات المحسنة للأتمتة:", JSON.stringify(enhancedConfig, null, 2));
    
    // في وضع المعاينة، نقوم بمحاكاة النجاح بدون اتصال فعلي بالخادم
    // تم تعديل هذا الشرط بحيث لا يتم تنفيذه أبدًا لأن isPreviewEnvironment() ترجع دائمًا false
    if (false) {
      // لن يتم تنفيذ هذا الكود أبدًا
      return { success: false, message: "وضع المعاينة غير متاح", automationType: 'server' };
    }
    
    // 3. الاتصال بالخادم وتنفيذ الأتمتة
    try {
      // الحصول على URL الخادم من الإعدادات
      const serverUrl = getAutomationServerUrl();
      console.log("URL خادم الأتمتة:", serverUrl);
      
      // إنشاء طلب الأتمتة مع تعيين مهلة طويلة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // مهلة دقيقتين كحد أقصى
      
      const response = await fetch(`${serverUrl}/api/automation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(enhancedConfig),
        signal: controller.signal
      });
      
      // إلغاء مؤقت المهلة بعد الحصول على الاستجابة
      clearTimeout(timeoutId);
      
      // تسجيل معلومات الاستجابة الأولية للتشخيص
      console.log(`استجابة الخادم - الحالة: ${response.status}, نوع المحتوى: ${response.headers.get('Content-Type')}`);
      
      // التحقق من نجاح الاستجابة
      if (!response.ok) {
        // محاولة استخراج رسالة الخطأ من الاستجابة
        let errorMessage = "فشل الاتصال بخادم الأتمتة";
        try {
          const errorText = await response.text();
          try {
            // محاولة تحليل النص كـ JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // إذا تعذر تحليل JSON، استخدام النص كما هو
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          // إذا تعذر قراءة النص، استخدام رسالة افتراضية
          errorMessage = `فشل الاتصال بخادم الأتمتة (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      // عمل نسخة من الاستجابة لتحليلها كـ JSON
      // هذا يمنع خطأ "body stream already read"
      const responseClone = response.clone();
      let data;
      
      try {
        data = await responseClone.json();
      } catch (e) {
        console.error("خطأ في تحليل JSON:", e);
        // محاولة قراءة النص إذا فشل تحليل JSON
        const text = await response.text();
        throw new Error(`فشل في تحليل استجابة الخادم: ${text}`);
      }
      
      console.log("استجابة الأتمتة:", data);
      
      // إعادة استجابة الخادم
      return data;
    } catch (error) {
      console.error("خطأ أثناء تنفيذ الأتمتة:", error);
      
      // تحسين رسائل الخطأ الشائعة للمستخدم
      let errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      let errorType = "ExecutionError";
      
      // التعامل مع أخطاء الاتصال
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("network")) {
        errorMessage = "فشل الاتصال بخادم الأتمتة. تأكد من اتصالك بالإنترنت وأن الخادم متاح.";
        errorType = "NetworkError";
      }
      
      // التعامل مع أخطاء انتهاء المهلة
      if (errorMessage.includes("timeout") || errorMessage.includes("timed out") || error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = "انتهت مهلة الاتصال بخادم الأتمتة. قد يكون الخادم مشغولاً، حاول مرة أخرى لاحقاً.";
        errorType = "TimeoutError";
      }
      
      // التعامل مع أخطاء CORS
      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        errorMessage = "خطأ في سياسة CORS. تأكد من إعدادات الخادم والمتصفح.";
        errorType = "CORSError";
      }
      
      // التعامل مع أخطأ "body stream already read"
      if (errorMessage.includes("body stream already read") || errorMessage.includes("response.text")) {
        errorMessage = "خطأ في معالجة استجابة الخادم. جاري إعادة المحاولة تلقائياً.";
        errorType = "ResponseError";
        
        // محاولة إعادة الاتصال مباشرة للمستخدم
        try {
          await checkConnection();
          return this.validateAndRunAutomation(config);
        } catch (e) {
          // إذا فشلت إعادة المحاولة
          errorMessage = "فشلت محاولة إعادة الاتصال. حاول مرة أخرى لاحقاً.";
        }
      }
      
      // إرجاع استجابة خطأ منسقة
      return {
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          message: errorMessage,
          type: errorType
        }
      };
    }
  }

  /**
   * التحقق من وجود الاتصال بالخادم
   */
  static async checkServerExistence(): Promise<boolean> {
    try {
      const result = await checkConnection();
      return result.isConnected;
    } catch (error) {
      console.error("خطأ في التحقق من وجود الخادم:", error);
      return false;
    }
  }

  /**
   * التحقق من حالة الخادم
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    try {
      const serverUrl = getAutomationServerUrl();
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`فشل التحقق من حالة الخادم: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      return null;
    }
  }

  /**
   * إجبار إعادة الاتصال بالخادم
   */
  static async forceReconnect(): Promise<boolean> {
    try {
      const result = await checkConnection();
      return result.isConnected;
    } catch (error) {
      console.error("خطأ في إعادة الاتصال بالخادم:", error);
      return false;
    }
  }

  /**
   * تبديل وضع التنفيذ الفعلي
   */
  static toggleRealExecution(enabled: boolean): void {
    try {
      localStorage.setItem('force_real_execution', enabled.toString());
      console.log(`تم ${enabled ? 'تفعيل' : 'تعطيل'} وضع التنفيذ الفعلي`);
    } catch (error) {
      console.error("خطأ في تبديل وضع التنفيذ الفعلي:", error);
    }
  }

  /**
   * بدء إعادة الاتصال التلقائي
   */
  static startAutoReconnect(callback?: (isConnected: boolean) => void): void {
    console.log("بدء إعادة الاتصال التلقائي");
    // هنا سيتم تنفيذ منطق إعادة الاتصال التلقائي
    // يمكن تنفيذ هذا في الإصدارات المستقبلية
  }

  /**
   * إيقاف إعادة الاتصال التلقائي
   */
  static stopReconnect(): void {
    console.log("إيقاف إعادة الاتصال التلقائي");
    // هنا سيتم إيقاف إعادة الاتصال التلقائي
    // يمكن تنفيذ هذا في الإصدارات المستقبلية
  }
}
