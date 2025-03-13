
import ExtractedDataField from "./ExtractedDataField";
import { IRAQ_PROVINCES } from "@/utils/provinces";

interface ExtractedDataFieldsProps {
  tempData: {
    code: string;
    senderName: string;
    phoneNumber: string;
    secondaryPhoneNumber: string;
    province: string;
    price: string;
    companyName: string;
  };
  editMode: boolean;
  onTempChange: (field: string, value: string) => void;
}

const ExtractedDataFields = ({ 
  tempData, 
  editMode, 
  onTempChange 
}: ExtractedDataFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ExtractedDataField 
        label="اسم الشركة"
        value={tempData.companyName}
        editMode={editMode}
        placeholder="أدخل اسم الشركة"
        onChange={(value) => onTempChange("companyName", value)}
      />

      <ExtractedDataField 
        label="الكود"
        value={tempData.code}
        editMode={editMode}
        placeholder="أدخل الكود"
        onChange={(value) => onTempChange("code", value)}
        fieldType="code"
      />

      <ExtractedDataField 
        label="اسم المرسل"
        value={tempData.senderName}
        editMode={editMode}
        placeholder="أدخل اسم المرسل"
        onChange={(value) => onTempChange("senderName", value)}
      />

      <ExtractedDataField 
        label="رقم الهاتف"
        value={tempData.phoneNumber}
        editMode={editMode}
        placeholder="أدخل رقم الهاتف"
        onChange={(value) => onTempChange("phoneNumber", value)}
        fieldType="phone"
      />
      
      <ExtractedDataField 
        label="رقم الهاتف الثانوي"
        value={tempData.secondaryPhoneNumber}
        editMode={editMode}
        placeholder="أدخل رقم الهاتف الثانوي"
        onChange={(value) => onTempChange("secondaryPhoneNumber", value)}
        fieldType="phone"
      />

      <ExtractedDataField 
        label="المحافظة"
        value={tempData.province}
        editMode={editMode}
        placeholder="اختر المحافظة"
        onChange={(value) => onTempChange("province", value)}
        options={IRAQ_PROVINCES}
      />

      <div className="col-span-2">
        <ExtractedDataField 
          label="السعر"
          value={tempData.price}
          editMode={editMode}
          placeholder="أدخل السعر"
          onChange={(value) => onTempChange("price", value)}
          fieldType="price"
        />
      </div>
    </div>
  );
};

export default ExtractedDataFields;
