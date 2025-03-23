import { AutomationConfig, AutomationResponse, ServerOptions } from "./automation/types";
import { getAutomationServerUrl } from "./automationServerUrl";
import { fetchWithRetry } from "./automation";

/**
 * فحص حالة خادم الأتمتة
 */
const checkServerStatus = async (): Promise<boolean> => {
  try {
    const serverUrl = getAutomationServerUrl();
    const response = await fetch(`${serverUrl}/api/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': 'web-client'
      },
      mode: 'cors'
    });
    
    return response.ok;
  } catch (error) {
    console.error("فشل في التحقق من حالة الخادم:", error);
    return false;
  }
};

/**
 * محاولة إعادة الاتصال بالخادم
 */
const forceReconnect = async (): Promise<boolean> => {
  try {
    const serverUrl = getAutomationServerUrl();
    const response = await fetch(`${serverUrl}/api/reconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': 'web-client'
      },
      mode: 'cors'
    });
    
    return response.ok;
  } catch (error) {
    console.error("فشل في محاولة إعادة الاتصال:", error);
    return false;
  }
};

/**
 * إرسال طلب تنفيذ الأتمتة إلى الخادم
 * @param config تكوين الأتمتة
 */
const executeAutomation = async (config: AutomationConfig): Promise<AutomationResponse> => {
  try {
    // تعديل الإجراءات لإضافة معلومات XPath
    const enhancedActions = config.actions.map(action => {
      // التحقق مما إذا كان المحدد هو محدد XPath
      const isXPathSelector = action.finder && (
        action.finder.startsWith('//') || 
        action.finder.startsWith('/') || 
        action.finder.includes('@') && action.finder.includes('[') && action.finder.includes(']')
      );
      
      return {
        ...action,
        // إضافة خاصية لتحديد ما إذا كان المحدد هو XPath
        isXPath: isXPathSelector
      };
    });
    
    const serverUrl = getAutomationServerUrl();
    const requestData = {
      ...config,
      actions: enhancedActions,
      timestamp: new Date().toISOString(),
      clientInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    // إعداد خيارات الطلب
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': 'web-client'
      },
      body: JSON.stringify(requestData)
    };
    
    // استخدام وظيفة fetchWithRetry لتجنب أخطاء الشبكة
    const response = await fetchWithRetry(`${serverUrl}/api/automate`, options, 3);
    const result = await response.json();
    
    return result;
  } catch (error) {
    // تحسين معالجة الأخطاء
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'حدث خطأ غير معروف';
    
    // التحقق مما إذا كان الخطأ متعلقًا بالشبكة
    const isNetworkError = 
      errorMessage.includes('fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('CORS');
    
    console.error('خطأ في تنفيذ الأتمتة:', error);
    
    return {
      success: false,
      message: isNetworkError 
        ? 'تعذر الاتصال بخادم الأتمتة. تحقق من اتصالك بالإنترنت وتأكد من أن الخادم متاح.' 
        : `فشل تنفيذ الأتمتة: ${errorMessage}`,
      automationType: 'server',
      error: {
        message: errorMessage,
        type: isNetworkError ? 'NetworkError' : 'ExecutionError',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * التحقق من تكوين الأتمتة وتنفيذها
 * @param config تكوين الأتمتة
 */
const validateAndRunAutomation = async (config: AutomationConfig): Promise<AutomationResponse> => {
  try {
    // التحقق من وجود المعلومات الأساسية
    if (!config.projectUrl) {
      throw new Error('يجب توفير عنوان URL للمشروع');
    }
    
    if (!config.actions || config.actions.length === 0) {
      throw new Error('يجب توفير إجراء واحد على الأقل');
    }
    
    // التحقق من صحة URL
    if (!config.projectUrl.startsWith('http://') && !config.projectUrl.startsWith('https://')) {
      config.projectUrl = `https://${config.projectUrl}`;
    }
    
    // تحسين تكوين الأتمتة
    const enhancedConfig: AutomationConfig = {
      ...config,
      automationType: config.automationType || 'server',
      useBrowserData: config.useBrowserData !== undefined ? config.useBrowserData : true,
      forceRealExecution: config.forceRealExecution !== undefined ? config.forceRealExecution : true
    };
    
    // تعزيز خيارات الخادم
    const serverOptions: ServerOptions = {
      timeout: 60000, // زيادة المهلة إلى 60 ثانية
      navigationTimeout: 30000,
      retries: config.forceRealExecution ? 2 : 0,
      useCache: false,
      disableCors: true,
      supportXPath: true // إضافة دعم XPath
    };
    
    console.log('تنفيذ الأتمتة مع الإعدادات:', enhancedConfig);
    console.log('خيارات الخادم:', serverOptions);
    
    // تنفيذ الأتمتة على الخادم
    return await executeAutomation(enhancedConfig);
  } catch (error) {
    console.error('خطأ في التحقق من تكوين الأتمتة:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'حدث خطأ غير معروف';
    
    return {
      success: false,
      message: `فشل في التحقق من تكوين الأتمتة: ${errorMessage}`,
      automationType: 'server',
      error: {
        message: errorMessage,
        type: 'ValidationError',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    };
  }
};

// تصدير الوظائف العامة
export const AutomationService = {
  validateAndRunAutomation,
  executeAutomation,
  checkServerStatus,
  forceReconnect,
};
