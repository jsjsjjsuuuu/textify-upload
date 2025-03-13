
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronRight, Lock } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import SiteLoginBookmarklet from "./SiteLoginBookmarklet";

interface LoginSiteFormProps {
  imageData: ImageData | null;
  multipleImages?: ImageData[];
  isMultiMode?: boolean;
}

const LoginSiteForm = ({ imageData, multipleImages = [], isMultiMode = false }: LoginSiteFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [siteUrl, setSiteUrl] = useState("https://");
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!siteUrl || !siteUrl.startsWith("http")) {
      toast({
        title: "خطأ في عنوان الموقع",
        description: "الرجاء إدخال عنوان صحيح يبدأ بـ http:// أو https://",
        variant: "destructive"
      });
      return;
    }
    
    setShowBookmarklet(true);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!showBookmarklet ? (
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-border/60 dark:border-gray-700/60">
          <CardHeader>
            <CardTitle className="text-center text-lg text-brand-brown dark:text-brand-beige">
              تسجيل الدخول للموقع المستهدف
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              أدخل بيانات تسجيل الدخول لإنشاء أداة التعبئة التلقائية
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-url">عنوان الموقع</Label>
                <Input
                  id="site-url"
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="bg-white dark:bg-gray-950"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white dark:bg-gray-950"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white dark:bg-gray-950"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
              >
                إنشاء أداة التعبئة التلقائية
                <ChevronRight className="h-4 w-4 mr-2" />
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 pt-2 border-t border-border/30 dark:border-gray-700/30">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              <span>
                بيانات تسجيل الدخول لن يتم حفظها أو مشاركتها، وتستخدم فقط لإنشاء أداة التعبئة التلقائية
              </span>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <SiteLoginBookmarklet
          imageData={imageData}
          multipleImages={multipleImages}
          isMultiMode={isMultiMode}
          siteUrl={siteUrl}
          username={username}
          password={password}
          onReset={() => setShowBookmarklet(false)}
        />
      )}
    </div>
  );
};

export default LoginSiteForm;
