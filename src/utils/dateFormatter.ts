
/**
 * وظيفة تنسيق التاريخ إلى تنسيق قابل للقراءة بالعربية
 * تقبل سواء كائن Date أو سلسلة نصية ISO
 */
export const formatDate = (date: Date | string) => {
  // التأكد أن التاريخ هو كائن Date
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  // التحقق من أن dateObject هو كائن Date صالح
  if (!(dateObject instanceof Date) || isNaN(dateObject.getTime())) {
    return "تاريخ غير صالح";
  }
  
  return dateObject.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory'
  }).replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
};
