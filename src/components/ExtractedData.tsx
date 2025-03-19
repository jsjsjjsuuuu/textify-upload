
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import * as ExtractedComponents from './ExtractedData/index';

const ExtractedData = ({ 
  image, 
  imageData, 
  extractedData, 
  extractionLoading, 
  updateExtractedData, 
  updateRawText 
}) => {
  
  if (!image) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-8 bg-white">
        <div className="text-center text-muted-foreground">
          <p>قم بتحميل صورة للبدء في استخراج البيانات</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">البيانات المستخرجة</CardTitle>
      </CardHeader>
      <CardContent>
        {extractionLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary/70" />
            <p className="mt-4 text-muted-foreground">جاري استخراج البيانات من الصورة...</p>
          </div>
        ) : (
          <ExtractedComponents.ExtractedDataFields 
            extractedData={extractedData}
            onChange={updateExtractedData}
          />
        )}
        
        {extractedData && Object.keys(extractedData).length > 0 && (
          <>
            <ExtractedComponents.ExtractedDataActions 
              extractedData={extractedData}
              rawText={imageData?.extractedText}
              onUpdateRawText={updateRawText}
            />
            
            <ExtractedComponents.RawTextViewer 
              rawText={imageData?.extractedText} 
              onUpdateText={updateRawText}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtractedData;
