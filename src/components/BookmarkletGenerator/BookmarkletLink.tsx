
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookmarkletLinkProps {
  bookmarkletUrl: string;
  isGeneratingUrl: boolean;
  onCopyBookmarklet: () => void;
  onDragStart?: (e: React.DragEvent<HTMLAnchorElement>) => void;
}

const BookmarkletLink: React.FC<BookmarkletLinkProps> = ({
  bookmarkletUrl,
  isGeneratingUrl,
  onCopyBookmarklet,
  onDragStart
}) => {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toast({
      title: "اسحب الرابط إلى شريط المفضلة",
      description: "لا تنقر على الرابط، بل اسحبه إلى شريط الإشارات المرجعية (المفضلة) في متصفحك",
      variant: "default"
    });
  };

  return (
    <div className="bg-secondary/30 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">كيفية إضافة الأداة للمتصفح:</h3>
      
      <div className="flex items-center">
        <div className="flex-1 relative">
          <div className="border rounded-md px-3 py-2 bg-muted text-sm truncate overflow-hidden text-center relative">
            <ArrowDown className="absolute top-2 left-2 h-4 w-4 text-muted-foreground animate-bounce" />
            
            {isGeneratingUrl ? (
              <span className="text-muted-foreground">جاري إنشاء الرابط...</span>
            ) : (
              <a 
                href={bookmarkletUrl} 
                className="text-brand-coral hover:text-brand-coral/80 hover:underline font-mono"
                draggable="true"
                onDragStart={onDragStart}
                onClick={handleClick}
              >
                أداة نقل البيانات
              </a>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onCopyBookmarklet}
          className="ml-2"
          disabled={isGeneratingUrl}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 flex items-center">
        <ArrowDown className="h-3 w-3 mr-1 inline-block" />
        <strong>اسحب الرابط</strong> (أداة نقل البيانات) إلى شريط الإشارات المرجعية في متصفحك
      </p>
      
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md">
        <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400">كيفية إظهار شريط الإشارات المرجعية (المفضلة):</h4>
        <ul className="text-xs text-blue-600 dark:text-blue-500 mt-1 list-disc list-inside space-y-1">
          <li>Chrome: انقر على ⋮ (ثلاث نقاط) ثم الإشارات المرجعية → إظهار شريط الإشارات المرجعية</li>
          <li>Firefox: انقر بزر الماوس الأيمن على شريط العناوين → إظهار شريط الإشارات المرجعية</li>
          <li>Edge: انقر على ⋯ (ثلاث نقاط) ثم الإشارات المرجعية → إظهار شريط الإشارات المرجعية</li>
        </ul>
      </div>
    </div>
  );
};

export default BookmarkletLink;
