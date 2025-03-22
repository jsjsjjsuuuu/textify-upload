
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, Trash2, Calendar, Server, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SavedAutomation {
  id: string;
  projectUrl: string;
  projectName: string;
  actions: any[];
  dateCreated: string;
  targetSite?: string;
  n8nMode?: boolean;
}

interface SavedAutomationsProps {
  isN8NMode?: boolean;
}

const SavedAutomations: React.FC<SavedAutomationsProps> = ({ isN8NMode = false }) => {
  const [automations, setAutomations] = useState<SavedAutomation[]>([]);
  const [filteredAutomations, setFilteredAutomations] = useState<SavedAutomation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // استرداد الأتمتة المحفوظة من التخزين المحلي
  useEffect(() => {
    try {
      const savedAutomationsString = localStorage.getItem('savedAutomations');
      if (savedAutomationsString) {
        const savedAutomations = JSON.parse(savedAutomationsString);
        setAutomations(savedAutomations);
        setFilteredAutomations(savedAutomations);
      }
    } catch (error) {
      console.error("خطأ في استرداد الأتمتة المحفوظة:", error);
      toast.error("تعذر استرداد الأتمتة المحفوظة");
    }
  }, []);
  
  // تصفية الأتمتة بناءً على مصطلح البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAutomations(automations);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = automations.filter(
        (automation) =>
          automation.projectName.toLowerCase().includes(searchTermLower) ||
          automation.projectUrl.toLowerCase().includes(searchTermLower)
      );
      setFilteredAutomations(filtered);
    }
  }, [searchTerm, automations]);
  
  // تنسيق التاريخ للعرض
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'تاريخ غير صالح';
    }
  };
  
  // حذف أتمتة محفوظة
  const deleteAutomation = (id: string) => {
    try {
      const updatedAutomations = automations.filter((automation) => automation.id !== id);
      localStorage.setItem('savedAutomations', JSON.stringify(updatedAutomations));
      setAutomations(updatedAutomations);
      setFilteredAutomations(updatedAutomations.filter(
        (automation) =>
          !searchTerm.trim() ||
          automation.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          automation.projectUrl.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      toast.success("تم حذف الأتمتة بنجاح");
    } catch (error) {
      console.error("خطأ في حذف الأتمتة:", error);
      toast.error("تعذر حذف الأتمتة");
    }
  };
  
  // تحميل أتمتة محفوظة
  const loadAutomation = (automation: SavedAutomation) => {
    try {
      // تخزين بيانات الأتمتة في localStorage
      localStorage.setItem('automationToLoad', JSON.stringify(automation));
      
      // إعادة تحميل الصفحة لتحميل الأتمتة
      window.location.href = window.location.pathname + '?tab=new&load=' + automation.id;
      
      toast.success("جاري تحميل الأتمتة...");
    } catch (error) {
      console.error("خطأ في تحميل الأتمتة:", error);
      toast.error("تعذر تحميل الأتمتة");
    }
  };
  
  // فتح عنوان URL للمشروع في تبويب جديد
  const openProjectUrl = (url: string) => {
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error("خطأ في فتح عنوان URL:", error);
      toast.error("تعذر فتح عنوان URL");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>الأتمتة المحفوظة</CardTitle>
        <CardDescription>
          قائمة بجميع سيناريوهات الأتمتة التي قمت بحفظها
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الأتمتة المحفوظة..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredAutomations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm.trim()
                  ? "لا توجد نتائج تطابق بحثك"
                  : "لا توجد أتمتة محفوظة. قم بإنشاء وحفظ أتمتة جديدة أولاً!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAutomations.map((automation) => (
                <div
                  key={automation.id}
                  className="border rounded-lg p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{automation.projectName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(automation.dateCreated)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {automation.n8nMode && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Server className="h-3 w-3 mr-1" />
                          n8n
                        </Badge>
                      )}
                      {automation.targetSite && automation.targetSite !== 'default' && (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                          {automation.targetSite}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => loadAutomation(automation)}
                        variant="outline"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        تحميل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openProjectUrl(automation.projectUrl)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح الرابط
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAutomation(automation.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="text-gray-600 font-medium">الرابط:</span>{" "}
                    <span className="font-mono">{automation.projectUrl}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <span className="text-gray-600 font-medium">عدد الإجراءات:</span>{" "}
                    {automation.actions.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SavedAutomations;
