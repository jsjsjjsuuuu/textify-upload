
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { isConnected } from '@/utils/automationServerUrl';
import { toast } from 'sonner';
import ImageCard from '@/components/ImageCard';
import BackgroundPattern from '@/components/BackgroundPattern';

const Index: React.FC = () => {
  const [showConnectionWarning, setShowConnectionWarning] = useState(false);
  
  useEffect(() => {
    // التحقق من حالة الاتصال عند تحميل الصفحة
    const isServerConnected = isConnected();
    setShowConnectionWarning(!isServerConnected);
    
    if (!isServerConnected) {
      toast.warning(
        "لم يتم الاتصال بخادم الأتمتة بعد",
        {
          description: "قد لا تعمل بعض ميزات الأتمتة. يرجى التحقق من الاتصال في إعدادات الخادم.",
          duration: 8000,
        }
      );
    }
  }, []);
  
  const cards = [
    {
      title: "محدد العناصر",
      description: "إنشاء بوكماركلت مخصص لتحديد العناصر والتفاعل معها على أي صفحة ويب.",
      image: "/element-finder.png",
      href: "/element-finder",
    },
    {
      title: "مولد البوكماركلت",
      description: "إنشاء بوكماركلت لتنفيذ إجراءات محددة على أي صفحة ويب.",
      image: "/bookmarklet-generator.png",
      href: "/bookmarklet-generator",
    },
    {
      title: "إعدادات الخادم",
      description: "تكوين عنوان URL لخادم الأتمتة وإدارة إعدادات الاتصال.",
      image: "/server-settings.png",
      href: "/server-settings",
    },
  ];

  return (
    <div className="relative flex flex-col min-h-screen">
      <BackgroundPattern />
      <div className="container mx-auto px-4 py-10 z-10">
        <h1 className="text-3xl font-semibold text-center mb-8">
          مرحبا بك في أدوات الأتمتة
        </h1>
        {showConnectionWarning && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">تحذير:</strong>
            <span className="block sm:inline"> لم يتم الاتصال بخادم الأتمتة بعد. قد لا تعمل بعض الميزات.</span>
            <Link to="/server-settings">
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg className="fill-current h-6 w-6 text-yellow-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
            </Link>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="h-full">
              <Link to={card.href} className="block h-full">
                <Card className="h-full p-4 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-transparent border-none backdrop-blur-sm">
                  <div className="flex flex-col gap-4 h-full">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-transparent">
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
