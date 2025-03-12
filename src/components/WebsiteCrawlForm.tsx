
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/lib/firecrawlService';
import { Card } from "@/components/ui/card";
import { BookmarkletGenerator } from './BookmarkletGenerator';
import { ImageData } from "@/types/ImageData";

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

const WebsiteCrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ImageData | null>(null);

  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    FirecrawlService.saveApiKey(apiKey);
    toast({
      title: "تم",
      description: "تم حفظ مفتاح API بنجاح",
      duration: 3000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    
    try {
      const savedApiKey = FirecrawlService.getApiKey();
      if (!savedApiKey && !apiKey) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال مفتاح API أولاً",
          variant: "destructive",
          duration: 3000,
        });
        setIsLoading(false);
        return;
      }

      if (apiKey && !savedApiKey) {
        FirecrawlService.saveApiKey(apiKey);
      }

      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 200);

      console.log('بدء عملية زحف للرابط:', url);
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success) {
        toast({
          title: "تم",
          description: "تم استخراج البيانات من الموقع بنجاح",
          duration: 3000,
        });
        setCrawlResult(result);
        
        // إنشاء نموذج بيانات لاستخدامه مع Bookmarklet
        const mockImageData: ImageData = {
          id: `crawl-${Date.now()}`,
          file: new File([], "crawled-data.txt"),
          previewUrl: "",
          extractedText: JSON.stringify(result.data, null, 2),
          date: new Date(),
          status: "completed",
          senderName: result.data?.[0]?.title || "بيانات مستخرجة",
          code: url,
          province: result.data?.[0]?.metadata?.description || "وصف الصفحة",
        };
        setExtractedData(mockImageData);
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في استخراج البيانات من الموقع",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('خطأ في استخراج البيانات من الموقع:', error);
      toast({
        title: "خطأ",
        description: "فشل في استخراج البيانات من الموقع",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-center text-brand-brown dark:text-brand-beige">استخراج البيانات من المواقع</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              مفتاح Firecrawl API (مطلوب مرة واحدة)
            </label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
                placeholder="أدخل مفتاح API الخاص بك"
              />
              <Button 
                type="button" 
                onClick={handleApiKeySave}
                variant="outline"
              >
                حفظ
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              يمكنك الحصول على مفتاح API من موقع Firecrawl
            </p>
          </div>

          <div>
            <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              رابط الموقع
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
              placeholder="https://example.com"
              required
            />
          </div>
        </div>
        
        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">جاري استخراج البيانات... {progress}%</p>
          </div>
        )}
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-coral hover:bg-brand-coral/90 text-white"
        >
          {isLoading ? "جاري الاستخراج..." : "استخراج البيانات"}
        </Button>
      </form>

      {crawlResult && crawlResult.success && (
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-2">نتائج الاستخراج</h3>
          <div className="space-y-2 text-sm">
            <p>الحالة: {crawlResult.status}</p>
            <p>الصفحات المكتملة: {crawlResult.completed}</p>
            <p>إجمالي الصفحات: {crawlResult.total}</p>
            <p>الرصيد المستخدم: {crawlResult.creditsUsed}</p>
            
            {crawlResult.data && (
              <div className="mt-4">
                <p className="font-semibold mb-2">البيانات المستخرجة:</p>
                <div className="bg-muted p-2 rounded overflow-auto max-h-40 text-xs">
                  <pre>
                    {JSON.stringify(crawlResult.data, null, 2)}
                  </pre>
                </div>
                
                <Button
                  onClick={() => setIsBookmarkletOpen(true)}
                  className="mt-4 w-full bg-brand-green text-white hover:bg-brand-green/90"
                >
                  إنشاء Bookmarklet للبيانات المستخرجة
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {isBookmarkletOpen && extractedData && (
        <BookmarkletGenerator
          isOpen={isBookmarkletOpen}
          onClose={() => setIsBookmarkletOpen(false)}
          imageData={extractedData}
        />
      )}
    </div>
  );
};

export default WebsiteCrawlForm;
