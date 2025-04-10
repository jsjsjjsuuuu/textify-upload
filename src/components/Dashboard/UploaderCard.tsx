
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import FileUploader from '@/components/FileUploader';

interface UploaderCardProps {
  isProcessing: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
}

const UploaderCard: React.FC<UploaderCardProps> = ({ isProcessing, onFilesSelected }) => {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-0">
        <CardTitle>تحميل الصور</CardTitle>
      </CardHeader>
      <CardContent>
        {!isProcessing && (
          <div className="mt-4">
            <FileUploader onFilesSelected={onFilesSelected} isProcessing={isProcessing} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploaderCard;
