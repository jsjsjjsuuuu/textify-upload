
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PlayIcon, Settings2Icon, InfoIcon, DatabaseIcon, UploadIcon, FolderIcon } from "lucide-react";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { getActiveDeliveryCompanies } from "@/utils/deliveryCompanies/companyData";

interface BatchAutomationSettingsProps {
  onStartAutomation: (settings: any) => void;
}

const BatchAutomationSettings: React.FC<BatchAutomationSettingsProps> = ({ onStartAutomation }) => {
  const [activeTab, setActiveTab] = React.useState("general");
  const [automationSettings, setAutomationSettings] = React.useState({
    general: {
      maxRetries: 3,
      delayBetweenRetries: 5000,
      delayBetweenRequests: 5000,
      maxConcurrent: 2,
      continueOnError: true,
      logToFile: true,
      logLevel: "info"
    },
    companies: {
      selectedCompanyIds: [] as string[],
      autoLogin: true,
      autoSubmit: true
    },
    scripts: {
      preProcessScript: "",
      postProcessScript: "",
      customValidation: false
    }
  });
  
  // الحصول على قائمة شركات التوصيل النشطة
  const companies = getActiveDeliveryCompanies();
  
  // تحديث إعدادات الأتمتة
  const updateSettings = (category: keyof typeof automationSettings, field: string, value: any) => {
    setAutomationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };
  
  // تبديل تحديد شركة
  const toggleCompanySelection = (companyId: string) => {
    const currentSelected = [...automationSettings.companies.selectedCompanyIds];
    const index = currentSelected.indexOf(companyId);
    
    if (index === -1) {
      currentSelected.push(companyId);
    } else {
      currentSelected.splice(index, 1);
    }
    
    updateSettings("companies", "selectedCompanyIds", currentSelected);
  };
  
  // تحديد كل الشركات
  const selectAllCompanies = () => {
    updateSettings("companies", "selectedCompanyIds", companies.map(c => c.id));
  };
  
  // إلغاء تحديد كل الشركات
  const deselectAllCompanies = () => {
    updateSettings("companies", "selectedCompanyIds", []);
  };
  
  // بدء عملية الأتمتة
  const handleStartAutomation = () => {
    onStartAutomation(automationSettings);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2Icon className="h-5 w-5 text-muted-foreground" />
          إعدادات الأتمتة المتقدمة
        </CardTitle>
        <CardDescription>
          تكوين وتخصيص إعدادات الأتمتة لمعالجة الطلبات بشكل دفعي
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
            <TabsTrigger value="companies">شركات التوصيل</TabsTrigger>
            <TabsTrigger value="scripts">سكريبتات مخصصة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-retries">عدد المحاولات القصوى:</Label>
                  <Input 
                    id="max-retries"
                    type="number"
                    min={1}
                    max={10}
                    value={automationSettings.general.maxRetries}
                    onChange={(e) => updateSettings("general", "maxRetries", parseInt(e.target.value) || 3)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد المحاولات التي سيتم إجراؤها لكل طلب.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="delay-retries">التأخير بين المحاولات (مللي ثانية):</Label>
                  <Input 
                    id="delay-retries"
                    type="number"
                    min={1000}
                    max={30000}
                    step={1000}
                    value={automationSettings.general.delayBetweenRetries}
                    onChange={(e) => updateSettings("general", "delayBetweenRetries", parseInt(e.target.value) || 5000)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="delay-requests">التأخير بين الطلبات (مللي ثانية):</Label>
                  <Input 
                    id="delay-requests"
                    type="number"
                    min={1000}
                    max={60000}
                    step={1000}
                    value={automationSettings.general.delayBetweenRequests}
                    onChange={(e) => updateSettings("general", "delayBetweenRequests", parseInt(e.target.value) || 5000)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-concurrent">أقصى عدد للطلبات المتزامنة:</Label>
                  <Input 
                    id="max-concurrent"
                    type="number"
                    min={1}
                    max={5}
                    value={automationSettings.general.maxConcurrent}
                    onChange={(e) => updateSettings("general", "maxConcurrent", parseInt(e.target.value) || 2)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="continue-error" className="flex items-center">
                    الاستمرار عند حدوث خطأ
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    متابعة معالجة الطلبات المتبقية حتى عند فشل بعض الطلبات
                  </p>
                </div>
                <Switch 
                  id="continue-error"
                  checked={automationSettings.general.continueOnError}
                  onCheckedChange={(checked) => updateSettings("general", "continueOnError", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-file" className="flex items-center">
                    تسجيل العمليات في ملف
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    حفظ سجل تفصيلي لجميع العمليات في ملف للمراجعة
                  </p>
                </div>
                <Switch 
                  id="log-file"
                  checked={automationSettings.general.logToFile}
                  onCheckedChange={(checked) => updateSettings("general", "logToFile", checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="log-level">مستوى التسجيل:</Label>
                <select 
                  id="log-level"
                  className="w-full p-2 border rounded mt-1 bg-background"
                  value={automationSettings.general.logLevel}
                  onChange={(e) => updateSettings("general", "logLevel", e.target.value)}
                >
                  <option value="error">أخطاء فقط</option>
                  <option value="warn">تحذيرات وأخطاء</option>
                  <option value="info">معلومات كاملة</option>
                  <option value="debug">تفاصيل للتصحيح</option>
                </select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="companies">
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllCompanies}
                >
                  تحديد الكل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={deselectAllCompanies}
                >
                  إلغاء تحديد الكل
                </Button>
              </div>
              
              <div className="border rounded">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center gap-2">
                        {company.logoUrl && (
                          <img 
                            src={company.logoUrl} 
                            alt={company.name} 
                            className="h-6 w-6 object-contain"
                          />
                        )}
                        <Label htmlFor={`company-${company.id}`}>{company.name}</Label>
                      </div>
                      <Switch 
                        id={`company-${company.id}`}
                        checked={automationSettings.companies.selectedCompanyIds.includes(company.id)}
                        onCheckedChange={() => toggleCompanySelection(company.id)}
                      />
                    </div>
                  ))}
                  
                  {companies.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      لا توجد شركات توصيل نشطة
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-login" className="flex items-center">
                      تسجيل الدخول تلقائيًا
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      محاولة تسجيل الدخول تلقائيًا إذا كان ذلك مطلوبًا
                    </p>
                  </div>
                  <Switch 
                    id="auto-login"
                    checked={automationSettings.companies.autoLogin}
                    onCheckedChange={(checked) => updateSettings("companies", "autoLogin", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-submit" className="flex items-center">
                      إرسال النماذج تلقائيًا
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      النقر تلقائيًا على زر الحفظ/الإرسال بعد ملء البيانات
                    </p>
                  </div>
                  <Switch 
                    id="auto-submit"
                    checked={automationSettings.companies.autoSubmit}
                    onCheckedChange={(checked) => updateSettings("companies", "autoSubmit", checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scripts">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pre-script">سكريبت ما قبل المعالجة:</Label>
                <Textarea 
                  id="pre-script"
                  placeholder="// سيتم تنفيذ هذا السكريبت قبل بدء المعالجة"
                  className="font-mono h-20 mt-1"
                  value={automationSettings.scripts.preProcessScript}
                  onChange={(e) => updateSettings("scripts", "preProcessScript", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  سكريبت JavaScript يتم تنفيذه قبل بدء عملية الأتمتة.
                </p>
              </div>
              
              <div>
                <Label htmlFor="post-script">سكريبت ما بعد المعالجة:</Label>
                <Textarea 
                  id="post-script"
                  placeholder="// سيتم تنفيذ هذا السكريبت بعد اكتمال المعالجة"
                  className="font-mono h-20 mt-1"
                  value={automationSettings.scripts.postProcessScript}
                  onChange={(e) => updateSettings("scripts", "postProcessScript", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  سكريبت JavaScript يتم تنفيذه بعد اكتمال عملية الأتمتة.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom-validation" className="flex items-center">
                    استخدام التحقق المخصص
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    تطبيق قواعد تحقق مخصصة للبيانات قبل الإرسال
                  </p>
                </div>
                <Switch 
                  id="custom-validation"
                  checked={automationSettings.scripts.customValidation}
                  onCheckedChange={(checked) => updateSettings("scripts", "customValidation", checked)}
                />
              </div>
              
              <div className="bg-muted/30 p-3 rounded mt-4">
                <div className="flex items-center">
                  <InfoIcon className="h-5 w-5 text-muted-foreground ml-2" />
                  <h3 className="text-sm font-medium">متغيرات السكريبت المتاحة:</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                  <div>
                    <code>context.images</code> - قائمة الصور المحددة
                  </div>
                  <div>
                    <code>context.companies</code> - قائمة الشركات المحددة
                  </div>
                  <div>
                    <code>context.settings</code> - إعدادات الأتمتة
                  </div>
                  <div>
                    <code>context.results</code> - نتائج الأتمتة (في سكريبت ما بعد المعالجة)
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline">إعادة التعيين</Button>
        <Button 
          onClick={handleStartAutomation}
          className="bg-brand-green hover:bg-brand-green/90"
        >
          <PlayIcon className="ml-2 h-4 w-4" />
          بدء عملية الأتمتة
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchAutomationSettings;
