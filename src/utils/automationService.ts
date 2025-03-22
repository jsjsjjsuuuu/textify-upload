
/**
 * خدمة الأتمتة - تقوم بالاتصال بخادم الأتمتة وإرسال طلبات الأتمتة
 */

import { AutomationConfig, AutomationResponse, ErrorType } from "./automation/types";
import { getAutomationServerUrl, updateConnectionStatus } from "./automationServerUrl";
import { toast } from "sonner";

export class AutomationService {
  // سجل حالة التنفيذ الفعلي
  private static _useRealExecution: boolean = true;

  /**
   * تبديل وضع التنفيذ الفعلي
   */
  static toggleRealExecution(value: boolean): void {
    this._useRealExecution = value;
    localStorage.setItem('useRealExecution', value ? 'true' : 'false');
    console.log(`تم تبديل وضع التنفيذ الفعلي إلى: ${value ? 'مفعل' : 'معطل'}`);
  }

  /**
   * التحقق مما إذا كان وضع التنفيذ الفعلي مفعلاً
   */
  static isRealExecutionEnabled(): boolean {
    // استرجاع القيمة من التخزين المحلي أو استخدام القيمة الافتراضية
    const storedValue = localStorage.getItem('useRealExecution');
    return storedValue !== null ? storedValue === 'true' : this._useRealExecution;
  }

  /**
   * إعادة الاتصال بالخادم بقوة وتحديث حالة الاتصال
   */
  static async forceReconnect(): Promise<boolean> {
    try {
      // فحص حالة الخادم
      const data = await this.checkServerStatus(false);
      if (data && data.status === 'ok') {
        updateConnectionStatus(true);
        return true;
      }
      updateConnectionStatus(false);
      return false;
    } catch (error) {
      console.error('خطأ في إعادة الاتصال بالخادم:', error);
      updateConnectionStatus(false);
      return false;
    }
  }

  /**
   * التحقق من حالة خادم الأتمتة
   */
  static async checkServerStatus(showToasts = true): Promise<any> {
    try {
      const serverUrl = getAutomationServerUrl();
      console.log('التحقق من حالة الخادم:', serverUrl);
      
      const response = await fetch(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
        },
        cache: 'no-store',
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('استجابة الخادم:', data);
          
          if (showToasts) {
            toast.success('خادم الأتمتة متصل ويعمل بشكل جيد');
          }
          
          return data;
        } catch (error) {
          console.error('خطأ في تحليل استجابة الخادم:', error);
          throw new Error('استجابة الخادم غير صالحة');
        }
      } else {
        // استرجاع النص الأصلي للخطأ
        const errorText = await response.text();
        console.error('خطأ في حالة الخادم:', response.status, errorText);
        
        if (showToasts) {
          toast.error(`فشل التحقق من حالة الخادم: ${response.status}`);
        }
        
        throw new Error(`خطأ في حالة الخادم: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('خطأ في التحقق من حالة الخادم:', error);
      
      if (showToasts) {
        toast.error(`فشل التحقق من حالة الخادم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
      
      throw error;
    }
  }
  
