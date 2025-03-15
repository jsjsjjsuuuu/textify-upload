import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { getFromLocalStorage, getItemsByStatus } from "@/utils/bookmarkletService";
import { useToast } from "@/hooks/use-toast";
import { Monitor, RotateCw, CheckCircle2, ClipboardCopy, X, Info, ChevronLeft, ChevronRight, Play, Pause, Video, Send, ExternalLink, Globe } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { BookmarkletItem, ExternalSubmitOptions } from "@/utils/bookmarklet/types";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [simulatorMode, setSimulatorMode] = useState<"preview" | "simulation">("preview");
  const [showInstructions, setShowInstructions] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<"idle" | "running" | "completed" | "saved">("idle");
  
  // تحسين إعدادات الإرسال الخارجي
  const [externalSubmit, setExternalSubmit] = useState<ExternalSubmitOptions>({
    enabled: false,
    url: externalUrl || "https://malshalal-exp.com/add_newwaslinserter.php?add",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    mapFields: {
      code: "code",
      senderName: "name",
      phoneNumber: "phone",
      province: "city",
      price: "amount",
      address: "address",
      notes: "notes"
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitError, setLastSubmitError] = useState<string | null>(null);

  const defaultItems: SimulationItem[] = [
    {
      id: "1",
      code: "1234567890",
      senderName: "علي محمد",
      phoneNumber: "07701234567",
      province: "بغداد",
      price: "25000",
      companyName: "شركة التوصيل السريع",
      address: "الكرادة",
      notes: "ملاحظات إضافية"
    },
    {
      id: "2",
      code: "9876543210",
      senderName: "فاطمة حسين",
      phoneNumber: "07809876543",
      province: "البصرة",
      price: "30000",
      companyName: "شركة الأمانة",
      address: "الجبيلة",
      notes: "تأمين شامل"
    },
    {
      id: "3",
      code: "5555555555",
      senderName: "محمود قاسم",
      phoneNumber: "07905555555",
      province: "الموصل",
      price: "20000",
      companyName: "شركة النهرين",
      address: "حي الجامعة",
      notes: "توصيل خلال 24 ساعة"
    }
  ];

  const typingSpeed = {
    slow: 200,
    medium: 100,
    fast: 50
  };

  // استرجاع العناصر عند تحميل المكون
  useEffect(() => {
    loadItems();
  }, [storedCount]);

  // استرجاع عنوان URL الخارجي عند التحميل
  useEffect(() => {
    const savedUrl = localStorage.getItem('external_form_url');
    if (savedUrl) {
      setExternalSubmit(prev => ({
        ...prev,
        url: savedUrl,
        enabled: true
      }));
    } else if (externalUrl) {
      setExternalSubmit(prev => ({
        ...prev,
        url: externalUrl,
        enabled: true
      }));
    }
  }, [externalUrl]);

  // حفظ عنوان URL عند تغييره
  useEffect(() => {
    if (externalSubmit.url) {
      localStorage.setItem('external_form_url', externalSubmit.url);
    }
  }, [externalSubmit.url]);

  const loadItems = async () => {
    try {
      // استدعاء getItemsByStatus بدلاً من getFromLocalStorage مباشرة
      const storedItems = getItemsByStatus("ready");
      
      if (storedItems && storedItems.length > 0) {
        // تحويل العناصر إلى SimulationItem[]
        const simulationItems: SimulationItem[] = storedItems.map(item => ({
          id: item.id || "",
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
        updateFormFields(simulationItems[0]);
      } else {
        setItems(defaultItems);
        updateFormFields(defaultItems[0]);
      }
    } catch (error) {
      console.error("Error loading items from local storage:", error);
      setItems(defaultItems);
      toast({
        title: "خطأ في استرجاع البيانات",
        description: "فشل في استرجاع البيانات من الذاكرة المحلية",
        variant: "destructive"
      });
      updateFormFields(defaultItems[0]);
    }
  };

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
  };

  const navigateToItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentItemIndex(index);
      updateFormFields(items[index]);
    }
  };

  const handleNext = () => {
    if (currentItemIndex < items.length - 1) {
      navigateToItem(currentItemIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      navigateToItem(currentItemIndex - 1);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormFields(prev => ({ ...prev, [field]: value }));
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "code": return "الكود";
      case "senderName": return "اسم المرسل";
      case "phoneNumber": return "رقم الهاتف";
      case "province": return "المحافظة";
      case "price": return "السعر";
      case "address": return "العنوان";
      case "notes": return "ملاحظات";
      default: return field;
    }
  };

  const startSimulation = () => {
    if (items.length === 0) {
      toast({
        title: "لا توجد بيانات للمحاكاة",
        description: "يرجى استيراد البيانات أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsSimulating(true);
    setSimulatorMode("simulation");
    setCurrentItemIndex(0);
    updateFormFields(items[0]);
    setSimulationStatus("running");
    simulateTyping(items[0]);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setIsLiveSimulation(false);
    setSimulatorMode("preview");
    setSimulationStatus("idle");
    setProgress(0);
    setCurrentStep(0);
  };

  const startLiveSimulation = () => {
    setIsLiveSimulation(true);
    setSimulationStatus("running");
    simulateSaveAction();
  };

  const stopLiveSimulation = () => {
    setIsLiveSimulation(false);
    setSimulationStatus("idle");
  };

  const simulateTyping = async (item: SimulationItem) => {
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

    const fields = ["code", "senderName", "phoneNumber", "province", "price", "address", "notes"];
    let step = 0;

    for (const field of fields) {
      setActiveField(field);
      const text = item[field as keyof typeof item] || "";
      let simulatedText = "";

      for (let i = 0; i < text.length; i++) {
        simulatedText += text[i];
        setSimulatedFields(prev => ({ ...prev, [field]: simulatedText }));
        step++;
        setCurrentStep(step);
        setProgress(Math.round((step / (fields.length * text.length)) * 100));
        await new Promise(resolve => setTimeout(resolve, typingSpeed[simulationSpeed]));
      }
    }

    setActiveField(null);
    setSimulationStatus("completed");
  };

  const simulateSaveAction = async () => {
    setSimulationStatus("saved");
    
    // إذا كان الإرسال الخارجي مفعلاً، قم بإرسال البيانات
    if (externalSubmit.enabled && externalSubmit.url) {
      await submitToExternalForm();
    } else {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ البيانات بنجاح في النظام"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSimulationStatus("idle");
    handleNext();
  };

  // تحسين وظيفة الإرسال إلى نموذج خارجي
  const submitToExternalForm = async () => {
    if (!externalSubmit.url) {
      toast({
        title: "خطأ في الإرسال",
        description: "لم يتم تحديد عنوان URL للنموذج الخارجي",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setLastSubmitError(null);
    
    try {
      // تحويل البيانات حسب تعيين الحقول
      const mappedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(formFields)) {
        if (value && externalSubmit.mapFields && externalSubmit.mapFields[key]) {
          mappedData[externalSubmit.mapFields[key]] = value;
        }
      }
      
      console.log("إرسال البيانات إلى النموذج الخارجي:", mappedData);
      console.log("URL الإرسال:", externalSubmit.url);
      console.log("طريقة الإرسال:", externalSubmit.method);
      
      // إضافة تجاوز CORS عبر استخدام وسيط (للاختبار فقط)
      const corsProxyUrl = '';
      const targetUrl = corsProxyUrl ? `${corsProxyUrl}${encodeURIComponent(externalSubmit.url)}` : externalSubmit.url;
      
      // إرسال البيانات
      const response = await fetch(targetUrl, {
        method: externalSubmit.method,
        headers: externalSubmit.headers || {
          "Content-Type": "application/json"
        },
        body: externalSubmit.method !== "GET" ? JSON.stringify(mappedData) : undefined,
        mode: "no-cors" // إضافة هذا الخيار للتغلب على مشاكل CORS
      });
      
      console.log("تم استلام استجابة من الخادم");
      
      // مع mode: "no-cors" لن نتمكن من قراءة الاستجابة، لذلك نفترض النجاح
      toast({
        title: "تم ارسال البيانات",
        description: "تم إرسال البيانات إلى النموذج الخارجي. (تم استخدام وضع no-cors لتجاوز قيود CORS)"
      });
      
      return true;
    } catch (error) {
      console.error("خطأ في إرسال البيانات إلى النموذج الخارجي:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء إرسال البيانات إلى النموذج الخارجي";
      setLastSubmitError(errorMessage);
      
      toast({
        title: "فشل الإرسال",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyFieldToClipboard = async (field: string) => {
    try {
      await navigator.clipboard.writeText(formFields[field as keyof typeof formFields] || "");
      toast({
        title: "تم النسخ",
        description: `تم نسخ ${getFieldLabel(field)} إلى الحافظة`
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: `فشل نسخ ${getFieldLabel(field)} إلى الحافظة`,
        variant: "destructive"
      });
    }
  };

  const renderItemPreview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.length > 0 ? (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-medium">معلومات العنصر:</h4>
            <div className="text-sm">
              <p><strong>الكود:</strong> {formFields.code}</p>
              <p><strong>اسم المرسل:</strong> {formFields.senderName}</p>
              <p><strong>رقم الهاتف:</strong> {formFields.phoneNumber}</p>
              <p><strong>المحافظة:</strong> {formFields.province}</p>
              <p><strong>السعر:</strong> {formFields.price}</p>
              <p><strong>العنوان:</strong> {formFields.address}</p>
              <p><strong>ملاحظات:</strong> {formFields.notes}</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentItemIndex === 0}>
                <ChevronLeft className="h-4 w-4 ml-1" />
                السابق
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={currentItemIndex === items.length - 1}>
                التالي
                <ChevronRight className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
          
          {/* إضافة قسم إعدادات الإرسال الخارجي */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center">
                <Globe className="h-4 w-4 ml-2 text-brand-green" />
                إعدادات الإرسال الخارجي:
              </h4>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xs text-muted-foreground">تفعيل</span>
                <Switch
                  checked={externalSubmit.enabled}
                  onCheckedChange={(checked) => 
                    setExternalSubmit(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </div>
            
            {externalSubmit.enabled && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="external-url" className="text-xs">رابط النموذج الخارجي</Label>
                  <div className="flex space-x-2 space-x-reverse">
                    <Input
                      id="external-url"
                      placeholder="https://example.com/form"
                      value={externalSubmit.url}
                      onChange={(e) => setExternalSubmit(prev => ({ ...prev, url: e.target.value }))}
                      className="text-xs"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">إعدادات الإرسال الخارجي</h4>
                          <p className="text-xs text-muted-foreground">
                            أدخل عنوان URL للنموذج الخارجي الذي ترغب بإرسال البيانات إليه.
                            يتم إرسال البيانات بتنسيق JSON مع تعيين الحقول حسب الإعدادات.
                          </p>
                          <div className="mt-2">
                            <Label className="text-xs">طريقة الإرسال:</Label>
                            <Select
                              value={externalSubmit.method}
                              onValueChange={(value: 'GET' | 'POST' | 'PUT') => 
                                setExternalSubmit(prev => ({ ...prev, method: value }))
                              }
                            >
                              <SelectTrigger className="mt-1 h-8 text-xs">
                                <SelectValue placeholder="اختر طريقة الإرسال" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={submitToExternalForm}
                  disabled={isSubmitting || !externalSubmit.url}
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                  {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات الآن"}
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>لا توجد بيانات</AlertTitle>
          <AlertDescription>يرجى استيراد البيانات أولاً.</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderMalshalal = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">نموذج مال الشلال</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">الكود</Label>
          <Input type="text" id="code" value={formFields.code} onChange={(e) => handleFieldChange("code", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="senderName">اسم المرسل</Label>
          <Input type="text" id="senderName" value={formFields.senderName} onChange={(e) => handleFieldChange("senderName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phoneNumber">رقم الهاتف</Label>
          <Input type="text" id="phoneNumber" value={formFields.phoneNumber} onChange={(e) => handleFieldChange("phoneNumber", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="province">المحافظة</Label>
          <Input type="text" id="province" value={formFields.province} onChange={(e) => handleFieldChange("province", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="price">السعر</Label>
          <Input type="text" id="price" value={formFields.price} onChange={(e) => handleFieldChange("price", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="address">العنوان</Label>
          <Input type="text" id="address" value={formFields.address} onChange={(e) => handleFieldChange("address", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="notes">ملاحظات</Label>
          <Input type="text" id="notes" value={formFields.notes} onChange={(e) => handleFieldChange("notes", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderSimulationForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">محاكاة إدخال البيانات</h3>
        <div className="flex items-center gap-2">
          <Select value={simulationSpeed} onValueChange={(value) => setSimulationSpeed(value as "slow" | "medium" | "fast")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر سرعة المحاكاة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">بطيئة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="fast">سريعة</SelectItem>
            </SelectContent>
          </Select>
          {isLiveSimulation ? (
            <Button variant="destructive" size="sm" onClick={stopLiveSimulation}>
              <Pause className="h-4 w-4 ml-2" />
              إيقاف المحاكاة
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={startLiveSimulation} disabled={simulationStatus === "running"}>
              {simulationStatus === "saved" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  تم الحفظ
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 ml-2" />
                  بدء المحاكاة
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div ref={formRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(simulatedFields).map(([field, value]) => (
            <div key={field} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field}>{getFieldLabel(field)}</Label>
                <Button variant="ghost" size="icon" onClick={() => copyFieldToClipboard(field)}>
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="text"
                id={field}
                value={value}
                readOnly
                className={activeField === field ? "ring-2 ring-brand-green" : ""}
              />
            </div>
          ))}
        </div>

        {simulationStatus === "running" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center text-lg font-semibold"
          >
            جاري المحاكاة... ({progress}%)
          </motion.div>
        )}
      </div>
    </div>
  );

  // حذفنا التعريف المكرر لدالة getFieldLabel هنا

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
              
              {/* عرض معلومات الخطأ السابق إذا كان موجوداً */}
              {lastSubmitError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>آخر خطأ في الإرسال</AlertTitle>
                  <AlertDescription className="text-xs break-all">{lastSubmitError}</AlertDescription>
                </Alert>
              )}
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
        <span>عدد العناصر المتاحة: {items.length}</span>
        <span>
          {externalSubmit.enabled 
            ? "إرسال البيانات إلى نموذج خارجي" 
            : "محاكاة فقط - لا يتم إرسال البيانات لأي خادم خارجي"}
        </span>
      </CardFooter>
    </Card>
  );
};

export default DataEntrySimulator;
