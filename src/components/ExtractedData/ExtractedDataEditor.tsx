
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ExtractedDataActions from "./ExtractedDataActions";
import RawTextViewer from "./RawTextViewer";
import LearningNotifications from "./LearningNotifications";
import ExtractedDataFields from "./ExtractedDataFields";
import AutomationButton from "./AutomationButton";
import { useDataExtraction } from "@/hooks/useDataExtraction";
import { motion } from "framer-motion";

interface ExtractedDataEditorProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ExtractedDataEditor = ({ image, onTextChange }: ExtractedDataEditorProps) => {
  const [editMode, setEditMode] = useState(false);
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
  }, [image.id, setTempData]);

  // التحقق من وجود البيانات المطلوبة للأتمتة
  const hasRequiredData = !!image.code && !!image.senderName && !!image.phoneNumber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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

          <LearningNotifications 
            correctionsMade={correctionsMade} 
            isLearningActive={isLearningActive} 
          />

          <motion.div
            initial={false}
            animate={{ scale: editMode ? 1.01 : 1 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-lg transition-colors ${editMode ? 'bg-secondary/50' : ''}`}
          >
            <ExtractedDataFields
              tempData={tempData}
              editMode={editMode}
              onTempChange={handleTempChange}
            />
          </motion.div>

          {/* إضافة قسم منفصل لزر الأتمتة ليكون أكثر بروزًا */}
          <div className="mt-6 flex justify-center">
            <AutomationButton image={image} />
          </div>

          {!hasRequiredData && (
            <div className="text-center mt-2 text-sm text-amber-600">
              <p>يرجى استخراج البيانات الأساسية (الكود، اسم المرسل، رقم الهاتف) قبل بدء الأتمتة</p>
            </div>
          )}

          <RawTextViewer text={image.extractedText} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExtractedDataEditor;
