
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Container } from '@/components/ui/container';

const ServerAutomation = () => {
  return (
    <Container>
      <PageHeader
        title="إعدادات الأتمتة"
        description="هذه الصفحة غير متوفرة حاليًا."
      />
      
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          تم إيقاف ميزة الأتمتة مؤقتًا. سيتم إعادة تفعيلها في تحديث قادم.
        </p>
      </div>
    </Container>
  );
};

export default ServerAutomation;
