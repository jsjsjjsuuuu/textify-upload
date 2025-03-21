import React, { useState, useEffect } from 'react';
import { AutomationConfig, AutomationAction } from '@/utils/automation/types';
import { AutomationService } from '@/utils/automationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, PlusCircle, Trash2, Edit, Save, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import ActionEditor from './ActionEditor';
import { getAutomationServerUrl, isPreviewEnvironment } from '@/utils/automationServerUrl';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutomationControllerProps {
  defaultUrl?: string;
}

interface ExtractedDataType {
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  address?: string;
  notes?: string;
  sourceId?: string;
}

const AutomationController: React.FC<AutomationControllerProps> = ({ defaultUrl = '' }) => {
  const [projectUrl, setProjectUrl] = useState(defaultUrl);
  const [projectName, setProjectName] = useState('مشروع أتمتة جديد');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataType | null>(null);

  // التحقق من حالة اتصال الخادم عند تحميل المكون
  useEffect(() => {
    checkServerConnection();
    
    // التحقق من وجودنا في بيئة المعاينة
    const previewMode = isPreviewEnvironment();
    setIsPreviewMode(previewMode);
    
    if (previewMode) {
      toast.warning("أنت في بيئة المعاينة. ستعمل الأتمتة في وضع المحاكاة فقط ولن تتصل بالمواقع الخارجية.", {
        duration: 5000,
      });
    }
    
    // التحقق من وجود بيانات مستخرجة
    const savedData = localStorage.getItem('automationData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setExtractedData(parsedData);
        if (parsedData.companyName) {
          setProjectName(`أتمتة بيانات ${parsedData.companyName}`);
        }
      } catch (error) {
        console.error("خطأ في قراءة البيانات المستخرجة:", error);
      }
    }
  }, []);

  const checkServerConnection = async () => {
    try {
      const status = await AutomationService.checkServerStatus(false);
      setServerConnected(true);
    } catch (error) {
      setServerConnected(false);
      toast.error('تعذر الاتصال بخادم الأتمتة. يرجى التحقق من إعدادات الخادم.');
    }
  };

  const handleAddAction = () => {
    const newAction: AutomationAction = {
      name: `إجراء ${actions.length + 1}`,
      finder: '',
      value: '',
      delay: 500
    };
    setActions([...actions, newAction]);
    setEditingActionIndex(actions.length);
  };

  const handleSaveAction = (action: AutomationAction, index: number) => {
    const newActions = [...actions];
    newActions[index] = action;
    setActions(newActions);
    setEditingActionIndex(null);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    setActions(newActions);
  };

  const handleEditAction = (index: number) => {
    setEditingActionIndex(index);
  };

  const runAutomation = async () => {
    if (!projectUrl) {
      toast.error('يرجى إدخال رابط المشروع');
      return;
    }

    if (actions.length === 0) {
      toast.error('يرجى إضافة إجراء واحد على الأقل');
      return;
    }

    setIsRunning(true);
    toast.info('جاري تنفيذ الأتمتة...', { duration: 3000 });

    try {
      const config: AutomationConfig = {
        projectName,
        projectUrl,
        actions,
        automationType: 'server',
        useBrowserData: true
      };

      const result = await AutomationService.validateAndRunAutomation(config);
      
      if (result.success) {
        toast.success('تم تنفيذ الأتمتة بنجاح!');
        
        // إذا كان المصدر من بيانات مستخرجة، نحذف البيانات المؤقتة
        if (extractedData && extractedData.sourceId) {
          localStorage.removeItem('automationData');
          setExtractedData(null);
        }
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveAutomationConfig = () => {
    try {
      const config = {
        id: uuidv4(),
        name: projectName,
        url: projectUrl,
        actions,
        createdAt: new Date().toISOString()
      };
      
      // حفظ التكوين في التخزين المحلي
      const savedConfigs = JSON.parse(localStorage.getItem('automationConfigs') || '[]');
      localStorage.setItem('automationConfigs', JSON.stringify([...savedConfigs, config]));
      
      toast.success('تم حفظ تكوين الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ التكوين');
    }
  };
  
  const handleClearExtractedData = () => {
    localStorage.removeItem('automationData');
    setExtractedData(null);
    toast.info('تم مسح البيانات المستخرجة');
  };
  
  // تحسين وظيفة إنشاء إجراءات تلقائية بناءً على البيانات المستخرجة مع محددات متعددة وأكثر مرونة
  const generateActionsFromExtractedData = () => {
    if (!extractedData) return;
    
    const newActions: AutomationAction[] = [];
    
    // محددات محسنة ومتعددة لكل حقل من البيانات المستخرجة
    if (extractedData.code) {
      newActions.push({
        name: 'إدخال الكود',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل الكود
        finder: [
          // محددات CSS
          'input[name*="code"], input[id*="code"], input[name*="reference"], input[id*="reference"], input[placeholder*="كود"], input[placeholder*="رقم الوصل"], input[placeholder*="رقم الشحنة"], input[name*="wasl"], input[id*="wasl"], input[name*="order"], input[id*="order"], input[name*="tracking"], input[id*="tracking"], input[name="bill_number"], input[name="shipment_number"]',
          // محددات XPath
          '//input[contains(@name, "code") or contains(@id, "code")]',
          '//input[contains(@name, "order") or contains(@id, "order")]',
          '//input[contains(@name, "reference") or contains(@id, "reference")]',
          '//input[contains(@name, "tracking") or contains(@id, "tracking")]',
          '//input[contains(@name, "wasl") or contains(@id, "wasl")]',
          '//input[contains(@placeholder, "رقم") and contains(@placeholder, "وصل")]',
          '//input[contains(@placeholder, "رقم") and contains(@placeholder, "شحنة")]',
          '//input[contains(@placeholder, "رقم") and contains(@placeholder, "طلب")]',
          '//input[contains(@placeholder, "كود")]',
          '//label[contains(text(), "رقم الوصل") or contains(text(), "رقم الشحنة") or contains(text(), "رقم الطلب") or contains(text(), "الكود")]/following::input[1]',
          '//span[contains(text(), "رقم الوصل") or contains(text(), "رقم الشحنة") or contains(text(), "رقم الطلب") or contains(text(), "الكود")]/following::input[1]',
          '//div[contains(text(), "رقم الوصل") or contains(text(), "رقم الشحنة") or contains(text(), "رقم الطلب") or contains(text(), "الكود")]/following::input[1]'
        ].join(', '),
        value: extractedData.code,
        delay: 500
      });
    }
    
    if (extractedData.senderName) {
      newActions.push({
        name: 'إدخال اسم المرسل',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل اسم المرسل
        finder: [
          // محددات CSS
          'input[name*="sender"], input[id*="sender"], input[name*="customer"], input[id*="customer"], input[name*="client"], input[id*="client"], input[name*="name"], input[id*="name"], input[placeholder*="اسم المرسل"], input[placeholder*="اسم العميل"], input[placeholder*="اسم الزبون"], select[name*="client"], select[id*="client"], select[name*="customer"], select[id*="customer"]',
          // محددات XPath
          '//input[contains(@name, "sender") or contains(@id, "sender")]',
          '//input[contains(@name, "customer") or contains(@id, "customer")]',
          '//input[contains(@name, "client") or contains(@id, "client")]',
          '//input[contains(@name, "name") or contains(@id, "name")]',
          '//input[contains(@placeholder, "اسم") and (contains(@placeholder, "مرسل") or contains(@placeholder, "عميل") or contains(@placeholder, "زبون"))]',
          '//select[contains(@name, "client") or contains(@id, "client")]',
          '//select[contains(@name, "customer") or contains(@id, "customer")]',
          '//label[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::input[1]',
          '//span[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::input[1]',
          '//div[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::input[1]',
          '//label[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::select[1]',
          '//span[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::select[1]',
          '//div[contains(text(), "اسم المرسل") or contains(text(), "اسم العميل") or contains(text(), "اسم الزبون")]/following::select[1]'
        ].join(', '),
        value: extractedData.senderName,
        delay: 500
      });
    }
    
    if (extractedData.phoneNumber) {
      newActions.push({
        name: 'إدخال رقم الهاتف',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل رقم الهاتف
        finder: [
          // محددات CSS
          'input[name*="phone"], input[id*="phone"], input[name*="mobile"], input[id*="mobile"], input[type="tel"], input[placeholder*="رقم الهاتف"], input[placeholder*="الهاتف"], input[placeholder*="الموبايل"], input[placeholder*="الجوال"], input[placeholder*="تليفون"], input[name*="tel"], input[id*="tel"], input[name="client_phone"], input[id="client_phone"], input[name="customer_mobile"], input[id="customer_mobile"]',
          // محددات XPath
          '//input[contains(@name, "phone") or contains(@id, "phone")]',
          '//input[contains(@name, "mobile") or contains(@id, "mobile")]',
          '//input[contains(@name, "tel") or contains(@id, "tel")]',
          '//input[@type="tel"]',
          '//input[contains(@placeholder, "رقم") and (contains(@placeholder, "هاتف") or contains(@placeholder, "موبايل") or contains(@placeholder, "جوال"))]',
          '//input[contains(@placeholder, "تليفون")]',
          '//label[contains(text(), "رقم الهاتف") or contains(text(), "الهاتف") or contains(text(), "الموبايل") or contains(text(), "الجوال")]/following::input[1]',
          '//span[contains(text(), "رقم الهاتف") or contains(text(), "الهاتف") or contains(text(), "الموبايل") or contains(text(), "الجوال")]/following::input[1]',
          '//div[contains(text(), "رقم الهاتف") or contains(text(), "الهاتف") or contains(text(), "الموبايل") or contains(text(), "الجوال")]/following::input[1]'
        ].join(', '),
        value: extractedData.phoneNumber,
        delay: 500
      });
    }
    
    if (extractedData.province) {
      newActions.push({
        name: 'اختيار المحافظة',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل المحافظة (سواء قائمة منسدلة أو حقل نص)
        finder: [
          // محددات CSS للقوائم المنسدلة
          'select[name*="province"], select[id*="province"], select[name*="city"], select[id*="city"], select[name*="governorate"], select[id*="governorate"], select[name*="area"], select[id*="area"], select[placeholder*="المحافظة"], select[placeholder*="المدينة"], select[placeholder*="المنطقة"], select[name="destination"], select[id="destination"]',
          // محددات CSS لحقول النص
          'input[name*="province"], input[id*="province"], input[name*="city"], input[id*="city"], input[placeholder*="المحافظة"], input[placeholder*="المدينة"], input[placeholder*="المنطقة"]',
          // محددات XPath للقوائم المنسدلة
          '//select[contains(@name, "province") or contains(@id, "province")]',
          '//select[contains(@name, "city") or contains(@id, "city")]',
          '//select[contains(@name, "governorate") or contains(@id, "governorate")]',
          '//select[contains(@name, "area") or contains(@id, "area")]',
          '//select[contains(@placeholder, "محافظة") or contains(@placeholder, "مدينة") or contains(@placeholder, "منطقة")]',
          // محددات XPath لحقول النص
          '//input[contains(@name, "province") or contains(@id, "province")]',
          '//input[contains(@name, "city") or contains(@id, "city")]',
          '//input[contains(@placeholder, "محافظة") or contains(@placeholder, "مدينة") or contains(@placeholder, "منطقة")]',
          // محددات XPath عامة باستخدام النصوص القريبة
          '//label[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::select[1]',
          '//label[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::input[1]',
          '//span[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::select[1]',
          '//span[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::input[1]',
          '//div[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::select[1]',
          '//div[contains(text(), "المحافظة") or contains(text(), "المدينة") or contains(text(), "المنطقة")]/following::input[1]',
          // محددات إضافية للمصطلحات العراقية الشائعة
          '//select[contains(@name, "muhafaza") or contains(@id, "muhafaza")]',
          '//select[contains(@name, "mouhafaza") or contains(@id, "mouhafaza")]',
          '//select[contains(@placeholder, "إلى")]',
          '//div[contains(text(), "إلى")]/following::select[1]'
        ].join(', '),
        value: extractedData.province,
        delay: 500
      });
    }
    
    if (extractedData.price) {
      newActions.push({
        name: 'إدخال السعر',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل السعر
        finder: [
          // محددات CSS
          'input[name*="price"], input[id*="price"], input[name*="amount"], input[id*="amount"], input[name*="total"], input[id*="total"], input[name*="cost"], input[id*="cost"], input[placeholder*="المبلغ"], input[placeholder*="السعر"], input[placeholder*="التكلفة"], input[type="number"], input[name="total_amount"], input[id="total_amount"], input[name="cod_amount"], input[id="cod_amount"], input[name="grand_total"], input[id="grand_total"], input[name*="mablagh"], input[id*="mablagh"], input[placeholder*="المبلغ بالدينار"], input[placeholder*="سعر"], input[placeholder*="قيمة"]',
          // محددات XPath
          '//input[contains(@name, "price") or contains(@id, "price")]',
          '//input[contains(@name, "amount") or contains(@id, "amount")]',
          '//input[contains(@name, "total") or contains(@id, "total")]',
          '//input[contains(@name, "cost") or contains(@id, "cost")]',
          '//input[contains(@placeholder, "مبلغ") or contains(@placeholder, "سعر") or contains(@placeholder, "تكلفة") or contains(@placeholder, "قيمة")]',
          '//input[@type="number"]',
          '//label[contains(text(), "المبلغ") or contains(text(), "السعر") or contains(text(), "التكلفة") or contains(text(), "القيمة")]/following::input[1]',
          '//span[contains(text(), "المبلغ") or contains(text(), "السعر") or contains(text(), "التكلفة") or contains(text(), "القيمة")]/following::input[1]',
          '//div[contains(text(), "المبلغ") or contains(text(), "السعر") or contains(text(), "التكلفة") or contains(text(), "القيمة")]/following::input[1]'
        ].join(', '),
        value: extractedData.price,
        delay: 500
      });
    }
    
    if (extractedData.address) {
      newActions.push({
        name: 'إدخال العنوان',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل العنوان
        finder: [
          // محددات CSS
          'input[name*="address"], input[id*="address"], textarea[name*="address"], textarea[id*="address"], input[placeholder*="العنوان"], textarea[placeholder*="العنوان"], input[name*="location"], input[id*="location"], textarea[name*="location"], textarea[id*="location"]',
          // محددات XPath
          '//input[contains(@name, "address") or contains(@id, "address")]',
          '//textarea[contains(@name, "address") or contains(@id, "address")]',
          '//input[contains(@name, "location") or contains(@id, "location")]',
          '//textarea[contains(@name, "location") or contains(@id, "location")]',
          '//input[contains(@placeholder, "عنوان")]',
          '//textarea[contains(@placeholder, "عنوان")]',
          '//label[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::input[1]',
          '//label[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::textarea[1]',
          '//span[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::input[1]',
          '//span[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::textarea[1]',
          '//div[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::input[1]',
          '//div[contains(text(), "العنوان") or contains(text(), "الموقع")]/following::textarea[1]'
        ].join(', '),
        value: extractedData.address,
        delay: 500
      });
    }
    
    if (extractedData.notes) {
      newActions.push({
        name: 'إدخال الملاحظات',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل الملاحظات
        finder: [
          // محددات CSS
          'textarea[name*="note"], textarea[id*="note"], input[name*="note"], input[id*="note"], textarea[placeholder*="ملاحظات"], input[placeholder*="ملاحظات"], textarea[name*="comment"], textarea[id*="comment"], input[name*="comment"], input[id*="comment"]',
          // محددات XPath
          '//textarea[contains(@name, "note") or contains(@id, "note")]',
          '//input[contains(@name, "note") or contains(@id, "note")]',
          '//textarea[contains(@name, "comment") or contains(@id, "comment")]',
          '//input[contains(@name, "comment") or contains(@id, "comment")]',
          '//textarea[contains(@placeholder, "ملاحظ")]',
          '//input[contains(@placeholder, "ملاحظ")]',
          '//label[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::textarea[1]',
          '//label[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::input[1]',
          '//span[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::textarea[1]',
          '//span[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::input[1]',
          '//div[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::textarea[1]',
          '//div[contains(text(), "ملاحظات") or contains(text(), "تعليق")]/following::input[1]'
        ].join(', '),
        value: extractedData.notes,
        delay: 500
      });
    }
    
    // إضافة إجراء للنقر على زر الإرسال
    newActions.push({
      name: 'إرسال النموذج',
      // استخدام مزيج من محددات CSS و XPath للعثور على زر الإرسال
      finder: [
        // محددات CSS
        'button[type="submit"], input[type="submit"], button:contains("حفظ"), button:contains("إرسال"), button:contains("تأكيد"), button:contains("إضافة"), .submit-btn, .save-btn, #submitBtn, #saveBtn, button.btn-primary, button.btn-success',
        // محددات XPath
        '//button[@type="submit"]',
        '//input[@type="submit"]',
        '//button[contains(text(), "حفظ") or contains(text(), "إرسال") or contains(text(), "تأكيد") or contains(text(), "إضافة")]',
        '//input[contains(@value, "حفظ") or contains(@value, "إرسال") or contains(@value, "تأكيد") or contains(@value, "إضافة")]',
        '//button[contains(@class, "submit") or contains(@class, "save") or contains(@class, "primary") or contains(@class, "success")]',
        '//a[contains(@class, "btn") and (contains(text(), "حفظ") or contains(text(), "إرسال") or contains(text(), "تأكيد") or contains(text(), "إضافة"))]'
      ].join(', '),
      value: 'click',
      delay: 1000
    });
    
    setActions(newActions);
    toast.success('تم إنشاء إجراءات تلقائية من البيانات المستخرجة مع محددات متعددة');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعداد الأتمتة عبر الخادم</CardTitle>
          <CardDescription>
            قم بتكوين إجراءات الأتمتة لتنفيذها على خادم {getAutomationServerUrl()}
          </CardDescription>
        </CardHeader>
        
        {isPreviewMode && (
          <div className="px-6">
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                أنت في بيئة المعاينة (لوفابل). ستعمل الأتمتة في وضع المحاكاة فقط ولن تتصل بالمواقع الخارجية.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {extractedData && (
          <div className="px-6 mb-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700 flex justify-between items-center">
                <div>
                  <span className="font-semibold">تم استيراد البيانات المستخرجة: </span> 
                  {extractedData.code && <span className="ml-2">الكود: {extractedData.code}</span>}
                  {extractedData.senderName && <span className="ml-2">المرسل: {extractedData.senderName}</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateActionsFromExtractedData}
                    className="border-green-300 bg-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    إنشاء إجراءات تلقائية
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearExtractedData}
                    className="border-red-300 bg-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    مسح البيانات
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="أدخل اسم المشروع"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectUrl">رابط المشروع</Label>
              <Input
                id="projectUrl"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="أدخل رابط المشروع"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">الإجراءات</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAction}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                إضافة إجراء
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">لم تتم إضافة أي إجراءات بعد. اضغط على زر "إضافة إجراء" لإضافة إجراء جديد.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    {editingActionIndex === index ? (
                      <ActionEditor
                        action={action}
                        onSave={(updatedAction) => handleSaveAction(updatedAction, index)}
                        onCancel={() => setEditingActionIndex(null)}
                      />
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{action.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {action.finder ? `محدد: ${action.finder.substring(0, 30)}${action.finder.length > 30 ? '...' : ''}` : 'لم يتم تحديد محدد'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAction(index)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAction(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={saveAutomationConfig}
            disabled={isRunning || actions.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            حفظ التكوين
          </Button>
          <Button
            onClick={runAutomation}
            disabled={isRunning || actions.length === 0 || (!serverConnected && !isPreviewMode)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                تشغيل الأتمتة
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AutomationController;
