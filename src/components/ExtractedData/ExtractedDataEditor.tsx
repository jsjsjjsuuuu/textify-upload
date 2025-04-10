
import { useState, useEffect, useMemo } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ExtractedDataActions from "./ExtractedDataActions";
import RawTextViewer from "./RawTextViewer";
import LearningNotifications from "./LearningNotifications";
import ExtractedDataFields from "./ExtractedDataFields";
import AutomationButton from "./AutomationButton";
import { useDataExtraction } from "@/hooks/useDataExtraction";
import { motion } from "framer-motion";
import DataCompletionIndicator from "./DataCompletionIndicator";

interface ExtractedDataEditorProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ExtractedDataEditor = ({
  image,
  onTextChange
}: ExtractedDataEditorProps) => {
  // جعل وضع التعديل دائمًا مفعّل لتمكين التعديل المباشر عند النقر على الحقل
  const [editMode, setEditMode] = useState(true);
  
  const {
    tempData,
    setTempData,
    correctionsMade,
    isLearningActive,
    handleEditToggle,
    handleCancel,
    handleCopyText,
    handleAutoExtract,
    handleTempChange
  } = useDataExtraction(image, onTextChange, editMode, setEditMode);

  // تحديث البيانات المؤقتة عند تغيير الصورة
  useEffect(() => {
    console.log("تغيير الصورة في ExtractedDataEditor، تحديث البيانات:", image.id);
    setTempData({
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || ""
    });
  }, [image.id, image.code, image.senderName, image.phoneNumber, image.province, image.price, image.companyName, setTempData]);
  
  // إشعار مكون ال DataCompletionIndicator بالتحديث عندما تتغير البيانات
  const imageDataChanged = useMemo(() => ({
    ...image,
    timestamp: Date.now() // إضافة طابع زمني لضمان التحديث
  }), [image]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
      dir="rtl"
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 shadow-sm border-brand-beige dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <ExtractedDataActions 
              editMode={editMode} 
              onEditToggle={handleEditToggle} 
              onCancel={handleCancel} 
              onCopyText={handleCopyText} 
              onAutoExtract={handleAutoExtract} 
              hasExtractedText={!!image.extractedText} 
            />
          </div>

          <DataCompletionIndicator image={imageDataChanged} />

          <LearningNotifications 
            correctionsMade={correctionsMade} 
            isLearningActive={isLearningActive} 
          />

          <motion.div 
            initial={false} 
            animate={{ scale: editMode ? 1.01 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <ExtractedDataFields 
              tempData={tempData} 
              editMode={editMode} 
              onTempChange={handleTempChange} 
              hideConfidence={true} 
            />
          </motion.div>

          {/* زر الأتمتة */}
          <div className="mt-4 flex justify-center">
            <AutomationButton image={image} />
          </div>

          {/* عرض النص الخام في قسم منفصل بعد تحسين التصميم */}
          <div className="mt-4">
            <RawTextViewer text={image.extractedText} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExtractedDataEditor;
