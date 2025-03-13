
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { ImageData } from "@/types/ImageData";

export const useBookmarkletGenerator = (
  passedImageData: ImageData | null = null,
  multipleImages: ImageData[] = [],
  isMultiMode: boolean = false,
  isOpen: boolean = false
) => {
  const { toast } = useToast();
  const [imageData, setImageData] = useState<ImageData | null>(passedImageData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookmarkletCode, setBookmarkletCode] = useState<string>("");
  const [intermediateHtml, setIntermediateHtml] = useState<string>("");
  const [bookmarkletUrl, setBookmarkletUrl] = useState<string>("");
  const [rawDataObject, setRawDataObject] = useState<Record<string, any>>({});

  useEffect(() => {
    // تحديث بيانات الصورة عند تغيرها من الخارج
    if (passedImageData) {
      setImageData(passedImageData);
    }
  }, [passedImageData]);

  useEffect(() => {
    if (!isOpen) return;
    if (!imageData && !isMultiMode) return;
    
    setIsGenerating(true);
    
    try {
      // إعداد كائن البيانات الخام
      let dataObject: Record<string, any> = {};
      
      if (isMultiMode && multipleImages.length > 0) {
        // إعداد مصفوفة من بيانات الصور المتعددة
        dataObject = multipleImages.map(img => ({
          id: img.id,
          companyName: img.companyName || "",
          code: img.code || "",
          senderName: img.senderName || "",
          phoneNumber: img.phoneNumber || "",
          province: img.province || "",
          price: img.price || ""
        }));
      } else if (imageData) {
        // إعداد بيانات صورة واحدة
        dataObject = {
          id: imageData.id,
          companyName: imageData.companyName || "",
          code: imageData.code || "",
          senderName: imageData.senderName || "",
          phoneNumber: imageData.phoneNumber || "",
          province: imageData.province || "",
          price: imageData.price || ""
        };
      }
      
      setRawDataObject(dataObject);
      
      // بناء سكريبت الإدخال التلقائي
      const autofillScript = buildAutofillScript(dataObject, isMultiMode);
      
      // إنشاء رمز الـ bookmarklet
      const bookmarklet = generateBookmarkletCode(autofillScript, dataObject);
      setBookmarkletCode(bookmarklet);
      setBookmarkletUrl(bookmarklet);
      
      // إنشاء صفحة وسيطة لتنفيذ السكريبت (تحل مشكلة المواقع التي ترفض السكريبت)
      const html = generateIntermediatePageHtml(dataObject, isMultiMode);
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
  }, [imageData, isMultiMode, multipleImages, isOpen, toast]);

  // دالة لبناء سكريبت الإدخال التلقائي
  const buildAutofillScript = (data: any, isMultiMode: boolean): string => {
    // يتم تخصيص السكريبت بناءً على وضع الصور المتعددة
    if (isMultiMode) {
      return `
        (function() {
          try {
            // التأكد من وجود البيانات
            const dataEntries = ${JSON.stringify(data)};
            var currentIndex = 0;
            
            function createInterface() {
              // إنشاء عنصر التحكم
              var controls = document.createElement('div');
              controls.id = 'multi-autofill-controls';
              controls.style.position = 'fixed';
              controls.style.bottom = '20px';
              controls.style.left = '50%';
              controls.style.transform = 'translateX(-50%)';
              controls.style.backgroundColor = 'rgba(0, 150, 0, 0.9)';
              controls.style.color = 'white';
              controls.style.padding = '10px 15px';
              controls.style.borderRadius = '5px';
              controls.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
              controls.style.zIndex = '9999';
              controls.style.display = 'flex';
              controls.style.alignItems = 'center';
              controls.style.justifyContent = 'center';
              controls.style.fontFamily = 'Arial, sans-serif';
              controls.style.direction = 'rtl';
              controls.style.gap = '10px';
              
              // إضافة زر السابق
              var prevButton = document.createElement('button');
              prevButton.textContent = 'السابق';
              prevButton.style.padding = '5px 10px';
              prevButton.style.border = 'none';
              prevButton.style.borderRadius = '3px';
              prevButton.style.backgroundColor = 'white';
              prevButton.style.color = 'green';
              prevButton.style.cursor = 'pointer';
              prevButton.onclick = function() {
                if (currentIndex > 0) {
                  currentIndex--;
                  updateCounter();
                  fillCurrentEntry();
                }
              };
              
              // إضافة عداد
              var counter = document.createElement('span');
              counter.id = 'entry-counter';
              counter.style.margin = '0 10px';
              
              // إضافة زر التالي
              var nextButton = document.createElement('button');
              nextButton.textContent = 'التالي';
              nextButton.style.padding = '5px 10px';
              nextButton.style.border = 'none';
              nextButton.style.borderRadius = '3px';
              nextButton.style.backgroundColor = 'white';
              nextButton.style.color = 'green';
              nextButton.style.cursor = 'pointer';
              nextButton.onclick = function() {
                if (currentIndex < dataEntries.length - 1) {
                  currentIndex++;
                  updateCounter();
                  fillCurrentEntry();
                }
              };
              
              // إضافة زر إغلاق
              var closeButton = document.createElement('button');
              closeButton.textContent = '×';
              closeButton.style.padding = '5px 8px';
              closeButton.style.border = 'none';
              closeButton.style.borderRadius = '50%';
              closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              closeButton.style.color = 'white';
              closeButton.style.cursor = 'pointer';
              closeButton.style.position = 'absolute';
              closeButton.style.top = '-10px';
              closeButton.style.right = '-10px';
              closeButton.onclick = function() {
                document.body.removeChild(controls);
              };
              
              // تجميع العناصر
              controls.appendChild(closeButton);
              controls.appendChild(prevButton);
              controls.appendChild(counter);
              controls.appendChild(nextButton);
              
              // إضافة إلى الصفحة
              document.body.appendChild(controls);
              
              // تحديث العداد
              updateCounter();
            }
            
            function updateCounter() {
              var counter = document.getElementById('entry-counter');
              if (counter) {
                counter.textContent = (currentIndex + 1) + ' من ' + dataEntries.length;
              }
            }
            
            // ملء النموذج بالبيانات الحالية
            function fillCurrentEntry() {
              var currentData = dataEntries[currentIndex];
              fillForm(currentData);
            }
            
            // وظيفة ملء النموذج
            function fillForm(data) {
              console.log("جاري ملء البيانات:", data);
              
              // وظيفة البحث عن وملء الحقول
              function fillFields(selectors, value) {
                if (!value) return false;
                
                var fieldFilled = false;
                selectors.forEach(function(selector) {
                  var fields = document.querySelectorAll(selector);
                  fields.forEach(function(field) {
                    if (field && !field.disabled && !field.readOnly) {
                      field.value = value;
                      field.dispatchEvent(new Event('input', { bubbles: true }));
                      field.dispatchEvent(new Event('change', { bubbles: true }));
                      fieldFilled = true;
                      console.log("تم ملء الحقل:", selector, "بالقيمة:", value);
                    }
                  });
                });
                return fieldFilled;
              }
              
              // حقول اسم الشركة
              fillFields([
                'input[name*="company"], input[name*="Company"]',
                'input[name*="شركة"], input[name*="الشركة"]',
                'input[id*="company"], input[id*="Company"]',
                'input[placeholder*="company"], input[placeholder*="Company"]',
                'input[placeholder*="شركة"], input[placeholder*="الشركة"]',
                'input[name*="store"], input[name*="Store"]',
                'input[name*="vendor"], input[name*="Vendor"]'
              ], data.companyName);
              
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
              ], data.code);
              
              // باقي الحقول
              fillFields([
                'input[name*="name"], input[name*="Name"]',
                'input[name*="sender"], input[name*="Sender"]',
                'input[name*="اسم"], input[name*="المرسل"]',
                'input[id*="name"], input[id*="Name"]',
                'input[placeholder*="name"], input[placeholder*="Name"]',
                'input[placeholder*="اسم"], input[placeholder*="المرسل"]',
                'input[name*="customer"], input[name*="Customer"]'
              ], data.senderName);
              
              fillFields([
                'input[name*="phone"], input[name*="Phone"]',
                'input[name*="mobile"], input[name*="Mobile"]',
                'input[name*="هاتف"], input[name*="الهاتف"]',
                'input[name*="موبايل"], input[name*="الموبايل"]',
                'input[id*="phone"], input[id*="Phone"]',
                'input[id*="mobile"], input[id*="Mobile"]',
                'input[placeholder*="phone"], input[placeholder*="Phone"]',
              ], data.phoneNumber);
              
              fillFields([
                'input[name*="province"], input[name*="Province"]',
                'input[name*="city"], input[name*="City"]',
                'input[name*="محافظة"], input[name*="المحافظة"]',
                'input[id*="province"], input[id*="Province"]',
                'input[id*="city"], input[id*="City"]',
              ], data.province);
              
              fillFields([
                'input[name*="price"], input[name*="Price"]',
                'input[name*="cost"], input[name*="Cost"]',
                'input[name*="amount"], input[name*="Amount"]',
                'input[id*="price"], input[id*="Price"]',
                'input[id*="cost"], input[id*="Cost"]',
              ], data.price);
              
              // البحث عن القوائم المنسدلة
              try {
                if (data.province) {
                  var selects = document.querySelectorAll('select');
                  for (var i = 0; i < selects.length; i++) {
                    var select = selects[i];
                    var options = select.querySelectorAll('option');
                    for (var j = 0; j < options.length; j++) {
                      var option = options[j];
                      var text = option.textContent || option.innerText;
                      if (text && text.indexOf(data.province) !== -1) {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log("تم اختيار المحافظة من القائمة المنسدلة:", text);
                        break;
                      }
                    }
                  }
                }
              } catch (e) {
                console.error("خطأ في محاولة ملء القوائم المنسدلة:", e);
              }
            }
            
            // إنشاء واجهة المستخدم
            createInterface();
            
            // ملء النموذج بالبيانات الأولى
            fillCurrentEntry();
            
            return "تم تفعيل أداة الإدخال التلقائي للبيانات المتعددة";
          } catch (error) {
            console.error("خطأ في سكريبت الإدخال التلقائي متعدد البيانات:", error);
            alert("حدث خطأ: " + error.message);
            return "حدث خطأ: " + error.message;
          }
        })();
      `;
    } else {
      // سكريبت للصورة الواحدة
      return `
        (function() {
          try {
            // تأكد من وجود البيانات
            var currentData = ${JSON.stringify(data)};
            console.log("بيانات الإدخال التلقائي:", currentData);
            
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
              
              // محاولة ملء حقول مختلفة
              
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
              
              // باقي الحقول
              fillFields([
                'input[name*="name"], input[name*="Name"]',
                'input[name*="sender"], input[name*="Sender"]',
                'input[name*="اسم"], input[name*="المرسل"]',
                'input[id*="name"], input[id*="Name"]',
                'input[placeholder*="name"], input[placeholder*="Name"]',
                'input[placeholder*="اسم"], input[placeholder*="المرسل"]',
                'input[name*="customer"], input[name*="Customer"]'
              ], currentData.senderName);
              
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
              
              // البحث عن القوائم المنسدلة
              try {
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
              } catch (e) {
                console.error("خطأ في محاولة ملء القوائم المنسدلة:", e);
              }
              
              return filled;
            }
            
            // محاولة ملء النموذج وإظهار رسالة
            var success = autofillForm(document);
            
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
            notification.textContent = success ? 'تم ملء النموذج تلقائيًا' : 'تمت محاولة ملء النموذج';
            
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
    }
  };

  // دالة لإنشاء رمز الـ bookmarklet
  const generateBookmarkletCode = (script: string, data: any): string => {
    // تشفير السكريبت لاستخدامه في الـ bookmarklet
    const encoded = encodeURIComponent(script);
    return `javascript:${encoded}`;
  };

  // دالة لإنشاء صفحة وسيطة لتنفيذ السكريبت
  const generateIntermediatePageHtml = (data: any, isMultiMode: boolean): string => {
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
            max-width: 600px;
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            margin-top: 0;
            color: #2c974b;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #2c974b;
            animation: spin 1s linear infinite;
            margin: 20px auto;
            display: none;
          }
          .data-preview {
            margin-top: 20px;
            text-align: right;
          }
          #statusMessage {
            margin: 15px 0;
            padding: 10px;
            background-color: #f0f8ff;
            border-radius: 5px;
            font-weight: bold;
          }
          .button {
            background-color: #2c974b;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 5px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #217a3b;
          }
          .button.secondary {
            background-color: #6c757d;
          }
          .button.secondary:hover {
            background-color: #5a6268;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>جاري تنفيذ الإدخال التلقائي</h1>
          <div class="spinner" id="spinner"></div>
          <p>سيتم فتح الصفحة المستهدفة وإدخال البيانات تلقائياً.</p>
          
          <div id="statusMessage">جاهز للتنفيذ</div>
          
          <div class="data-preview">
            <h3>البيانات التي سيتم إدخالها:</h3>
            <pre id="dataPreview" style="text-align: left; direction: ltr; background: #f0f0f0; padding: 10px; border-radius: 5px; max-height: 150px; overflow: auto;">${JSON.stringify(data, null, 2)}</pre>
          </div>
          
          <div style="margin-top: 20px;">
            <button id="executeButton" class="button">تنفيذ مباشرة</button>
            <button id="closeButton" class="button secondary">إغلاق</button>
          </div>
        </div>
        
        <script>
          // حفظ البيانات الخام
          var dataEntries = ${JSON.stringify(data)};
          
          // تحديد ما إذا كان وضع متعدد
          var isMultiMode = ${isMultiMode};
          
          // سكريبت الإدخال التلقائي
          var autofillScript = \`${buildAutofillScript(data, isMultiMode).replace(/`/g, '\\`')}\`;
          
          // زر التنفيذ المباشر
          document.getElementById('executeButton').addEventListener('click', function() {
            var targetUrl = prompt("أدخل عنوان URL للموقع المستهدف (متضمنًا https://)", "https://");
            if (!targetUrl || !targetUrl.startsWith('http')) {
              alert("الرجاء إدخال عنوان URL صالح يبدأ بـ http:// أو https://");
              return;
            }
            
            document.getElementById('statusMessage').textContent = "جاري فتح الموقع المستهدف...";
            document.getElementById('spinner').style.display = "block";
            
            // حفظ آخر عنوان URL مستخدم
            try {
              localStorage.setItem('lastAutoFillUrl', targetUrl);
            } catch (e) {}
            
            // نهج جديد: استخدام نافذة وسيطة لطلب البيانات من النافذة الرئيسية
            var uniqueId = dataEntries.id || ('img_' + Date.now());
            
            // فتح نافذة بالموقع المستهدف
            var targetWindow = window.open(targetUrl, "_blank");
            
            if (!targetWindow) {
              document.getElementById('statusMessage').textContent = "تم حظر النوافذ المنبثقة! الرجاء السماح بالنوافذ المنبثقة وإعادة المحاولة.";
              document.getElementById('spinner').style.display = "none";
              return;
            }
            
            // إضافة مستمع للرسائل
            window.addEventListener("message", function messageHandler(event) {
              if (event.data && event.data.type === 'direct-autofill-response') {
                // تم استلام رد من النافذة الرئيسية مع البيانات والسكريبت
                if (event.data.success) {
                  try {
                    // تنفيذ السكريبت في النافذة المستهدفة
                    targetWindow.postMessage({
                      type: 'execute-script',
                      script: event.data.script,
                      data: event.data.data
                    }, '*');
                    
                    document.getElementById('statusMessage').textContent = "تم إرسال البيانات للموقع المستهدف بنجاح.";
                  } catch (e) {
                    document.getElementById('statusMessage').textContent = "خطأ في تنفيذ السكريبت: " + e.message;
                    console.error("خطأ في تنفيذ السكريبت:", e);
                  }
                } else {
                  document.getElementById('statusMessage').textContent = "خطأ: " + (event.data.error || "فشل في الحصول على البيانات");
                }
                
                document.getElementById('spinner').style.display = "none";
                
                // إزالة المستمع بعد الاستخدام
                window.removeEventListener("message", messageHandler);
              }
            });
            
            // انتظار قليلاً ثم طلب البيانات والسكريبت من النافذة الرئيسية
            setTimeout(function() {
              try {
                // إرسال طلب للحصول على السكريبت المباشر من الصفحة الرئيسية
                window.opener.postMessage({
                  type: 'direct-autofill-request',
                  imageId: uniqueId,
                  targetOrigin: '*'
                }, '*');
                
                document.getElementById('statusMessage').textContent = "تم إرسال طلب البيانات للصفحة الرئيسية...";
              } catch (e) {
                document.getElementById('statusMessage').textContent = "خطأ في طلب البيانات: " + e.message;
                document.getElementById('spinner').style.display = "none";
                console.error("خطأ في طلب البيانات:", e);
              }
            }, 1000);
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
    if (!imageData && !isMultiMode) {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد بيانات للإدخال التلقائي",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // إنشاء بلوب من محتوى الصفحة الوسيطة
      const blob = new Blob([intermediateHtml], { type: 'text/html' });
      const intermediateUrl = URL.createObjectURL(blob);
      
      // فتح صفحة وسيطة
      const newWindow = window.open(intermediateUrl, '_blank');
      if (!newWindow) {
        toast({
          title: "خطأ",
          description: "تم منع فتح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.",
          variant: "destructive",
        });
        return;
      }
      
      // تحرير URL البلوب بعد فتح النافذة
      setTimeout(() => {
        URL.revokeObjectURL(intermediateUrl);
      }, 1000);
      
      toast({
        title: "تم",
        description: "تم فتح صفحة الإدخال التلقائي",
      });
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
    bookmarkletUrl,
    rawDataObject,
    intermediateHtml,
    executeScript
  };
};
