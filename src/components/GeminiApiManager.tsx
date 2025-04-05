
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useGeminiProcessing } from '@/hooks/useGeminiProcessing';

const GeminiApiManager = () => {
  const [apiKey, setApiKey] = useState('');
  const { addNewApiKey, getApiStats } = useGeminiProcessing();
  const stats = getApiStats();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error("خطأ", {
        description: "يرجى إدخال مفتاح API صالح"
      });
      return;
    }
    
    const success = addNewApiKey(apiKey);
    if (success) {
      setApiKey('');
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">إعدادات مفتاح Gemini API</CardTitle>
        <CardDescription>
          أضف مفتاح API خاص بك للحصول على أداء أفضل في معالجة الصور
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">مفتاح Gemini API الخاص بك</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="أدخل مفتاح API الخاص بك هنا..."
                className="flex-1"
              />
              <Button type="submit">
                إضافة
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              للحصول على مفتاح Gemini API يرجى زيارة{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          
          {stats && (
            <div className="text-sm text-muted-foreground mt-2 space-y-1 border-t pt-2">
              <p>عدد المفاتيح: {stats.total}</p>
              <p>المفاتيح النشطة: {stats.active}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default GeminiApiManager;
