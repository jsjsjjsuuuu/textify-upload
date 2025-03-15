
/**
 * مولد كود البوكماركلت - يقوم بإنشاء كود JavaScript بناءً على الخيارات المحددة
 */

import { BookmarkletOptions } from "@/types/BookmarkletOptions";
import { getStorageCode } from "./storageCode";
import { getExportToolsCode } from "./exportToolsCode";
import { createUICode } from "./uiCode";

// إضافة محاكاة السيلينيوم إلى واجهة البوكماركلت
export const getBookmarkletCode = (options: BookmarkletOptions): string => {
  const { version, includeFormFiller, includeExportTools } = options;
  
  // استيراد الدوال من ملف enhancedFormFiller مباشرة
  // بدلاً من استخدام الدوال المستوردة في التعريفات
  const formFillerCode = includeFormFiller ? `
    // ===== نظام ملء النماذج المحسن مع محاكاة سيلينيوم =====
    const enhancedFormFiller = async function(data, options = {}) {
      console.log("[EnhancedFormFiller] بدء ملء النموذج مع بيانات:", data);
      
      try {
        // استخدام نظام السيلينيوم المحسن للتعبئة التلقائية
        await runQuickAutomation(data, (status, details) => {
          if (status === 'error') {
            console.error(\`[EnhancedFormFiller] خطأ: \${details}\`);
          } else if (status === 'warning') {
            console.warn(\`[EnhancedFormFiller] تحذير: \${details}\`);
          } else {
            console.log(\`[EnhancedFormFiller] \${details}\`);
          }
        });
        
        return {
          success: true,
          message: "تم ملء النموذج بنجاح باستخدام نظام محاكاة السيلينيوم"
        };
      } catch (error) {
        console.error("[EnhancedFormFiller] فشل ملء النموذج:", error);
        return {
          success: false,
          message: \`فشل ملء النموذج: \${error}\`
        };
      }
    };
    
    // واجهة السيلينيوم المحاكاة
    const createSeleniumController = function(data) {
      let actions = [];
      let debugMode = false;
      let defaultDelay = 100;
      
      const controller = {
        // إعداد وضع التصحيح
        setDebugMode: function(enabled) {
          debugMode = enabled;
          if (debugMode) console.log("[SeleniumController] تم تفعيل وضع التصحيح");
          return controller;
        },
        
        // ضبط التأخير الافتراضي بين الإجراءات
        setDelay: function(delay) {
          defaultDelay = delay;
          return controller;
        },
        
        // انتظار تحميل الصفحة
        waitForPageLoad: function() {
          actions.push(async function() {
            if (debugMode) console.log("[SeleniumController] انتظار تحميل الصفحة...");
            return new Promise(function(resolve) {
              if (document.readyState === 'complete') {
                if (debugMode) console.log("[SeleniumController] الصفحة محملة بالفعل");
                resolve();
              } else {
                window.addEventListener('load', function() {
                  if (debugMode) console.log("[SeleniumController] اكتمل تحميل الصفحة");
                  resolve();
                });
              }
            });
          });
          return controller;
        },
        
        // انتظار ظهور عنصر
        waitForElement: function(selector, timeout) {
          timeout = timeout || 5000;
          actions.push(async function() {
            if (debugMode) console.log(\`[SeleniumController] انتظار العنصر: \${selector}...\`);
            return new Promise(function(resolve, reject) {
              // التحقق أولاً إذا كان العنصر موجوداً بالفعل
              if (document.querySelector(selector)) {
                if (debugMode) console.log(\`[SeleniumController] العنصر موجود بالفعل: \${selector}\`);
                resolve();
                return;
              }
              
              // تعيين مهلة زمنية
              const timeoutId = setTimeout(function() {
                observer.disconnect();
                reject(new Error(\`انتهت المهلة أثناء انتظار العنصر: \${selector}\`));
              }, timeout);
              
              // إعداد مراقب DOM
              const observer = new MutationObserver(function() {
                if (document.querySelector(selector)) {
                  if (debugMode) console.log(\`[SeleniumController] تم العثور على العنصر: \${selector}\`);
                  observer.disconnect();
                  clearTimeout(timeoutId);
                  resolve();
                }
              });
              
              // بدء المراقبة
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
              });
            });
          });
          return controller;
        },
        
        // كتابة نص في حقل
        typeText: function(selector, text) {
          if (text === undefined || text === null) {
            if (debugMode) console.log(\`[SeleniumController] النص فارغ لـ \${selector}، تخطي\`);
            return controller;
          }
          
          actions.push(async function() {
            if (debugMode) console.log(\`[SeleniumController] كتابة النص في \${selector}: \${text}\`);
            const element = document.querySelector(selector);
            if (!element) {
              throw new Error(\`لم يتم العثور على العنصر: \${selector}\`);
            }
            
            // التأكد من أن العنصر مرئي ويمكن التفاعل معه
            if (element.style.display === 'none' || element.style.visibility === 'hidden') {
              throw new Error(\`العنصر غير مرئي: \${selector}\`);
            }
            
            // تنشيط الحقل أولاً
            element.focus();
            
            // محاكاة الكتابة البشرية حرفًا بحرفًا
            for (let i = 0; i < text.length; i++) {
              await new Promise(resolve => setTimeout(resolve, 30));
              element.value = text.substring(0, i + 1);
              // تشغيل حدث input لتحديث الواجهة
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // تشغيل حدث التغيير
            element.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, defaultDelay));
          });
          return controller;
        },
        
        // اختيار خيار من قائمة منسدلة
        selectOption: function(selector, value) {
          actions.push(async function() {
            if (debugMode) console.log(\`[SeleniumController] اختيار القيمة \${value} من \${selector}\`);
            const select = document.querySelector(selector);
            if (!select) {
              throw new Error(\`لم يتم العثور على قائمة الاختيار: \${selector}\`);
            }
            
            // البحث عن الخيار المطابق للقيمة أو النص
            let found = false;
            for (let i = 0; i < select.options.length; i++) {
              const option = select.options[i];
              
              if (option.value === value || option.text === value) {
                select.selectedIndex = i;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                found = true;
                break;
              }
            }
            
            if (!found) {
              throw new Error(\`لم يتم العثور على الخيار: \${value} في القائمة \${selector}\`);
            }
            
            await new Promise(resolve => setTimeout(resolve, defaultDelay));
          });
          return controller;
        },
        
        // النقر على عنصر
        click: function(selector) {
          actions.push(async function() {
            if (debugMode) console.log(\`[SeleniumController] النقر على العنصر: \${selector}\`);
            const element = document.querySelector(selector);
            if (!element) {
              throw new Error(\`لم يتم العثور على العنصر: \${selector}\`);
            }
            
            // محاكاة النقر البشري
            element.focus();
            await new Promise(resolve => setTimeout(resolve, 50));
            element.click();
            await new Promise(resolve => setTimeout(resolve, defaultDelay));
          });
          return controller;
        },
        
        // إضافة تأخير
        delay: function(ms) {
          actions.push(async function() {
            if (debugMode) console.log(\`[SeleniumController] تأخير \${ms} مللي ثانية\`);
            await new Promise(resolve => setTimeout(resolve, ms));
          });
          return controller;
        },
        
        // إضافة إجراء مخصص
        customAction: function(fn) {
          actions.push(async function() {
            if (debugMode) console.log("[SeleniumController] تنفيذ إجراء مخصص");
            await fn();
          });
          return controller;
        },
        
        // تنفيذ جميع الإجراءات
        execute: async function() {
          if (debugMode) console.log("[SeleniumController] بدء تنفيذ سلسلة الإجراءات");
          
          for (let i = 0; i < actions.length; i++) {
            try {
              await actions[i]();
            } catch (error) {
              console.error(\`[SeleniumController] فشل الإجراء #\${i+1}:\`, error);
              throw error;
            }
          }
          
          if (debugMode) console.log("[SeleniumController] اكتمل تنفيذ جميع الإجراءات بنجاح");
        }
      };
      
      return controller;
    };
    
    const runQuickAutomation = async function(data, logger) {
      const log = function(status, message) {
        if (logger) {
          logger(status, message);
        } else {
          console.log(\`[QuickAutomation] [\${status}] \${message}\`);
        }
      };
      
      log('info', 'بدء الأتمتة السريعة...');
      
      try {
        // إنشاء متحكم السيلينيوم
        const controller = createSeleniumController(data);
        
        // بناء سلسلة الإجراءات الافتراضية
        controller
          .setDebugMode(true)
          .waitForPageLoad()
          .delay(500);
        
        // إضافة إجراءات بناءً على البيانات المتاحة
        if (data.code) {
          // محاولة العثور على حقل الكود في الصفحة
          controller.customAction(async function() {
            const possibleSelectors = [
              '#code', '#shipmentCode', '#customerCode', '#orderCode', 
              '[name="code"]', '[name="shipmentCode"]', '[name="customerCode"]',
              '[placeholder*="كود"]', '[placeholder*="رقم الشحنة"]', '[placeholder*="رمز"]'
            ];
            
            for (const selector of possibleSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                log('info', \`تم العثور على حقل الكود: \${selector}\`);
                controller.typeText(selector, data.code);
                return;
              }
            }
            
            log('warning', 'لم يتم العثور على حقل الكود، حاول البحث بطريقة أخرى');
          });
        }
        
        // حقل اسم المرسل
        if (data.senderName) {
          controller.customAction(async function() {
            const possibleSelectors = [
              '#senderName', '#name', '#customerName', '#sender',
              '[name="senderName"]', '[name="name"]', '[name="customerName"]',
              '[placeholder*="اسم المرسل"]', '[placeholder*="الاسم"]'
            ];
            
            for (const selector of possibleSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                log('info', \`تم العثور على حقل الاسم: \${selector}\`);
                controller.typeText(selector, data.senderName);
                return;
              }
            }
            
            log('warning', 'لم يتم العثور على حقل اسم المرسل');
          });
        }
        
        // حقل رقم الهاتف
        if (data.phoneNumber) {
          controller.customAction(async function() {
            const possibleSelectors = [
              '#phone', '#phoneNumber', '#mobile', '#customerPhone',
              '[name="phone"]', '[name="phoneNumber"]', '[name="mobile"]',
              '[placeholder*="رقم الهاتف"]', '[placeholder*="الجوال"]', '[placeholder*="الموبايل"]'
            ];
            
            for (const selector of possibleSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                log('info', \`تم العثور على حقل الهاتف: \${selector}\`);
                controller.typeText(selector, data.phoneNumber);
                return;
              }
            }
            
            log('warning', 'لم يتم العثور على حقل رقم الهاتف');
          });
        }
        
        // المحافظة
        if (data.province) {
          controller.customAction(async function() {
            const possibleSelectors = [
              '#province', '#city', '#governorate', '#region',
              'select[name="province"]', 'select[name="city"]', 'select[name="governorate"]',
              'select[placeholder*="المحافظة"]', 'select[placeholder*="المدينة"]'
            ];
            
            for (const selector of possibleSelectors) {
              const element = document.querySelector(selector);
              if (element && element.tagName === 'SELECT') {
                log('info', \`تم العثور على قائمة المحافظة: \${selector}\`);
                controller.selectOption(selector, data.province);
                return;
              }
            }
            
            log('warning', 'لم يتم العثور على قائمة المحافظة');
          });
        }
        
        // تنفيذ سلسلة الإجراءات
        await controller.execute();
        log('info', 'تم تنفيذ الأتمتة السريعة بنجاح');
        
      } catch (error) {
        log('error', \`فشل الأتمتة السريعة: \${error}\`);
        throw error;
      }
    };
    
    // إضافة واجهات التحكم إلى النافذة
    window.bookmarkletControls = {
      enhancedFormFiller,
      createSeleniumController,
      runQuickAutomation
    };
    
    console.log("[Bookmarklet] تم تحميل نظام ملء النماذج المحسن مع دعم محاكاة السيلينيوم");
  ` : '';
  
  // كود أدوات التصدير
  const exportToolsCode = includeExportTools ? `
    // ===== أدوات تصدير البيانات =====
    const exportDataAsJSON = ${getExportToolsCode({ exportType: 'json' })};
    const exportDataAsCSV = ${getExportToolsCode({ exportType: 'csv' })};
    
    // إضافة وظائف التصدير إلى النافذة
    window.bookmarkletExport = {
      exportDataAsJSON,
      exportDataAsCSV
    };
    
    console.log("[Bookmarklet] تم تحميل أدوات تصدير البيانات");
  ` : '';
  
  // كود التخزين
  const storageCode = getStorageCode();
  
  // دمج كل الأجزاء معًا
  const fullCode = `
    (function() {
      console.log("[Bookmarklet] بدء تشغيل البوكماركلت v${version || '1.0'}");
      
      // التحقق من عدم تحميل البوكماركلت مسبقًا
      if (window._bookmarkletLoaded) {
        alert("البوكماركلت نشط بالفعل!");
        return;
      }
      
      // تعيين علامة التحميل
      window._bookmarkletLoaded = true;
      
      ${storageCode}
      ${formFillerCode}
      ${exportToolsCode}
      
      // إنشاء واجهة المستخدم
      ${createUICode}();
      
      console.log("[Bookmarklet] اكتمل تحميل البوكماركلت");
    })();
  `;
  
  return fullCode;
};
