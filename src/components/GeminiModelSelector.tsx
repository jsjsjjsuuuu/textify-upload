import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AVAILABLE_MODELS, GeminiModelType } from '@/lib/gemini/models';
import { Info } from 'lucide-react';  // Changed from InfoCircle to Info
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GeminiModelSelectorProps {
  onModelChange?: (model: GeminiModelType) => void;
  defaultModel?: GeminiModelType;
  className?: string;
}

const GeminiModelSelector: React.FC<GeminiModelSelectorProps> = ({
  onModelChange,
  defaultModel = GeminiModelType.FLASH,
  className = ''
}) => {
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>(defaultModel);
  
  // حفظ النموذج المختار في التخزين المحلي
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('preferred_gemini_model', selectedModel);
    }
  }, [selectedModel]);
  
  // تحميل النموذج المخزن عند بدء التشغيل
  useEffect(() => {
    const storedModel = localStorage.getItem('preferred_gemini_model');
    if (storedModel && AVAILABLE_MODELS.some(m => m.id === storedModel)) {
      setSelectedModel(storedModel as GeminiModelType);
      if (onModelChange) {
        onModelChange(storedModel as GeminiModelType);
      }
    }
  }, [onModelChange]);
  
  // تغيير النموذج المختار
  const handleModelChange = (value: string) => {
    const newModel = value as GeminiModelType;
    setSelectedModel(newModel);
    
    if (onModelChange) {
      onModelChange(newModel);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="model-selector" className="flex items-center gap-1 text-sm">
          نموذج Gemini
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Replace InfoCircle with Info in the JSX */}
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-80">
                <p className="text-sm">
                  اختر نموذج Gemini الذي تريد استخدامه في استخراج البيانات من الصور.
                  النماذج المختلفة لها قدرات وسرعات مختلفة.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="اختر النموذج" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span>{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GeminiModelSelector;
