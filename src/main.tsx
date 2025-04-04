
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// مدير الأخطاء العام
window.addEventListener("error", (event) => {
  console.error("خطأ غير معالج:", event.error || event.message);
  
  // إضافة المزيد من المعلومات للتشخيص
  if (event.error) {
    console.error("معلومات الخطأ:", {
      name: event.error.name,
      message: event.error.message,
      stack: event.error.stack,
    });
  }
});

// منع الأخطاء في الوعود غير المعالجة من إيقاف التطبيق
window.addEventListener("unhandledrejection", (event) => {
  console.error("وعد غير معالج:", event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("عنصر الجذر غير موجود");
  }
  
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("خطأ في تحميل التطبيق:", error);
  
  // إظهار رسالة خطأ للمستخدم
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; padding: 20px; text-align: center;">
        <h1 style="color: #e11d48;">حدث خطأ أثناء تحميل التطبيق</h1>
        <p style="margin-bottom: 20px;">يرجى تحديث الصفحة وإعادة المحاولة.</p>
        <button onclick="window.location.reload()" style="background-color: #0ea5e9; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          إعادة تحميل الصفحة
        </button>
      </div>
    `;
  }
}
