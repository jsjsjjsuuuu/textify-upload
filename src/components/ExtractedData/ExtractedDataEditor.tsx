
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
import { AlertCircle, CheckCircle } from "lucide-react";

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

  // التحقق من اكتمال البيانات المطلوبة
  const isAllDataComplete = useMemo(() => {
    return !!(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price
    );
  }, [image.code, image.senderName, image.phoneNumber, image.province, image.price]);

  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

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
            
            {/* إضافة مؤشر حالة اكتمال البيانات */}
            <div className="flex items-center gap-2">
              {isAllDataComplete ? (
                <div className="flex items-center text-green-600 text-xs">
                  <CheckCircle size={14} className="ml-1" />
                  <span>البيانات مكتملة</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600 text-xs">
                  <AlertCircle size={14} className="ml-1" />
                  <span>البيانات غير مكتملة</span>
                </div>
              )}
            </div>
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

          {/* قسم يوضح الحقول المطلوب تعبئتها */}
          <div className="mt-4 p-2 rounded-md bg-muted/50">
            <h4 className="text-xs font-medium mb-1 text-center">الحقول المطلوبة للإرسال</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className={`flex items-center ${image.code ? 'text-green-600' : 'text-amber-600'}`}>
                <span className="ml-1">{image.code ? '✓' : '•'}</span>
                <span>الكود</span>
              </div>
              <div className={`flex items-center ${image.senderName ? 'text-green-600' : 'text-amber-600'}`}>
                <span className="ml-1">{image.senderName ? '✓' : '•'}</span>
                <span>اسم المرسل</span>
              </div>
              <div className={`flex items-center ${image.phoneNumber && isPhoneNumberValid ? 'text-green-600' : 'text-amber-600'}`}>
                <span className="ml-1">{image.phoneNumber && isPhoneNumberValid ? '✓' : '•'}</span>
                <span>رقم الهاتف</span>
              </div>
              <div className={`flex items-center ${image.province ? 'text-green-600' : 'text-amber-600'}`}>
                <span className="ml-1">{image.province ? '✓' : '•'}</span>
                <span>المحافظة</span>
              </div>
              <div className={`flex items-center ${image.price ? 'text-green-600' : 'text-amber-600'}`}>
                <span className="ml-1">{image.price ? '✓' : '•'}</span>
                <span>السعر</span>
              </div>
            </div>
          </div>

          {/* إضافة قسم منفصل لزر الأتمتة ليكون أكثر بروزًا */}
          <div className="mt-6 flex justify-center">
            <AutomationButton image={image} />
          </div>

          <RawTextViewer text={image.extractedText} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExtractedDataEditor;
