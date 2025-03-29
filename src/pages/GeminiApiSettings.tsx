
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import GeminiApiKeyManager from '@/components/ApiKeyManager/GeminiApiKeyManager';

const GeminiApiSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">إدارة مفاتيح Gemini API</CardTitle>
            <CardDescription>
              قم بإدارة مفاتيح Gemini API للنظام بأكمله. ستكون هذه المفاتيح متاحة لجميع المستخدمين لمعالجة الصور.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeminiApiKeyManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeminiApiSettings;
