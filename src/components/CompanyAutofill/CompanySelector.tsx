
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, BarChart2 } from "lucide-react";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { getActiveDeliveryCompanies } from "@/utils/deliveryCompanies/companyData";

interface CompanySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (companyId: string) => void;
}

const CompanySelector = ({ isOpen, onClose, onSelectCompany }: CompanySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const companies = useMemo(() => getActiveDeliveryCompanies(), []);
  
  // فلترة الشركات حسب كلمة البحث
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    
    const query = searchQuery.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(query) || 
      company.id.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);
  
  // فرز الشركات حسب الاستخدام الأخير
  const recentCompanies = useMemo(() => {
    return [...companies]
      .filter(company => company.lastUsed !== undefined)
      .sort((a, b) => {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [companies]);
  
  // فرز الشركات حسب عدد مرات الاستخدام
  const popularCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }, [companies]);
  
  // معالج اختيار الشركة
  const handleSelectCompany = (companyId: string) => {
    onSelectCompany(companyId);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>اختر شركة التوصيل</DialogTitle>
        <DialogDescription>
          اختر شركة التوصيل التي تريد إدخال البيانات فيها
        </DialogDescription>
        
        <div className="grid gap-4 py-4">
          {/* حقل البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن شركة..."
              className="pr-10 rtl-textarea"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* قائمة الشركات الأخيرة */}
          {recentCompanies.length > 0 && !searchQuery && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <Clock className="ml-2 h-4 w-4" />
                المستخدمة مؤخرًا
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {recentCompanies.map(company => (
                  <Button
                    key={`recent-${company.id}`}
                    variant="outline"
                    className="h-auto py-2 justify-start gap-2 border-gray-200"
                    onClick={() => handleSelectCompany(company.id)}
                  >
                    {company.logoUrl ? (
                      <img 
                        src={company.logoUrl} 
                        alt={company.name} 
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <div 
                        className="h-5 w-5 rounded-full" 
                        style={{ backgroundColor: company.color || '#888' }}
                      />
                    )}
                    <span className="truncate">{company.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* قائمة الشركات الأكثر استخدامًا */}
          {popularCompanies.length > 0 && !searchQuery && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <BarChart2 className="ml-2 h-4 w-4" />
                الأكثر استخدامًا
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {popularCompanies.map(company => (
                  <Button
                    key={`popular-${company.id}`}
                    variant="outline"
                    className="h-auto py-2 justify-start gap-2 border-gray-200"
                    onClick={() => handleSelectCompany(company.id)}
                  >
                    {company.logoUrl ? (
                      <img 
                        src={company.logoUrl} 
                        alt={company.name} 
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <div 
                        className="h-5 w-5 rounded-full" 
                        style={{ backgroundColor: company.color || '#888' }}
                      />
                    )}
                    <span className="truncate">{company.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* قائمة جميع الشركات */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {searchQuery ? "نتائج البحث" : "جميع الشركات"}
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <Button
                    key={company.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-2"
                    onClick={() => handleSelectCompany(company.id)}
                  >
                    {company.logoUrl ? (
                      <img 
                        src={company.logoUrl} 
                        alt={company.name} 
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <div 
                        className="h-6 w-6 rounded-full" 
                        style={{ backgroundColor: company.color || '#888' }}
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <span>{company.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {company.usageCount} استخدام
                      </span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  لم يتم العثور على شركات مطابقة
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanySelector;
