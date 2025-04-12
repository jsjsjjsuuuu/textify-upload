
import React from 'react';
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="flex justify-center py-12 bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
    </div>
  );
};

export default LoadingState;
