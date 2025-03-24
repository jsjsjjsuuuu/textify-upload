
/**
 * تشغيل سيناريوهات الأتمتة
 */
import { getAutomationServerUrl, updateConnectionStatus, createBaseHeaders, getNextIp, isPreviewEnvironment, createTimeoutSignal } from "../automationServerUrl";
import { toast } from "sonner";
import { AutomationConfig, AutomationResponse, ActionResult } from "./types";
import { ConnectionManager } from "./connectionManager";
import { logActionExecution } from "../automation";

export class AutomationRunner {
  /**
   * تشغيل سيناريو الأتمتة باستخدام Puppeteer
   */
  static async runAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    const serverUrl = getAutomationServerUrl();
    
    try {
      // إظهار رسالة توضح أن الأتمتة قيد التنفيذ
      toast("جاري تنفيذ سيناريو الأتمتة...", {
        duration: 3000,
      });
      
      console.log("بدء تنفيذ الأتمتة مع التكوين:", {
        projectUrl: config.projectUrl,
        actionsCount: config.actions.length,
        useBrowserData: config.useBrowserData
      });
      
      // إذا كنا في بيئة المعاينة، نتحقق ما إذا كان المستخدم يريد التنفيذ الفعلي
      if (isPreviewEnvironment()) {
        // التحقق من وجود علامة التنفيذ الفعلي في التخزين المحلي
        let forceRealExecution = false;
        try {
          forceRealExecution = localStorage.getItem('force_real_execution') === 'true';
        } catch (error) {
          console.error("خطأ في الوصول إلى التخزين المحلي:", error);
        }
        
        if (!forceRealExecution) {
          toast("أنت في بيئة المعاينة (لوفابل). التنفيذ الفعلي لا يعمل هنا، سيتم محاكاة النتائج فقط.", {
            duration: 5000,
          });
          
          console.log("تشغيل الأتمتة في وضع المحاكاة (بيئة المعاينة)");
          
          // محاكاة تأخير لتجربة أكثر واقعية
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // محاكاة تنفيذ الإجراءات وتسجيلها
          const mockResults: ActionResult[] = config.actions.map((action, index) => {
            const success = Math.random() > 0.2; // 80% نسبة نجاح
            return {
              index,
              action: action.type || action.name, // استخدم type أو name
              selector: action.selector || action.finder || '', // استخدم selector أو finder
              value: action.value || '',
              success,
              error: success ? null : 'خطأ محاكاة: لم يتم العثور على العنصر',
              timestamp: new Date().toISOString(),
              duration: Math.floor(Math.random() * 500) + 100,
              screenshots: []
            };
          });
          
          // إرجاع استجابة مزيفة للمحاكاة مع إضافة خاصية details
          return {
            success: true,
            message: "تمت محاكاة تنفيذ الأتمتة بنجاح (بيئة المعاينة)",
            automationType: 'client',
            details: [
              `عدد الإجراءات: ${config.actions.length}`,
              `الرابط: ${config.projectUrl}`,
              `استخدام بيانات المتصفح: ${config.useBrowserData ? 'نعم' : 'لا'}`
            ],
            results: mockResults,
            executionTime: 2000,
            timestamp: new Date().toISOString()
          };
        } else {
          // إظهار رسالة أن المستخدم يستخدم التنفيذ الفعلي في بيئة المعاينة
          toast.warning("تم تفعيل التنفيذ الفعلي في بيئة المعاينة. سيتم محاولة الاتصال بالخادم الحقيقي.", {
            duration: 5000,
          });
          console.log("تشغيل الأتمتة الفعلية في بيئة المعاينة بناءً على طلب المستخدم");
        }
      }
      
      // استخدام عنوان IP متناوب في كل محاولة
      const currentIp = getNextIp();
      console.log("استخدام عنوان IP للطلب:", currentIp);
      
      console.log("بدء تنفيذ الأتمتة على الخادم:", serverUrl);
      console.log("بيانات الطلب:", {
        projectUrl: config.projectUrl,
        actionsCount: config.actions.length,
        ipAddress: currentIp,
        useBrowserData: config.useBrowserData
      });
      
      // إضافة معلومات إضافية للتشخيص في التكوين
      const enhancedConfig = {
        ...config,
        ipAddress: currentIp,
        clientInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
          screenResolution: `${window.screen.width}x${window.screen.height}`
        },
        debugging: {
          verboseLogging: true,
          captureScreenshots: true,
          logElementDetails: true,
          logNetworkRequests: true,
          logErrors: true
        },
        // إضافة معلومات للتشخيص
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screenSize: `${window.screen.width}x${window.screen.height}`
        },
        // إضافة خيارات خاصة لـ Puppeteer لمساعدة في تهيئته
        puppeteerOptions: {
          useSingleProcess: true,
          disableGpu: true,
          additionalArgs: [
            '--no-zygote',
            '--disable-features=site-per-process',
            '--ignore-certificate-errors'
          ]
        }
      };
      
      // إعداد معالجة المهلة
      const timeoutSignal = createTimeoutSignal(120000); // زيادة المهلة إلى دقيقتين
      
      // إعداد الرؤوس
      const headers = createBaseHeaders(currentIp);
      
      // محاولات متعددة للاتصال
      let retries = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      while (retries < maxRetries) {
        try {
          // إضافة رقم المحاولة إلى الرؤوس
          const headersWithRetry = {
            ...headers,
            'X-Retry-Count': retries.toString(),
            'X-Debug-Mode': 'true',
            'X-Client-Timestamp': new Date().toISOString(),
            'Origin': window.location.origin,
            'Access-Control-Allow-Origin': '*',
            'Accept': '*/*'
          };
          
          console.log(`محاولة الاتصال #${retries + 1} بخادم الأتمتة...`);
          
          // تصحيح نقطة النهاية من /api/automation/execute إلى /api/automate
          const response = await fetch(`${serverUrl}/api/automate`, {
            method: 'POST',
            headers: headersWithRetry,
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify(enhancedConfig),
            signal: timeoutSignal
          });
          
          console.log(`استجابة الخادم: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            // تحسين معالجة الأخطاء للحصول على المزيد من المعلومات
            let errorText = '';
            try {
              const errorBody = await response.json();
              errorText = errorBody.message || errorBody.error || '';
              console.error('تفاصيل الخطأ من الخادم:', errorBody);
            } catch {
              errorText = await response.text();
            }
            
            if (errorText.includes('Puppeteer') || errorText.includes('Chrome') || errorText.includes('browser')) {
              console.error('خطأ في تهيئة Puppeteer على الخادم:', errorText);
              toast.error('فشل في تهيئة Puppeteer على الخادم', {
                description: 'تحقق من تثبيت Chrome وضبط متغيرات البيئة المناسبة.'
              });
              
              throw new Error(`فشل في تهيئة Puppeteer: ${errorText}`);
            } else if (errorText.includes('require is not defined') || errorText.includes('require is not a function')) {
              console.error('خطأ في دالة require:', errorText);
              toast.error('خطأ في تشغيل البرنامج: الدالة require غير متاحة في المتصفح', {
                description: 'تم تحديث التطبيق لمعالجة هذه المشكلة. يرجى تحديث الصفحة.'
              });
              
              throw new Error(`خطأ في تشغيل دالة require: ${errorText}`);
            } else {
              console.error(`فشل في تنفيذ الأتمتة (${response.status}):`, errorText);
              throw new Error(`فشل في تنفيذ الأتمتة: ${response.status} ${response.statusText} - ${errorText}`);
            }
          }
          
          const result = await response.json();
          console.log("نتيجة تنفيذ الأتمتة:", result);
          
          // تحديث حالة الاتصال
          updateConnectionStatus(true);
          
          // تسجيل نتائج الإجراءات
          if (result.results && Array.isArray(result.results)) {
            result.results.forEach((actionResult: ActionResult) => {
              logActionExecution(
                actionResult.action,
                actionResult.selector,
                actionResult.value,
                actionResult.success,
                actionResult.error
              );
            });
          }
          
          // إظهار رسالة نجاح
          if (result.success) {
            toast.success("تم تنفيذ سيناريو الأتمتة بنجاح!", {
              duration: 5000,
            });
            
            // إذا كان هناك إجراءات فاشلة، عرض رسالة تحذير
            const failedActions = result.results?.filter(r => !r.success) || [];
            if (failedActions.length > 0) {
              toast.warning(`نجح السيناريو مع ${failedActions.length} إجراءات فاشلة`, {
                duration: 8000,
                description: "انظر إلى التفاصيل لمعرفة المزيد"
              });
            }
          } else {
            toast.error(`فشل في تنفيذ الأتمتة: ${result.message}`, {
              duration: 5000,
            });
          }
          
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`فشل في المحاولة ${retries + 1}/${maxRetries}:`, error);
          retries++;
          
          // تغيير عنوان IP في المحاولة التالية
          const newIp = getNextIp();
          console.log(`جاري تغيير عنوان IP إلى ${newIp} للمحاولة التالية`);
          
          if (retries < maxRetries) {
            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
      throw lastError || new Error("فشلت جميع محاولات الاتصال");
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      // تحديث حالة الاتصال
      updateConnectionStatus(false);
      
      // إنشاء رسالة خطأ مفصلة
      let errorMessage = "حدث خطأ أثناء تنفيذ الأتمتة";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || "";
      } else {
        errorMessage = String(error);
      }
      
      // معالجة خاصة لخطأ require
      if (errorMessage.includes('require is not defined') || errorMessage.includes('require is not a function')) {
        errorMessage = "خطأ في تشغيل البرنامج: الدالة require غير متاحة في المتصفح. تم تحديث التطبيق لمعالجة هذه المشكلة. يرجى تحديث الصفحة.";
        
        toast.error("خطأ في تشغيل البرنامج", {
          duration: 8000,
          description: "الدالة require غير متاحة في المتصفح. تم تحديث التطبيق لمعالجة هذه المشكلة. يرجى تحديث الصفحة."
        });
      }
      // تحسين فحص نوع الخطأ لتقديم إرشادات محددة للمستخدم
      else if (errorMessage.includes('Puppeteer') || errorMessage.includes('Chrome') || errorMessage.includes('browser')) {
        errorMessage = "فشل في تهيئة Puppeteer على الخادم. تحقق من تثبيت Chrome وضبط متغيرات البيئة المناسبة.";
        
        // إظهار رسالة مفصلة ومفيدة
        toast.error("فشل في تهيئة Puppeteer", {
          duration: 8000,
          description: "هناك مشكلة في إعداد المتصفح على الخادم. تواصل مع مسؤول النظام."
        });
      } else if (errorMessage.includes('timeout') || errorMessage.includes('مهلة')) {
        errorMessage = "انتهت مهلة الاتصال بخادم الأتمتة. قد يكون الخادم مشغولًا أو بطيئًا.";
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        errorMessage = "حدث خطأ في الشبكة أثناء الاتصال بالخادم. تأكد من اتصالك بالإنترنت.";
      } else if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
        errorMessage = "تم منع الطلب بسبب سياسة أمان CORS. تحقق من إعدادات الخادم.";
      }
      
      // إظهار رسالة خطأ
      toast.error(`خطأ في تنفيذ الأتمتة: ${errorMessage}`, {
        duration: 8000,
        description: errorDetails.substring(0, 100)
      });
      
      // بدء إعادة المحاولات التلقائية
      ConnectionManager.startAutoReconnect();
      
      // إرجاع كائن استجابة مع معلومات الخطأ
      return {
        success: false,
        message: errorMessage,
        automationType: config.automationType || 'server',
        details: [
          `نوع الخطأ: ${error instanceof Error ? error.name : 'غير معروف'}`,
          `رسالة الخطأ: ${errorMessage}`,
          `تفاصيل: ${errorDetails.substring(0, 200)}`
        ],
        results: [],
        executionTime: 0,
        timestamp: new Date().toISOString(),
        error: {
          message: errorMessage,
          stack: errorDetails,
          type: error instanceof Error ? error.name : 'Unknown'
        }
      };
    }
  }
  
  /**
   * التحقق من اتصال الخادم قبل تشغيل الأتمتة
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    try {
      // التحقق من حالة الخادم أولاً
      await ConnectionManager.checkServerStatus();
      
      // إذا نجح التحقق، نقوم بتشغيل الأتمتة
      return await this.runAutomation(config);
    } catch (error) {
      console.error("فشل التحقق من الخادم:", error);
      
      // بدء إعادة المحاولات التلقائية
      ConnectionManager.startAutoReconnect();
      
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      
      // إرجاع كائن استجابة مع معلومات الخطأ
      return {
        success: false,
        message: `تعذر الاتصال بخادم الأتمتة: ${errorMessage}`,
        automationType: config.automationType || 'server',
        details: [
          `نوع الخطأ: التحقق من حالة الخادم`,
          `رسالة الخطأ: ${errorMessage}`
        ],
        results: [],
        executionTime: 0,
        timestamp: new Date().toISOString(),
        error: {
          message: `تعذر الاتصال بخادم الأتمتة: ${errorMessage}`,
          type: 'ConnectionError'
        }
      };
    }
  }
}
