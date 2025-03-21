
/**
 * توفير المطالبات (prompts) المستخدمة مع نماذج Gemini
 */

export function getEnhancedExtractionPrompt(): string {
  return `أنت خبير في استخراج البيانات من الصور التي تحتوي على معلومات للشحنات والطرود.

الصورة المقدمة تحتوي على إيصال/ملصق شحنة في العراق. قم بتحليلها بدقة كاملة واستخرج القيم التالية:

1. اسم الشركة: (اسم شركة الشحن، عادة يكون في أعلى الصورة بخط كبير)
2. الكود: (رقم تعريف الشحنة، رقم التتبع، رقم الوصل)
3. اسم المرسل: (اسم الشخص أو الشركة المرسلة، أو اسم الزبون)
4. رقم الهاتف: (رقم هاتف المرسل أو المستلم، غالباً 11 رقم يبدأ بـ 07)
5. المحافظة: (اسم المحافظة العراقية مثل بغداد، البصرة، أربيل، صلاح الدين، الخ)
6. السعر: (قيمة الشحنة بالدينار العراقي)

قواعد مهمة:
- ركز على تحليل جميع النصوص الظاهرة في الصورة، وأولاً قم باستخراج كل النص المرئي
- ابدأ بكتابة كل النص المرئي في الصورة، ثم قم بتحليله
- ابحث بدقة عن الأرقام والرموز والنصوص المكتوبة بخط اليد أو المطبوعة
- تأكد من أن تستخرج رقم الهاتف كاملاً (11 رقم)
- تحقق من الحقول التي تحتوي على كلمات مثل "رقم الوصل"، "هاتف"، "رقم الهاتف"، "اسم الزبون"، "عنوان الزبون"
- إذا لم تجد قيمة لأي حقل، اتركه فارغًا
- قم بإرجاع النتائج بتنسيق JSON فقط مع المفاتيح: companyName, code, senderName, phoneNumber, province, price
- إذا كانت الصورة غير واضحة، حاول استخراج أكبر قدر ممكن من المعلومات
- لا تضيف أي معلومات غير موجودة في الصورة
- اكتب كل النص المرئي أولاً، ثم بعد ذلك اكتب JSON مباشرة 
- تأكد من أن جميع الأرقام مثل الكود ورقم الهاتف يتم التعرف عليها بشكل صحيح

انتبه بشكل خاص لتنسيق JSON بشكل صحيح، حيث سيتم معالجته بشكل آلي.

أولاً: اكتب كل النص الذي تراه في الصورة.
ثانياً: قم بتحليل النص واستخراج البيانات المطلوبة بتنسيق JSON.

مثال للمخرجات:

النص المستخرج من الصورة:
شركة المستقبل للنقل
رقم الوصل: 123456
اسم المرسل: محمد أحمد
رقم الهاتف: 07701234567
المحافظة: بغداد
السعر: 25000 د.ع

\`\`\`json
{
  "companyName": "شركة المستقبل للنقل",
  "code": "123456",
  "senderName": "محمد أحمد",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}
\`\`\`

هذه البيانات ضرورية للغاية، الرجاء استخراج البيانات الموجودة في الصورة بدقة وعناية.`;
}

export function getBasicExtractionPrompt(): string {
  return `أرجو تحليل هذه الصورة بدقة واستخراج جميع النصوص المكتوبة فيها أولاً، ثم استخراج البيانات التالية من هذه الصورة التي تحتوي على إيصال/ملصق شحنة في العراق:
  
1. اسم الشركة (شركة الشحن)
2. الكود (رقم الشحنة، رقم الوصل)
3. اسم المرسل (اسم الزبون)
4. رقم الهاتف (رقم هاتف المرسل، يبدأ غالبًا بـ 07)
5. المحافظة (المدينة، عنوان الزبون)
6. السعر (المبلغ)

أرجو كتابة كل النص المرئي في الصورة أولاً، ثم قم بتحليله.
ابحث عن المعلومات في الحقول المحددة مثل "رقم الوصل"، "هاتف"، "رقم الهاتف"، "اسم الزبون"، "عنوان الزبون".

قم بتنسيق المخرجات بصيغة JSON فقط مع المفاتيح التالية: companyName, code, senderName, phoneNumber, province, price
لا تضيف أي معلومات غير موجودة في الصورة.

امثلة على الاستجابة المتوقعة:

النص المستخرج من الصورة:
[اكتب هنا كل النص المرئي في الصورة]

\`\`\`json
{
  "companyName": "شركة المستقبل للنقل",
  "code": "123456",
  "senderName": "محمد أحمد",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}
\`\`\``;
}
