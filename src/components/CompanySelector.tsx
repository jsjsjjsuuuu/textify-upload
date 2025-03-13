
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

const CompanySelector = () => {
  const { user, companies, activeCompany, switchCompany } = useAuth();
  
  // إذا لم يكن المستخدم مسجل الدخول أو ليس لديه شركات متعددة، لا نعرض أي شيء
  if (!user || !user.companies || user.companies.length <= 1) {
    return null;
  }
  
  // نحدد الشركات المتاحة للمستخدم الحالي
  const userCompanies = companies.filter(company => 
    user.companies?.some(c => typeof c === 'string' ? c === company.id : c.id === company.id)
  );
  
  return (
    <div className="min-w-[180px]">
      <Select
        value={activeCompany?.id}
        onValueChange={switchCompany}
      >
        <SelectTrigger className="bg-white/90 dark:bg-gray-800/90">
          <SelectValue placeholder="اختر الشركة" />
        </SelectTrigger>
        <SelectContent>
          {userCompanies.map(company => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex items-center gap-2">
                {company.logoUrl && (
                  <img 
                    src={company.logoUrl} 
                    alt={company.name} 
                    className="h-5 w-5 object-contain" 
                  />
                )}
                <span>{company.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelector;
