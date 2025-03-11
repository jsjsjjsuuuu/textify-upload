
import React from "react";

interface ConfidenceIndicatorProps {
  confidence: number | undefined;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ confidence }) => {
  if (!confidence) {
    return <span>—</span>;
  }

  return (
    <div className="flex items-center">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-16">
        <div 
          className={`h-2 rounded-full ${confidence > 85 ? 'bg-brand-green' : confidence > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${Math.round(confidence)}%` }}
        ></div>
      </div>
      <span className="font-medium">{Math.round(confidence)}%</span>
    </div>
  );
};

export default ConfidenceIndicator;
