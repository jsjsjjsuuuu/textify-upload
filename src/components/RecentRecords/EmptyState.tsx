
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

const EmptyState = () => {
  return (
    <CardContent className="text-center py-12 text-white/70">
      <div className="glassmorphism-card p-8 mx-auto max-w-md">
        <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">لا توجد سجلات حتى الآن</p>
        <p className="text-sm mt-2 text-white/50">ستظهر هنا السجلات بمجرد إضافتها</p>
      </div>
    </CardContent>
  );
};

export default EmptyState;
