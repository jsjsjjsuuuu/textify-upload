
/**
 * توفير المطالبات (prompts) المستخدمة مع نماذج Gemini
 */

export function getEnhancedExtractionPrompt(): string {
  return `أنت مساعد ذكي متخصص في استخراج البيانات من صور الإيصالات والفواتير وملصقات الشحن العراقية.

مهمتك: تحليل الصورة المقدمة واستخراج البيانات التالية بدقة عالية:

1. اسم الشركة: (شركة الشحن، عادة في أعلى الصورة)
2. الكود: (رقم التتبع أو رقم الوصل)
3. اسم المرسل: (اسم الزبون أو المرسل)
4. رقم الهاتف: (رقم هاتف عراقي، غالباً يبدأ بـ 07)
5. المحافظة: (اسم المحافظة العراقية مثل بغداد، البصرة، أربيل)
6. السعر: (المبلغ بالدينار العراقي)

خطوات العمل:
1. انسخ أولاً كل النص المرئي في الصورة حرفياً.
2. ابحث عن حقول محددة مثل "رقم الوصل"، "رقم الهاتف"، "اسم الزبون"، "المحافظة".
3. ركز على النصوص المكتوبة بخط اليد والمطبوعة.
4. لا تفترض أي معلومات غير موجودة في الصورة.

يجب أن تكون النتيجة النهائية بصيغة JSON دقيقة بالمفاتيح التالية:
companyName, code, senderName, phoneNumber, province, price

مثال للمخرجات:

النص المستخرج من الصورة:
[هنا يتم نسخ كل النص الظاهر في الصورة]

\`\`\`json
{
  "companyName": "شركة النجاح للنقل",
  "code": "123456",
  "senderName": "محمد علي",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}
\`\`\`

ملاحظات مهمة:
- يجب وضع النص المستخرج أولاً، ثم JSON.
- تأكد من أن JSON سليم تماماً ويمكن تحليله آلياً.
- إذا لم تجد معلومة معينة، اترك القيمة فارغة في JSON.
- الدقة هي الأولوية القصوى، لا تخمن البيانات.`;
}

export function getBasicExtractionPrompt(): string {
  return `قم بتحليل هذه الصورة واستخراج النص الكامل منها أولاً، ثم استخرج البيانات التالية بدقة:

1. اسم الشركة
2. الكود (رقم الوصل)
3. اسم المرسل
4. رقم الهاتف (يبدأ غالباً بـ 07)
5. المحافظة
6. السعر

ابدأ بكتابة كل النص الذي تراه في الصورة، ثم قم بتنظيم المعلومات المستخرجة بصيغة JSON:

\`\`\`json
{
  "companyName": "",
  "code": "",
  "senderName": "",
  "phoneNumber": "",
  "province": "",
  "price": ""
}
\`\`\`

لا تترك أي حقل في JSON بدون قيمة، استخدم سلسلة فارغة "" إذا لم تجد المعلومة.`;
}

// إضافة مطالبة تركز على استخراج النص فقط
export function getTextOnlyExtractionPrompt(): string {
  return `مهمتك البسيطة هي استخراج كل النص المرئي من هذه الصورة.
  
لا تحاول تفسير النص أو تنظيمه، فقط انسخ كل النص المرئي في الصورة بشكل حرفي.

انتبه للعناصر التالية:
- النصوص المكتوبة بخط اليد
- النصوص المطبوعة
- الأرقام والرموز
- العناوين والمحتوى
  
اكتب فقط النص المستخرج دون أي تعليقات إضافية.`;
}
