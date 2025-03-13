
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { ImageData } from "@/types/ImageData";

export const useBookmarkletGenerator = () => {
  const { toast } = useToast();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookmarkletCode, setBookmarkletCode] = useState<string>("");
  const [intermediateHtml, setIntermediateHtml] = useState<string>("");

  useEffect(() => {
    if (!imageData) return;
    
    setIsGenerating(true);
    
    try {
      // بناء سكريبت الإدخال التلقائي
      const autofillScript = buildAutofillScript(imageData);
      
      // إنشاء رمز الـ bookmarklet
      const bookmarklet = generateBookmarkletCode(autofillScript, imageData);
      setBookmarkletCode(bookmarklet);
      
      // إنشاء صفحة وسيطة لتنفيذ السكريبت (تحل مشكلة المواقع التي ترفض السكريبت)
      const html = generateIntermediatePageHtml(imageData);
      setIntermediateHtml(html);
      
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating bookmarklet:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الـ Bookmarklet",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  }, [imageData, toast]);

  // دالة لبناء سكريبت الإدخال التلقائي
  const buildAutofillScript = (data: ImageData): string => {
    return `
      (function() {
        try {
          // تهيئة البيانات
          var currentData = {
            companyName: ${JSON.stringify(data.companyName || "")},
            code: ${JSON.stringify(data.code || "")},
            senderName: ${JSON.stringify(data.senderName || "")},
            phoneNumber: ${JSON.stringify(data.phoneNumber || "")},
            province: ${JSON.stringify(data.province || "")},
            price: ${JSON.stringify(data.price || "")}
          };
          
          console.log("بيانات الإدخال التلقائي:", currentData);
          
          // ترقب المستندات التي تُحمّل في إطارات iframe
          function monitorFrames() {
            try {
              // البحث عن حقول الإدخال في المستند الحالي
              autofillForm(document);
              
              // البحث في كل إطارات الصفحة
              var frames = document.querySelectorAll('iframe');
              for (var i = 0; i < frames.length; i++) {
                try {
                  var frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
                  if (frameDoc) {
                    autofillForm(frameDoc);
                  }
                } catch (e) {
                  console.log("لا يمكن الوصول إلى إطار محمي:", e);
                }
              }
            } catch (e) {
              console.error("خطأ في مراقبة الإطارات:", e);
            }
          }
          
          // وظيفة ملء النموذج
          function autofillForm(doc) {
            var filled = false;
            
            // وظيفة البحث عن وملء الحقول
            function fillFields(selectors, value) {
              if (!value) return false;
              
              var fieldFilled = false;
              selectors.forEach(function(selector) {
                var fields = doc.querySelectorAll(selector);
                for (var i = 0; i < fields.length; i++) {
                  var field = fields[i];
                  if (field && !field.disabled && !field.readOnly && field.value === "") {
                    field.value = value;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    fieldFilled = true;
                    filled = true;
                    console.log("تم ملء الحقل:", selector, "بالقيمة:", value);
                  }
                }
              });
              return fieldFilled;
            }
            
            // محاولة ملء حقول مختلفة بناءً على أنماط متوقعة
            
            // حقول اسم الشركة
            fillFields([
              'input[name*="company"], input[name*="Company"]',
              'input[name*="شركة"], input[name*="الشركة"]',
              'input[id*="company"], input[id*="Company"]',
              'input[placeholder*="company"], input[placeholder*="Company"]',
              'input[placeholder*="شركة"], input[placeholder*="الشركة"]',
              'input[name*="store"], input[name*="Store"]',
              'input[name*="vendor"], input[name*="Vendor"]'
            ], currentData.companyName);
            
            // حقول الكود
            fillFields([
              'input[name*="code"], input[name*="Code"]',
              'input[name*="كود"], input[name*="الكود"]',
              'input[id*="code"], input[id*="Code"]',
              'input[name*="reference"], input[name*="Reference"]',
              'input[name*="order"], input[name*="Order"]',
              'input[placeholder*="code"], input[placeholder*="Code"]',
              'input[placeholder*="كود"], input[placeholder*="الكود"]',
              'input[type="number"]'
            ], currentData.code);
            
            // حقول اسم المرسل
            fillFields([
              'input[name*="name"], input[name*="Name"]',
              'input[name*="sender"], input[name*="Sender"]',
              'input[name*="اسم"], input[name*="المرسل"]',
              'input[id*="name"], input[id*="Name"]',
              'input[placeholder*="name"], input[placeholder*="Name"]',
              'input[placeholder*="اسم"], input[placeholder*="المرسل"]',
              'input[name*="customer"], input[name*="Customer"]'
            ], currentData.senderName);
            
            // حقول رقم الهاتف
            fillFields([
              'input[name*="phone"], input[name*="Phone"]',
              'input[name*="mobile"], input[name*="Mobile"]',
              'input[name*="هاتف"], input[name*="الهاتف"]',
              'input[name*="موبايل"], input[name*="الموبايل"]',
              'input[name*="جوال"], input[name*="الجوال"]',
              'input[id*="phone"], input[id*="Phone"]',
              'input[id*="mobile"], input[id*="Mobile"]',
              'input[placeholder*="phone"], input[placeholder*="Phone"]',
              'input[placeholder*="هاتف"], input[placeholder*="الهاتف"]',
              'input[placeholder*="موبايل"], input[placeholder*="الموبايل"]',
              'input[placeholder*="جوال"], input[placeholder*="الجوال"]',
              'input[type="tel"]'
            ], currentData.phoneNumber);
            
            // حقول المحافظة
            fillFields([
              'input[name*="province"], input[name*="Province"]',
              'input[name*="city"], input[name*="City"]',
              'input[name*="محافظة"], input[name*="المحافظة"]',
              'input[name*="مدينة"], input[name*="المدينة"]',
              'input[id*="province"], input[id*="Province"]',
              'input[id*="city"], input[id*="City"]',
              'input[placeholder*="province"], input[placeholder*="Province"]',
              'input[placeholder*="city"], input[placeholder*="City"]',
              'input[placeholder*="محافظة"], input[placeholder*="المحافظة"]',
              'input[placeholder*="مدينة"], input[placeholder*="المدينة"]',
              'select[name*="province"], select[name*="Province"]',
              'select[name*="city"], select[name*="City"]',
              'select[name*="محافظة"], select[name*="المحافظة"]',
              'select[name*="مدينة"], select[name*="المدينة"]'
            ], currentData.province);
            
            // حقول السعر
            fillFields([
              'input[name*="price"], input[name*="Price"]',
              'input[name*="cost"], input[name*="Cost"]',
              'input[name*="amount"], input[name*="Amount"]',
              'input[name*="سعر"], input[name*="السعر"]',
              'input[name*="تكلفة"], input[name*="التكلفة"]',
              'input[name*="مبلغ"], input[name*="المبلغ"]',
              'input[id*="price"], input[id*="Price"]',
              'input[id*="cost"], input[id*="Cost"]',
              'input[placeholder*="price"], input[placeholder*="Price"]',
              'input[placeholder*="cost"], input[placeholder*="Cost"]',
              'input[placeholder*="سعر"], input[placeholder*="السعر"]',
              'input[placeholder*="تكلفة"], input[placeholder*="التكلفة"]',
              'input[placeholder*="مبلغ"], input[placeholder*="المبلغ"]'
            ], currentData.price);
            
            // البحث عن القوائم المنسدلة وتحديد الخيار المطابق للمحافظة
            if (currentData.province) {
              var selects = doc.querySelectorAll('select');
              for (var i = 0; i < selects.length; i++) {
                var select = selects[i];
                var options = select.querySelectorAll('option');
                for (var j = 0; j < options.length; j++) {
                  var option = options[j];
                  var text = option.textContent || option.innerText;
                  if (text && text.indexOf(currentData.province) !== -1) {
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    filled = true;
                    console.log("تم اختيار المحافظة من القائمة المنسدلة:", text);
                    break;
                  }
                }
              }
            }
            
            return filled;
          }
          
          // تشغيل وظيفة ملء النموذج
          var filled = false;
          
          // المحاولة الأولى
          filled = monitorFrames();
          
          // في حال لم يتم العثور على الحقول، إضافة مراقب لتغييرات الـ DOM
          if (!filled) {
            var observer = new MutationObserver(function(mutations) {
              monitorFrames();
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // إيقاف المراقب بعد 10 ثوانٍ
            setTimeout(function() {
              observer.disconnect();
            }, 10000);
          }
          
          // إظهار رسالة للمستخدم
          var notification = document.createElement('div');
          notification.style.position = 'fixed';
          notification.style.top = '10px';
          notification.style.right = '10px';
          notification.style.zIndex = '9999';
          notification.style.backgroundColor = 'rgba(0, 150, 0, 0.8)';
          notification.style.color = 'white';
          notification.style.padding = '10px 15px';
          notification.style.borderRadius = '5px';
          notification.style.fontSize = '14px';
          notification.style.fontFamily = 'Arial, sans-serif';
          notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
          notification.style.direction = 'rtl';
          notification.textContent = 'تمت محاولة ملء النموذج تلقائيًا';
          
          document.body.appendChild(notification);
          
          // إزالة الإشعار بعد 5 ثوانٍ
          setTimeout(function() {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(function() {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 500);
          }, 5000);
          
          return "تمت محاولة ملء النموذج بنجاح";
        } catch (error) {
          console.error("خطأ في سكريبت الإدخال التلقائي:", error);
          alert("حدث خطأ أثناء محاولة ملء النموذج: " + error.message);
          return "حدث خطأ: " + error.message;
        }
      })();
    `;
  };

  // دالة لإنشاء رمز الـ bookmarklet
  const generateBookmarkletCode = (script: string, data: ImageData): string => {
    // إنشاء نسخة مبسطة من البيانات
    const dataString = JSON.stringify({
      companyName: data.companyName || "",
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || ""
    });
    
    // دمج البيانات والسكريبت معًا
    const fullScript = `
      var currentData = ${dataString};
      ${script}
    `;
    
    // تشفير السكريبت لاستخدامه في الـ bookmarklet
    const encoded = encodeURIComponent(fullScript);
    return `javascript:(function(){${encoded}})();`;
  };

  // دالة لإنشاء صفحة وسيطة لتنفيذ السكريبت
  const generateIntermediatePageHtml = (data: ImageData): string => {
    // استخراج المعرّف
    const imageId = data.id;
    
    // إنشاء الـ HTML للصفحة الوسيطة
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>جاري تنفيذ الإدخال التلقائي</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
            direction: rtl;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            width: 90%;
            max-width: 500px;
            margin-bottom: 20px;
          }
          h1 {
            color: #057a55;
            margin-top: 0;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #057a55;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          .message {
            margin: 20px 0;
            padding: 10px;
            border-radius: 5px;
          }
          .success {
            background-color: #d1fae5;
            color: #047857;
          }
          .error {
            background-color: #fee2e2;
            color: #b91c1c;
          }
          .button {
            background-color: #059669;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #047857;
          }
          .button.secondary {
            background-color: #6b7280;
          }
          .button.secondary:hover {
            background-color: #4b5563;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .data-field {
            margin: 10px 0;
            text-align: right;
          }
          .data-field strong {
            color: #059669;
          }
          #statusMessage {
            font-weight: bold;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>جاري تنفيذ الإدخال التلقائي</h1>
          <div class="spinner" id="spinner"></div>
          <p>سيتم فتح الصفحة المستهدفة وإدخال البيانات تلقائياً خلال لحظات.</p>
          <p>لا تغلق هذه النافذة حتى تكتمل العملية.</p>
          
          <div id="statusMessage"></div>
          
          <div class="data-preview" style="display: none;">
            <h3>البيانات التي سيتم إدخالها:</h3>
            <div class="data-field"><strong>اسم الشركة:</strong> <span id="companyNamePreview"></span></div>
            <div class="data-field"><strong>الكود:</strong> <span id="codePreview"></span></div>
            <div class="data-field"><strong>اسم المرسل:</strong> <span id="senderNamePreview"></span></div>
            <div class="data-field"><strong>رقم الهاتف:</strong> <span id="phoneNumberPreview"></span></div>
            <div class="data-field"><strong>المحافظة:</strong> <span id="provincePreview"></span></div>
            <div class="data-field"><strong>السعر:</strong> <span id="pricePreview"></span></div>
          </div>
          
          <div style="margin-top: 20px;">
            <button id="executeButton" class="button">تنفيذ مباشرة</button>
            <button id="closeButton" class="button secondary">إغلاق</button>
          </div>
        </div>
        
        <script>
          // متغير عام للبيانات
          var currentData = null;
          var imageId = "${imageId}";
          var autofillScript = null;
          
          // طلب البيانات من النافذة الأصلية
          window.addEventListener('DOMContentLoaded', function() {
            document.getElementById('statusMessage').textContent = "جاري جلب البيانات...";
            
            // إرسال رسالة للنافذة الأم لطلب البيانات
            window.opener.postMessage({
              type: 'autofill-data-request',
              imageId: imageId
            }, '*');
            
            // تحديث حالة النافذة بعد ثانيتين إذا لم تصل البيانات
            setTimeout(function() {
              if (!currentData) {
                document.getElementById('statusMessage').textContent = "في انتظار البيانات... (إذا استمر هذا لأكثر من 5 ثوانٍ، أغلق النافذة وحاول مرة أخرى)";
              }
            }, 2000);
            
            // تحديث حالة النافذة بعد 10 ثوانٍ إذا لم تصل البيانات
            setTimeout(function() {
              if (!currentData) {
                document.getElementById('statusMessage').innerHTML = "<span style='color: red;'>تعذر الحصول على البيانات. الرجاء إغلاق النافذة والمحاولة مرة أخرى.</span>";
                document.getElementById('spinner').style.display = "none";
              }
            }, 10000);
          });
          
          // استقبال البيانات من النافذة الأصلية
          window.addEventListener('message', function(event) {
            console.log("رسالة مستلمة:", event.data);
            
            if (event.data && event.data.type === 'autofill-data-response') {
              currentData = event.data.data;
              document.getElementById('statusMessage').textContent = "تم استلام البيانات بنجاح. انقر على 'تنفيذ مباشرة' للمتابعة.";
              document.getElementById('spinner').style.display = "none";
              
              // عرض البيانات في الصفحة
              document.querySelector('.data-preview').style.display = "block";
              document.getElementById('companyNamePreview').textContent = currentData.companyName || "-";
              document.getElementById('codePreview').textContent = currentData.code || "-";
              document.getElementById('senderNamePreview').textContent = currentData.senderName || "-";
              document.getElementById('phoneNumberPreview').textContent = currentData.phoneNumber || "-";
              document.getElementById('provincePreview').textContent = currentData.province || "-";
              document.getElementById('pricePreview').textContent = currentData.price || "-";
              
              // إنشاء سكريبت الإدخال التلقائي
              buildAutofillScript();
            }
          });
          
          // بناء سكريبت الإدخال التلقائي
          function buildAutofillScript() {
            if (!currentData) return null;
            
            autofillScript = \`
              (function() {
                try {
                  // تهيئة البيانات
                  var currentData = {
                    companyName: \${JSON.stringify(currentData.companyName || "")},
                    code: \${JSON.stringify(currentData.code || "")},
                    senderName: \${JSON.stringify(currentData.senderName || "")},
                    phoneNumber: \${JSON.stringify(currentData.phoneNumber || "")},
                    province: \${JSON.stringify(currentData.province || "")},
                    price: \${JSON.stringify(currentData.price || "")}
                  };
                  
                  console.log("بيانات الإدخال التلقائي:", currentData);
                  
                  // ترقب المستندات التي تُحمّل في إطارات iframe
                  function monitorFrames() {
                    try {
                      // البحث عن حقول الإدخال في المستند الحالي
                      autofillForm(document);
                      
                      // البحث في كل إطارات الصفحة
                      var frames = document.querySelectorAll('iframe');
                      for (var i = 0; i < frames.length; i++) {
                        try {
                          var frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
                          if (frameDoc) {
                            autofillForm(frameDoc);
                          }
                        } catch (e) {
                          console.log("لا يمكن الوصول إلى إطار محمي:", e);
                        }
                      }
                    } catch (e) {
                      console.error("خطأ في مراقبة الإطارات:", e);
                    }
                  }
                  
                  // وظيفة ملء النموذج
                  function autofillForm(doc) {
                    var filled = false;
                    
                    // وظيفة البحث عن وملء الحقول
                    function fillFields(selectors, value) {
                      if (!value) return false;
                      
                      var fieldFilled = false;
                      selectors.forEach(function(selector) {
                        var fields = doc.querySelectorAll(selector);
                        for (var i = 0; i < fields.length; i++) {
                          var field = fields[i];
                          if (field && !field.disabled && !field.readOnly && field.value === "") {
                            field.value = value;
                            field.dispatchEvent(new Event('input', { bubbles: true }));
                            field.dispatchEvent(new Event('change', { bubbles: true }));
                            fieldFilled = true;
                            filled = true;
                            console.log("تم ملء الحقل:", selector, "بالقيمة:", value);
                          }
                        }
                      });
                      return fieldFilled;
                    }
                    
                    // محاولة ملء حقول مختلفة بناءً على أنماط متوقعة
                    
                    // حقول اسم الشركة
                    fillFields([
                      'input[name*="company"], input[name*="Company"]',
                      'input[name*="شركة"], input[name*="الشركة"]',
                      'input[id*="company"], input[id*="Company"]',
                      'input[placeholder*="company"], input[placeholder*="Company"]',
                      'input[placeholder*="شركة"], input[placeholder*="الشركة"]',
                      'input[name*="store"], input[name*="Store"]',
                      'input[name*="vendor"], input[name*="Vendor"]'
                    ], currentData.companyName);
                    
                    // حقول الكود
                    fillFields([
                      'input[name*="code"], input[name*="Code"]',
                      'input[name*="كود"], input[name*="الكود"]',
                      'input[id*="code"], input[id*="Code"]',
                      'input[name*="reference"], input[name*="Reference"]',
                      'input[name*="order"], input[name*="Order"]',
                      'input[placeholder*="code"], input[placeholder*="Code"]',
                      'input[placeholder*="كود"], input[placeholder*="الكود"]',
                      'input[type="number"]'
                    ], currentData.code);
                    
                    // حقول اسم المرسل
                    fillFields([
                      'input[name*="name"], input[name*="Name"]',
                      'input[name*="sender"], input[name*="Sender"]',
                      'input[name*="اسم"], input[name*="المرسل"]',
                      'input[id*="name"], input[id*="Name"]',
                      'input[placeholder*="name"], input[placeholder*="Name"]',
                      'input[placeholder*="اسم"], input[placeholder*="المرسل"]',
                      'input[name*="customer"], input[name*="Customer"]'
                    ], currentData.senderName);
                    
                    // حقول رقم الهاتف
                    fillFields([
                      'input[name*="phone"], input[name*="Phone"]',
                      'input[name*="mobile"], input[name*="Mobile"]',
                      'input[name*="هاتف"], input[name*="الهاتف"]',
                      'input[name*="موبايل"], input[name*="الموبايل"]',
                      'input[name*="جوال"], input[name*="الجوال"]',
                      'input[id*="phone"], input[id*="Phone"]',
                      'input[id*="mobile"], input[id*="Mobile"]',
                      'input[placeholder*="phone"], input[placeholder*="Phone"]',
                      'input[placeholder*="هاتف"], input[placeholder*="الهاتف"]',
                      'input[placeholder*="موبايل"], input[placeholder*="الموبايل"]',
                      'input[placeholder*="جوال"], input[placeholder*="الجوال"]',
                      'input[type="tel"]'
                    ], currentData.phoneNumber);
                    
                    // حقول المحافظة
                    fillFields([
                      'input[name*="province"], input[name*="Province"]',
                      'input[name*="city"], input[name*="City"]',
                      'input[name*="محافظة"], input[name*="المحافظة"]',
                      'input[name*="مدينة"], input[name*="المدينة"]',
                      'input[id*="province"], input[id*="Province"]',
                      'input[id*="city"], input[id*="City"]',
                      'input[placeholder*="province"], input[placeholder*="Province"]',
                      'input[placeholder*="city"], input[placeholder*="City"]',
                      'input[placeholder*="محافظة"], input[placeholder*="المحافظة"]',
                      'input[placeholder*="مدينة"], input[placeholder*="المدينة"]',
                      'select[name*="province"], select[name*="Province"]',
                      'select[name*="city"], select[name*="City"]',
                      'select[name*="محافظة"], select[name*="المحافظة"]',
                      'select[name*="مدينة"], select[name*="المدينة"]'
                    ], currentData.province);
                    
                    // حقول السعر
                    fillFields([
                      'input[name*="price"], input[name*="Price"]',
                      'input[name*="cost"], input[name*="Cost"]',
                      'input[name*="amount"], input[name*="Amount"]',
                      'input[name*="سعر"], input[name*="السعر"]',
                      'input[name*="تكلفة"], input[name*="التكلفة"]',
                      'input[name*="مبلغ"], input[name*="المبلغ"]',
                      'input[id*="price"], input[id*="Price"]',
                      'input[id*="cost"], input[id*="Cost"]',
                      'input[placeholder*="price"], input[placeholder*="Price"]',
                      'input[placeholder*="cost"], input[placeholder*="Cost"]',
                      'input[placeholder*="سعر"], input[placeholder*="السعر"]',
                      'input[placeholder*="تكلفة"], input[placeholder*="التكلفة"]',
                      'input[placeholder*="مبلغ"], input[placeholder*="المبلغ"]'
                    ], currentData.price);
                    
                    // البحث عن القوائم المنسدلة وتحديد الخيار المطابق للمحافظة
                    if (currentData.province) {
                      var selects = doc.querySelectorAll('select');
                      for (var i = 0; i < selects.length; i++) {
                        var select = selects[i];
                        var options = select.querySelectorAll('option');
                        for (var j = 0; j < options.length; j++) {
                          var option = options[j];
                          var text = option.textContent || option.innerText;
                          if (text && text.indexOf(currentData.province) !== -1) {
                            select.value = option.value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            filled = true;
                            console.log("تم اختيار المحافظة من القائمة المنسدلة:", text);
                            break;
                          }
                        }
                      }
                    }
                    
                    return filled;
                  }
                  
                  // تشغيل وظيفة ملء النموذج
                  var filled = false;
                  
                  // المحاولة الأولى
                  filled = monitorFrames();
                  
                  // في حال لم يتم العثور على الحقول، إضافة مراقب لتغييرات الـ DOM
                  if (!filled) {
                    var observer = new MutationObserver(function(mutations) {
                      monitorFrames();
                    });
                    
                    observer.observe(document.body, { childList: true, subtree: true });
                    
                    // إيقاف المراقب بعد 10 ثوانٍ
                    setTimeout(function() {
                      observer.disconnect();
                    }, 10000);
                  }
                  
                  // إظهار رسالة للمستخدم
                  var notification = document.createElement('div');
                  notification.style.position = 'fixed';
                  notification.style.top = '10px';
                  notification.style.right = '10px';
                  notification.style.zIndex = '9999';
                  notification.style.backgroundColor = 'rgba(0, 150, 0, 0.8)';
                  notification.style.color = 'white';
                  notification.style.padding = '10px 15px';
                  notification.style.borderRadius = '5px';
                  notification.style.fontSize = '14px';
                  notification.style.fontFamily = 'Arial, sans-serif';
                  notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                  notification.style.direction = 'rtl';
                  notification.textContent = 'تمت محاولة ملء النموذج تلقائيًا';
                  
                  document.body.appendChild(notification);
                  
                  // إزالة الإشعار بعد 5 ثوانٍ
                  setTimeout(function() {
                    notification.style.opacity = '0';
                    notification.style.transition = 'opacity 0.5s';
                    setTimeout(function() {
                      if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                      }
                    }, 500);
                  }, 5000);
                  
                  return "تمت محاولة ملء النموذج بنجاح";
                } catch (error) {
                  console.error("خطأ في سكريبت الإدخال التلقائي:", error);
                  alert("حدث خطأ أثناء محاولة ملء النموذج: " + error.message);
                  return "حدث خطأ: " + error.message;
                }
              })();
            \`;
            
            return autofillScript;
          }
          
          // تنفيذ مباشر للسكريبت على الموقع المستهدف
          document.getElementById('executeButton').addEventListener('click', function() {
            if (!currentData) {
              alert("لم يتم استلام البيانات بعد! الرجاء الانتظار.");
              return;
            }
            
            if (window.opener) {
              var targetUrl = prompt("أدخل عنوان URL للموقع المستهدف (متضمنًا https://)", "https://");
              if (!targetUrl || !targetUrl.startsWith('http')) {
                alert("الرجاء إدخال عنوان URL صالح يبدأ بـ http:// أو https://");
                return;
              }
              
              document.getElementById('statusMessage').textContent = "جاري فتح الموقع المستهدف...";
              document.getElementById('spinner').style.display = "block";
              
              // فتح نافذة جديدة بالموقع المستهدف
              var targetWindow = window.open(targetUrl, "_blank");
              
              // انتظار حتى يتم تحميل الصفحة
              setTimeout(function() {
                try {
                  if (targetWindow && !targetWindow.closed) {
                    // محاولة تنفيذ السكريبت في النافذة المستهدفة
                    var result = targetWindow.eval(autofillScript);
                    document.getElementById('statusMessage').textContent = "تم تنفيذ السكريبت: " + result;
                    document.getElementById('spinner').style.display = "none";
                  } else {
                    document.getElementById('statusMessage').innerHTML = "<span style='color: red;'>تعذر الوصول إلى النافذة المستهدفة. قد تكون محظورة بواسطة متصفحك.</span>";
                    document.getElementById('spinner').style.display = "none";
                  }
                } catch (e) {
                  document.getElementById('statusMessage').innerHTML = "<span style='color: red;'>تعذر تنفيذ السكريبت: " + e.message + "</span>";
                  document.getElementById('spinner').style.display = "none";
                  console.error("خطأ في تنفيذ السكريبت:", e);
                }
              }, 3000);
            } else {
              alert("لا يمكن الوصول إلى النافذة الأصلية!");
            }
          });
          
          // زر الإغلاق
          document.getElementById('closeButton').addEventListener('click', function() {
            window.close();
          });
        </script>
      </body>
      </html>
    `;
  };

  // تنفيذ السكريبت في الصفحة المستهدفة
  const executeScript = (targetUrl: string) => {
    if (!imageData) {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد بيانات الصورة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // فتح نافذة وسيطة مع HTML المنشأ
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        toast({
          title: "خطأ",
          description: "تم منع فتح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.",
          variant: "destructive",
        });
        return;
      }
      
      newWindow.document.write(intermediateHtml);
      newWindow.document.close();
    } catch (error) {
      console.error("Error opening window:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح النافذة: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return {
    imageData,
    setImageData,
    isGenerating,
    bookmarkletCode,
    intermediateHtml,
    executeScript
  };
};
