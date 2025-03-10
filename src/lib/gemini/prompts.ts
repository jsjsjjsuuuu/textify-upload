
/**
 * توفير المطالبات (prompts) المستخدمة مع نماذج Gemini
 */

export function getEnhancedExtractionPrompt(): string {
  return `انت خبير في استخراج البيانات من الصور التي تحتوي على معلومات للشحنات والطرود.
      
قم بتحليل هذه الصورة بدقة واستخرج القيم التالية:
1. اسم الشركة: (اسم الشركة أو المؤسسة، عادة يكون في أعلى الصورة بخط كبير)
2. الكود: (رقم تعريف الشحنة، عادة ما يكون رقم من 6-10 أرقام)
3. اسم المرسل: (اسم الشخص أو الشركة المرسلة)
4. رقم الهاتف: (رقم هاتف المرسل، قد يكون بتنسيق مختلف)
5. المحافظة: (اسم المحافظة أو المدينة)
6. السعر: (قيمة الشحنة، قد تكون بالدينار العراقي أو الدولار)

قواعد مهمة:
- استخرج البيانات كما هي في الصورة تمامًا، حتى لو كانت باللغة العربية أو الإنجليزية
- إذا لم تجد قيمة لأي حقل، اتركه فارغًا (null)
- حاول التقاط أي أرقام أو نصوص حتى لو كانت غير واضحة تمامًا
- قم بإرجاع النتائج بتنسيق JSON فقط بالمفاتيح التالية: companyName, code, senderName, phoneNumber, province, price
- تأكد من أن النتيجة صالحة بتنسيق JSON

مثال للمخرجات:
\`\`\`json
{
  "companyName": "شركة النقل السريع",
  "code": "123456",
  "senderName": "محمد علي",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}
\`\`\``;
}

export function getBasicExtractionPrompt(): string {
  return "استخرج البيانات التالية من هذه الصورة: اسم الشركة، الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر. قم بتنسيق المخرجات بتنسيق JSON مع المفاتيح التالية باللغة الإنجليزية: companyName, code, senderName, phoneNumber, province, price";
}
