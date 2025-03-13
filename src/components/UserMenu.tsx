
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, User, ChevronDown, Building } from "lucide-react";

const UserMenu = () => {
  const { user, logout, isAdmin, companies, switchCompany, activeCompany } = useAuth();

  if (!user) {
    return null;
  }

  // تحديد الشركات المتاحة للمستخدم الحالي
  const userCompanies = companies.filter(company => 
    user.companies?.some(c => typeof c === 'string' ? c === company.id : c.id === company.id)
  );

  const hasMultipleCompanies = userCompanies.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{user.username}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>حسابي</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>الملف الشخصي</span>
        </DropdownMenuItem>
        
        {hasMultipleCompanies && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>تبديل الشركة</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  {userCompanies.map(company => (
                    <DropdownMenuItem 
                      key={company.id}
                      onClick={() => switchCompany(company.id)}
                      className={`flex items-center gap-2 ${activeCompany?.id === company.id ? 'bg-secondary' : ''}`}
                    >
                      {company.logoUrl && (
                        <img 
                          src={company.logoUrl} 
                          alt={company.name} 
                          className="h-4 w-4 object-contain" 
                        />
                      )}
                      <span>{company.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        
        {isAdmin && (
          <DropdownMenuItem className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-2 text-red-500 focus:text-red-500"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
