
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageData } from "@/types/ImageData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookmarkletGenerator from "./BookmarkletGenerator";
import LoginSiteForm from "./LoginSiteForm";

interface AdvancedFillOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: ImageData | null;
  multipleImages?: ImageData[];
  isMultiMode?: boolean;
}

const AdvancedFillOptions = ({
  isOpen,
  onClose,
  imageData,
  multipleImages = [],
  isMultiMode = false
}: AdvancedFillOptionsProps) => {
  const [activeTab, setActiveTab] = useState<string>("standard");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-2">
            خيارات التعبئة التلقائية المتقدمة
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="standard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="standard">التعبئة العادية</TabsTrigger>
            <TabsTrigger value="login">مواقع تسجيل الدخول</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            <BookmarkletGenerator
              isOpen={activeTab === "standard"}
              onClose={() => {}} // لا نحتاج لإغلاق الـ Dialog هنا
              imageData={imageData}
              multipleImages={multipleImages}
              isMultiMode={isMultiMode}
            />
          </TabsContent>
          
          <TabsContent value="login">
            <LoginSiteForm
              imageData={imageData}
              multipleImages={multipleImages}
              isMultiMode={isMultiMode}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFillOptions;
