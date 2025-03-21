
import { AutomationAction, AutomationConfig, AutomationResponse, ActionResult, ErrorType } from './automation/types';
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
    
    // تأكد من أن عنوان URL يحتوي على بروتوكول
    if (!config.projectUrl.startsWith('http://') && !config.projectUrl.startsWith('https://')) {
      config.projectUrl = 'https://' + config.projectUrl;
      console.log("تم تصحيح عنوان URL تلقائيًا:", config.projectUrl);
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
      
      // إنشاء نتائج محاكاة للإجراءات
      const mockResults: ActionResult[] = enhancedConfig.actions.map((action, index) => ({
        index,
        action: action.name || '',
        selector: action.finder || '',
        value: action.value || '',
        success: true,
        error: null,
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 500) + 100,
        screenshots: []
      }));
      
      // إنشاء استجابة وهمية
      return {
        success: true,
        message: "تم تنفيذ الأتمتة بنجاح (وضع المعاينة)",
        automationType: 'server',
        executionTime: 2000,
        results: mockResults
      };
    }
    
    // 3. الاتصال بالخادم وتنفيذ الأتمتة
    try {
      // الحصول على URL الخادم من الإعدادات
      const serverUrl = getAutomationServerUrl();
      console.log("URL خادم الأتمتة:", serverUrl);
      
      // التحقق من سلامة الـ URL قبل الاستدعاء
      if (!serverUrl) {
        throw new Error("لم يتم تكوين عنوان URL لخادم الأتمتة بشكل صحيح");
      }
      
      const apiEndpoint = `${serverUrl}/api/automation/run`;
      console.log("نقطة نهاية API الكاملة:", apiEndpoint);
      
      // إنشاء طلب الأتمتة
      const response = await fetch(apiEndpoint, {
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
        let errorMessage = `فشل الاتصال بخادم الأتمتة (${response.status})`;
        let errorType = ErrorType.ExecutionError;
        
        if (response.status === 404) {
          errorMessage = "نقطة النهاية API غير موجودة. تأكد من تكوين خادم الأتمتة بشكل صحيح.";
          errorType = ErrorType.EndpointNotFoundError;
        } else if (response.status === 403 || response.status === 401) {
          errorMessage = "غير مصرح بالوصول إلى خادم الأتمتة. تحقق من بيانات الاعتماد.";
          errorType = ErrorType.AuthorizationError;
        } else if (response.status === 500) {
          errorMessage = "حدث خطأ داخلي في خادم الأتمتة. يرجى المحاولة مرة أخرى لاحقاً.";
          errorType = ErrorType.ServerError;
        }
        
        try {
          // نسخ الاستجابة لتفادي مشكلة "body stream already read"
          const responseClone = response.clone();
          const errorData = await responseClone.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // إذا تعذر تحليل JSON، استخدام نص الخطأ
          try {
            // نسخ الاستجابة مرة أخرى لتجنب المشكلة
            const responseClone = response.clone();
            const textResponse = await responseClone.text();
            if (textResponse) {
              errorMessage = `${errorMessage}: ${textResponse.substring(0, 100)}...`;
            }
          } catch (textError) {
            console.error("تعذر قراءة نص الاستجابة:", textError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // نسخ الاستجابة قبل قراءتها لتفادي مشكلة "body stream already read"
      const responseClone = response.clone();
      
      try {
        // تحليل الاستجابة
        const data = await responseClone.json();
        console.log("استجابة الأتمتة:", data);
        
        // إعادة استجابة الخادم
        return data;
      } catch (jsonError) {
        console.error("خطأ في تحليل استجابة JSON:", jsonError);
        
        // محاولة قراءة الاستجابة كنص
        try {
          const textResponse = await response.text();
          console.log("استجابة نصية:", textResponse);
          
          return {
            success: false,
            message: `تعذر تحليل استجابة الخادم: ${textResponse.substring(0, 100)}...`,
            automationType: 'server',
            error: {
              message: "استجابة غير صالحة من الخادم",
              type: ErrorType.ResponseFormatError
            }
          };
        } catch (textError) {
          console.error("تعذر قراءة نص الاستجابة:", textError);
          throw new Error("تعذر قراءة استجابة الخادم");
        }
      }
    } catch (error) {
      console.error("خطأ أثناء تنفيذ الأتمتة:", error);
      
      // تحسين رسائل الخطأ الشائعة للمستخدم
      let errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      let errorType = ErrorType.ExecutionError;
      
      // التعامل مع أخطاء الاتصال
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = "فشل الاتصال بخادم الأتمتة. تأكد من اتصالك بالإنترنت وأن الخادم متاح.";
        errorType = ErrorType.NetworkError;
      }
      
      // التعامل مع أخطاء انتهاء المهلة
      if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorMessage = "انتهت مهلة الاتصال بخادم الأتمتة. قد يكون الخادم مشغولاً، حاول مرة أخرى لاحقاً.";
        errorType = ErrorType.TimeoutError;
      }
      
      // التعامل مع أخطاء CORS
      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        errorMessage = "خطأ في سياسة مشاركة الموارد عبر الأصول (CORS). تأكد من إعدادات الخادم.";
        errorType = ErrorType.CORSError;
      }
      
      // التعامل مع أخطاء "body stream already read"
      if (errorMessage.includes("body stream already read")) {
        errorMessage = "حدث خطأ أثناء قراءة استجابة الخادم. حاول مرة أخرى.";
        errorType = ErrorType.StreamReadError;
      }
      
      // إرجاع استجابة خطأ منسقة
      return {
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          message: errorMessage,
          type: errorType,
          stack: error instanceof Error ? error.stack : undefined
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
