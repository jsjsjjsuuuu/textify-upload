
import React from 'react';
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="glass-morphism flex justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
    </div>
  );
};

export default LoadingState;
