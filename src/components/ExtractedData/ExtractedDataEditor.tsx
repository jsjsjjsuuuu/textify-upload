
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ExtractedDataActions from "./ExtractedDataActions";
import RawTextViewer from "./RawTextViewer";
import LearningNotifications from "./LearningNotifications";
import ExtractedDataFields from "./ExtractedDataFields";
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
      secondaryPhoneNumber: image.secondaryPhoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || ""
    });
  }, [image.id, setTempData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 shadow-sm border-brand-beige dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <ExtractedDataActions 
            editMode={editMode}
            onEditToggle={handleEditToggle}
            onCancel={handleCancel}
            onCopyText={handleCopyText}
            onAutoExtract={handleAutoExtract}
            hasExtractedText={!!image.extractedText}
          />

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

          <RawTextViewer text={image.extractedText} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExtractedDataEditor;
