
import React from 'react';
import { PackageX } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="text-center py-12 bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50">
      <PackageX className="h-12 w-12 mx-auto mb-4 text-slate-500" />
      <div className="text-slate-400 text-lg">
        لا توجد سجلات متاحة
      </div>
    </div>
  );
};

export default EmptyState;
