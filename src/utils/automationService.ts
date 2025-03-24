
import { AutomationConfig, AutomationResponse, ServerStatusResponse, GoogleSheetsConfig, GoogleSheetsResponse } from "./automation/types";
import { getAutomationServerUrl, createBaseHeaders } from "./automationServerUrl";
import { fetchWithRetry } from "./automation";

/**
 * خدمة الأتمتة
 */
export const AutomationService = {
  /**
   * التحقق والتنفيذ
   */
  validateAndRunAutomation: async (config: AutomationConfig): Promise<AutomationResponse> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/automation/validate-and-execute`, {
        method: 'POST',
        headers: createBaseHeaders(),
        body: JSON.stringify(config),
      });
      return await response.json() as AutomationResponse;
    } catch (error) {
      console.error("Error validating and running automation:", error);
      throw error;
    }
  },

  /**
   * تنفيذ الأتمتة
   */
  executeAutomation: async (config: AutomationConfig): Promise<AutomationResponse> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/automation/execute`, {
        method: 'POST',
        headers: createBaseHeaders(),
        body: JSON.stringify(config),
      });
      return await response.json() as AutomationResponse;
    } catch (error) {
      console.error("Error executing automation:", error);
      throw error;
    }
  },

  /**
   * التحقق من حالة الخادم
   */
  checkServerStatus: async (): Promise<ServerStatusResponse> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/status`, {
        method: 'GET',
        headers: createBaseHeaders(),
      });
      return await response.json() as ServerStatusResponse;
    } catch (error) {
      console.error("Error checking server status:", error);
      throw error;
    }
  },

  /**
   * إجبار إعادة الاتصال
   */
  forceReconnect: async (): Promise<boolean> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/reconnect`, {
        method: 'POST',
        headers: createBaseHeaders(),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error("Error forcing reconnect:", error);
      return false;
    }
  },
  
  /**
   * تبديل وضع التنفيذ الفعلي
   * @param {boolean} enable تفعيل أو تعطيل وضع التنفيذ الفعلي
   */
  toggleRealExecution: (enable: boolean): void => {
    try {
      console.log(`تبديل وضع التنفيذ الفعلي إلى: ${enable}`);
      localStorage.setItem('force_real_execution', enable.toString());
    } catch (error) {
      console.error("خطأ في تعيين وضع التنفيذ الفعلي:", error);
    }
  },

  /**
   * تصدير البيانات إلى Google Sheets
   * @param {any[]} data البيانات المراد تصديرها
   * @param {GoogleSheetsConfig} config إعدادات Google Sheets
   */
  exportToGoogleSheets: async (data: any[], config: GoogleSheetsConfig): Promise<GoogleSheetsResponse> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/googlesheets/export`, {
        method: 'POST',
        headers: createBaseHeaders(),
        body: JSON.stringify({ data, config }),
      });
      return await response.json() as GoogleSheetsResponse;
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error);
      return {
        success: false,
        message: `خطأ في تصدير البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  },

  /**
   * التحقق من صحة بيانات الوصول إلى Google Sheets
   * @param {GoogleSheetsConfig} config إعدادات Google Sheets
   */
  validateGoogleSheetsCredentials: async (config: GoogleSheetsConfig): Promise<boolean> => {
    const serverUrl = getAutomationServerUrl();
    try {
      const response = await fetchWithRetry(`${serverUrl}/api/googlesheets/validate`, {
        method: 'POST',
        headers: createBaseHeaders(),
        body: JSON.stringify(config),
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error("Error validating Google Sheets credentials:", error);
      return false;
    }
  }
};
