
/**
 * خدمة الأتمتة للتواصل مع خادم الأتمتة
 */

import { getAutomationServerUrl } from './automationServerUrl';

export interface AutomationConfig {
  projectName: string;
  projectUrl: string;
  actions: AutomationAction[];
  automationType: 'server' | 'client';
  useBrowserData: boolean;
  forceRealExecution?: boolean;
}

export interface AutomationAction {
  name: string;
  finder: string;
  value: string;
  delay: number;
}

export interface AutomationResult {
  success: boolean;
  message?: string;
  details?: string[];
}

export const AutomationService = {
  /**
   * التحقق من حالة الخادم
   */
  async checkServerStatus(showNotification = true): Promise<boolean> {
    try {
      const serverUrl = getAutomationServerUrl();
      if (!serverUrl) {
        console.error("عنوان URL لخادم الأتمتة غير محدد");
        return false;
      }

      const response = await fetch(`${serverUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`فشل الاتصال بالخادم: ${response.statusText}`);
      }

      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error("خطأ في فحص حالة الخادم:", error);
      return false;
    }
  },

  /**
   * إجبار إعادة الاتصال بالخادم
   */
  async forceReconnect(): Promise<boolean> {
    return this.checkServerStatus(true);
  },

  /**
   * تبديل وضع التنفيذ الفعلي
   */
  toggleRealExecution(enabled: boolean): boolean {
    localStorage.setItem('automation_real_execution', enabled ? 'true' : 'false');
    return enabled;
  },

  /**
   * التحقق من صلاحية التكوين وتشغيل الأتمتة
   */
  async validateAndRunAutomation(config: AutomationConfig): Promise<AutomationResult> {
    try {
      if (!config.projectUrl) {
        return {
          success: false,
          message: "عنوان URL للمشروع مطلوب"
        };
      }

      if (!config.actions || config.actions.length === 0) {
        return {
          success: false,
          message: "مطلوب إجراء واحد على الأقل"
        };
      }

      // محاولة تنفيذ الأتمتة باستخدام الخادم الفعلي
      const serverUrl = getAutomationServerUrl();
      if (!serverUrl) {
        return {
          success: false,
          message: "عنوان URL لخادم الأتمتة غير محدد"
        };
      }

      const response = await fetch(`${serverUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل تنفيذ الأتمتة: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: "تم تنفيذ الأتمتة بنجاح",
        details: result.details || []
      };
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        details: []
      };
    }
  }
};
