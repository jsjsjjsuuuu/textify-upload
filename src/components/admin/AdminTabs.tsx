
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus } from 'lucide-react';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  managementTabContent: React.ReactNode;
}

const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  managementTabContent
}) => {
  return (
    <>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">قائمة المستخدمين</TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            إضافة و إدارة المستخدمين
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={activeTab}>
        <TabsContent value="users" className="mt-0">
          {children}
        </TabsContent>
        
        <TabsContent value="management">
          {managementTabContent}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminTabs;
