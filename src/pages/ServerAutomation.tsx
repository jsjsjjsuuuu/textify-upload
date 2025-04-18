
import React from 'react';
import SimpleAutomationSection from '@/components/SimpleAutomationSection';
import RealExecutionToggle from '@/components/ServerSettings/RealExecutionToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ServerAutomation = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>إعدادات الأتمتة</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <RealExecutionToggle />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>إنشاء أتمتة جديدة</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <SimpleAutomationSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServerAutomation;
