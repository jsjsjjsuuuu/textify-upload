
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLearningStats } from "@/utils/learningSystem";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { Brain } from 'lucide-react';

const LearningStats = () => {
  const [stats, setStats] = useState<ReturnType<typeof getLearningStats> | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setStats(getLearningStats());
    
    // تحديث الإحصائيات كل 30 ثانية
    const interval = setInterval(() => {
      setStats(getLearningStats());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // تحديث الإحصائيات عند إظهار المكون
  useEffect(() => {
    if (isVisible) {
      setStats(getLearningStats());
    }
  }, [isVisible]);

  if (!stats || stats.totalCorrections === 0) {
    return null;
  }
  
  const fieldNames: Record<string, string> = {
    code: "الكود",
    senderName: "اسم المرسل",
    phoneNumber: "رقم الهاتف",
    province: "المحافظة",
    price: "السعر"
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 shadow-sm border-brand-beige dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Brain size={18} className="text-brand-green" />
          نظام التعلم الذكي
          <Badge className="mr-2 bg-brand-brown dark:bg-amber-700">
            {stats.totalCorrections} تصحيح
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-3">
          آخر تحديث: {formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: arEG })}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm mb-1">المجالات التي تم تحسينها:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.fieldStats).map(([field, data]) => (
              <Badge key={field} variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {fieldNames[field] || field}: {data.count} تصحيح
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningStats;
