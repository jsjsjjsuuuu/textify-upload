import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { getFromLocalStorage, getItemsByStatus } from "@/utils/bookmarkletService";
import { useToast } from "@/hooks/use-toast";
import { Monitor, RotateCw, CheckCircle2, ClipboardCopy, X, Info, ChevronLeft, ChevronRight, Play, Pause, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

// نوع البيانات المستخدمة في المحاكاة
type SimulationItem = {
  id: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  address?: string; // تم تغييرها من إجبارية إلى اختيارية
  notes?: string;   // تم تغييرها من إجبارية إلى اختيارية
  status?: string;
};

interface DataSimulatorProps {
  storedCount: number;
  externalUrl?: string;
}

const DataEntrySimulator: React.FC<DataSimulatorProps> = ({ storedCount, externalUrl = "" }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<SimulationItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLiveSimulation, setIsLiveSimulation] = useState(false);
  const [formFields, setFormFields] = useState({
    code: "",
    senderName: "",
    phoneNumber: "",
    province: "",
    price: "",
    address: "",
    notes: ""
  });
  const [simulatedFields, setSimulatedFields] = useState({
    code: "",
    senderName: "",
    phoneNumber: "",
    province: "",
    price: "",
    address: "",
    notes: ""
  });
  const [activeField, setActiveField] = useState<string | null>(null);
  const [mockFormId, setMockFormId] = useState<string | null>(null);
  const [simulatorMode, setSimulatorMode<"preview" | "simulation">("preview");
  const [showInstructions, setShowInstructions] = useState(true);
  const [simulationSpeed, setSimulationSpeed<"slow" | "medium" | "fast">("medium");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);
  const [simulationStatus, setSimulationStatus<"idle" | "running" | "completed" | "saved">("idle");
  
  // بيانات المحاكاة الافتراضية
  const defaultItems: SimulationItem[] = [
    {
      id: '1',
      code: 'MS12345',
      senderName: 'محمد أحمد',
      phoneNumber: '07801234567',
      province: 'بغداد',
      price: '25000',
      companyName: 'مال الشلال للشحن',
      address: 'حي الجامعة، شارع 14',
      notes: 'اتصال قبل التسليم'
    },
    {
      id: '2',
      code: 'MS67890',
      senderName: 'علي حسين',
      phoneNumber: '07709876543',
      province: 'البصرة',
      price: '18000',
      companyName: 'مال الشلال للشحن',
      address: 'شارع الكورنيش، بجانب فندق البصرة',
      notes: 'الدفع عند الاستلام'
    },
    {
      id: '3',
      code: 'MS24680',
      senderName: 'نور الهدى',
      phoneNumber: '07711223344',
      province: 'أربيل',
      price: '32500',
      companyName: 'مال الشلال للشحن',
      address: 'عينكاوا، قرب مول فاميلي',
      notes: 'توصيل سريع'
    }
  ];

  // سرعة الكتابة حسب الإعداد المختار
  const typingSpeed = {
    slow: 120,
    medium: 70,
    fast: 30
  };

  // استرجاع العناصر عند تحميل المكون
  useEffect(() => {
    loadItems();
  }, [storedCount]);

  // تحميل العناصر 
  const loadItems = () => {
    try {
      // محاولة استرجاع البيانات المخزنة، وإذا لم يجد يستخدم البيانات الافتراضية
      const storedItems = getItemsByStatus("ready");
      
      if (storedItems && storedItems.length > 0) {
        // تحويل عناصر BookmarkletItem إلى SimulationItem مع التأكد من وجود الحقول المطلوبة
        const simulationItems: SimulationItem[] = storedItems.map(item => ({
          id: item.id,
          code: item.code || "",
          senderName: item.senderName || "",
          phoneNumber: item.phoneNumber || "",
          province: item.province || "",
          price: item.price || "",
          companyName: item.companyName || "",
          address: item.address || "",
          notes: item.notes || "",
          status: item.status
        }));
        
        setItems(simulationItems);
        setCurrentItemIndex(0);
        if (simulationItems.length > 0) {
          updateFormFields(simulationItems[0]);
        }
      } else {
        console.log("استخدام بيانات المحاكاة الافتراضية");
        setItems(defaultItems);
        setCurrentItemIndex(0);
        updateFormFields(defaultItems[0]);
      }
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error);
      setItems(defaultItems);
      setCurrentItemIndex(0);
      updateFormFields(defaultItems[0]);
    }
  };

  // تحديث حقول النموذج بناءً على العنصر الحالي
  const updateFormFields = (item: SimulationItem) => {
    setFormFields({
      code: item.code || "",
      senderName: item.senderName || "",
      phoneNumber: item.phoneNumber || "",
      province: item.province || "",
      price: item.price || "",
      address: item.address || "",
      notes: item.notes || ""
    });
    
    // إعادة تعيين الحقول المحاكاة
    setSimulatedFields({
      code: "",
      senderName: "",
      phoneNumber: "",
      province: "",
      price: "",
      address: "",
      notes: ""
    });
  };

  // التنقل بين العناصر
  const navigateToItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentItemIndex(index);
      updateFormFields(items[index]);
      if (isLiveSimulation) {
        // إيقاف المحاكاة الحالية وإعادة تشغيلها للعنصر الجديد
        stopLiveSimulation();
        setTimeout(() => startLiveSimulation(), 500);
      }
    }
  };

  // بدء المحاكاة
  const startSimulation = () => {
    if (items.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد بيانات متاحة للمحاكاة.",
        variant: "destructive"
      });
      return;
    }

    setIsSimulating(true);
    setSimulatorMode("simulation");
    setShowEmbeddedForm(true);
    
    // إنشاء معرف فريد للنموذج المحاكى
    const randomId = `mock-form-${Math.random().toString(36).substring(2, 9)}`;
    setMockFormId(randomId);
    setSimulationStatus("idle");
    
    toast({
      title: "تم بدء المحاكاة",
      description: "يمكنك الآن تجربة إدخال البيانات في النموذج المحاكى."
    });
  };

  // إيقاف المحاكاة
  const stopSimulation = () => {
    setIsSimulating(false);
    setIsLiveSimulation(false);
    setMockFormId(null);
    setSimulatorMode("preview");
    setActiveField(null);
    setProgress(0);
    setCurrentStep(0);
    setShowEmbeddedForm(false);
    setSimulationStatus("idle");
    
    toast({
      title: "تم إيقاف المحاكاة",
      description: "تم إيقاف المحاكاة بنجاح."
    });
  };

  // بدء المحاكاة المباشرة
  const startLiveSimulation = async () => {
    if (!isSimulating) {
      startSimulation();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsLiveSimulation(true);
    setProgress(0);
    setCurrentStep(0);
    setSimulationStatus("running");
    setSimulatedFields({
      code: "",
      senderName: "",
      phoneNumber: "",
      province: "",
      price: "",
      address: "",
      notes: ""
    });
    
    // البدء بالمحاكاة المباشرة
    simulateTyping();
  };

  // إيقاف المحاكاة المباشرة
  const stopLiveSimulation = () => {
    setIsLiveSimulation(false);
    setActiveField(null);
    setProgress(0);
    setCurrentStep(0);
    setSimulationStatus("idle");
  };

  // محاكاة عملية الكتابة حقلاً بعد حقل
  const simulateTyping = async () => {
    const fields = ["code", "senderName", "phoneNumber", "province", "price", "address", "notes"];
    const fieldsWithValues = fields.filter(field => formFields[field as keyof typeof formFields]);
    
    for (let i = 0; i < fieldsWithValues.length; i++) {
      const field = fieldsWithValues[i];
      const value = formFields[field as keyof typeof formFields];
      setActiveField(field);
      setCurrentStep(i + 1);
      
      // التركيز على الحقل الحالي
      const input = document.getElementById(`sim-${field}`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      
      // محاكاة الكتابة حرفاً حرفاً
      for (let j = 0; j <= value.length; j++) {
        if (!isLiveSimulation) break; // توقف إذا تم إيقاف المحاكاة
        
        setSimulatedFields(prev => ({
          ...prev,
          [field]: value.substring(0, j)
        }));
        
        // حساب التقدم الإجمالي
        const fieldProgress = j / value.length;
        const overallProgress = (i + fieldProgress) / fieldsWithValues.length;
        setProgress(overallProgress * 100);
        
        // انتظار للمحاكاة الواقعية للكتابة
        await new Promise(resolve => setTimeout(resolve, typingSpeed[simulationSpeed]));
      }
      
      // التأخير قبل الانتقال إلى الحقل التالي
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // إنهاء المحاكاة
    setActiveField(null);
    setProgress(100);
    setSimulationStatus("completed");
    
    // محاكاة عملية الحفظ
    setTimeout(() => {
      simulateSaveAction();
    }, 1000);
  };

  // محاكاة عملية الحفظ
  const simulateSaveAction = () => {
    setSimulationStatus("saved");
    
    toast({
      title: "تم حفظ البيانات بنجاح",
      description: "تمت عملية إدخال وحفظ البيانات في نظام مال الشلال",
      variant: "default"  // تغيير من "success" إلى "default"
    });
    
    // إيقاف المحاكاة المباشرة بعد ثانيتين
    setTimeout(() => {
      if (isLiveSimulation) {
        setIsLiveSimulation(false);
        
        // انتقل إلى العنصر التالي إذا كان موجوداً
        if (currentItemIndex < items.length - 1) {
          setTimeout(() => {
            navigateToItem(currentItemIndex + 1);
            // إعادة تشغيل المحاكاة للعنصر التالي بعد لحظة
            setTimeout(() => {
              startLiveSimulation();
            }, 1000);
          }, 1500);
        }
      }
    }, 2000);
  };

  // نسخ البيانات إلى الحافظة
  const copyFieldToClipboard = (fieldName: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${fieldName} إلى الحافظة`
      });
    });
  };

  // إنشاء عنصر معاينة للعنصر الحالي
  const renderItemPreview = () => {
    if (items.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <div className="flex justify-center">
            <X className="h-10 w-10 mb-2" />
          </div>
          <p>لا توجد بيانات متاحة للمعاينة.</p>
        </div>
      );
    }

    const currentItem = items[currentItemIndex];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">العنصر {currentItemIndex + 1} من {items.length}</h3>
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateToItem(currentItemIndex - 1)}
              disabled={currentItemIndex === 0}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
              السابق
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateToItem(currentItemIndex + 1)}
              disabled={currentItemIndex === items.length - 1}
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(formFields).map(([key, value]) => (
            value ? (
              <div key={key} className="bg-muted/50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{getFieldLabel(key)}:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyFieldToClipboard(getFieldLabel(key), value)}
                    title="نسخ إلى الحافظة"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm mt-1 text-foreground/90">{value}</p>
              </div>
            ) : null
          ))}
        </div>

        <div className="flex flex-col space-y-2 mt-6">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">محاكاة بالبث المباشر</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              يمكنك تشغيل المحاكاة المباشرة لمشاهدة كيفية إدخال البيانات تلقائياً في نموذج مال الشلال، كأنها تُكتب بواسطة شخص حقيقي.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center space-x-4 space-x-reverse mt-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                setSimulatorMode("simulation");
                startLiveSimulation();
              }}
              className="bg-brand-green hover:bg-brand-green/90"
            >
              <Video className="h-4 w-4 ml-2" />
              بدء المحاكاة المباشرة
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // إنشاء محاكاة لواجهة مال الشلال
  const renderMalshalal = () => {
    return (
      <div className="border rounded-md bg-white shadow-lg p-0 overflow-hidden">
        <div className="bg-[#242f59] text-white p-3 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/lovable-uploads/e3521185-21aa-443a-ae91-7a1b8f5c5400.png" 
                alt="مال الشلال" 
                className="h-8 w-auto ml-2" />
            <h3 className="text-lg font-semibold">مال الشلال للتوصيل السريع</h3>
          </div>
          <span className="text-sm">إضافة وصل جديد</span>
        </div>
        
        <div className="p-4">
          <div className="border rounded-md bg-gray-50 p-4 mb-4">
            <h4 className="text-[#242f59] font-semibold mb-4 border-b pb-2">بيانات الوصل الجديد</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="malsh-code" className={activeField === "code" ? "text-blue-600 font-medium" : ""}>
                  رقم الشحنة: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-code" 
                  value={isLiveSimulation ? simulatedFields.code : formFields.code}
                  className={`h-9 border-gray-300 ${activeField === "code" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="malsh-senderName" className={activeField === "senderName" ? "text-blue-600 font-medium" : ""}>
                  اسم المرسل: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-senderName" 
                  value={isLiveSimulation ? simulatedFields.senderName : formFields.senderName}
                  className={`h-9 border-gray-300 ${activeField === "senderName" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="malsh-phoneNumber" className={activeField === "phoneNumber" ? "text-blue-600 font-medium" : ""}>
                  رقم الهاتف: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-phoneNumber" 
                  value={isLiveSimulation ? simulatedFields.phoneNumber : formFields.phoneNumber}
                  className={`h-9 border-gray-300 ${activeField === "phoneNumber" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="malsh-province" className={activeField === "province" ? "text-blue-600 font-medium" : ""}>
                  المحافظة: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-province" 
                  value={isLiveSimulation ? simulatedFields.province : formFields.province}
                  className={`h-9 border-gray-300 ${activeField === "province" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="malsh-price" className={activeField === "price" ? "text-blue-600 font-medium" : ""}>
                  المبلغ: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-price" 
                  value={isLiveSimulation ? simulatedFields.price : formFields.price}
                  className={`h-9 border-gray-300 ${activeField === "price" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="malsh-address" className={activeField === "address" ? "text-blue-600 font-medium" : ""}>
                  العنوان: <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="malsh-address" 
                  value={isLiveSimulation ? simulatedFields.address : formFields.address}
                  className={`h-9 border-gray-300 ${activeField === "address" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="malsh-notes" className={activeField === "notes" ? "text-blue-600 font-medium" : ""}>
                  ملاحظات:
                </Label>
                <Input 
                  id="malsh-notes" 
                  value={isLiveSimulation ? simulatedFields.notes : formFields.notes}
                  className={`h-9 border-gray-300 ${activeField === "notes" ? "border-blue-500 ring-1 ring-blue-500" : ""}`}
                  disabled={isLiveSimulation}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              {simulationStatus === "running" && "جاري إدخال البيانات..."}
              {simulationStatus === "completed" && "تم إدخال البيانات بنجاح."}
              {simulationStatus === "saved" && "تم حفظ البيانات بنجاح ✓"}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-gray-700"
                disabled={isLiveSimulation || simulationStatus === "running"}
              >
                إلغاء
              </Button>
              <Button
                variant="default"
                size="sm"
                className={simulationStatus === "saved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                disabled={isLiveSimulation && simulationStatus !== "completed"}
              >
                {simulationStatus === "saved" ? "تم الحفظ ✓" : "حفظ"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // إنشاء نموذج المحاكاة
  const renderSimulationForm = () => {
    return (
      <div className="space-y-4">
        {showInstructions && (
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">كيفية استخدام المحاكي</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                <li>هذا نموذج محاكاة لإدخال البيانات مشابه لما ستجده في موقع مال الشلال للشحن.</li>
                <li>يمكنك التنقل بين العناصر باستخدام أزرار "السابق" و"التالي".</li>
                <li>استخدم زر "إيقاف المحاكاة" للعودة إلى وضع المعاينة.</li>
                <li>اضغط على زر "محاكاة مباشرة" لمشاهدة عملية إدخال وحفظ البيانات تلقائياً.</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowInstructions(false)} 
                className="mt-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
              >
                فهمت، لا تعرض هذه الرسالة مرة أخرى
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLiveSimulation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-green/10 border border-brand-green/30 p-3 rounded-md mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Play className="h-4 w-4 text-brand-green mr-2 animate-pulse" />
                <span className="font-medium text-brand-green">محاكاة مباشرة قيد التشغيل...</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Select
                  value={simulationSpeed}
                  onValueChange={(value) => setSimulationSpeed(value as "slow" | "medium" | "fast")}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue placeholder="السرعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">بطيء</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="fast">سريع</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={stopLiveSimulation}
                  className="h-7 text-xs"
                >
                  <Pause className="h-3 w-3 ml-1" />
                  إيقاف
                </Button>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-brand-green h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>الخطوة {currentStep} من {Object.values(formFields).filter(Boolean).length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="border rounded-md bg-white dark:bg-gray-800 overflow-hidden p-0" ref={formRef}>
          <div className="bg-[#242f59] text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="font-semibold text-lg">محاكاة موقع مال الشلال</h3>
              <p className="text-xs text-gray-200 mr-2">العنصر {currentItemIndex + 1} من {items.length}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              {!isLiveSimulation && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-brand-green hover:bg-brand-green/90"
                  onClick={startLiveSimulation}
                >
                  <Play className="h-4 w-4 ml-1" />
                  محاكاة مباشرة
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={stopSimulation}>
                إيقاف المحاكاة
              </Button>
            </div>
          </div>

          <div className="p-0" id={mockFormId || undefined}>
            {showEmbeddedForm && renderMalshalal()}
          </div>

          <div className="flex justify-between p-3 border-t">
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(formFields, null, 2));
                  toast({
                    title: "تم النسخ",
                    description: "تم نسخ كافة البيانات إلى الحافظة"
                  });
                }}
                disabled={isLiveSimulation}
              >
                <ClipboardCopy className="h-4 w-4 ml-1" />
                نسخ كل البيانات
              </Button>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigateToItem(currentItemIndex - 1)}
                disabled={currentItemIndex === 0 || isLiveSimulation}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                السابق
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigateToItem(currentItemIndex + 1)}
                disabled={currentItemIndex === items.length - 1 || isLiveSimulation}
              >
                التالي
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // الحصول على تسمية الحقل بالعربية
  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      code: "رقم الشحنة",
      senderName: "اسم المرسل",
      phoneNumber: "رقم الهاتف",
      province: "المحافظة",
      price: "السعر",
      address: "العنوان",
      notes: "ملاحظات"
    };
    
    return labels[key] || key;
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-brand-brown dark:text-brand-beige">
          <Monitor className="h-5 w-5 ml-2 text-brand-green" />
          محاكاة إدخال البيانات في موقع مال الشلال
        </CardTitle>
        <CardDescription>
          محاكاة حية لعملية إدخال البيانات في موقع مال الشلال وحفظها بشكل تلقائي
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={simulatorMode} onValueChange={(val) => {
          if (val === "simulation" && !isSimulating) {
            startSimulation();
          }
          setSimulatorMode(val as "preview" | "simulation");
        }} data-simulator-tab={simulatorMode}>
          <TabsList className="w-full rounded-none grid grid-cols-2">
            <TabsTrigger value="preview" className="rounded-none data-[state=active]:bg-background">
              <Monitor className="h-4 w-4 ml-2" />
              معاينة البيانات
            </TabsTrigger>
            <TabsTrigger value="simulation" className="rounded-none data-[state=active]:bg-background">
              <CheckCircle2 className="h-4 w-4 ml-2" />
              نموذج المحاكاة
            </TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="preview" className="mt-0">
              {renderItemPreview()}
            </TabsContent>
            
            <TabsContent value="simulation" className="mt-0">
              {isSimulating ? (
                renderSimulationForm()
              ) : (
                <div className="text-center py-6">
                  <Button 
                    variant="default" 
                    onClick={startSimulation}
                    className="mx-auto bg-brand-green hover:bg-brand-green/90"
                  >
                    <RotateCw className="h-4 w-4 ml-2" />
                    بدء المحاكاة
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-muted/20 border-t flex justify-between items-center px-4 py-2 text-xs text-muted-foreground">
        <span>عدد العناصر المتاحة:
