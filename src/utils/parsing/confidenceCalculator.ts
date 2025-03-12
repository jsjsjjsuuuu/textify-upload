
/**
 * حساب درجة الثقة في البيانات المستخرجة
 */
export const calculateConfidenceScore = (data: Record<string, string>): number => {
  let score = 0;
  const fields = ['code', 'senderName', 'phoneNumber', 'province', 'price', 'companyName'];
  const weights = {
    code: 20,
    senderName: 15,
    phoneNumber: 20,
    province: 15,
    price: 15,
    companyName: 15
  };
  
  for (const field of fields) {
    if (data[field] && data[field].toString().trim() !== '') {
      // للكود، تحقق من صحة الرقم
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط للكود غير الرقمي
        }
      } 
      // لرقم الهاتف، تحقق من التنسيق الصحيح
      else if (field === 'phoneNumber') {
        const digits = data[field].toString().replace(/\D/g, '');
        if (digits.length === 11) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط لتنسيق الهاتف غير الصحيح
        }
      } 
      // للسعر، تحقق من أنه رقم صحيح
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف النقاط لتنسيق السعر غير الصحيح
        }
      } 
      // للحقول النصية، تحقق من طول النص
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من النقاط للنص القصير
        }
      }
    }
  }
  
  return Math.min(Math.round(score), 100);
};
