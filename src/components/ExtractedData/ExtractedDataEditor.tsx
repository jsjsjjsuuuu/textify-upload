
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ExtractedDataField from "./ExtractedDataField";
import ExtractedDataActions from "./ExtractedDataActions";
import RawTextViewer from "./RawTextViewer";
import LearningNotifications from "./LearningNotifications";
import ExtractedDataFields from "./ExtractedDataFields";
import { useDataExtraction } from "@/hooks/useDataExtraction";

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
      price: image.price || ""
    });
  }, [image.id, setTempData]);

  return (
    <Card className="bg-white/95 dark:bg-gray-800/95 shadow-sm border-brand-beige dark:border-gray-700">
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

        <ExtractedDataFields
          tempData={tempData}
          editMode={editMode}
          onTempChange={handleTempChange}
        />

        <RawTextViewer text={image.extractedText} />
      </CardContent>
    </Card>
  );
};

export default ExtractedDataEditor;
