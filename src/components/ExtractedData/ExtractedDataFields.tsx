
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
}

const ExtractedDataFields = ({
  tempData,
  editMode,
  onTempChange,
  hideConfidence = false
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
      />
      <ExtractedDataField
        label="الكود:"
        field="code"
        value={tempData.code}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="اسم المرسل:"
        field="senderName"
        value={tempData.senderName}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="رقم الهاتف:"
        field="phoneNumber"
        value={tempData.phoneNumber}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="المحافظة:"
        field="province"
        value={tempData.province}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="السعر:"
        field="price"
        value={tempData.price}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="العنوان:"
        field="address"
        value={tempData.address}
        onChange={onTempChange}
        editMode={editMode}
        className="col-span-2"
        hideConfidence={hideConfidence}
      />
      <ExtractedDataField
        label="ملاحظات:"
        field="notes"
        value={tempData.notes}
        onChange={onTempChange}
        editMode={editMode}
        className="col-span-2"
        hideConfidence={hideConfidence}
      />
    </div>
  );
};

export default ExtractedDataFields;
