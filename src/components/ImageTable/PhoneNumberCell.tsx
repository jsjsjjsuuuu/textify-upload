
import React from "react";
import { AlertCircle } from "lucide-react";

interface PhoneNumberCellProps {
  phoneNumber: string | undefined;
}

const PhoneNumberCell: React.FC<PhoneNumberCellProps> = ({ phoneNumber }) => {
  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !phoneNumber || phoneNumber.replace(/[^\d]/g, '').length === 11;

  if (!phoneNumber) {
    return <span>—</span>;
  }

  return (
    <div className="flex items-center">
      <span className={!isPhoneNumberValid ? "text-destructive font-medium" : "font-medium"}>
        {phoneNumber}
      </span>
      {!isPhoneNumberValid && (
        <span className="mr-1.5 text-destructive">
          <AlertCircle size={14} />
        </span>
      )}
    </div>
  );
};

export default PhoneNumberCell;
