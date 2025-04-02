
export const formatDate = (dateInput: string | Date) => {
  // تحويل الإدخال إلى كائن تاريخ بناءً على نوعه
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory'
  }).replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
};
