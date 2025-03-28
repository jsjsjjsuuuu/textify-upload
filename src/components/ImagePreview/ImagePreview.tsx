
import React, { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExtractedDataFields from "@/components/ExtractedData/ExtractedDataFields";
import { Button } from "@/components/ui/button";
import { Edit, Check, RefreshCw } from "lucide-react";

interface ImagePreviewProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImagePreview = ({ image, onTextChange }: ImagePreviewProps) => {
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || "",
    companyName: image.companyName || "",
    address: image.address || "",
    notes: image.notes || ""
  });

  // تحديث البيانات المؤقتة عند تغيير الصورة المحددة
  useEffect(() => {
    setTempData({
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || "",
      address: image.address || "",
      notes: image.notes || ""
    });
    setEditMode(false);
  }, [image.id, image.code, image.senderName, image.phoneNumber, image.province, image.price, image.companyName, image.address, image.notes]);

  // تحديث البيانات المؤقتة عند تغيير القيمة
  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => ({ ...prev, [field]: value }));
  };

  // حفظ التغييرات على جميع الحقول
  const saveChanges = () => {
    Object.entries(tempData).forEach(([field, value]) => {
      if (image[field] !== value) {
        onTextChange(image.id, field, value);
      }
    });
    setEditMode(false);
  };

  // نص النص المستخرج لعرض أكثر سهولة
  const formattedExtractedText = image.extractedText?.trim()
    .replace(/\n\n+/g, "\n\n")
    .split("\n")
    .map((line, i) => <div key={i}>{line || <br />}</div>);

  return (
    <div className="p-4">
      <Tabs defaultValue="data">
        <TabsList className="mb-4">
          <TabsTrigger value="data">البيانات المستخرجة</TabsTrigger>
          <TabsTrigger value="text">النص الكامل</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">البيانات المستخرجة</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (editMode) {
                  saveChanges();
                } else {
                  setEditMode(true);
                }
              }}
            >
              {editMode ? (
                <>
                  <Check className="w-4 h-4 ml-1.5" />
                  حفظ
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 ml-1.5" />
                  تعديل
                </>
              )}
            </Button>
          </div>
          
          <ExtractedDataFields
            tempData={tempData}
            editMode={editMode}
            onTempChange={handleTempChange}
          />
        </TabsContent>
        
        <TabsContent value="text" className="pt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">النص المستخرج</h3>
            <div className="text-xs text-muted-foreground">
              طريقة الاستخراج: {image.extractionMethod === "gemini" ? "Gemini AI" : "OCR"}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[300px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
            {formattedExtractedText}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImagePreview;
