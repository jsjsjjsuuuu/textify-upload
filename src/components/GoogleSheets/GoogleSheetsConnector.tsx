
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CircleCheck, AlertCircle, Table, FileSpreadsheet, ArrowUpToLine, RefreshCw } from 'lucide-react';
import { GoogleSheetsConfig, GoogleSheetsResponse } from '@/utils/automation/types';
import { AutomationService } from '@/utils/automationService';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface GoogleSheetsConnectorProps {
  data?: any[];
  onExport?: (response: GoogleSheetsResponse) => void;
}

const GoogleSheetsConnector: React.FC<GoogleSheetsConnectorProps> = ({ 
  data = [], 
  onExport 
}) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>({
    spreadsheetId: '',
    sheetName: 'Sheet1',
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [exportResponse, setExportResponse] = useState<GoogleSheetsResponse | null>(null);
  const [saveCredentials, setSaveCredentials] = useState(true);
  
  // استرجاع البيانات المحفوظة
  useEffect(() => {
    const savedConfig = localStorage.getItem('google_sheets_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig) as GoogleSheetsConfig;
        setConfig(parsedConfig);
        
        // التحقق من صحة الاتصال تلقائيًا
        validateConnection(parsedConfig);
      } catch (error) {
        console.error('خطأ في استرجاع بيانات اتصال Google Sheets:', error);
      }
    }
  }, []);
  
  // حفظ البيانات
  const saveConfig = () => {
    if (saveCredentials && config.spreadsheetId) {
      localStorage.setItem('google_sheets_config', JSON.stringify(config));
      toast.success('تم حفظ بيانات الاتصال بنجاح');
    }
  };
  
  // تحديث قيمة حقل
  const handleConfigChange = (field: keyof GoogleSheetsConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };
  
  // التحقق من صحة الاتصال
  const validateConnection = async (configToValidate = config) => {
    if (!configToValidate.spreadsheetId) {
      toast.error('يرجى إدخال معرف جدول البيانات');
      return;
    }
    
    setIsValidating(true);
    setIsConnected(false);
    
    try {
      const isValid = await AutomationService.validateGoogleSheetsCredentials(configToValidate);
      
      if (isValid) {
        setIsConnected(true);
        toast.success('تم التحقق من الاتصال بنجاح');
        saveConfig();
      } else {
        setIsConnected(false);
        toast.error('فشل الاتصال بجدول البيانات');
      }
    } catch (error) {
      console.error('خطأ في التحقق من الاتصال:', error);
      toast.error('حدث خطأ أثناء التحقق من الاتصال');
    } finally {
      setIsValidating(false);
    }
  };
  
  // تصدير البيانات إلى Google Sheets
  const exportData = async () => {
    if (!config.spreadsheetId) {
      toast.error('يرجى إدخال معرف جدول البيانات');
      return;
    }
    
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const response = await AutomationService.exportToGoogleSheets(data, config);
      setExportResponse(response);
      
      if (response.success) {
        toast.success('تم تصدير البيانات بنجاح');
        if (onExport) {
          onExport(response);
        }
      } else {
        toast.error(`فشل تصدير البيانات: ${response.message}`);
      }
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      toast.error('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <span>ربط Google Sheets</span>
        </CardTitle>
        <CardDescription>
          قم بربط جداول بيانات Google وتصدير البيانات إليها مباشرة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spreadsheetId">معرّف جدول البيانات (Spreadsheet ID)</Label>
          <Input
            id="spreadsheetId"
            placeholder="مثال: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            value={config.spreadsheetId}
            onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            يمكنك الحصول على المعرّف من رابط جدول البيانات: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sheetName">اسم الورقة (Sheet)</Label>
          <Input
            id="sheetName"
            placeholder="مثال: Sheet1"
            value={config.sheetName}
            onChange={(e) => handleConfigChange('sheetName', e.target.value)}
            dir="ltr"
          />
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Switch
            id="save-credentials"
            checked={saveCredentials}
            onCheckedChange={setSaveCredentials}
          />
          <Label htmlFor="save-credentials">حفظ بيانات الاتصال محليًا</Label>
        </div>
        
        {isConnected && (
          <Alert className="bg-green-50 border-green-200">
            <CircleCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              تم الاتصال بجدول البيانات بنجاح
              {config.spreadsheetId && (
                <div className="mt-1">
                  <a 
                    href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-700 underline text-sm flex items-center gap-1"
                  >
                    <Table className="h-3 w-3" />
                    فتح جدول البيانات
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {exportResponse && (
          <Alert className={exportResponse.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            {exportResponse.success ? (
              <CircleCheck className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={exportResponse.success ? "text-green-700" : "text-red-700"}>
              {exportResponse.message}
              {exportResponse.updatedRows && (
                <div className="mt-1 text-sm">
                  تم تحديث {exportResponse.updatedRows} صف من البيانات
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => validateConnection()}
          disabled={isValidating || !config.spreadsheetId}
        >
          {isValidating ? (
            <>
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
              جارِ التحقق...
            </>
          ) : (
            <>
              <RefreshCw className="ml-2 h-4 w-4" />
              التحقق من الاتصال
            </>
          )}
        </Button>
        
        <Button
          onClick={exportData}
          disabled={isExporting || !config.spreadsheetId || data.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {isExporting ? (
            <>
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
              جارِ التصدير...
            </>
          ) : (
            <>
              <ArrowUpToLine className="ml-2 h-4 w-4" />
              تصدير البيانات
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleSheetsConnector;
