
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <CardContent className="space-y-4 p-6">
      <div className="flex items-center justify-center mb-6">
        <Loader className="w-6 h-6 animate-spin mr-2 text-white/70" />
        <span className="text-white/70">جاري تحميل البيانات...</span>
      </div>
      
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-1/3 bg-white/10" />
            <Skeleton className="h-4 w-2/3 bg-white/5" />
          </div>
        </div>
      ))}
    </CardContent>
  );
};

export default LoadingState;
