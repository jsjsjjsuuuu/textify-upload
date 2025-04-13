
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
import { CheckCircle, AlertTriangle } from "lucide-react";

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

  // التحقق من اكتمال البيانات
  const isDataComplete = useMemo(() => {
    return Boolean(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price &&
      (!image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11)
    );
  }, [image]);

  // التحقق مما إذا كان هناك خطأ في رقم الهاتف
  const hasPhoneNumberError = useMemo(() => {
    return Boolean(image.phoneNumber) && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  }, [image.phoneNumber]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
      dir="rtl"
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 shadow-md border-brand-beige dark:border-gray-700 hover:shadow-lg transition-shadow">
        {/* شريط حالة البيانات بتصميم أكثر وضوحاً */}
        <div className={`p-5 flex items-center justify-between rounded-t-lg ${
          isDataComplete ? "bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-400" : 
          hasPhoneNumberError ? "bg-red-500/20 text-red-700 dark:bg-red-900/30 dark:text-red-400" : 
          "bg-amber-500/20 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          <div className="flex items-center gap-3">
            {isDataComplete ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
            <span className="font-medium text-lg">
              {isDataComplete ? "البيانات مكتملة" : 
               hasPhoneNumberError ? "خطأ في رقم الهاتف" : 
               "البيانات غير مكتملة"}
            </span>
          </div>
          <div className="text-base">
            {image.submitted ? "تم الإرسال" : "لم يتم الإرسال بعد"}
          </div>
        </div>

        <CardContent className="p-6"> {/* زيادة التباعد الداخلي */}
          <div className="flex justify-between items-center mb-6"> {/* زيادة المسافة أسفل الأزرار */}
            <ExtractedDataActions 
              editMode={editMode} 
              onEditToggle={handleEditToggle} 
              onCancel={handleCancel} 
              onCopyText={handleCopyText} 
              onAutoExtract={handleAutoExtract} 
              hasExtractedText={!!image.extractedText} 
            />
          </div>

          {/* نقلت DataCompletionIndicator تحت شريط الحالة لتفاصيل إضافية عن الحقول */}
          <div className="mb-6"> {/* زيادة المسافة أسفل مؤشر الاكتمال */}
            <DataCompletionIndicator image={imageDataChanged} />
          </div>

          <LearningNotifications 
            correctionsMade={correctionsMade} 
            isLearningActive={isLearningActive} 
          />

          <motion.div 
            initial={false} 
            animate={{ scale: editMode ? 1.01 : 1 }}
            transition={{ duration: 0.2 }}
            className="mb-6" /* زيادة المسافة أسفل الحقول */
          >
            <ExtractedDataFields 
              tempData={tempData} 
              editMode={editMode} 
              onTempChange={handleTempChange} 
              hideConfidence={true} 
            />
          </motion.div>

          {/* زر الأتمتة */}
          <div className="mt-6 mb-6 flex justify-center"> {/* زيادة المسافات */}
            <AutomationButton image={image} />
          </div>

          {/* عرض النص الخام في قسم منفصل بعد تحسين التصميم */}
          <div className="mt-6"> {/* زيادة المسافة فوق عارض النص */}
            <RawTextViewer text={image.extractedText} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExtractedDataEditor;
