
// وظائف مساعدة للأتمتة

// التحقق مما إذا كان يجب استخدام بيانات المتصفح في الأتمتة
export function shouldUseBrowserData(): boolean {
  const savedSetting = localStorage.getItem("useBrowserDataForAutomation");
  return savedSetting === "true";
}

// تعيين إعداد استخدام بيانات المتصفح
export function setUseBrowserData(value: boolean): boolean {
  try {
    localStorage.setItem("useBrowserDataForAutomation", String(value));
    return true;
  } catch (error) {
    console.error("فشل في حفظ إعداد استخدام بيانات المتصفح:", error);
    return false;
  }
}

// الحصول على معرف الجلسة الحالية
export function getCurrentSessionId(): string | null {
  return localStorage.getItem("automationSessionId");
}

// تعيين معرف جلسة جديد
export function setCurrentSessionId(sessionId: string): void {
  localStorage.setItem("automationSessionId", sessionId);
}
