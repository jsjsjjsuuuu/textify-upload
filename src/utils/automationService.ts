
import { toast } from "sonner";
import { AutomationConfig, AutomationResponse } from "./automation/types";
import { ConnectionManager } from "./automation/connectionManager";
import { 
  isPreviewEnvironment,
  getAutomationServerUrl,
  getLastConnectionStatus, 
  createFetchOptions,
  fetchWithRetry 
} from "./automationServerUrl";

export class AutomationService {
  private static readonly maxRetries = 3;
  private static readonly retryDelay = 2000;
  private static isRunning = false;

  /**
   * التحقق من حالة اتصال خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    try {
      return await ConnectionManager.checkServerStatus(showToasts);
    } catch (error) {
      console.error("خطأ في التحقق من حالة خادم الأتمتة:", error);
      throw error;
    }
  }

  /**
   * التحقق من وجود خادم الأتمتة
   */
  static async checkServerExistence(showToasts = true): Promise<boolean> {
    try {
      const result = await this.checkServerStatus(showToasts);
      return result && result.status === 'ok';
    } catch (error) {
      console.error("خطأ في التحقق من وجود خادم الأتمتة:", error);
      return false;
    }
  }

  /**
   * إجبار إعادة الاتصال بالخادم
   */
  static async forceReconnect(): Promise<boolean> {
    try {
      const result = await this.checkServerStatus(false);
      return result && result.status === 'ok';
    } catch (error) {
      console.error("فشل في إعادة الاتصال بالخادم:", error);
      return false;
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
   * تبديل وضع التنفيذ الفعلي
   */
  static toggleRealExecution(enable: boolean): void {
    console.log(`تبديل وضع التنفيذ الفعلي: ${enable ? 'مفعل' : 'غير مفعل'}`);
    // دائمًا نستخدم وضع التنفيذ الفعلي
  }

  /**
   * التحقق من صحة إعدادات الأتمتة قبل تنفيذها
   */
  static validateAutomationConfig(config: AutomationConfig): string[] {
    const errors: string[] = [];

    // التحقق من وجود URL المشروع
    if (!config.projectUrl) {
      errors.push("يجب تحديد رابط المشروع");
    } else if (!config.projectUrl.startsWith("http")) {
      errors.push("يجب أن يبدأ رابط المشروع بـ http:// أو https://");
    }

    // التحقق من وجود إجراءات الأتمتة
    if (!config.actions || config.actions.length === 0) {
      errors.push("يجب إضافة إجراء واحد على الأقل");
    } else {
      // التحقق من تفاصيل كل إجراء
      for (let i = 0; i < config.actions.length; i++) {
        const action = config.actions[i];
        // نتحقق من وجود العناصر الأساسية حسب نوع الواجهة
        if ('type' in action) {
          // إذا كان من نوع Action
          if (!action.type) {
            errors.push(`الإجراء #${i + 1}: يجب تحديد نوع الإجراء`);
          }
          if (!action.selector && !action.finder) {
            errors.push(`الإجراء #${i + 1}: يجب تحديد المحدد الخاص بالإجراء`);
          }
        } else {
          // إذا كان من نوع AutomationAction
          if (!action.name) {
            errors.push(`الإجراء #${i + 1}: يجب تحديد اسم الإجراء`);
          }
          if (!action.finder) {
            errors.push(`الإجراء #${i + 1}: يجب تحديد المحدد الخاص بالإجراء`);
          }
        }
      }
    }

    // التحقق من نوع الأتمتة
    if (!config.automationType) {
      errors.push("يجب تحديد نوع الأتمتة (server أو client)");
    }

    // التحقق من قيمة useBrowserData
    if (config.useBrowserData === undefined) {
      errors.push("يجب تحديد قيمة useBrowserData");
    }

    return errors;
  }

  /**
   * التحقق من الإعدادات وتنفيذ الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    // التأكد من تمكين وضع التنفيذ الفعلي دائمًا
    config.forceRealExecution = true;
    
    // التحقق من الإعدادات قبل التنفيذ
    const validationErrors = this.validateAutomationConfig(config);
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: "فشل التحقق من إعدادات الأتمتة",
        automationType: config.automationType,
        details: validationErrors,
        error: {
          message: validationErrors.join("\n"),
          type: "ValidationError"
        }
      };
    }

    console.log("تكوين الأتمتة قبل التنفيذ:", JSON.stringify(config, null, 2));

    try {
      // تنفيذ الأتمتة
      return await this.runAutomation(config);
    } catch (error: any) {
      console.error("خطأ أثناء تنفيذ الأتمتة:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "حدث خطأ غير معروف أثناء تنفيذ الأتمتة";
      
      // تحسين رسالة الخطأ للمستخدم
      let userFriendlyMessage = "حدث خطأ أثناء تنفيذ الأتمتة.";
      let errorType = "UnknownError";
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        userFriendlyMessage = "حدث خطأ في الشبكة أثناء الاتصال بالخادم. تأكد من اتصالك بالإنترنت.";
        errorType = "NetworkError";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        userFriendlyMessage = "انتهت مهلة الاتصال بالخادم. قد يكون الخادم بطيئًا أو غير متاح حاليًا.";
        errorType = "TimeoutError";
      } else if (errorMessage.includes("CORS")) {
        userFriendlyMessage = "حدث خطأ في اتصال CORS. قد يكون هناك مشكلة في إعدادات الخادم.";
        errorType = "CORSError";
      }
      
      return {
        success: false,
        message: userFriendlyMessage,
        automationType: config.automationType,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          type: errorType
        }
      };
    }
  }

  /**
   * تنفيذ الأتمتة
   */
  static async runAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    if (this.isRunning) {
      return {
        success: false,
        message: "هناك عملية أتمتة قيد التنفيذ بالفعل. يرجى الانتظار حتى اكتمالها.",
        automationType: config.automationType
      };
    }

    // التأكد دائمًا من تمكين وضع التنفيذ الفعلي
    config.forceRealExecution = true;

    // إذا كانت الإجراءات من نوع AutomationAction، فسنقوم بتحويلها إلى نوع Action المتوافق مع واجهة خادم الأتمتة
    if (config.actions.length > 0 && 'name' in config.actions[0]) {
      const actions = config.actions as any[];
      const mappedActions = actions.map(action => {
        let type = 'click';
        
        // تحديد نوع الإجراء من الاسم أو القيمة
        if (action.name === 'انقر' || action.value === 'click') {
          type = 'click';
        } else if (action.name === 'أدخل نص') {
          type = 'type';
        } else if (action.name === 'اختر قيمة') {
          type = 'select';
        } else if (action.name === 'انتظر' || action.value === 'wait') {
          type = 'wait';
        }
        
        return {
          type,
          selector: action.finder,
          value: action.value,
          delay: action.delay
        };
      });
      
      console.log("تم تحويل الإجراءات:", mappedActions);
      config.actions = mappedActions;
    }

    // التحقق من اتصال الخادم قبل تنفيذ الأتمتة
    const connectionStatus = getLastConnectionStatus();
    if (!connectionStatus.isConnected && config.automationType === 'server') {
      // محاولة إعادة الاتصال قبل الفشل
      try {
        const retryResult = await this.retryServerConnection(2);
        if (!retryResult) {
          return {
            success: false,
            message: "تعذر الاتصال بخادم الأتمتة. تأكد من اتصالك بالإنترنت.",
            automationType: config.automationType,
            error: {
              message: "حدث خطأ في الشبكة أثناء الاتصال بالخادم. تأكد من اتصالك بالإنترنت.",
              type: "ConnectionError"
            }
          };
        }
      } catch (error) {
        console.error("خطأ أثناء محاولة إعادة الاتصال:", error);
      }
    }

    this.isRunning = true;
    let failed = false;
    
    try {
      // تحديد وقت بدء التنفيذ
      const startTime = Date.now();
      
      // الحصول على رابط خادم الأتمتة
      const serverUrl = getAutomationServerUrl();
      if (!serverUrl && config.automationType === 'server') {
        throw new Error("لم يتم تحديد رابط خادم الأتمتة");
      }
      
      // إعداد طلب الأتمتة
      const endpoint = `${serverUrl}/api/automation/run`;
      console.log(`إرسال طلب الأتمتة إلى ${endpoint}`, config);
      
      // التأكد دائمًا من تمكين وضع التنفيذ الفعلي
      config.forceRealExecution = true;
      
      // تنفيذ الأتمتة مع إعادة المحاولة تلقائيًا
      const response = await fetchWithRetry(
        endpoint, 
        createFetchOptions('POST', config),
        this.maxRetries,
        this.retryDelay
      );
      
      if (!response.ok) {
        failed = true;
        
        // محاولة استخراج تفاصيل الخطأ من الاستجابة
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `فشل الطلب بحالة: ${response.status}`);
        } catch (parseError) {
          throw new Error(`فشل الطلب بحالة: ${response.status} ${response.statusText}`);
        }
      }
      
      // استخراج نتائج الأتمتة
      const result = await response.json();
      console.log("نتيجة تنفيذ الأتمتة:", result);
      
      // تحديد وقت الانتهاء وحساب مدة التنفيذ
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // إضافة معلومات إضافية للنتيجة
      return {
        ...result,
        executionTime,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      failed = true;
      console.error("خطأ أثناء تنفيذ الأتمتة:", error);
      
      // إعداد رسالة خطأ أكثر تفصيلاً
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "حدث خطأ أثناء تنفيذ الأتمتة";
      let errorType = "AutomationError";
      
      // تحسين رسالة الخطأ بناءً على نوع الخطأ
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        userFriendlyMessage = "حدث خطأ في الشبكة أثناء الاتصال بالخادم. تأكد من اتصالك بالإنترنت.";
        errorType = "NetworkError";
        
        // محاولة إعادة اتصال الخادم
        this.startAutoReconnect();
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        userFriendlyMessage = "انتهت مهلة الاتصال بالخادم. قد يكون الخادم بطيئًا أو غير متوفر حاليًا.";
        errorType = "TimeoutError";
      } else if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        userFriendlyMessage = "حدث خطأ في اتصال CORS. قد يكون هناك مشكلة في إعدادات الخادم.";
        errorType = "CORSError";
      } else if (errorMessage.includes("selector") || errorMessage.includes("element not found")) {
        userFriendlyMessage = "تعذر العثور على العنصر المحدد في الصفحة. يرجى التحقق من صحة المحدد.";
        errorType = "SelectorError";
      }
      
