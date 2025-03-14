
/**
 * محرك ملء النماذج المحسّن
 * يستخدم تقنيات متعددة لتحديد حقول النماذج وملئها بشكل أكثر موثوقية
 */

import { FieldMapping } from "./types";

// النتائج المُرجعة من محاولة ملء النموذج
interface FormFillerResults {
  filled: string[];
  failed: string[];
  message: string;
  success: boolean;
  attempted: number;
}

// استراتيجيات تحديد الحقول
enum FieldDetectionStrategy {
  LABEL_FOR_ATTRIBUTE = "label-for",
  PLACEHOLDER = "placeholder",
  NAME_OR_ID = "name-id",
  TEXT_CONTENT = "text-content",
  ARIA_LABEL = "aria-label",
  PARENT_TEXT = "parent-text",
  SIBLINGS = "siblings",
  MACHINE_LEARNING = "machine-learning"
}

// استراتيجيات ملء الحقول
enum FillingStrategy {
  DIRECT_ASSIGNMENT = "direct",
  OBJECT_DEFINE_PROPERTY = "define-property",
  EVENT_SIMULATION = "event-simulation",
  CLIPBOARD = "clipboard",
  KEYBOARD_EVENTS = "keyboard"
}

// عنصر تحكم لوحة الإدخال
let controlPanel: HTMLElement | null = null;

