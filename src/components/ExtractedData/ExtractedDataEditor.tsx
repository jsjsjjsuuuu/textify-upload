
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
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ExtractedDataEditorProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ExtractedDataEditor = ({ image, onTextChange }: ExtractedDataEditorProps) => {
  const [editMode, setEditMode] = useState(false);
  const [loadedImageId, setLoadedImageId] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  
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

  // وظيفة تنفيذ عند تغيير الصورة
  useEffect(() => {
    // إذا تغيرت الصورة عن الصورة المحملة سابقًا، قم بتحديث البيانات
    if (image.id !== loadedImageId) {
      console.log("تحديث البيانات المؤقتة في ExtractedDataEditor لصورة جديدة:", image.id);
      
      // تعيين حالة التحميل لإظهار مؤشر التحميل
      setIsDataLoading(true);
      
      // تأخير قصير لإظهار مؤشر التحميل
      setTimeout(() => {
        console.log("البيانات الجديدة:", {
          code: image.code || "",
          senderName: image.senderName || "",
          phoneNumber: image.phoneNumber || "",
          province: image.province || "",
          price: image.price || "",
          companyName: image.companyName || ""
        });
        
        // تعيين البيانات المؤقتة
        setTempData({
          code: image.code || "",
          senderName: image.senderName || "",
          phoneNumber: image.phoneNumber || "",
          province: image.province || "",
          price: image.price || "",
          companyName: image.companyName || ""
        });
        
        // تحديث معرف الصورة المحملة
        setLoadedImageId(image.id);
        
        // إيقاف حالة التحميل
        setIsDataLoading(false);
      }, 500);
    } else if (
      // تحديث البيانات إذا تغيرت قيم الصورة ولكن بقي نفس المعرف
      image.code !== tempData.code ||
      image.senderName !== tempData.senderName ||
      image.phoneNumber !== tempData.phoneNumber ||
      image.province !== tempData.province ||
      image.price !== tempData.price ||
      image.companyName !== tempData.companyName
    ) {
      console.log("تحديث البيانات المؤقتة لأن البيانات تغيرت للصورة:", image.id);
      
      // تعيين حالة التحميل لإظهار مؤشر التحميل
      setIsDataLoading(true);
      
      // تأخير قصير لإظهار مؤشر التحميل
      setTimeout(() => {
        setTempData({
          code: image.code || "",
          senderName: image.senderName || "",
          phoneNumber: image.phoneNumber || "",
          province: image.province || "",
          price: image.price || "",
          companyName: image.companyName || ""
        });
        
        // إيقاف حالة التحميل
        setIsDataLoading(false);
      }, 300);
    }
  }, [
    image.id, 
    image.code, 
    image.senderName, 
    image.phoneNumber, 
    image.province, 
    image.price, 
    image.companyName, 
    setTempData,
    loadedImageId,
    tempData
  ]);

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

  // عرض نسبة الثقة بشكل أفضل
  const confidenceDisplay = image.confidence ? (
    <div className="mt-3 text-center">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        دقة الاستخراج {image.confidence}%
      </span>
    </div>
  ) : null;

  // عرض مؤشر التحميل أثناء تحميل البيانات
  const loadingIndicator = isDataLoading ? (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
        <span className="text-sm text-muted-foreground">جاري تحميل البيانات...</span>
      </div>
    </div>
  ) : null;

  // عرض مؤشر حالة المعالجة
  const processingIndicator = image.status === "processing" ? (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">جاري معالجة الصورة...</span>
        <span className="text-xs text-muted-foreground mt-1">يرجى الانتظار</span>
      </div>
    </div>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/95 dark:bg-gray-800/95 shadow-sm border-brand-beige dark:border-gray-700 hover:shadow-md transition-shadow relative">
        {loadingIndicator}
        {processingIndicator}
        
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <ExtractedDataActions 
              editMode={editMode}
              onEditToggle={handleEditToggle}
              onCancel={handleCancel}
              onCopyText={handleCopyText}
              onAutoExtract={handleAutoExtract}
              hasExtractedText={!!image.extractedText}
              isProcessing={image.status === "processing"}
            />
            
            {/* عرض مؤشر حالة اكتمال البيانات */}
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

          {/* عرض مؤشر الثقة في الأعلى بدلاً من بجانب كل حقل */}
          {confidenceDisplay}

          <LearningNotifications 
            correctionsMade={correctionsMade.length > 0} 
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
              hideConfidence={true} // إخفاء عرض نسبة الثقة بجانب كل حقل
              isLoading={isDataLoading}
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
