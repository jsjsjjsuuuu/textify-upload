
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { CompanySelector, CompanyAutofillDialog } from "@/components/CompanyAutofill";

interface CompanyAutofillButtonProps {
  imageData: ImageData;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

const CompanyAutofillButton = ({ 
  imageData, 
  variant = "default", 
  size = "default",
  fullWidth = false
}: CompanyAutofillButtonProps) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isAutofillDialogOpen, setIsAutofillDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // فتح نافذة اختيار الشركة
  const handleOpenSelector = () => {
    setIsSelectorOpen(true);
  };
  
  // معالج اختيار الشركة
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setIsSelectorOpen(false);
    setIsAutofillDialogOpen(true);
  };
  
  // إغلاق نافذة الإدخال التلقائي
  const handleCloseAutofillDialog = () => {
    setIsAutofillDialogOpen(false);
    setSelectedCompanyId(null);
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenSelector}
        className={`${fullWidth ? 'w-full' : ''} ${variant === 'default' ? 'bg-brand-green hover:bg-brand-green/90' : ''}`}
      >
        <Send size={16} className="ml-2" />
        إرسال لشركة توصيل
      </Button>
      
      <CompanySelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectCompany={handleSelectCompany}
      />
      
      {selectedCompanyId && (
        <CompanyAutofillDialog 
          isOpen={isAutofillDialogOpen}
          onClose={handleCloseAutofillDialog}
          imageData={imageData}
          companyId={selectedCompanyId}
        />
      )}
    </>
  );
};

export default CompanyAutofillButton;
