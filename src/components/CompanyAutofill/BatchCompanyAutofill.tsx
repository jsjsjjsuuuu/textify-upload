
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageData } from "@/types/ImageData";
import { getActiveDeliveryCompanies } from "@/utils/deliveryCompanies/companyData";
import { useCompanyAutofill } from "@/hooks/useCompanyAutofill";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlayIcon, PauseIcon, StopIcon, Settings2Icon, CheckIcon, XIcon, AlertCircleIcon } from "lucide-react";

interface BatchCompanyAutofillProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  updateImage: (id: string, fields: Partial<ImageData>) => void;
}

const BatchCompanyAutofill: React.FC<BatchCompanyAutofillProps> = ({ 
  isOpen, 
  onClose, 
  images,
  updateImage
}) => {
  const { toast } = useToast();
  const { executeBatchAutofill, isAutofilling } = useCompanyAutofill();
  
  // حالة الدفعة
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);
  
  // إعدادات الإدخال التلقائي
  const [retryCount, setRetryCount] = useState(3);
  const [delayBetweenRetries, setDelayBetweenRetries] = useState(5000);
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(5000);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [clickSubmitButton, setClickSubmitButton] = useState(true);
  
  // إحصائيات
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    success: 0,
    failed: 0
  });
  
  // الحصول على قائمة الشركات النشطة
  const companies = getActiveDeliveryCompanies();
  
  // إعادة تعيين حالة الإرسال عند إعادة فتح الحوار
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setResults({});
      setIsRunning(false);
      
      // تحديد الصور المكتملة تلقائيًا
      const initialSelectedImages: Record<string, boolean> = {};
      images.forEach(img => {
        if (img.status === "completed" && !img.submitted) {
          initialSelectedImages[img.id] = true;
        } else {
          initialSelectedImages[img.id] = false;
        }
      });
      setSelectedImages(initialSelectedImages);
      
      // تحديث الإحصائيات
      updateStats(initialSelectedImages);
    }
  }, [isOpen, images]);
  
  // تحديث الإحصائيات
  const updateStats = (selected: Record<string, boolean>) => {
    const selectedCount = Object.values(selected).filter(Boolean).length;
    setStats({
      total: selectedCount,
      completed: 0,
      success: 0,
      failed: 0
    });
  };
  
  // تحديد أو إلغاء تحديد جميع الصور
  const handleSelectAll = (select: boolean) => {
    const newSelected: Record<string, boolean> = {};
    images.forEach(img => {
      if (img.status === "completed") {
        newSelected[img.id] = select;
      } else {
        newSelected[img.id] = false;
      }
    });
    setSelectedImages(newSelected);
    updateStats(newSelected);
  };
  
  // تبديل تحديد صورة معينة
  const handleToggleImage = (id: string, selected: boolean) => {
    const newSelected = { ...selectedImages, [id]: selected };
    setSelectedImages(newSelected);
    updateStats(newSelected);
  };
  
  // بدء عملية الإدخال التلقائي المجمع
  const handleStartBatchProcess = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار شركة التوصيل أولاً",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من وجود صور محددة
    const selectedIds = Object.entries(selectedImages)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
    
    if (selectedIds.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد صورة واحدة على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    // تجميع الصور المحددة
    const selectedImagesData = images.filter(img => selectedImages[img.id]);
    
    // إعداد خيارات الإدخال التلقائي
    const options = {
      retryCount,
      delayBetweenRetries,
      delayBetweenRequests,
      maxConcurrent,
      clickSubmitButton,
      onProgress: (completed: number, total: number) => {
        // تحديث شريط التقدم
        const percentage = Math.floor((completed / total) * 100);
        setProgress(percentage);
        
        // تحديث الإحصائيات
        setStats(prev => ({
          ...prev,
          completed
        }));
      },
      onItemComplete: (imageId: string, result: any) => {
        // تحديث نتائج العنصر
        setResults(prev => ({
          ...prev,
          [imageId]: result
        }));
        
        // تحديث بيانات الصورة
        const image = images.find(img => img.id === imageId);
        if (image) {
          const currentAutoFillResults = image.autoFillResult || [];
          const company = companies.find(c => c.id === selectedCompanyId);
          
          updateImage(imageId, {
            autoFillResult: [
              ...currentAutoFillResults,
              {
                ...result,
                company: company?.name || selectedCompanyId,
                timestamp: new Date().toISOString()
              }
            ]
          });
        }
        
        // تحديث إحصائيات النجاح/الفشل
        setStats(prev => ({
          ...prev,
          success: result.success ? prev.success + 1 : prev.success,
          failed: !result.success ? prev.failed + 1 : prev.failed
        }));
      }
    };
    
    // بدء العملية
    setIsRunning(true);
    toast({
      title: "بدء الإدخال التلقائي المجمع",
      description: `جاري معالجة ${selectedImagesData.length} صورة...`,
    });
    
    try {
      await executeBatchAutofill(selectedCompanyId, selectedImagesData, options);
    } finally {
      setIsRunning(false);
    }
  };
  
  // إيقاف العملية
  const handleStopProcess = () => {
    // يمكن تنفيذ الإيقاف المؤقت/الدائم هنا
    setIsRunning(false);
    toast({
      title: "تم إيقاف العملية",
      description: "تم إيقاف عملية الإدخال التلقائي المجمع",
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>الإدخال التلقائي المجمع</DialogTitle>
          <DialogDescription>
            إدخال البيانات تلقائياً في عدة طلبات دفعة واحدة
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="selection" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="selection">تحديد الصور</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="results">النتائج</TabsTrigger>
          </TabsList>
          
          <TabsContent value="selection" className="flex-1 overflow-hidden flex flex-col">
            <div className="mb-4">
              <div className="mb-4">
                <Label htmlFor="company-select">اختر شركة التوصيل:</Label>
                <select 
                  id="company-select"
                  className="w-full p-2 border rounded mt-1 bg-background"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">-- اختر شركة --</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                  disabled={isRunning}
                >
                  تحديد الكل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                  disabled={isRunning}
                >
                  إلغاء تحديد الكل
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[300px] border rounded p-2">
                <div className="space-y-2">
                  {images.map(image => (
                    <div key={image.id} className="flex items-center p-2 border-b">
                      <Checkbox 
                        id={`image-${image.id}`}
                        checked={!!selectedImages[image.id]}
                        onCheckedChange={(checked) => handleToggleImage(image.id, !!checked)}
                        disabled={image.status !== "completed" || isRunning}
                      />
                      <div className="mr-2 flex-1">
                        <Label 
                          htmlFor={`image-${image.id}`}
                          className={image.status !== "completed" ? "text-muted-foreground" : ""}
                        >
                          {image.senderName || "بدون اسم"} - {image.phoneNumber || "بدون رقم"}
                        </Label>
                        {image.status !== "completed" && (
                          <p className="text-xs text-red-500">
                            (غير مكتمل - لا يمكن تحديده)
                          </p>
                        )}
                        {image.submitted && (
                          <p className="text-xs text-yellow-500">
                            (تم إرساله مسبقاً)
                          </p>
                        )}
                      </div>
                      {results[image.id] && (
                        <div className="ml-2">
                          {results[image.id].success ? (
                            <CheckIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <XIcon className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {images.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      لا توجد صور للعرض
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            <div className="mt-4 bg-muted/30 p-2 rounded">
              <div className="text-sm">
                الإحصائيات: {stats.completed} / {stats.total} تم معالجتها
                {stats.completed > 0 && (
                  <span className="mr-2">
                    ({stats.success} ناجحة، {stats.failed} فاشلة)
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-2 mt-1" />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1 overflow-auto">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 p-2">
                <div>
                  <Label htmlFor="retry-count">عدد المحاولات لكل صورة:</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      id="retry-count"
                      type="number"
                      min={1}
                      max={10}
                      value={retryCount}
                      onChange={(e) => setRetryCount(parseInt(e.target.value) || 3)}
                      disabled={isRunning}
                    />
                    <span className="mr-2 text-muted-foreground text-sm">محاولات</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد المحاولات التي سيتم إجراؤها لملء البيانات في حالة الفشل.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="delay-between-retries">المدة بين المحاولات:</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      id="delay-between-retries"
                      type="number"
                      min={1000}
                      max={30000}
                      step={1000}
                      value={delayBetweenRetries}
                      onChange={(e) => setDelayBetweenRetries(parseInt(e.target.value) || 5000)}
                      disabled={isRunning}
                    />
                    <span className="mr-2 text-muted-foreground text-sm">مللي ثانية</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    المدة الزمنية بين المحاولات المتتالية لنفس الصورة.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="delay-between-requests">المدة بين الطلبات:</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      id="delay-between-requests"
                      type="number"
                      min={1000}
                      max={60000}
                      step={1000}
                      value={delayBetweenRequests}
                      onChange={(e) => setDelayBetweenRequests(parseInt(e.target.value) || 5000)}
                      disabled={isRunning}
                    />
                    <span className="mr-2 text-muted-foreground text-sm">مللي ثانية</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    المدة الزمنية بين مجموعات الطلبات المتتالية.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="max-concurrent">أقصى عدد للطلبات المتزامنة:</Label>
                  <div className="flex items-center mt-1">
                    <Input 
                      id="max-concurrent"
                      type="number"
                      min={1}
                      max={5}
                      value={maxConcurrent}
                      onChange={(e) => setMaxConcurrent(parseInt(e.target.value) || 2)}
                      disabled={isRunning}
                    />
                    <span className="mr-2 text-muted-foreground text-sm">طلبات</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد الطلبات التي سيتم تنفيذها بشكل متزامن.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id="click-submit"
                    checked={clickSubmitButton}
                    onCheckedChange={(checked) => setClickSubmitButton(!!checked)}
                    disabled={isRunning}
                  />
                  <Label htmlFor="click-submit">النقر تلقائياً على زر الحفظ بعد ملء البيانات</Label>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="results" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[300px] border rounded p-2">
              <div className="space-y-2">
                {Object.keys(results).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    لم يتم تنفيذ أي عمليات بعد
                  </div>
                ) : (
                  Object.entries(results).map(([imageId, result]) => {
                    const image = images.find(img => img.id === imageId);
                    return (
                      <div key={imageId} className="border rounded p-3 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium flex items-center">
                            {result.success ? (
                              <CheckIcon className="h-4 w-4 text-green-500 ml-1" />
                            ) : (
                              <AlertCircleIcon className="h-4 w-4 text-red-500 ml-1" />
                            )}
                            {image?.senderName || "بدون اسم"}
                          </div>
                          <Badge variant={result.success ? "success" : "destructive"}>
                            {result.success ? "ناجح" : "فاشل"}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-1">
                          {result.message}
                        </div>
                        
                        {result.fieldsFound !== undefined && (
                          <div className="text-xs">
                            الحقول: {result.fieldsFilled || 0} من {result.fieldsFound || 0} تم ملؤها
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="text-xs text-red-500 mt-1">
                            الخطأ: {result.error}
                          </div>
                        )}
                        
                        {result.retryCount !== undefined && result.retryCount > 0 && (
                          <div className="text-xs text-yellow-500 mt-1">
                            تمت المحاولة {result.retryCount} مرة
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-4 flex justify-between space-x-2 space-x-reverse">
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant={isRunning ? "destructive" : "default"}
              onClick={isRunning ? handleStopProcess : handleStartBatchProcess}
              disabled={isAutofilling && !isRunning}
            >
              {isRunning ? (
                <>
                  <StopIcon className="ml-2 h-4 w-4" />
                  إيقاف
                </>
              ) : (
                <>
                  <PlayIcon className="ml-2 h-4 w-4" />
                  بدء
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRunning}
            >
              إغلاق
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {stats.total > 0 && (
              <>
                {stats.completed} من {stats.total} تم معالجتها
                {stats.completed > 0 && (
                  <>
                    {" - "}
                    <span className="text-green-500">{stats.success} ناجحة</span>
                    {", "}
                    <span className="text-red-500">{stats.failed} فاشلة</span>
                  </>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchCompanyAutofill;
