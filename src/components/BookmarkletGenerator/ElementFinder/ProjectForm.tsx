
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectFormProps {
  projectUrl: string;
  customName: string;
  isRunning: boolean;
  onProjectUrlChange: (url: string) => void;
  onCustomNameChange: (name: string) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  projectUrl,
  customName,
  isRunning,
  onProjectUrlChange,
  onCustomNameChange,
}) => {
  // التحقق من صحة URL عند التغيير
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onProjectUrlChange(value);
    
    // اقتراح اسم المشروع تلقائياً إذا كان حقل الاسم فارغاً
    if (!customName && value) {
      try {
        const url = new URL(value);
        const suggestedName = `${url.hostname.replace('www.', '')}`;
        onCustomNameChange(suggestedName);
      } catch (e) {
        // تجاهل الأخطاء لعناوين URL غير الصالحة
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="project-url">رابط المشروع <span className="text-red-500">*</span></Label>
        <Input
          id="project-url"
          placeholder="https://example.com"
          value={projectUrl}
          onChange={handleUrlChange}
          disabled={isRunning}
          className={`${!projectUrl.startsWith('http://') && !projectUrl.startsWith('https://') && projectUrl ? 'border-red-300' : ''}`}
        />
        {projectUrl && !projectUrl.startsWith('http://') && !projectUrl.startsWith('https://') && (
          <p className="text-xs text-red-500">
            يجب أن يبدأ الرابط بـ http:// أو https://
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="custom-name">اسم المشروع (اختياري)</Label>
        <Input
          id="custom-name"
          placeholder="اسم خاص للمشروع"
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          disabled={isRunning}
        />
      </div>
    </div>
  );
};

export default ProjectForm;
