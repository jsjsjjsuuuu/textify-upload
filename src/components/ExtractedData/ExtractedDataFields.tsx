
import React from "react";
import ExtractedDataField from "./ExtractedDataField";

interface ExtractedDataFieldsProps {
  tempData: {
    code: string;
    senderName: string;
    phoneNumber: string;
    province: string;
    price: string;
    companyName: string;
    address: string;
    notes: string;
  };
  editMode: boolean;
  onTempChange: (field: string, value: string) => void;
  hideConfidence?: boolean; // إضافة خيار لإخفاء قيم الثقة
  confidence?: Record<string, number>; // مصفوفة لقيم الثقة لكل حقل
  isLoading?: boolean; // حالة التحميل
  loadingFields?: string[]; // قائمة الحقول التي يتم تحميلها حاليًا
}

const ExtractedDataFields = ({
  tempData,
  editMode,
  onTempChange,
  hideConfidence = false,
  confidence = {},
  isLoading = false,
  loadingFields = []
}: ExtractedDataFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ExtractedDataField
        label="اسم الشركة:"
        field="companyName"
        value={tempData.companyName}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.companyName}
        isLoading={isLoading || loadingFields.includes('companyName')}
      />
      <ExtractedDataField
        label="الكود:"
        field="code"
        value={tempData.code}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.code}
        isLoading={isLoading || loadingFields.includes('code')}
      />
      <ExtractedDataField
        label="اسم المرسل:"
        field="senderName"
        value={tempData.senderName}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.senderName}
        isLoading={isLoading || loadingFields.includes('senderName')}
      />
      <ExtractedDataField
        label="رقم الهاتف:"
        field="phoneNumber"
        value={tempData.phoneNumber}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.phoneNumber}
        isLoading={isLoading || loadingFields.includes('phoneNumber')}
      />
      <ExtractedDataField
        label="المحافظة:"
        field="province"
        value={tempData.province}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.province}
        isLoading={isLoading || loadingFields.includes('province')}
      />
      <ExtractedDataField
        label="السعر:"
        field="price"
        value={tempData.price}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.price}
        isLoading={isLoading || loadingFields.includes('price')}
      />
      <ExtractedDataField
        label="العنوان:"
        field="address"
        value={tempData.address}
        onChange={onTempChange}
        editMode={editMode}
        className="col-span-2"
        hideConfidence={hideConfidence}
        confidence={confidence.address}
        isLoading={isLoading || loadingFields.includes('address')}
      />
      <ExtractedDataField
        label="ملاحظات:"
        field="notes"
        value={tempData.notes}
        onChange={onTempChange}
        editMode={editMode}
        className="col-span-2"
        hideConfidence={hideConfidence}
        confidence={confidence.notes}
        isLoading={isLoading || loadingFields.includes('notes')}
      />
    </div>
  );
};

export default ExtractedDataFields;
