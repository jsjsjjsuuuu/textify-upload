
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CheckCircle } from 'lucide-react';

interface UserTabsFilterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  children: React.ReactNode;
}

const UserTabsFilter: React.FC<UserTabsFilterProps> = ({
  activeTab,
  onTabChange,
  totalUsers,
  pendingUsers,
  approvedUsers,
  children
}) => {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={onTabChange}
      className="w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            جميع المستخدمين ({totalUsers})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            في الانتظار ({pendingUsers})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            المعتمدون ({approvedUsers})
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="all">
        {children}
      </TabsContent>
      
      <TabsContent value="pending">
        {children}
      </TabsContent>
      
      <TabsContent value="approved">
        {children}
      </TabsContent>
    </Tabs>
  );
};

export default UserTabsFilter;
