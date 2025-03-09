
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Edit2, X, Copy } from "lucide-react";

interface ExtractedDataEditorProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ExtractedDataEditor = ({ image, onTextChange }: ExtractedDataEditorProps) => {
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || ""
  });

  const handleEditToggle = () => {
    if (editMode) {
      // Save changes
      Object.entries(tempData).forEach(([field, value]) => {
        onTextChange(image.id, field, value);
      });
    } else {
      // Enter edit mode
      setTempData({
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || ""
      });
    }
    setEditMode(!editMode);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleCopyText = () => {
    const textToCopy = `الكود: ${image.code || "غير متوفر"}
اسم المرسل: ${image.senderName || "غير متوفر"}
رقم الهاتف: ${image.phoneNumber || "غير متوفر"}
المحافظة: ${image.province || "غير متوفر"}
السعر: ${image.price || "غير متوفر"}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      // Could add toast here if desired
      console.log("نسخ البيانات إلى الحافظة");
    });
  };

  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Extract known fields from text based on patterns
  const tryExtractField = (text: string, patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  };

  const handleAutoExtract = () => {
    if (!image.extractedText) return;
    
    const extractedData = {
      code: tryExtractField(image.extractedText, [
        /كود[:\s]+([0-9]+)/i, 
        /code[:\s]+([0-9]+)/i, 
        /رقم[:\s]+([0-9]+)/i,
        /رمز[:\s]+([0-9]+)/i
      ]),
      senderName: tryExtractField(image.extractedText, [
        /اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, 
        /sender[:\s]+(.+?)(?:\n|\r|$)/i, 
        /الاسم[:\s]+(.+?)(?:\n|\r|$)/i,
        /الراسل[:\s]+(.+?)(?:\n|\r|$)/i
      ]),
      phoneNumber: tryExtractField(image.extractedText, [
        /هاتف[:\s]+([0-9\-\s]+)/i, 
        /phone[:\s]+([0-9\-\s]+)/i, 
        /جوال[:\s]+([0-9\-\s]+)/i, 
        /رقم الهاتف[:\s]+([0-9\-\s]+)/i,
        /رقم[:\s]+([0-9\-\s]+)/i
      ]),
      province: tryExtractField(image.extractedText, [
        /محافظة[:\s]+(.+?)(?:\n|\r|$)/i, 
        /province[:\s]+(.+?)(?:\n|\r|$)/i, 
        /المدينة[:\s]+(.+?)(?:\n|\r|$)/i,
        /المنطقة[:\s]+(.+?)(?:\n|\r|$)/i
      ]),
      price: tryExtractField(image.extractedText, [
        /سعر[:\s]+(.+?)(?:\n|\r|$)/i, 
        /price[:\s]+(.+?)(?:\n|\r|$)/i, 
        /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i,
        /قيمة[:\s]+(.+?)(?:\n|\r|$)/i
      ])
    };

    // Update temp data with extracted values
    setTempData(prev => ({
      ...prev,
      ...extractedData
    }));

    // If in normal mode, apply changes directly
    if (!editMode) {
      Object.entries(extractedData).forEach(([field, value]) => {
        if (value) onTextChange(image.id, field, value);
      });
    }
  };

  return (
    <Card className="bg-white/95 shadow-sm border-brand-beige">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-brand-brown">البيانات المستخرجة</h3>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleCancel}
                  className="h-8 text-destructive hover:bg-destructive/10"
                >
                  <X size={16} className="ml-1" />
                  إلغاء
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={handleEditToggle}
                  className="h-8 bg-brand-green hover:bg-brand-green/90"
                >
                  <Check size={16} className="ml-1" />
                  حفظ
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCopyText}
                  className="h-8"
                >
                  <Copy size={16} className="ml-1" />
                  نسخ
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAutoExtract}
                  className="h-8"
                >
                  إعادة استخراج
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleEditToggle}
                  className="h-8"
                >
                  <Edit2 size={16} className="ml-1" />
                  تعديل
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">الكود:</label>
            {editMode ? (
              <Input 
                value={tempData.code} 
                onChange={e => handleTempChange("code", e.target.value)} 
                className="rtl-textarea" 
                dir="rtl" 
                placeholder="أدخل الكود"
              />
            ) : (
              <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
                {image.code || <span className="text-muted-foreground text-sm">غير متوفر</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">اسم المرسل:</label>
            {editMode ? (
              <Input 
                value={tempData.senderName} 
                onChange={e => handleTempChange("senderName", e.target.value)} 
                className="rtl-textarea" 
                dir="rtl" 
                placeholder="أدخل اسم المرسل"
              />
            ) : (
              <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
                {image.senderName || <span className="text-muted-foreground text-sm">غير متوفر</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">رقم الهاتف:</label>
            {editMode ? (
              <Input 
                value={tempData.phoneNumber} 
                onChange={e => handleTempChange("phoneNumber", e.target.value)} 
                className="rtl-textarea" 
                dir="rtl" 
                placeholder="أدخل رقم الهاتف"
              />
            ) : (
              <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
                {image.phoneNumber || <span className="text-muted-foreground text-sm">غير متوفر</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">المحافظة:</label>
            {editMode ? (
              <Input 
                value={tempData.province} 
                onChange={e => handleTempChange("province", e.target.value)} 
                className="rtl-textarea" 
                dir="rtl" 
                placeholder="أدخل المحافظة"
              />
            ) : (
              <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
                {image.province || <span className="text-muted-foreground text-sm">غير متوفر</span>}
              </div>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <label className="block text-sm font-medium mb-1">السعر:</label>
            {editMode ? (
              <Input 
                value={tempData.price} 
                onChange={e => handleTempChange("price", e.target.value)} 
                className="rtl-textarea" 
                dir="rtl" 
                placeholder="أدخل السعر"
              />
            ) : (
              <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
                {image.price || <span className="text-muted-foreground text-sm">غير متوفر</span>}
              </div>
            )}
          </div>
        </div>

        {image.extractedText && (
          <div className="mt-4 pt-4 border-t">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">النص المستخرج الخام</summary>
              <div className="bg-gray-100 p-3 rounded-md mt-2 max-h-40 overflow-y-auto rtl-text">
                <pre className="whitespace-pre-wrap text-xs">
                  {image.extractedText}
                </pre>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtractedDataEditor;
