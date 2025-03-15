
/**
 * كود أدوات التصدير للبوكماركلت
 */

interface ExportToolsOptions {
  exportType: 'json' | 'csv' | 'excel';
}

export const getExportToolsCode = (options: ExportToolsOptions): string => {
  const { exportType } = options;
  
  if (exportType === 'json') {
    return `function(data, filename = 'export.json') {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("[Export] تم تصدير البيانات بصيغة JSON");
      return true;
    }`;
  }
  
  if (exportType === 'csv') {
    return `function(data, filename = 'export.csv') {
      // التحقق من وجود بيانات
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error("[Export] لا توجد بيانات للتصدير");
        return false;
      }
      
      // استخراج أسماء الحقول من العنصر الأول
      const fields = Object.keys(data[0]);
      
      // إنشاء محتوى CSV
      const csvContent = [
        fields.join(','), // سطر العناوين
        ...data.map(item => 
          fields.map(field => {
            const value = item[field];
            // التعامل مع القيم المحتوية على فواصل
            return (typeof value === 'string' && (value.includes(',') || value.includes('"')))
              ? \`"\${value.replace(/"/g, '""')}"\`
              : value || '';
          }).join(',')
        )
      ].join('\\n');
      
      // إنشاء ملف للتنزيل
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("[Export] تم تصدير البيانات بصيغة CSV");
      return true;
    }`;
  }
  
  return `function() { console.error("[Export] نوع التصدير غير مدعوم"); return false; }`;
};
