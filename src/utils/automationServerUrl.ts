
// استرجاع عنوان URL لخادم الأتمتة
export function getAutomationServerUrl(): string {
  // محاولة استرجاع العنوان من التخزين المحلي
  const savedUrl = localStorage.getItem("automationServerUrl");
  // إرجاع العنوان المخزن أو القيمة الافتراضية
  return savedUrl || "https://automation-server.default.url";
}

// تعيين عنوان URL جديد لخادم الأتمتة
export function setAutomationServerUrl(url: string): boolean {
  try {
    // تخزين العنوان في التخزين المحلي
    localStorage.setItem("automationServerUrl", url);
    return true;
  } catch (error) {
    console.error("فشل في حفظ عنوان خادم الأتمتة:", error);
    return false;
  }
}
