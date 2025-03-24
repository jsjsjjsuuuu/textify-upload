
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home, Settings, FileSpreadsheet, Server } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ConnectionStatusIndicator } from '@/components/ui/connection-status-indicator';

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="link"
            className="flex items-center gap-2 text-brand-brown px-0"
            onClick={() => navigate('/')}
          >
            <Home size={18} />
            <span className="font-medium">الرئيسية</span>
          </Button>
          
          <div className="mx-3">
            <ConnectionStatusIndicator size="sm" hideText={true} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
            onClick={() => navigate('/server-automation')}
          >
            <Server size={16} />
            <span>الأتمتة</span>
          </Button>
          
          <Button
            variant="outline" 
            className="flex items-center gap-2"
            size="sm"
            onClick={() => navigate('/api-settings')}
          >
            <FileSpreadsheet size={16} />
            <span>API</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
            onClick={() => navigate('/server-settings')}
          >
            <Settings size={16} />
            <span>الإعدادات</span>
          </Button>
        </div>
      </div>
      <Separator className="my-4" />
    </header>
  );
};

export default AppHeader;
