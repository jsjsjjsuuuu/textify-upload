
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, LogIn, LogOut, Plus, RefreshCw, Send, CheckCircle } from "lucide-react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { ImageData } from "@/types/ImageData";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useImageProcessing } from "@/hooks/useImageProcessing";

interface GoogleSheetsExportProps {
  images: ImageData[];
}

const GoogleSheetsExport: React.FC<GoogleSheetsExportProps> = ({ images }) => {
  const { 
    isInitialized, 
    isSignedIn, 
    isLoading, 
    spreadsheets, 
    handleSignIn, 
    handleSignOut, 
    loadSpreadsheets, 
    createSheet, 
    exportToSheet 
  } = useGoogleSheets();
  
  const {
    autoExportEnabled,
    defaultSheetId,
    toggleAutoExport,
    setDefaultSheet
  } = useImageProcessing();
  
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [newSheetName, setNewSheetName] = useState<string>(`بيانات الشحنات ${new Date().toLocaleDateString('ar-EG')}`);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const validImagesCount = images.filter(img => 
    img.status === "completed" && img.code && img.senderName && img.phoneNumber
  ).length;
  
  // تحديث قائمة جداول البيانات عند تسجيل الدخول
  useEffect(() => {
    if (isSignedIn) {
      loadSpreadsheets();
    }
  }, [isSignedIn]);
  
  // تحديث المعرف المحدد عندما يتغير المعرف الافتراضي
  useEffect(() => {
    if (defaultSheetId && !selectedSheetId) {
      setSelectedSheetId(defaultSheetId);
    }
  }, [defaultSheetId]);
  
  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) {
      return;
    }
    
    const sheetId = await createSheet(newSheetName);
    if (sheetId) {
      setSelectedSheetId(sheetId);
      setIsCreateDialogOpen(false);
    }
  };
  
  const handleExport = async () => {
    if (!selectedSheetId) {
      return;
    }
    
    await exportToSheet(selectedSheetId, images);
  };
  
  // تعيين الجدول المختار كجدول افتراضي للتصدير التلقائي
  const handleSetDefaultSheet = () => {
    if (selectedSheetId) {
      setDefaultSheet(selectedSheetId);
    }
  };
  
  return (
    <Card className="bg-secondary/30 dark:bg-secondary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 ml-2 text-brand-green" />
            <CardTitle className="text-lg text-brand-brown dark:text-brand-beige">تصدير إلى Google Sheets</CardTitle>
          </div>
          
          {isInitialized && (
            <Button 
              variant={isSignedIn ? "outline" : "default"} 
              size="sm" 
              onClick={isSignedIn ? handleSignOut : handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : isSignedIn ? (
                <><LogOut className="h-4 w-4 ml-2" /> تسجيل الخروج</>
              ) : (
                <><LogIn className="h-4 w-4 ml-2" /> تسجيل الدخول إلى Google</>
              )}
            </Button>
          )}
        </div>
        <CardDescription>
          قم بتصدير البيانات المستخرجة مباشرة إلى Google Sheets
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isInitialized ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isSignedIn ? (
          <div className="space-y-4">
            {/* إعدادات التصدير التلقائي */}
            <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 rounded-md p-3 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center">
                    التصدير التلقائي
                    {autoExportEnabled && defaultSheetId && (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    )}
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    {autoExportEnabled 
                      ? "سيتم تصدير البيانات تلقائياً إلى Google Sheets عند الانتهاء من المعالجة"
                      : "قم بتفعيل هذا الخيار لتصدير البيانات تلقائياً عند الانتهاء من المعالجة"
                    }
                  </p>
                </div>
                <Switch 
                  checked={autoExportEnabled}
                  onCheckedChange={toggleAutoExport}
                  disabled={!isSignedIn}
                />
              </div>
              
              {autoExportEnabled && (
                <div className="mt-3 pt-2 border-t border-green-200 dark:border-green-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">
                      {defaultSheetId 
                        ? "جدول البيانات الافتراضي للتصدير التلقائي:" 
                        : "لم يتم تعيين جدول بيانات افتراضي بعد"
                      }
                    </span>
                    {selectedSheetId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSetDefaultSheet}
                        className="text-xs h-7 bg-green-100 hover:bg-green-200 border-green-300"
                        disabled={selectedSheetId === defaultSheetId}
                      >
                        تعيين كافتراضي
                      </Button>
                    )}
                  </div>
                  {defaultSheetId && (
                    <div className="mt-1">
                      <span className="text-xs bg-green-100 dark:bg-green-800/40 px-2 py-1 rounded">
                        {spreadsheets.find(s => s.id === defaultSheetId)?.name || defaultSheetId}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md p-3 mb-2">
              <div className="flex items-start">
                <div>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    العناصر الجاهزة للتصدير: {validImagesCount}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    فقط العناصر المكتملة والتي تحتوي على البيانات الأساسية (الكود، اسم المرسل، رقم الهاتف) سيتم تصديرها.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="spreadsheet" className="block text-sm font-medium text-muted-foreground mb-1">
                  اختر جدول بيانات
                </label>
                <Select value={selectedSheetId} onValueChange={setSelectedSheetId}>
                  <SelectTrigger id="spreadsheet" className="w-full">
                    <SelectValue placeholder="اختر جدول بيانات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {spreadsheets.length === 0 ? (
                        <SelectItem value="no-sheets" disabled>
                          لا توجد جداول بيانات متاحة
                        </SelectItem>
                      ) : (
                        spreadsheets.map(sheet => (
                          <SelectItem key={sheet.id} value={sheet.id}>
                            {sheet.name}
                            {sheet.id === defaultSheetId ? " (الافتراضي)" : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 self-end">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="إنشاء جدول بيانات جديد">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء جدول بيانات جديد</DialogTitle>
                      <DialogDescription>
                        أدخل اسمًا لجدول البيانات الجديد الذي سيتم إنشاؤه في حساب Google الخاص بك
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        value={newSheetName} 
                        onChange={(e) => setNewSheetName(e.target.value)}
                        placeholder="اسم جدول البيانات"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleCreateSheet} 
                        disabled={!newSheetName.trim() || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Plus className="h-4 w-4 ml-2" />
                        )}
                        إنشاء
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={loadSpreadsheets} 
                  disabled={isLoading}
                  title="تحديث القائمة"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-1">تسجيل الدخول لبدء التصدير</h3>
            <p className="text-sm text-muted-foreground mb-4">
              قم بتسجيل الدخول إلى حساب Google الخاص بك للوصول إلى جداول البيانات
            </p>
            <Button onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <LogIn className="h-4 w-4 ml-2" />
              )}
              تسجيل الدخول إلى Google
            </Button>
          </div>
        )}
      </CardContent>
      
      {isSignedIn && (
        <CardFooter className="pt-0">
          <Button 
            onClick={handleExport} 
            disabled={!selectedSheetId || isLoading || validImagesCount === 0}
            className="w-full bg-brand-green hover:bg-brand-green/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Send className="h-4 w-4 ml-2" />
            )}
            تصدير البيانات ({validImagesCount})
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default GoogleSheetsExport;
