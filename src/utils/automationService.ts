
import { AutomationConfig, AutomationResponse } from "./automation/types";
import { automationServerUrl, isPreviewEnvironment } from "./automationServerUrl";
import { toast } from "sonner";

// الخدمة المسؤولة عن إدارة عمليات الأتمتة
export class AutomationService {
  
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
        
        return {
          success: true,
          message: "تم تنفيذ الأتمتة بنجاح (محاكاة)",
          automationType: 'client',
          results: cleanedConfig.actions.map((action, index) => ({
            success: true,
            actionName: action.name,
            actionIndex: index,
            message: `تم تنفيذ الإجراء "${action.description || action.name}" بنجاح`,
            selector: action.finder,
            value: action.value
          })),
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
      
      // التعامل بشكل خاص مع خطأ "require is not defined"
      if (errorMessage.includes('require is not defined')) {
        errorMessage = "خطأ في تنفيذ الأتمتة: مشكلة في تكوين الخادم. يرجى التحقق من إعدادات الخادم.";
      }
      
      // إرجاع كائن استجابة يحتوي على معلومات الخطأ
      return {
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          type: 'ExecutionError',
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        },
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // تنظيف وتحسين تكوين الأتمتة
  private static sanitizeConfig(config: AutomationConfig): AutomationConfig {
    // نسخة من التكوين للتعديل
    const cleanedConfig = { ...config };
    
    // التأكد من وجود اسم للمشروع
    if (!cleanedConfig.projectName) {
      cleanedConfig.projectName = 'أتمتة بدون اسم';
    }
    
    // تعديل الإجراءات للتأكد من وجود جميع الحقول المطلوبة
    cleanedConfig.actions = (cleanedConfig.actions || []).map(action => ({
      name: action.name,
      finder: action.finder,
      value: action.value || '',
      delay: typeof action.delay === 'number' ? action.delay : parseInt(action.delay?.toString() || '500', 10),
      description: action.description || `إجراء ${action.name}`
    }));
    
    // إضافة معلومات المتصفح والبيئة
    cleanedConfig.browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`
    };
    
    // إضافة خيارات إضافية للخادم
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
    
    return cleanedConfig;
  }
}