      return {
        success: false,
        message: userFriendlyMessage,
        automationType: config.automationType,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          type: errorType
        }
      };
    } finally {
      this.isRunning = false;
      
      // إذا فشلت العملية، حاول إعادة الاتصال
      if (failed && config.automationType === 'server') {
        // تحديث حالة الاتصال وإعادة المحاولة إذا لزم الأمر
        try {
          await this.checkServerStatus(false);
        } catch (error) {
          console.error("فشل التحقق من حالة الخادم بعد فشل الأتمتة:", error);
        }
      }
    }
  }

  /**
   * محاولة إعادة الاتصال بالخادم قبل فشل العملية
   */
  private static async retryServerConnection(maxRetries: number): Promise<boolean> {
    console.log(`محاولة إعادة الاتصال بالخادم (${maxRetries} محاولات)...`);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        toast.info(`محاولة إعادة الاتصال بالخادم (${i + 1}/${maxRetries})...`);
        
        // انتظار قبل إعادة المحاولة
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        await this.checkServerStatus(false);
        const status = getLastConnectionStatus();
        
        if (status.isConnected) {
          console.log("تم إعادة الاتصال بالخادم بنجاح!");
          toast.success("تم إعادة الاتصال بالخادم بنجاح");
          return true;
        }
      } catch (error) {
        console.error(`فشلت محاولة إعادة الاتصال ${i + 1}/${maxRetries}:`, error);
      }
    }
    
    console.error(`فشلت جميع محاولات إعادة الاتصال (${maxRetries} محاولات)`);
    return false;
  }
}
