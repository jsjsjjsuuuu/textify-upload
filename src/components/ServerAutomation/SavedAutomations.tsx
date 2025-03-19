
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Trash2, Copy, ExternalLink, FileText, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AutomationService } from '@/utils/automationService';
import { AutomationConfig, AutomationAction } from '@/utils/automation/types';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface SavedAutomation {
  id: string;
  name: string;
  url: string;
  actions: AutomationAction[];
  createdAt: string;
}

const SavedAutomations: React.FC = () => {
  const [savedAutomations, setSavedAutomations] = useState<SavedAutomation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<SavedAutomation | null>(null);
  const [isRunning, setIsRunning] = useState<{[key: string]: boolean}>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    loadSavedAutomations();
  }, []);
  
  const loadSavedAutomations = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('automationConfigs') || '[]');
      setSavedAutomations(saved);
    } catch (error) {
      console.error('فشل في تحميل الأتمتة المحفوظة', error);
      toast.error('حدث خطأ أثناء تحميل الأتمتة المحفوظة');
    }
  };
  
  const handleDelete = (id: string) => {
    try {
      const updated = savedAutomations.filter(item => item.id !== id);
      localStorage.setItem('automationConfigs', JSON.stringify(updated));
      setSavedAutomations(updated);
      toast.success('تم حذف الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الأتمتة');
    }
  };
  
  const handleRun = async (automation: SavedAutomation) => {
    setIsRunning(prev => ({ ...prev, [automation.id]: true }));
    toast.info('جاري تنفيذ الأتمتة...', { duration: 3000 });
    
    try {
      const config: AutomationConfig = {
        projectName: automation.name,
        projectUrl: automation.url,
        actions: automation.actions,
        automationType: 'server'
      };
      
      const result = await AutomationService.validateAndRunAutomation(config);
      
      if (result.success) {
        toast.success('تم تنفيذ الأتمتة بنجاح!');
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRunning(prev => ({ ...prev, [automation.id]: false }));
    }
  };
  
  const handleDuplicate = (automation: SavedAutomation) => {
    try {
      const newAutomation = {
        ...automation,
        id: crypto.randomUUID(),
        name: `نسخة من ${automation.name}`,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...savedAutomations, newAutomation];
      localStorage.setItem('automationConfigs', JSON.stringify(updated));
      setSavedAutomations(updated);
      toast.success('تم نسخ الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء نسخ الأتمتة');
    }
  };
  
  const viewDetails = (automation: SavedAutomation) => {
    setSelectedAutomation(automation);
    setIsDialogOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };
  
  return (
    <div>
      {savedAutomations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-medium mb-2">لا توجد أتمتة محفوظة</h3>
            <p className="text-muted-foreground">
              لم تقم بحفظ أي سيناريوهات أتمتة بعد. قم بإنشاء وحفظ سيناريو جديد من علامة التبويب "إنشاء أتمتة جديدة".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedAutomations.map((automation) => (
            <Card key={automation.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{automation.name}</CardTitle>
                <CardDescription>
                  <span dir="ltr" className="text-xs opacity-70">{automation.url}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">عدد الإجراءات: </span>
                  <span className="font-medium">{automation.actions.length}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  تم الإنشاء {formatDate(automation.createdAt)}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2 pb-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewDetails(automation)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  التفاصيل
                </Button>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(automation.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDuplicate(automation)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleRun(automation)}
                    disabled={isRunning[automation.id]}
                  >
                    <PlayCircle className={`h-4 w-4 mr-1 ${isRunning[automation.id] ? 'animate-spin' : ''}`} />
                    تشغيل
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedAutomation && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الأتمتة: {selectedAutomation.name}</DialogTitle>
              <DialogDescription>
                تم إنشاؤها {formatDate(selectedAutomation.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">رابط المشروع:</h4>
                <div className="flex items-center">
                  <code className="bg-muted p-2 rounded text-xs block w-full overflow-x-auto" dir="ltr">
                    {selectedAutomation.url}
                  </code>
                  <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0"
                    onClick={() => {
                      window.open(selectedAutomation.url, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h4 className="text-sm font-medium mb-2">الإجراءات ({selectedAutomation.actions.length}):</h4>
              
              <ScrollArea className="h-80 rounded-md border p-3">
                <div className="space-y-3">
                  {selectedAutomation.actions.map((action, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between">
                        <h5 className="font-medium">
                          {index + 1}. {action.name}
                        </h5>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          تأخير: {action.delay} مللي ثانية
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">المحدد: </span>
                          <code className="text-xs bg-muted px-1 rounded" dir="ltr">{action.finder}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">القيمة: </span>
                          <span>{action.value || <em className="opacity-50">فارغة</em>}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter className="gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => handleDuplicate(selectedAutomation)}
              >
                <Copy className="mr-2 h-4 w-4" />
                نسخ
              </Button>
              <Button 
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  handleRun(selectedAutomation);
                  setIsDialogOpen(false);
                }}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                تشغيل الأتمتة
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default SavedAutomations;
