
import { AutomationAction, AutomationConfig, AutomationResponse } from './automation/types';
import { getAutomationServerUrl, isPreviewEnvironment } from './automationServerUrl';

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
    if (isPreviewEnvironment()) {
      console.log("وضع المعاينة: محاكاة تنفيذ الأتمتة بنجاح");
      
      // إنشاء تأخير مصطنع لمحاكاة وقت المعالجة
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إنشاء استجابة وهمية
      return {
        success: true,
        message: "تم تنفيذ الأتمتة بنجاح (وضع المعاينة)",
        automationType: 'server',
        executionTime: 2000,
        results: enhancedConfig.actions.map(action => ({
          success: true,
          action: action.name,
          message: "تم تنفيذ الإجراء بنجاح (وضع المعاينة)",
          selector: action.finder,
          delay: action.delay
        }))
      };
    }
    
    // 3. الاتصال بالخادم وتنفيذ الأتمتة
    try {
      // الحصول على URL الخادم من الإعدادات
      const serverUrl = getAutomationServerUrl();
      console.log("URL خادم الأتمتة:", serverUrl);
      
      // إنشاء طلب الأتمتة
      const response = await fetch(`${serverUrl}/api/automation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(enhancedConfig)
      });
      
      // تسجيل معلومات الاستجابة الأولية للتشخيص
      console.log(`استجابة الخادم - الحالة: ${response.status}, نوع المحتوى: ${response.headers.get('Content-Type')}`);
      
      // التحقق من نجاح الاستجابة
      if (!response.ok) {
        // محاولة استخراج رسالة الخطأ من الاستجابة
        let errorMessage = "فشل الاتصال بخادم الأتمتة";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // إذا تعذر تحليل JSON، استخدام نص الخطأ
          errorMessage = await response.text() || errorMessage;
        }
        
        throw new Error(`خطأ في طلب الأتمتة (${response.status}): ${errorMessage}`);
      }
      
      // تحليل الاستجابة
      const data = await response.json();
      console.log("استجابة الأتمتة:", data);
      
      // إعادة استجابة الخادم
      return data;
    } catch (error) {
      console.error("خطأ أثناء تنفيذ الأتمتة:", error);
      
      // تحسين رسائل الخطأ الشائعة للمستخدم
      let errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      
      // التعامل مع أخطاء الاتصال
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "فشل الاتصال بخادم الأتمتة. تأكد من اتصالك بالإنترنت وأن الخادم متاح.";
      }
      
      // التعامل مع أخطاء انتهاء المهلة
      if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorMessage = "انتهت مهلة الاتصال بخادم الأتمتة. قد يكون الخادم مشغولاً، حاول مرة أخرى لاحقاً.";
      }
      
      // إرجاع استجابة خطأ منسقة
      return {
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          message: errorMessage,
          type: 'ExecutionError'
        }
      };
    }
  }
}

