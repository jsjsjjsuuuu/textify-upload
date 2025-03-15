
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BookmarkletItem } from "@/utils/bookmarklet/types";
import { getItemsByStatus } from "@/utils/bookmarkletService";
import { useToast } from "@/hooks/use-toast";
import { Monitor, RotateCw, CheckCircle2, ClipboardCopy, X } from "lucide-react";

interface DataSimulatorProps {
  storedCount: number;
}

const DataEntrySimulator: React.FC<DataSimulatorProps> = ({ storedCount }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<BookmarkletItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [formFields, setFormFields] = useState({
    code: "",
    senderName: "",
    phoneNumber: "",
    province: "",
    price: "",
    address: "",
    notes: ""
  });
  const [mockFormId, setMockFormId] = useState<string | null>(null);
  const [simulatorMode, setSimulatorMode] = useState<"preview" | "simulation">("preview");

  // استرجاع العناصر عند تحميل المكون
  useEffect(() => {
    loadItems();
  }, [storedCount]);

  // تحميل العناصر من التخزين
  const loadItems = () => {
    const storedItems = getItemsByStatus("ready");
    setItems(storedItems);
    
    if (storedItems.length > 0) {
      setCurrentItemIndex(0);
      updateFormFields(storedItems[0]);
    }
  };

  // تحديث حقول النموذج بناءً على العنصر الحالي
  const updateFormFields = (item: BookmarkletItem) => {
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

  // التنقل بين العناصر
  const navigateToItem = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentItemIndex(index);
      updateFormFields(items[index]);
    }
  };

  // بدء المحاكاة
  const startSimulation = () => {
    if (items.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد بيانات متاحة للمحاكاة. يرجى تصدير البيانات أولاً.",
        variant: "destructive"
      });
      return;
    }

    setIsSimulating(true);
    setSimulatorMode("simulation");
    
    // إنشاء معرف فريد للنموذج المحاكى
    const randomId = `mock-form-${Math.random().toString(36).substring(2, 9)}`;
    setMockFormId(randomId);
    
    toast({
      title: "تم بدء المحاكاة",
      description: "يمكنك الآن تجربة إدخال البيانات في النموذج المحاكى."
    });
  };

  // إيقاف المحاكاة
  const stopSimulation = () => {
    setIsSimulating(false);
    setMockFormId(null);
    setSimulatorMode("preview");
    
    toast({
      title: "تم إيقاف المحاكاة",
      description: "تم إيقاف المحاكاة بنجاح."
    });
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
          <p>لا توجد بيانات متاحة للمعاينة. يرجى تصدير البيانات أولاً.</p>
        </div>
      );
    }

    const currentItem = items[currentItemIndex];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">العنصر {currentItemIndex + 1} من {items.length}</h3>
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateToItem(currentItemIndex - 1)}
              disabled={currentItemIndex === 0}
            >
              السابق
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateToItem(currentItemIndex + 1)}
              disabled={currentItemIndex === items.length - 1}
            >
              التالي
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
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm mt-1 text-foreground/90">{value}</p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    );
  };

  // إنشاء نموذج المحاكاة
  const renderSimulationForm = () => {
    return (
      <div className="space-y-4 border p-4 rounded-md bg-white shadow-sm">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-semibold">نموذج إدخال البيانات المحاكى</h3>
          <Button variant="destructive" size="sm" onClick={stopSimulation}>
            إيقاف المحاكاة
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4" id={mockFormId || undefined}>
          <div className="space-y-2">
            <Label htmlFor="sim-code">رقم الشحنة:</Label>
            <Input 
              id="sim-code" 
              value={formFields.code} 
              onChange={(e) => setFormFields(prev => ({ ...prev, code: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sim-senderName">اسم المرسل:</Label>
            <Input 
              id="sim-senderName" 
              value={formFields.senderName} 
              onChange={(e) => setFormFields(prev => ({ ...prev, senderName: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sim-phoneNumber">رقم الهاتف:</Label>
            <Input 
              id="sim-phoneNumber" 
              value={formFields.phoneNumber} 
              onChange={(e) => setFormFields(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sim-province">المحافظة:</Label>
            <Input 
              id="sim-province" 
              value={formFields.province} 
              onChange={(e) => setFormFields(prev => ({ ...prev, province: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sim-price">السعر:</Label>
            <Input 
              id="sim-price" 
              value={formFields.price} 
              onChange={(e) => setFormFields(prev => ({ ...prev, price: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sim-address">العنوان:</Label>
            <Input 
              id="sim-address" 
              value={formFields.address} 
              onChange={(e) => setFormFields(prev => ({ ...prev, address: e.target.value }))}
              className="h-9" 
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="sim-notes">ملاحظات:</Label>
            <Input 
              id="sim-notes" 
              value={formFields.notes} 
              onChange={(e) => setFormFields(prev => ({ ...prev, notes: e.target.value }))}
              className="h-9" 
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 space-x-reverse pt-2 border-t">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigateToItem(currentItemIndex - 1)}
            disabled={currentItemIndex === 0}
          >
            السابق
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigateToItem(currentItemIndex + 1)}
            disabled={currentItemIndex === items.length - 1}
          >
            التالي
          </Button>
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
        <CardTitle>محاكاة إدخال البيانات</CardTitle>
        <CardDescription>
          محاكاة عملية إدخال البيانات في نماذج الشحن بدون الحاجة لزيارة مواقع خارجية
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={simulatorMode} onValueChange={(val) => setSimulatorMode(val as "preview" | "simulation")}>
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
                    disabled={items.length === 0}
                    className="mx-auto"
                  >
                    <RotateCw className="h-4 w-4 ml-2" />
                    بدء المحاكاة
                  </Button>
                  
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      لا توجد بيانات متاحة للمحاكاة. يرجى تصدير البيانات أولاً.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-muted/20 border-t flex justify-between items-center px-4 py-2 text-xs text-muted-foreground">
        <span>عدد العناصر المتاحة: {items.length}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={loadItems}
        >
          <RotateCw className="h-3 w-3 ml-1" /> تحديث
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataEntrySimulator;
