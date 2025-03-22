
import { AutomationConfig, AutomationResponse, ActionResult, ErrorType } from "./automation/types";
import { automationServerUrl, isPreviewEnvironment, checkConnection } from "./automationServerUrl";
import { toast } from "sonner";

// الخدمة المسؤولة عن إدارة عمليات الأتمتة
export class AutomationService {
  
  // إضافة تبديل التنفيذ الفعلي
  static toggleRealExecution(enable: boolean): void {
    try {
      localStorage.setItem('force_real_execution', enable ? 'true' : 'false');
      console.log(`تم ${enable ? 'تفعيل' : 'تعطيل'} التنفيذ الفعلي للأتمتة`);
    } catch (error) {
      console.error("خطأ في تبديل وضع التنفيذ الفعلي:", error);
    }
  }
  
  // التحقق من حالة التنفيذ الفعلي
  static isRealExecutionEnabled(): boolean {
    try {
      return localStorage.getItem('force_real_execution') === 'true';
    } catch {
      return false;
    }
  }
  
  // إعادة محاولة الاتصال بالخادم
  static async forceReconnect(): Promise<boolean> {
    try {
      const response = await fetch(`${automationServerUrl}/api/ping?force=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      if (response.ok) {
        console.log("تم إعادة الاتصال بالخادم بنجاح");
        return true;
      }
      
      console.error("فشل إعادة الاتصال بالخادم:", response.statusText);
      return false;
    } catch (error) {
      console.error("خطأ في إعادة الاتصال بالخادم:", error);
      return false;
    }
  }
  
  // التحقق من حالة الخادم
  static async checkServerStatus(showToast: boolean = true): Promise<boolean> {
    try {
      const isPreviewMode = isPreviewEnvironment();
      
      // في بيئة المعاينة، نفترض أن الخادم متصل دائمًا
      if (isPreviewMode) {
        if (showToast) {
          toast.success("وضع المعاينة: محاكاة اتصال الخادم");
        }
        return true;
      }
      
      const response = await fetch(`${automationServerUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'web-client'
        }
      });
      
      if (response.ok) {
        if (showToast) {
          toast.success("خادم الأتمتة متصل");
        }
        return true;
      } else {
        if (showToast) {
          toast.error("خادم الأتمتة غير متصل");
        }
        return false;
      }
    } catch (error) {
      if (showToast) {
        toast.error("تعذر الاتصال بخادم الأتمتة");
      }
      console.error("خطأ في التحقق من حالة الخادم:", error);
      return false;
    }
  }
  
  // التحقق من الإعدادات وتنفيذ الأتمتة
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    try {
      // تحسين وتنقية البيانات قبل الإرسال
      const cleanedConfig = this.sanitizeConfig(config);
      
      console.log("بدء تنفيذ الأتمتة:", cleanedConfig);
      
      const isPreviewMode = isPreviewEnvironment();
      
      // في بيئة المعاينة، نقوم بمحاكاة استجابة ناجحة
      if (isPreviewMode) {
        console.log("وضع المعاينة: محاكاة استجابة الأتمتة");
        
        // استجابة مزيفة للاختبار
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // إنشاء نتائج الإجراءات بتنسيق يتوافق مع ActionResult
        const mockResults: ActionResult[] = cleanedConfig.actions.map((action, idx) => ({
          index: idx,
          action: action.name,
          selector: action.finder || '',
          value: action.value || '',
          success: true,
          error: null,
          timestamp: new Date().toISOString(),
          duration: 500,
          screenshots: []
        }));
        
        return {
          success: true,
          message: "تم تنفيذ الأتمتة بنجاح (محاكاة)",
          automationType: 'client',
          results: mockResults,
          executionTime: 1500,
          timestamp: new Date().toISOString()
        };
      }
      
      // تنفيذ الأتمتة على الخادم
      const response = await fetch(`${automationServerUrl}/api/automate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'web-client'
        },
        body: JSON.stringify(cleanedConfig)
      });
      
      // إذا كان هناك خطأ في الاستجابة
      if (!response.ok) {
        const errorText = await response.text();
        
        // محاولة تحليل رسالة الخطأ إذا كانت بصيغة JSON
        let errorMessage = `خطأ في الخادم: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          // إذا لم تكن الاستجابة بصيغة JSON، استخدم النص كما هو
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }
      
      // تحليل الاستجابة
      const responseData = await response.json();
      
      // إعادة تنسيق البيانات لتتوافق مع تنسيق AutomationResponse
      return {
        success: responseData.success,
        message: responseData.message,
        results: responseData.results,
        executionTime: responseData.executionTime,
        automationType: 'server',
        error: responseData.error,
        timestamp: responseData.timestamp || new Date().toISOString(),
        details: responseData.details
      };
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      // تحديد رسالة الخطأ
      let errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف أثناء تنفيذ الأتمتة";
      let errorType: ErrorType = "ExecutionError";
      
      // التعامل مع خطأ require بشكل خاص
      if (errorMessage.includes('require is not defined') || errorMessage.includes('require is not a function')) {
        errorType = "RequireError";
        errorMessage = "خطأ في تشغيل البرنامج: الدالة require غير متاحة في المتصفح. يجب استخدام آليات استيراد أخرى.";
      }
      // تحليل نوع الخطأ بناءً على الرسالة
      else if (errorMessage.includes('Puppeteer') || errorMessage.includes('Chrome') || errorMessage.includes('browser')) {
        errorType = "PuppeteerError";
        errorMessage = "خطأ في تنفيذ الأتمتة: مشكلة في المتصفح الآلي على الخادم. يرجى التحقق من إعدادات الخادم.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        errorType = "TimeoutError";
        errorMessage = "خطأ في تنفيذ الأتمتة: انتهت مهلة الاتصال بالخادم.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorType = "NetworkError";
        errorMessage = "خطأ في تنفيذ الأتمتة: مشكلة في الاتصال بالشبكة.";
      } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        errorType = "ValidationError";
        errorMessage = "خطأ في تنفيذ الأتمتة: بيانات غير صالحة.";
      } else if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
        errorType = "ConfigurationError";
        errorMessage = "خطأ في تنفيذ الأتمتة: مشكلة في الإعدادات.";
      } else if (errorMessage.includes('server')) {
        errorType = "ServerError";
        errorMessage = "خطأ في تنفيذ الأتمتة: مشكلة في الخادم.";
      } else if (errorMessage.includes('not found') || errorMessage.includes('selector')) {
        errorType = "ElementNotFoundError";
        errorMessage = "خطأ في تنفيذ الأتمتة: لم يتم العثور على العنصر المحدد.";
      } else if (errorMessage.includes('module')) {
        errorType = "ModuleError";
        errorMessage = "خطأ في تحميل الوحدات: قد تحتاج إلى تحديث النظام أو تثبيت المكتبات الضرورية.";
      }
      
      // إرجاع كائن استجابة يحتوي على معلومات الخطأ
      return {
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          type: errorType,
          message: errorMessage,
          stack: error instanceof Error ? error.stack || "" : "",
          details: [
            "نوع الخطأ: " + errorType,
            "وقت الخطأ: " + new Date().toLocaleString("ar-SA")
          ]
        },
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // تنظيف وتحسين تكوين الأتمتة
  private static sanitizeConfig(config: AutomationConfig): AutomationConfig {
    // نسخة من التكوين للتعديل
    const cleanedConfig: AutomationConfig = { ...config };
    
    // التأكد من وجود اسم للمشروع
    if (!cleanedConfig.projectName) {
      cleanedConfig.projectName = 'أتمتة بدون اسم';
    }
    
    // تعديل الإجراءات للتأكد من وجود جميع الحقول المطلوبة
    cleanedConfig.actions = (cleanedConfig.actions || []).map(action => ({
      name: action.name,
      type: action.name, // إضافة خاصية type لتكون مطابقة للاسم
      finder: action.finder,
      value: action.value || '',
      delay: typeof action.delay === 'number' ? action.delay : parseInt(String(action.delay) || '500', 10),
      description: action.description || `إجراء ${action.name}`
    }));
    
    // إضافة معلومات المتصفح والبيئة
    if (!cleanedConfig.browserInfo) {
      cleanedConfig.browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`
      };
    }
    
    // إضافة خيارات إضافية للخادم
    if (!cleanedConfig.serverOptions) {
      cleanedConfig.serverOptions = {
        timeout: 60000, // مهلة 60 ثانية
        maxRetries: 2, // عدد محاولات إعادة المحاولة
        useHeadlessMode: true, // استخدام وضع العرض بدون واجهة
        puppeteerOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        }
      };
    }
    
    return cleanedConfig;
  }
}