  /**
   * التحقق من صحة الأتمتة وتنفيذها
   */
  static async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResponse> {
    // التحقق من صحة التكوين
    if (!config.projectUrl) {
      return {
        success: false,
        message: 'يجب تحديد رابط المشروع',
        automationType: config.automationType || 'server',
        error: {
          type: ErrorType.ValidationError,
          message: 'يجب تحديد رابط المشروع',
        }
      };
    }
    
    if (!config.actions || config.actions.length === 0) {
      return {
        success: false,
        message: 'يجب تحديد إجراء واحد على الأقل',
        automationType: config.automationType || 'server',
        error: {
          type: ErrorType.ValidationError,
          message: 'يجب تحديد إجراء واحد على الأقل',
        }
      };
    }
    
    try {
      const serverUrl = getAutomationServerUrl();
      console.log(`🚀 بدء تنفيذ الأتمتة على ${serverUrl}/api/automation/execute`);
      
      // تنفيذ الأتمتة
      const startTime = Date.now();
      
      // إضافة معلومات إضافية للتشخيص
      const enhancedConfig = {
        ...config,
        clientInfo: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          origin: window.location.origin,
          clientId: 'web-client-' + Date.now(),
          version: '1.1.0'
        },
        debug: true
      };
      
      console.log('🔧 تكوين الأتمتة:', JSON.stringify(enhancedConfig, null, 2));
      
      // تعديل هنا: نستخدم نقطة النهاية /api/automation/execute بشكل متسق
      const apiUrl = `${serverUrl}/api/automation/execute`;
      console.log(`📡 إرسال طلب إلى: ${apiUrl}`);
      
      // إجراء فحص مسبق للاتصال باستخدام GET بدلاً من HEAD
      const pingResponse = await fetch(`${serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!pingResponse.ok) {
        console.error('❌ فشل فحص الاتصال بالخادم قبل إرسال الأتمتة');
        return {
          success: false,
          message: 'فشل الاتصال بخادم الأتمتة. تأكد من إعدادات الخادم.',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          automationType: config.automationType || 'server',
          error: {
            type: ErrorType.NetworkError,
            message: 'تعذر الاتصال بخادم الأتمتة',
          }
        };
      }
      
      // استخدام معلمات متعددة لتفادي مشاكل الذاكرة المخبأة
      const response = await fetch(apiUrl + `?t=${Date.now()}&clientId=web-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'X-Request-Time': Date.now().toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Accept': '*/*',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(enhancedConfig),
      });
      
      console.log(`⏱️ وقت الاستجابة: ${Date.now() - startTime}ms`);
      console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);
      
      // التحقق من نوع المحتوى للمساعدة في التشخيص
      const contentType = response.headers.get('content-type');
      console.log(`🔍 نوع المحتوى: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        // استخراج النص كاملاً للتشخيص
        const textResponse = await response.text();
        console.error('❌ استجابة غير صالحة (ليست JSON):', textResponse);
        
        // تحقق إذا كانت الاستجابة هي HTML (خطأ في البرنامج الوسيط)
        if (textResponse.includes('<!DOCTYPE html>') || textResponse.includes('<html>')) {
          return {
            success: false,
            message: 'نقطة النهاية API غير موجودة، تأكد من تكوين خادم الأتمتة بشكل صحيح. يرجى استخدام نقطة نهاية API أخرى مثل: /api/automation/execute',
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            automationType: config.automationType || 'server',
            error: {
              type: ErrorType.EndpointNotFoundError,
              message: 'استجابة HTML بدلاً من JSON، مما يشير إلى أن نقطة النهاية API غير موجودة',
              additionalInfo: textResponse.substring(0, 200) + '...'
            }
          };
        }
        
        return {
          success: false,
          message: 'استجابة خادم الأتمتة غير صالحة، يرجى التحقق من سجلات الأخطاء',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          automationType: config.automationType || 'server',
          error: {
            type: ErrorType.ServerError,
            message: 'استجابة غير صالحة من الخادم',
            additionalInfo: textResponse.substring(0, 500)
          }
        };
      }
      
      // محاولة تحليل JSON
      try {
        const data = await response.json();
        console.log('📦 بيانات الاستجابة:', data);
        
        // إضافة وقت التنفيذ والطابع الزمني إذا لم يكن موجوداً
        const result: AutomationResponse = {
          ...data,
          executionTime: data.executionTime || (Date.now() - startTime),
          timestamp: data.timestamp || new Date().toISOString(),
          automationType: data.automationType || config.automationType || 'server'
        };
        
        return result;
      } catch (error) {
        console.error('❌ خطأ في تحليل استجابة JSON:', error);
        return {
          success: false,
          message: 'فشل في تحليل استجابة الخادم',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          automationType: config.automationType || 'server',
          error: {
            type: ErrorType.ServerError,
            message: 'استجابة JSON غير صالحة',
          }
        };
      }
    } catch (error) {
      console.error('❌ خطأ في تنفيذ الأتمتة:', error);
      
      // تحديد نوع الخطأ للمساعدة في التشخيص
      let errorType = ErrorType.ServerError;
      let errorMessage = 'خطأ غير معروف أثناء تنفيذ الأتمتة';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorType = ErrorType.NetworkError;
        errorMessage = 'خطأ في الشبكة: تعذر الاتصال بخادم الأتمتة';
      } else if (error instanceof TypeError && error.message.includes('JSON')) {
        errorType = ErrorType.ServerError;
        errorMessage = 'استجابة غير صالحة من الخادم';
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        errorType = ErrorType.TimeoutError;
        errorMessage = 'انتهت مهلة تنفيذ الأتمتة';
      }
      
      return {
        success: false,
        message: errorMessage,
        executionTime: 0,
        timestamp: new Date().toISOString(),
        automationType: (config && config.automationType) || 'server',
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : 'خطأ غير معروف',
        }
      };
    }
  }
  
  /**
   * تحويل البيانات إلى JSON
   */
  private static async parseJsonResponse(response: Response): Promise<any> {
    try {
      const text = await response.text();
      
      // فحص إذا كان النص فارغًا
      if (!text || text.trim() === '') {
        return null;
      }
      
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('❌ خطأ في تحليل JSON:', error, 'النص:', text);
        
        // إذا كان النص يحتوي على HTML، فمن المحتمل أنه صفحة خطأ
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          throw new Error('استجابة HTML بدلاً من JSON. نقطة النهاية API قد تكون غير صحيحة.');
        }
        
        throw new Error(`فشل تحليل استجابة JSON: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('❌ خطأ في قراءة نص الاستجابة:', error);
      throw error;
    }
  }
}
