
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx'

// إضافة كود لتحسين أداء الصفحة
function reportWebVitals(metric: any) {
  // قياس الأداء الحيوي للصفحة وتسجيله
  console.debug('Web Vitals:', metric);
  
  // يمكنك إرسال بيانات قياس الأداء إلى خدمة تحليلات
  // sendToAnalytics(metric);
}

function EnableOptimizations() {
  // تمكين التحميل الكسول للصور
  if ('loading' in HTMLImageElement.prototype) {
    console.log('متصفحك يدعم تحميل الصور الكسول بشكل أصلي');
  } else {
    console.log('تحميل مكتبة احتياطية للتحميل الكسول');
    import('lazysizes').then(lazySizes => {
      console.log('تم تحميل lazysizes');
    });
  }
  
  // تمكين التخزين المؤقت للطلبات
  if ('caches' in window) {
    console.log('API تخزين مؤقت متاح');
  }
  
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex items-center justify-center h-screen">جاري تحميل التطبيق...</div>}>
      <BrowserRouter>
        <EnableOptimizations />
        <App />
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
)

// قياس الأداء الحيوي
// نستخدم استيراد ديناميكي مؤجل لمكتبة web-vitals
// حتى لا يؤثر على أداء التحميل الأولي للتطبيق
if (typeof window !== 'undefined') {
  import('web-vitals')
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals);
      getFID(reportWebVitals);
      getFCP(reportWebVitals);
      getLCP(reportWebVitals);
      getTTFB(reportWebVitals);
    })
    .catch(error => {
      console.warn('فشل تحميل مكتبة web-vitals:', error);
    });
}
