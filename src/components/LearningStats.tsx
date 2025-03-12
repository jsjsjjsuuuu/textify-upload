import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLearningStats } from "@/utils/learningSystem";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { Brain, ArrowUpCircle } from 'lucide-react';
const LearningStats = () => {
  const [stats, setStats] = useState<ReturnType<typeof getLearningStats> | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  useEffect(() => {
    setStats(getLearningStats());

    // تحديث الإحصائيات كل 30 ثانية
    const interval = setInterval(() => {
      const newStats = getLearningStats();
      setStats(prev => {
        // إظهار تأثير بصري عند تغير الإحصائيات
        if (prev && newStats.totalCorrections > prev.totalCorrections) {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 3000);
        }
        return newStats;
      });
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
  return;
};
export default LearningStats;