// وظيفة إنشاء لوحة التحكم
function createControlPanel(items: any[]) {
  // إزالة اللوحة الحالية إن وجدت
  if (controlPanel && controlPanel.parentNode) {
    controlPanel.parentNode.removeChild(controlPanel);
  }

  // استيراد أنماط CSS لواجهة المستخدم
  const styles = document.createElement("style");
  styles.textContent = `
    .ima-control{font-family:system-ui,-apple-system,sans-serif;direction:rtl;position:fixed;top:10px;right:10px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);width:340px;z-index:9999999;max-height:90vh;overflow-y:auto;border:1px solid #eaeaea}
    .ima-header{padding:12px 15px;border-bottom:1px solid #eaeaea;display:flex;justify-content:space-between;align-items:center;background:#f8f8f8;border-radius:8px 8px 0 0}
    .ima-title{margin:0;font-size:16px;font-weight:600;color:#333}
    .ima-close{background:none;border:none;font-size:20px;cursor:pointer;color:#666;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}
    .ima-close:hover{background:#f0f0f0;color:#333}
    .ima-content{padding:15px}
    .ima-info{margin-bottom:15px;font-size:14px;color:#555;padding:10px;background:#f9f9f9;border-radius:6px;border:1px solid #eee}
    .ima-btn{display:block;width:100%;padding:10px 12px;border:none;border-radius:6px;margin:8px 0;cursor:pointer;font-size:14px;font-weight:500;text-align:center;transition:all 0.2s}
    .ima-btn-primary{background:#4CAF50;color:white}
    .ima-btn-primary:hover{background:#43A047}
    .ima-btn-primary:disabled{background:#A5D6A7;cursor:not-allowed}
    .ima-btn-secondary{background:#f5f5f5;color:#333;border:1px solid #ddd}
    .ima-btn-secondary:hover{background:#e5e5e5}
    .ima-btn-danger{background:#FFF;color:#E53935;border:1px solid #FFCDD2}
    .ima-btn-danger:hover{background:#FFEBEE}
    .ima-item{padding:12px;margin:10px 0;border:1px solid #eaeaea;border-radius:6px;background:#f9f9f9;transition:all 0.2s}
    .ima-item:hover{border-color:#ddd;background:#f5f5f5}
    .ima-item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    .ima-item-title{font-weight:600;font-size:14px;color:#333;margin:0}
    .ima-item-detail{font-size:13px;color:#666;margin:3px 0}
    .ima-item-footer{display:flex;justify-content:space-between;margin-top:10px}
    .ima-badge{display:inline-block;padding:2px 6px;border-radius:12px;font-size:11px;font-weight:500}
    .ima-badge-pending{background:#FFF9C4;color:#FBC02D}
    .ima-badge-success{background:#E8F5E9;color:#4CAF50}
    .ima-badge-error{background:#FFEBEE;color:#E53935}
    .ima-tabs{display:flex;border-bottom:1px solid #eee;margin-bottom:15px}
    .ima-tab{padding:8px 12px;cursor:pointer;font-size:13px;color:#666;border-bottom:2px solid transparent}
    .ima-tab.active{color:#4CAF50;border-bottom-color:#4CAF50;font-weight:500}
    .ima-tab:hover:not(.active){color:#43A047;background:#f9f9f9}
    .ima-loader{display:inline-block;width:12px;height:12px;border:2px solid rgba(0,0,0,0.1);border-radius:50%;border-top-color:#4CAF50;animation:ima-spin 1s linear infinite;margin-right:8px}
    .ima-notification{position:fixed;bottom:20px;right:20px;padding:12px 15px;color:white;border-radius:6px;z-index:10000000;font-size:14px;font-weight:500;box-shadow:0 2px 10px rgba(0,0,0,0.1);opacity:0;transform:translateY(20px);transition:all 0.3s ease}
    .ima-notification.show{opacity:1;transform:translateY(0)}
    .ima-notification-success{background:#4CAF50}
    .ima-notification-error{background:#E53935}
    .ima-notification-info{background:#2196F3}
    @keyframes ima-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  `;
  document.head.appendChild(styles);

  // إنشاء لوحة التحكم
  controlPanel = document.createElement("div");
  controlPanel.className = "ima-control";

  // إضافة العنوان وزر الإغلاق
  const header = document.createElement("div");
  header.className = "ima-header";
  
  const title = document.createElement("h3");
  title.className = "ima-title";
  title.textContent = "أداة الإدخال التلقائي المحسّنة";
  header.appendChild(title);
  
  const closeButton = document.createElement("button");
  closeButton.className = "ima-close";
  closeButton.textContent = "×";
  closeButton.onclick = function() {
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
      controlPanel = null;
    }
  };
  header.appendChild(closeButton);
  controlPanel.appendChild(header);

  // إنشاء محتوى اللوحة
  const content = document.createElement("div");
  content.className = "ima-content";

  // إضافة نبذة عن الأداة
  const infoDiv = document.createElement("div");
  infoDiv.className = "ima-info";
  infoDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
      <strong>العناصر المتاحة:</strong> <span>${items.length} عنصر</span>
    </div>
    <div style="font-size:12px;color:#666;">
      انتقل إلى صفحة إضافة شحنة جديدة في موقع شركة التوصيل وانقر على أحد الأزرار أدناه
    </div>
  `;
  content.appendChild(infoDiv);

  // إنشاء أزرار الإجراءات السريعة
  const quickActionsDiv = document.createElement("div");
  
  // زر ملء البيانات تلقائيًا (الأول)
  const fillFirstButton = document.createElement("button");
  fillFirstButton.className = "ima-btn ima-btn-primary";
  fillFirstButton.innerHTML = '<span>ملء العنصر الأول تلقائيًا</span>';
  fillFirstButton.onclick = async function() {
    if (items.length > 0) {
      try {
        fillFirstButton.innerHTML = '<span class="ima-loader"></span><span>جاري ملء البيانات...</span>';
        fillFirstButton.disabled = true;
        
        // استخدام محرك الإدخال المحسن
        const result = await enhancedFillForm(items[0]);
        
        // عرض النتيجة
        if (result.success) {
          showNotification(`تم ملء ${result.filled.length} حقل بنجاح`, "success");
          updateItemStatus(items[0].id, "success", `تم إدخال ${result.filled.length} حقل من أصل ${result.attempted}`);
        } else {
          showNotification(result.message, "error");
          updateItemStatus(items[0].id, "error", result.message);
        }
      } catch (error) {
        console.error("خطأ في ملء البيانات:", error);
        showNotification("حدث خطأ أثناء ملء البيانات", "error");
      } finally {
        fillFirstButton.innerHTML = '<span>ملء العنصر الأول تلقائيًا</span>';
        fillFirstButton.disabled = false;
      }
    }
  };
  quickActionsDiv.appendChild(fillFirstButton);
  
  // زر ملء البيانات وحفظها تلقائيًا
  const fillAndSaveButton = document.createElement("button");
  fillAndSaveButton.className = "ima-btn ima-btn-primary";
  fillAndSaveButton.innerHTML = '<span>ملء البيانات والحفظ تلقائيًا</span>';
  fillAndSaveButton.onclick = async function() {
    if (items.length > 0) {
      try {
        fillAndSaveButton.innerHTML = '<span class="ima-loader"></span><span>جاري ملء البيانات والحفظ...</span>';
        fillAndSaveButton.disabled = true;
        
        // استخدام محرك الإدخال المحسن
        const result = await enhancedFillForm(items[0]);
        
        if (result.success) {
          // البحث عن زر الحفظ والضغط عليه
          const saveResult = await findAndClickSubmitButton();
          
          if (saveResult.success) {
            showNotification(`تم ملء ${result.filled.length} حقل والضغط على زر الحفظ بنجاح`, "success");
            updateItemStatus(items[0].id, "success", "تم الإدخال والحفظ بنجاح");
          } else {
            showNotification("تم ملء البيانات لكن لم يتم العثور على زر الحفظ", "error");
            updateItemStatus(items[0].id, "warning", "تم ملء البيانات لكن فشل الحفظ التلقائي");
          }
        } else {
          showNotification(result.message, "error");
          updateItemStatus(items[0].id, "error", result.message);
        }
      } catch (error) {
        console.error("خطأ في ملء البيانات والحفظ:", error);
        showNotification("حدث خطأ أثناء ملء البيانات", "error");
      } finally {
        fillAndSaveButton.innerHTML = '<span>ملء البيانات والحفظ تلقائيًا</span>';
        fillAndSaveButton.disabled = false;
      }
    }
  };
  quickActionsDiv.appendChild(fillAndSaveButton);
  
  // زر عرض كل العناصر
  const showAllButton = document.createElement("button");
  showAllButton.className = "ima-btn ima-btn-secondary";
  showAllButton.textContent = "عرض جميع العناصر";
  showAllButton.onclick = function() {
    const itemsContainer = document.getElementById("ima-items-container");
    if (itemsContainer) {
      if (itemsContainer.style.display === "none") {
        renderItemsList(items, itemsContainer);
        itemsContainer.style.display = "block";
        showAllButton.textContent = "إخفاء العناصر";
      } else {
        itemsContainer.style.display = "none";
        showAllButton.textContent = "عرض جميع العناصر";
      }
    }
  };
  quickActionsDiv.appendChild(showAllButton);
  
  // زر إغلاق الأداة
  const closeToolButton = document.createElement("button");
  closeToolButton.className = "ima-btn ima-btn-danger";
  closeToolButton.textContent = "إغلاق الأداة";
  closeToolButton.onclick = function() {
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
      controlPanel = null;
    }
  };
  quickActionsDiv.appendChild(closeToolButton);
  
  content.appendChild(quickActionsDiv);

  // إنشاء حاوية العناصر (مخفية افتراضيًا)
  const itemsContainer = document.createElement("div");
  itemsContainer.id = "ima-items-container";
  itemsContainer.style.display = "none";
  content.appendChild(itemsContainer);

  controlPanel.appendChild(content);
  document.body.appendChild(controlPanel);
}

// تصيير قائمة العناصر
function renderItemsList(items: any[], container: HTMLElement) {
  container.innerHTML = "";
  
  if (items.length === 0) {
    container.innerHTML = `<div class="ima-info">لا توجد عناصر متاحة</div>`;
    return;
  }

  // إنشاء عنصر لكل عنصر في القائمة
  items.forEach((item, index) => {
    const itemElement = document.createElement("div");
    itemElement.className = "ima-item";
    
    // عنوان العنصر
    const itemHeader = document.createElement("div");
    itemHeader.className = "ima-item-header";
    
    const itemTitle = document.createElement("h4");
    itemTitle.className = "ima-item-title";
    itemTitle.textContent = `${index + 1}. ${item.senderName || 'بدون اسم'} - ${item.code || 'بدون كود'}`;
    itemHeader.appendChild(itemTitle);
    
    // شارة الحالة
    const statusBadge = document.createElement("span");
    statusBadge.className = `ima-badge ima-badge-${item.status === "success" ? "success" : (item.status === "error" ? "error" : "pending")}`;
    statusBadge.textContent = item.status === "success" ? "تم" : (item.status === "error" ? "فشل" : "جديد");
    itemHeader.appendChild(statusBadge);
    
    itemElement.appendChild(itemHeader);
    
    // تفاصيل العنصر
    const phoneDetail = document.createElement("div");
    phoneDetail.className = "ima-item-detail";
    phoneDetail.textContent = `رقم الهاتف: ${item.phoneNumber || 'غير محدد'}`;
    itemElement.appendChild(phoneDetail);
    
    const provinceDetail = document.createElement("div");
    provinceDetail.className = "ima-item-detail";
    provinceDetail.textContent = `المحافظة: ${item.province || 'غير محددة'}`;
    itemElement.appendChild(provinceDetail);
    
    if (item.price) {
      const priceDetail = document.createElement("div");
      priceDetail.className = "ima-item-detail";
      priceDetail.textContent = `السعر: ${item.price}`;
      itemElement.appendChild(priceDetail);
    }
    
    // تذييل العنصر (أزرار الإجراءات)
    const itemFooter = document.createElement("div");
    itemFooter.className = "ima-item-footer";
    
    const fillButton = document.createElement("button");
    fillButton.className = "ima-btn ima-btn-secondary";
    fillButton.style.margin = "0";
    fillButton.style.fontSize = "12px";
    fillButton.style.padding = "6px 10px";
    fillButton.textContent = "ملء البيانات";
    fillButton.onclick = async function() {
      try {
        fillButton.innerHTML = '<span class="ima-loader"></span><span>جاري...</span>';
        fillButton.disabled = true;
        
        const result = await enhancedFillForm(item);
        
        if (result.success) {
          showNotification(`تم ملء ${result.filled.length} حقل بنجاح`, "success");
          updateItemStatus(item.id, "success", `تم إدخال ${result.filled.length} حقل من أصل ${result.attempted}`);
          
          // تحديث شارة الحالة
          statusBadge.className = "ima-badge ima-badge-success";
          statusBadge.textContent = "تم";
        } else {
          showNotification(result.message, "error");
          updateItemStatus(item.id, "error", result.message);
          
          // تحديث شارة الحالة
          statusBadge.className = "ima-badge ima-badge-error";
          statusBadge.textContent = "فشل";
        }
      } catch (error) {
        console.error("خطأ في ملء البيانات:", error);
        showNotification("حدث خطأ أثناء ملء البيانات", "error");
      } finally {
        fillButton.textContent = "ملء البيانات";
        fillButton.disabled = false;
      }
    };
    itemFooter.appendChild(fillButton);
    
    const fillAndSaveButton = document.createElement("button");
    fillAndSaveButton.className = "ima-btn ima-btn-primary";
    fillAndSaveButton.style.margin = "0";
    fillAndSaveButton.style.fontSize = "12px";
    fillAndSaveButton.style.padding = "6px 10px";
    fillAndSaveButton.textContent = "ملء وحفظ";
    fillAndSaveButton.onclick = async function() {
      try {
        fillAndSaveButton.innerHTML = '<span class="ima-loader"></span><span>جاري...</span>';
        fillAndSaveButton.disabled = true;
        
        const result = await enhancedFillForm(item);
        
        if (result.success) {
          // البحث عن زر الحفظ والضغط عليه
          const saveResult = await findAndClickSubmitButton();
          
          if (saveResult.success) {
            showNotification(`تم ملء ${result.filled.length} حقل والضغط على زر الحفظ بنجاح`, "success");
            updateItemStatus(item.id, "success", "تم الإدخال والحفظ بنجاح");
            
            // تحديث شارة الحالة
            statusBadge.className = "ima-badge ima-badge-success";
            statusBadge.textContent = "تم";
          } else {
            showNotification("تم ملء البيانات لكن لم يتم العثور على زر الحفظ", "error");
            updateItemStatus(item.id, "warning", "تم ملء البيانات لكن فشل الحفظ التلقائي");
            
            // تحديث شارة الحالة
            statusBadge.className = "ima-badge ima-badge-warning";
            statusBadge.textContent = "جزئي";
          }
        } else {
          showNotification(result.message, "error");
          updateItemStatus(item.id, "error", result.message);
          
          // تحديث شارة الحالة
          statusBadge.className = "ima-badge ima-badge-error";
          statusBadge.textContent = "فشل";
        }
      } catch (error) {
        console.error("خطأ في ملء البيانات والحفظ:", error);
        showNotification("حدث خطأ أثناء ملء البيانات", "error");
      } finally {
        fillAndSaveButton.textContent = "ملء وحفظ";
        fillAndSaveButton.disabled = false;
      }
    };
    itemFooter.appendChild(fillAndSaveButton);
    
    itemElement.appendChild(itemFooter);
    
    container.appendChild(itemElement);
  });
}

// عرض إشعار
function showNotification(message: string, type: "success" | "error" | "info" = "info") {
  // إزالة الإشعارات السابقة
  const existingNotifications = document.querySelectorAll(".ima-notification");
  existingNotifications.forEach(n => n.parentNode?.removeChild(n));
  
  // إنشاء الإشعار الجديد
  const notification = document.createElement("div");
  notification.className = `ima-notification ima-notification-${type}`;
  notification.textContent = message;
  
  // إضافة الإشعار للصفحة
  document.body.appendChild(notification);
  
  // عرض الإشعار بعد لحظة (للسماح بالانتقال)
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  
  // إخفاء الإشعار بعد فترة
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// تحديث حالة العنصر في التخزين المحلي
function updateItemStatus(itemId: string, status: "success" | "error" | "warning" | "ready", message: string) {
  try {
    const storageKey = "bookmarklet_data_v1";
    const storageData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    if (storageData.items && Array.isArray(storageData.items)) {
      const updatedItems = storageData.items.map(item => {
        if (item.id === itemId) {
          const now = new Date();
          return { 
            ...item, 
            status: status, 
            message: message, 
            lastUpdated: now.toISOString() 
          };
        }
        return item;
      });
      
      storageData.items = updatedItems;
      storageData.lastUpdated = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      
      console.log("تم تحديث حالة العنصر:", itemId, status);
    }
  } catch (e) {
    console.error("خطأ في تحديث حالة العنصر:", e);
  }
}

// محرك ملء النماذج المحسن
async function enhancedFillForm(item: any): Promise<FormFillerResults> {
  console.log("بدء ملء النموذج بالبيانات:", item);
  
  if (!item) {
    return { 
      filled: [], 
      failed: [], 
      message: 'لا توجد بيانات للملء', 
      success: false, 
      attempted: 0 
    };
  }
  
  // النتائج
  const results: FormFillerResults = {
    filled: [],
    failed: [],
    message: '',
    success: false,
    attempted: 0
  };
  
  // تحديد الحقول المطلوبة
  const fieldMappings = [
    {
      key: 'code',
      label: 'رقم الوصل',
      value: item.code || '',
      required: true,
      selectors: [
        'input[name*="code"]',
        'input[id*="code"]',
        'input[placeholder*="رقم الوصل"]',
        'input[placeholder*="رقم البوليصة"]',
        'input[placeholder*="رقم الشحنة"]',
        'input[placeholder*="رقم الطلب"]',
        'input[name*="order"]',
        'input[id*="order"]',
        'input[name*="tracking"]',
        'input[id*="tracking"]',
        'input[name*="reference"]',
        'input[id*="reference"]'
      ]
    },
    {
      key: 'phoneNumber',
      label: 'رقم الهاتف',
      value: item.phoneNumber ? item.phoneNumber.replace(/\D/g, '') : '',
      required: true,
      selectors: [
        'input[name*="phone"]',
        'input[id*="phone"]',
        'input[type="tel"]',
        'input[placeholder*="رقم الهاتف"]',
        'input[placeholder*="موبايل"]',
        'input[placeholder*="جوال"]',
        'input[name*="mobile"]',
        'input[id*="mobile"]',
        'input[placeholder*="تليفون"]',
        'input[name*="tel"]',
        'input[id*="tel"]'
      ]
    },
    {
      key: 'senderName',
      label: 'اسم المرسل',
      value: item.senderName || item.customerName || '',
      required: true,
      selectors: [
        'input[name*="sender"]',
        'input[name*="customer"]',
        'input[id*="sender"]',
        'input[id*="customer"]',
        'input[placeholder*="اسم المرسل"]',
        'input[placeholder*="اسم العميل"]',
        'input[placeholder*="الزبون"]',
        'input[placeholder*="المرسل"]',
        'input[name*="client"]',
        'input[id*="client"]',
        'input[name="name"]'
      ]
    },
    {
      key: 'recipientName',
      label: 'اسم المستلم',
      value: item.recipientName || '',
      required: false,
      selectors: [
        'input[name*="recipient"]',
        'input[name*="receiver"]',
        'input[id*="recipient"]',
        'input[id*="receiver"]',
        'input[placeholder*="اسم المستلم"]',
        'input[placeholder*="المستلم"]',
        'input[name*="consignee"]',
        'input[id*="consignee"]'
      ]
    },
    {
      key: 'province',
      label: 'المحافظة',
      value: item.province || item.area || '',
      required: true,
      selectors: [
        'select[name*="province"]',
        'select[id*="province"]',
        'select[name*="city"]',
        'select[id*="city"]',
        'select[placeholder*="المحافظة"]',
        'select[placeholder*="المدينة"]',
        'select[name*="governorate"]',
        'select[id*="governorate"]',
        'select[name*="area"]',
        'select[id*="area"]',
        'select[placeholder*="منطقة"]',
        'input[name*="province"]',
        'input[id*="province"]',
        'input[placeholder*="المحافظة"]'
      ]
    },
    {
      key: 'price',
      label: 'المبلغ',
      value: item.price ? item.price.replace(/[^\d.]/g, '') : '',
      required: false,
      selectors: [
        'input[name*="price"]',
        'input[name*="amount"]',
        'input[id*="price"]',
        'input[id*="amount"]',
        'input[placeholder*="المبلغ"]',
        'input[placeholder*="السعر"]',
        'input[type="number"]',
        'input[name*="total"]',
        'input[id*="total"]',
        'input[name*="cost"]',
        'input[id*="cost"]',
        'input[placeholder*="التكلفة"]'
      ]
    },
    {
      key: 'notes',
      label: 'ملاحظات',
      value: item.notes || '',
      required: false,
      selectors: [
        'textarea[name*="note"]',
        'textarea[id*="note"]',
        'textarea[placeholder*="ملاحظات"]',
        'textarea[name*="comment"]',
        'textarea[id*="comment"]',
        'textarea[placeholder*="تعليق"]',
        'input[name*="note"]',
        'input[id*="note"]',
        'input[placeholder*="ملاحظات"]'
      ]
    },
    {
      key: 'packageType',
      label: 'نوع البضاعة',
      value: item.packageType || 'بضائع متنوعة',
      required: false,
      selectors: [
        'select[name*="type"]',
        'select[id*="type"]',
        'select[name*="product"]',
        'select[id*="product"]',
        'select[placeholder*="نوع البضاعة"]',
        'input[name*="type"]',
        'input[id*="type"]',
        'input[placeholder*="نوع البضاعة"]',
        'textarea[name*="product"]',
        'textarea[id*="product"]',
        'textarea[placeholder*="نوع البضاعة"]'
      ]
    }
  ];

  // البحث في عناصر الصفحة للعثور على الحقول المناسبة
  const forms = document.querySelectorAll('form');
  console.log(`وجدت ${forms.length} نموذج في الصفحة`);
  
  const allFields = document.querySelectorAll('input, select, textarea');
  console.log(`وجدت ${allFields.length} حقل في الصفحة`);
  
  // محاولة ملء الحقول باستخدام كل استراتيجيات التحديد
  for (const mapping of fieldMappings) {
    results.attempted++;
    let filled = false;
    
    // الاستراتيجية 1: البحث باستخدام المحددات المباشرة
    if (!filled) {
      for (const selector of mapping.selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const element = elements[0] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          console.log(`وجدت عنصر للحقل ${mapping.key} باستخدام المحدد ${selector}`);
          
          filled = await fillFieldWithMultipleStrategies(element, mapping.value);
          if (filled) {
            console.log(`تم ملء الحقل ${mapping.key} بنجاح باستخدام محدد مباشر`);
            results.filled.push(mapping.key);
            break;
          }
        }
      }
    }
    
    // الاستراتيجية 2: البحث باستخدام تسميات الحقول
    if (!filled) {
      const labels = document.querySelectorAll('label');
      for (const label of Array.from(labels)) {
        const labelText = label.textContent?.trim().toLowerCase() || '';
        if (labelText.includes(mapping.label.toLowerCase())) {
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            const element = document.getElementById(forAttr) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            if (element) {
              console.log(`وجدت عنصر للحقل ${mapping.key} باستخدام تسمية الحقل`);
              
              filled = await fillFieldWithMultipleStrategies(element, mapping.value);
              if (filled) {
                console.log(`تم ملء الحقل ${mapping.key} بنجاح باستخدام تسمية الحقل`);
                results.filled.push(mapping.key);
                break;
              }
            }
          }
        }
      }
    }
    
    // الاستراتيجية 3: البحث باستخدام placeholder أو aria-label
    if (!filled) {
      for (const field of Array.from(allFields)) {
        const placeholder = (field as HTMLInputElement).placeholder?.toLowerCase() || '';
        const ariaLabel = field.getAttribute('aria-label')?.toLowerCase() || '';
        
        if (placeholder.includes(mapping.label.toLowerCase()) || ariaLabel.includes(mapping.label.toLowerCase())) {
          console.log(`وجدت عنصر للحقل ${mapping.key} باستخدام placeholder أو aria-label`);
          
          filled = await fillFieldWithMultipleStrategies(field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, mapping.value);
          if (filled) {
            console.log(`تم ملء الحقل ${mapping.key} بنجاح باستخدام placeholder أو aria-label`);
            results.filled.push(mapping.key);
            break;
          }
        }
      }
    }
    
    // الاستراتيجية 4: البحث في النصوص المحيطة بالحقول
    if (!filled) {
      for (const field of Array.from(allFields)) {
        const surroundingText = getSurroundingText(field);
        if (surroundingText.toLowerCase().includes(mapping.label.toLowerCase())) {
          console.log(`وجدت عنصر للحقل ${mapping.key} باستخدام النصوص المحيطة`);
          
          filled = await fillFieldWithMultipleStrategies(field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, mapping.value);
          if (filled) {
            console.log(`تم ملء الحقل ${mapping.key} بنجاح باستخدام النصوص المحيطة`);
            results.filled.push(mapping.key);
            break;
          }
        }
      }
    }
    
    // إذا لم نجد الحقل بأي استراتيجية
    if (!filled) {
      console.log(`لم يتم العثور على حقل مناسب للمفتاح: ${mapping.key}`);
      results.failed.push(mapping.key);
    }
  }
  
  // تحديد نجاح العملية
  if (results.filled.length > 0) {
    results.success = true;
    results.message = `تم ملء ${results.filled.length} حقل بنجاح`;
  } else {
    results.success = false;
    results.message = "لم يتم العثور على حقول مناسبة أو ملؤها";
  }
  
  return results;
}

// الحصول على النصوص المحيطة بعنصر ما
function getSurroundingText(element: Element): string {
  let text = '';
  
  // البحث في العناصر المجاورة
  let sibling = element.previousElementSibling;
  while (sibling && text.length < 100) {
    if (sibling.tagName !== 'INPUT' && sibling.tagName !== 'SELECT' && sibling.tagName !== 'TEXTAREA') {
      text += ' ' + (sibling.textContent || '');
    }
    sibling = sibling.previousElementSibling;
  }
  
  // البحث في العنصر الأب
  if (element.parentElement) {
    // الحصول على النص المباشر من العنصر الأب (باستثناء نصوص العناصر الفرعية)
    for (const node of Array.from(element.parentElement.childNodes)) {
      if (node.nodeType === 3) { // النوع 3 = عقدة نصية
        text += ' ' + (node.textContent || '');
      }
    }
    
    // البحث في عناصر div أو span داخل العنصر الأب
    const parentElements = element.parentElement.querySelectorAll('div, span, label');
    for (const el of Array.from(parentElements)) {
      if (!el.contains(element) && el.textContent) {
        text += ' ' + el.textContent;
      }
    }
  }
  
  return text.trim();
}

// ملء الحقول باستخدام استراتيجيات متعددة
async function fillFieldWithMultipleStrategies(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): Promise<boolean> {
  if (!element || value === undefined) return false;
  
  let filled = false;
  
  // الاستراتيجية 1: التعيين المباشر
  try {
    if (element.tagName === 'SELECT') {
      filled = fillSelectField(element as HTMLSelectElement, value);
    } else {
      // التعيين المباشر للقيمة
      element.value = value;
      
      // إطلاق أحداث
      ['input', 'change', 'blur'].forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      filled = element.value === value;
    }
  } catch (e) {
    console.warn("فشل في استراتيجية التعيين المباشر:", e);
  }
  
  // الاستراتيجية 2: تعريف خاصية
  if (!filled) {
    try {
      // استخدام Object.defineProperty
      const descriptor = Object.getOwnPropertyDescriptor(element, 'value');
      const originalSetter = descriptor?.set;
      
      Object.defineProperty(element, 'value', {
        get: function() {
          return value;
        },
        set: function(newVal) {
          if (originalSetter) originalSetter.call(this, value);
        },
        configurable: true
      });
      
      // إطلاق أحداث
      ['input', 'change', 'blur'].forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      // استعادة المعرف الأصلي
      setTimeout(() => {
        if (descriptor) {
          Object.defineProperty(element, 'value', descriptor);
        }
      }, 500);
      
      filled = element.value === value;
    } catch (e) {
      console.warn("فشل في استراتيجية تعريف الخاصية:", e);
    }
  }
  
  // الاستراتيجية 3: محاكاة كتابة المستخدم
  if (!filled && element.tagName !== 'SELECT') {
    try {
      element.focus();
      
      // محاكاة الكتابة حرفًا بحرف
      element.value = '';
      for (let i = 0; i < value.length; i++) {
        element.value += value[i];
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      element.blur();
      filled = element.value === value;
    } catch (e) {
      console.warn("فشل في استراتيجية محاكاة الكتابة:", e);
    }
  }
  
  // الاستراتيجية 4: استخدام الحافظة
  if (!filled && element.tagName !== 'SELECT') {
    try {
      // حفظ قيمة الحافظة الحالية
      const originalClipboard = await navigator.clipboard.readText().catch(() => '');
      
      // نسخ القيمة الجديدة إلى الحافظة
      await navigator.clipboard.writeText(value);
      
      // التركيز على العنصر ولصق القيمة
      element.focus();
      document.execCommand('selectAll');
      document.execCommand('paste');
      element.blur();
      
      // استعادة قيمة الحافظة الأصلية
      await navigator.clipboard.writeText(originalClipboard);
      
      filled = element.value === value;
    } catch (e) {
      console.warn("فشل في استراتيجية الحافظة:", e);
    }
  }
  
  return filled;
}

// ملء حقول القائمة المنسدلة
function fillSelectField(element: HTMLSelectElement, value: string): boolean {
  if (!element || !value) return false;
  
  // الحصول على قائمة الخيارات
  const options = Array.from(element.options);
  const searchValue = value.trim().toLowerCase();
  
  // البحث عن تطابق دقيق
  let matchedOption = options.find(opt => 
    opt.text.trim().toLowerCase() === searchValue || 
    opt.value.toLowerCase() === searchValue
  );
  
  // إذا لم نجد تطابقًا دقيقًا، ابحث عن تطابق جزئي
  if (!matchedOption) {
    matchedOption = options.find(opt => 
      opt.text.trim().toLowerCase().includes(searchValue) || 
      searchValue.includes(opt.text.trim().toLowerCase())
    );
  }
  
  // إذا وجدنا خيارًا مطابقًا
  if (matchedOption) {
    // تحديد الخيار
    element.value = matchedOption.value;
    
    // إطلاق حدث التغيير
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  // إذا لم نجد تطابقًا، حاول استخدام أول خيار غير فارغ
  if (options.length > 0) {
    for (const option of options) {
      if (option.value && option.text.trim() !== '') {
        element.value = option.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`لم يتم العثور على تطابق للقيمة ${value}، استخدام الخيار الأول: ${option.text}`);
        return true;
      }
    }
  }
  
  return false;
}

// البحث عن زر الإرسال والضغط عليه
async function findAndClickSubmitButton(): Promise<{success: boolean, message: string}> {
  console.log("البحث عن زر الإرسال/الحفظ...");
  
  // محددات محتملة لزر الإرسال/الحفظ
  const submitButtonSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:contains("حفظ")',
    'button:contains("إرسال")',
    'button:contains("تأكيد")',
    'button:contains("احفظ")',
    'button:contains("إضافة")',
    'input[value="حفظ"]',
    'input[value="إرسال"]',
    'input[value="تأكيد"]',
    '.btn-save',
    '.save-button',
    '.submit-button',
    '.btn-primary',
    '.btn-success'
  ];
  
  // محاولة العثور على الزر باستخدام المحددات
  for (const selector of submitButtonSelectors) {
    try {
      // معالجة محددات بالنص
      if (selector.includes(':contains')) {
        const textToFind = selector.match(/:contains\("([^"]+)"\)/)?.[1] || '';
        const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
        
        for (const button of Array.from(allButtons)) {
          const buttonText = button.textContent?.trim() || '';
          if (buttonText.includes(textToFind)) {
            console.log(`وجدت زر بالنص "${textToFind}"`);
            
            (button as HTMLElement).click();
            return { success: true, message: `تم النقر على زر "${textToFind}"` };
          }
        }
      } else {
        // المحددات العادية
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
          console.log(`وجدت زر باستخدام المحدد "${selector}"`);
          
          (buttons[0] as HTMLElement).click();
          return { success: true, message: `تم النقر على زر باستخدام المحدد "${selector}"` };
        }
      }
    } catch (e) {
      console.warn(`خطأ في محاولة العثور على زر باستخدام المحدد "${selector}":`, e);
    }
  }
  
  // استراتيجية متقدمة: تخمين زر الإرسال/الحفظ
  // 1. الأزرار في نهاية النموذج
  const forms = document.querySelectorAll('form');
  for (const form of Array.from(forms)) {
    const formButtons = form.querySelectorAll('button, input[type="submit"], input[type="button"]');
    if (formButtons.length > 0) {
      // آخر زر في النموذج غالبًا ما يكون زر الإرسال
      const lastButton = formButtons[formButtons.length - 1] as HTMLElement;
      console.log("وجدت آخر زر في النموذج");
      
      lastButton.click();
      return { success: true, message: "تم النقر على آخر زر في النموذج" };
    }
  }
  
  // 2. زر في أسفل الصفحة مع خصائص تشير إلى أنه زر حفظ
  const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  
  // ترتيب الأزرار حسب موقعها
  const sortedButtons = Array.from(allButtons).sort((a, b) => {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    return rectB.top - rectA.top; // ترتيب من الأسفل إلى الأعلى
  });
  
  // حاول النقر على الزر الأكثر احتمالا
  for (const button of sortedButtons) {
    const buttonText = button.textContent?.trim().toLowerCase() || '';
    const buttonType = (button as HTMLInputElement).type?.toLowerCase() || '';
    const buttonValue = (button as HTMLInputElement).value?.toLowerCase() || '';
    const buttonClassName = button.className.toLowerCase() || '';
    
    // التحقق مما إذا كان هذا الزر هو على الأرجح زر الحفظ
    if (
      buttonText.includes('حفظ') || 
      buttonText.includes('إرسال') || 
      buttonText.includes('تأكيد') || 
      buttonText.includes('احفظ') || 
      buttonText.includes('إضافة') ||
      buttonValue.includes('حفظ') || 
      buttonValue.includes('إرسال') || 
      buttonValue.includes('تأكيد') ||
      buttonType === 'submit' ||
      buttonClassName.includes('save') ||
      buttonClassName.includes('submit') ||
      buttonClassName.includes('primary') ||
      buttonClassName.includes('success')
    ) {
      console.log("وجدت زر يشبه زر الحفظ في أسفل الصفحة");
      
      (button as HTMLElement).click();
      return { success: true, message: "تم النقر على زر يشبه زر الحفظ" };
    }
  }
  
  // إذا لم نجد أي زر مناسب
  return { success: false, message: "لم يتم العثور على زر مناسب للحفظ" };
}

export function initEnhancedFormFiller() {
  console.log("بدء تشغيل محرك ملء النماذج المحسّن");
  
  try {
    // التحقق من وجود البيانات
    const storageKey = "bookmarklet_data_v1";
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      alert("لا توجد بيانات مخزنة للاستخدام. يرجى تصدير البيانات أولاً من التطبيق.");
      return;
    }
    
    // تحليل البيانات
    const parsedData = JSON.parse(data);
    const items = parsedData.items || [];
    
    if (items.length === 0) {
      alert("لا توجد عناصر مخزنة للاستخدام.");
      return;
    }
    
    // إنشاء لوحة التحكم
    createControlPanel(items);
    
    console.log("تم تهيئة أداة الإدخال التلقائي المحسّنة بنجاح");
  } catch (error) {
    console.error("خطأ في تهيئة أداة الإدخال التلقائي المحسّنة:", error);
    alert("حدث خطأ في تشغيل الأداة: " + (error as Error).message);
  }
}
