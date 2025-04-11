
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
  };
  editMode: boolean;
  onTempChange: (field: string, value: string) => void;
  hideConfidence?: boolean;
  confidence?: Record<string, number>;
  isLoading?: boolean;
  loadingFields?: string[];
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
    <div className="grid grid-cols-1 gap-3">
      <ExtractedDataField
        label="الكود:"
        field="code"
        value={tempData.code}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.code}
        isLoading={isLoading || loadingFields.includes('code')}
        className="mb-1"
        isRequired={true}
      />
      <ExtractedDataField
        label="اسم الشركة:"
        field="companyName"
        value={tempData.companyName}
        onChange={onTempChange}
        editMode={editMode}
        hideConfidence={hideConfidence}
        confidence={confidence.companyName}
        isLoading={isLoading || loadingFields.includes('companyName')}
        className="mb-1"
        isRequired={true}
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
        className="mb-1"
        isRequired={true}
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
        className="mb-1"
        isRequired={true}
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
        className="mb-1"
        isRequired={true}
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
        className="mb-1"
        isRequired={true}
      />
    </div>
  );
};

export default ExtractedDataFields;
