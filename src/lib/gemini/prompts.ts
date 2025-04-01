
/**
 * توفير المطالبات (prompts) المستخدمة مع نماذج Gemini
 */

export function getEnhancedExtractionPrompt(): string {
  return `أنت خبير متخصص في استخراج البيانات من صور الإيصالات والفواتير وملصقات الشحن العراقية بدقة عالية.

مهمتك الرئيسية: تحليل الصورة المقدمة واستخراج البيانات التالية بأعلى دقة ممكنة:

1. اسم الشركة (في الأعلى غالباً)
2. الكود أو رقم التتبع (هذا مهم جداً)
3. اسم المرسل أو الزبون
4. رقم الهاتف (يجب أن يبدأ بـ 07 ويكون 11 رقم)
5. المحافظة العراقية
6. السعر بالدينار العراقي

اهتم بشكل خاص بالتالي:
- النصوص المكتوبة بخط اليد
- الأرقام والتواريخ والرموز
- البيانات المهيكلة مثل الجداول
- جميع النصوص المطبوعة

طريقة العمل:
1. انسخ أولاً كل النص المرئي في الصورة حرفياً، بما في ذلك النصوص المكتوبة بخط اليد.
2. انتبه للأنماط مثل "رقم الوصل"، "الكود"، "رقم الهاتف"، "اسم الزبون"، "المحافظة"، "السعر" وما شابه.
3. ابحث عن الرمز الرقمي (رقم الوصل)، وهو عادة سلسلة من الأرقام (6-10 أرقام).
4. رقم الهاتف العراقي يجب أن يبدأ بـ 07 ويكون 11 رقم - هذا مهم جداً.
5. لا تقصر في استخراج الأرقام والنصوص المكتوبة بخط اليد، خاصة في الحقول المهمة.

يجب أن تكون النتيجة النهائية بصيغة JSON دقيقة وتشمل الحقول التالية:
companyName (اسم الشركة)
code (الكود أو رقم التتبع)
senderName (اسم المرسل أو الزبون)
phoneNumber (رقم الهاتف، 11 رقم يبدأ بـ 07)
province (المحافظة العراقية)
price (السعر)

مثال للمخرجات:

النص المستخرج من الصورة:
[هنا تنسخ كل النص الظاهر في الصورة بما في ذلك المكتوب بخط اليد]

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

ملاحظات هامة:
- يجب استخراج جميع البيانات المرئية، حتى إذا كانت مكتوبة بخط اليد أو غير واضحة.
- كن دقيقاً في استخراج الأرقام والحروف.
- أهم الحقول هي الكود ورقم الهاتف والمحافظة.
- إذا لم تتمكن من العثور على قيمة معينة، اترك الحقل فارغاً في JSON.
- إذا كان هناك أكثر من خيار محتمل لقيمة ما، اختر الأكثر ترجيحاً واذكر البدائل.
- تأكد من أن رقم الهاتف يكون 11 رقم بالضبط ويبدأ بـ 07.
- تأكد من أن السعر كقيمة رقمية فقط، بدون رموز أو حروف.`;
}

export function getBasicExtractionPrompt(): string {
  return `قم بتحليل هذه الصورة واستخراج كل البيانات منها بالتفصيل.

المطلوب استخراجه:
1. اسم الشركة
2. الكود أو رقم الوصل
3. اسم المرسل (الزبون)
4. رقم الهاتف (يبدأ بـ 07، ويجب أن يكون 11 رقم)
5. المحافظة العراقية
6. السعر

اهتم بشكل خاص بما يلي:
- النصوص المكتوبة بخط اليد
- الأرقام بجميع أشكالها
- تفاصيل جميع البيانات المرئية

أولاً، اكتب كل النص الذي تراه في الصورة.
ثم استخرج البيانات المطلوبة وضعها في صيغة JSON كالتالي:

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

تأكد من استخراج رقم الهاتف العراقي بشكل صحيح (11 رقم يبدأ بـ 07).
تأكد من استخراج الكود ورقم الوصل بدقة.
انتبه للأسماء والمحافظات العراقية.`;
}

// مطالبة مُحسّنة للتركيز على استخراج النص بأعلى دقة ممكنة
export function getTextOnlyExtractionPrompt(): string {
  return `مهمتك هي استخراج كل النص المرئي من هذه الصورة بدقة عالية.
  
انسخ كل النص المرئي في الصورة بشكل حرفي، بما في ذلك:
- النصوص المكتوبة بخط اليد
- النصوص المطبوعة
- الأرقام والرموز بكل دقة
- العناوين والمحتوى
- الكلمات والعبارات بلغات مختلفة

اهتم بشكل خاص بالتالي:
- رقم الوصل أو الكود
- رقم الهاتف (خاصة إذا كان يبدأ بـ 07)
- اسماء الأشخاص
- أسماء المحافظات العراقية
- المبالغ والأسعار
- أسماء الشركات

اكتب فقط النص المستخرج بالكامل دون تنسيق خاص أو تفسير. حاول تنظيم النص بشكل يحافظ على ترتيبه الأصلي في الصورة.`;
}

// إضافة مطالبة مخصصة للتعرف على النصوص المكتوبة بخط اليد
export function getHandwritingExtractionPrompt(): string {
  return `أنت خبير في التعرف على النصوص المكتوبة بخط اليد. مهمتك استخراج كل النص المكتوب بخط اليد في هذه الصورة.

ركز بشكل خاص على:
- الأرقام والأكواد المكتوبة بخط اليد
- أسماء الأشخاص المكتوبة بخط اليد
- أسماء المحافظات والمناطق
- المبالغ والأسعار
- أي تفاصيل مكتوبة بخط اليد

لا تكتفي بالنصوص الواضحة فقط، بل حاول أيضًا التعرف على النصوص الغامضة أو المشوشة.
تذكر أن تلتقط الأرقام بدقة، خاصة أرقام الهواتف والأكواد.

اكتب أولاً كل ما تمكنت من قراءته بخط اليد، ثم قدم تحليلاً مختصرًا للبيانات المهمة التي وجدتها.`;
}
