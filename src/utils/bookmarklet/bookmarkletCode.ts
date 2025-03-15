/**
 * مولد كود البوكماركلت - يقوم بإنشاء كود JavaScript بناءً على الخيارات المحددة
 */

import { BookmarkletOptions } from "@/types/BookmarkletOptions";
import { getStorageCode } from "./storageCode";
import { enhancedFormFiller, createSeleniumController, runQuickAutomation } from "./enhancedFormFiller";
import { getExportToolsCode } from "./exportToolsCode";
import { createUICode } from "./uiCode";

// إضافة محاكاة السيلينيوم إلى واجهة البوكماركلت
export const getBookmarkletCode = (options: BookmarkletOptions): string => {
  const { version, includeFormFiller, includeExportTools } = options;
  
  // كود ملء النماذج المحسن (مع نظام محاكاة السيلينيوم)
  const formFillerCode = includeFormFiller ? `
    // ===== نظام ملء النماذج المحسن مع محاكاة سيلينيوم =====
    const enhancedFormFiller = ${enhancedFormFiller.toString()};
    
    // واجهة السيلينيوم المحاكاة
    const createSeleniumController = ${createSeleniumController.toString()};
    const runQuickAutomation = ${runQuickAutomation.toString()};
    
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
  
  // كود إنشاء واجهة المستخدم
  const createUICode = `
    // ===== إنشاء واجهة المستخدم =====
    const createUI = ${createUICode};
    createUI();
  `;
  
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
      ${createUICode}
      
      console.log("[Bookmarklet] اكتمل تحميل البوكماركلت");
    })();
  `;
  
  return fullCode;
};

