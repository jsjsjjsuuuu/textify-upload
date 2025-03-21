
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProjectFormProps {
  projectUrl: string;
  customName: string;
  isRunning: boolean;
  onProjectUrlChange: (value: string) => void;
  onCustomNameChange: (value: string) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  projectUrl,
  customName,
  isRunning,
  onProjectUrlChange,
  onCustomNameChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectUrl">رابط المشروع</Label>
        <Input
          id="projectUrl"
          placeholder="https://example.com"
          value={projectUrl}
          onChange={(e) => onProjectUrlChange(e.target.value)}
          disabled={isRunning}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="customName">اسم مخصص (اختياري)</Label>
        <Input
          id="customName"
          placeholder="اسم المشروع المخصص"
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          disabled={isRunning}
        />
      </div>
    </div>
  );
};

export default ProjectForm;
