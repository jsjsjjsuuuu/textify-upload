
import React from 'react';
import { PackageX } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="glass-morphism text-center py-12">
      <PackageX className="h-12 w-12 mx-auto mb-4 text-slate-500" />
      <div className="text-slate-400 text-lg">
        لا توجد مهام متاحة
      </div>
    </div>
  );
};

export default EmptyState;
