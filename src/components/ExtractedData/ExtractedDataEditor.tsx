
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import ExtractedDataField from "./ExtractedDataField";
import ExtractedDataActions from "./ExtractedDataActions";
import RawTextViewer from "./RawTextViewer";

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
        <ExtractedDataActions 
          editMode={editMode}
          onEditToggle={handleEditToggle}
          onCancel={handleCancel}
          onCopyText={handleCopyText}
          onAutoExtract={handleAutoExtract}
          hasExtractedText={!!image.extractedText}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExtractedDataField 
            label="الكود"
            value={tempData.code}
            editMode={editMode}
            placeholder="أدخل الكود"
            onChange={(value) => handleTempChange("code", value)}
          />

          <ExtractedDataField 
            label="اسم المرسل"
            value={tempData.senderName}
            editMode={editMode}
            placeholder="أدخل اسم المرسل"
            onChange={(value) => handleTempChange("senderName", value)}
          />

          <ExtractedDataField 
            label="رقم الهاتف"
            value={tempData.phoneNumber}
            editMode={editMode}
            placeholder="أدخل رقم الهاتف"
            onChange={(value) => handleTempChange("phoneNumber", value)}
          />

          <ExtractedDataField 
            label="المحافظة"
            value={tempData.province}
            editMode={editMode}
            placeholder="أدخل المحافظة"
            onChange={(value) => handleTempChange("province", value)}
          />

          <div className="col-span-2">
            <ExtractedDataField 
              label="السعر"
              value={tempData.price}
              editMode={editMode}
              placeholder="أدخل السعر"
              onChange={(value) => handleTempChange("price", value)}
            />
          </div>
        </div>

        <RawTextViewer text={image.extractedText} />
      </CardContent>
    </Card>
  );
};

export default ExtractedDataEditor;
