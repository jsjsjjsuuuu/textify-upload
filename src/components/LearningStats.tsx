
import React, { useState, useEffect } from 'react';
import { getLearningStats } from "@/utils/learningSystem";

// تعديل المكون بحيث لا يظهر في واجهة المستخدم ولكن يحتفظ بوظائفه الداخلية
const LearningStats = () => {
  const [stats, setStats] = useState<ReturnType<typeof getLearningStats> | null>(null);

  useEffect(() => {
    setStats(getLearningStats());
    
    // تحديث الإحصائيات كل 30 ثانية
    const interval = setInterval(() => {
      const newStats = getLearningStats();
      setStats(prev => {
        return newStats;
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // المكون لا يعرض أي واجهة مستخدم ولكنه يحتفظ بالمنطق الداخلي
  return null;
};

export default LearningStats;
