
type LearningData = {
  originalText: string;
  originalData: Record<string, string>;
  correctedData: Record<string, string>;
  date: string;
};

type LearningStore = {
  corrections: LearningData[];
  lastUpdated: string;
};

// استرجاع بيانات التعلم من localStorage
export const getLearningData = (): LearningStore => {
  const storedData = localStorage.getItem('ocrLearningData');
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error("فشل في استرجاع بيانات التعلم:", e);
      return { corrections: [], lastUpdated: new Date().toISOString() };
    }
  }
  return { corrections: [], lastUpdated: new Date().toISOString() };
};

// حفظ بيانات التعلم في localStorage
export const saveLearningData = (data: LearningStore): void => {
  try {
    localStorage.setItem('ocrLearningData', JSON.stringify(data));
  } catch (e) {
    console.error("فشل في حفظ بيانات التعلم:", e);
  }
};

// إضافة تصحيح جديد
export const addCorrection = (
  originalText: string,
  originalData: Record<string, string>,
  correctedData: Record<string, string>
): void => {
  // تجاهل إذا لم تتغير البيانات
  if (JSON.stringify(originalData) === JSON.stringify(correctedData)) {
    return;
  }

  const learningStore = getLearningData();
  
  // إضافة التصحيح الجديد
  learningStore.corrections.push({
    originalText,
    originalData,
    correctedData,
    date: new Date().toISOString()
  });
  
  // الاحتفاظ بأحدث 100 تصحيح فقط لتجنب امتلاء التخزين
  if (learningStore.corrections.length > 100) {
    learningStore.corrections = learningStore.corrections.slice(-100);
  }
  
  learningStore.lastUpdated = new Date().toISOString();
  saveLearningData(learningStore);
  
  console.log("تم إضافة تصحيح جديد للتعلم:", {
    originalData,
    correctedData
  });
};

// استخدام البيانات المتعلمة لتحسين البيانات المستخرجة
export const enhanceWithLearning = (
  extractedText: string,
  extractedData: Record<string, string>
): Record<string, string> => {
  const learningStore = getLearningData();
  
  if (learningStore.corrections.length === 0) {
    return extractedData;
  }
  
  console.log("تطبيق التعلم على البيانات المستخرجة");
  
  // نسخة من البيانات المستخرجة للتعديل
  let enhancedData = { ...extractedData };
  let appliedCorrections = 0;
  
  // البحث عن أوجه تشابه بين النص الحالي والنصوص المصححة سابقاً
  for (const correction of learningStore.corrections) {
    // حساب مدى التشابه بين النصوص (طريقة بسيطة)
    const similarity = calculateTextSimilarity(extractedText, correction.originalText);
    
    // إذا كان هناك تشابه كافٍ، طبق التصحيحات
    if (similarity > 0.4) {
      console.log(`وجد تشابه بنسبة ${similarity.toFixed(2)} مع تصحيح سابق`);
      
      // لكل حقل تم تصحيحه سابقاً
      for (const [field, correctedValue] of Object.entries(correction.correctedData)) {
        const originalValue = correction.originalData[field] || '';
        
        // إذا كان الحقل المستخرج حالياً يشبه الحقل الأصلي قبل التصحيح
        if (originalValue && 
            extractedData[field] && 
            calculateStringSimilarity(extractedData[field], originalValue) > 0.7) {
          
          // طبق التصحيح
          enhancedData[field] = correctedValue;
          appliedCorrections++;
          console.log(`تطبيق تصحيح على حقل ${field}: من "${extractedData[field]}" إلى "${correctedValue}"`);
        }
      }
    }
  }
  
  console.log(`تم تطبيق ${appliedCorrections} تصحيحات من التعلم السابق`);
  return enhancedData;
};

// حساب مدى التشابه بين سلسلتين نصيتين (0-1)
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  if (str1 === str2) return 1;
  
  // مقياس بسيط للتشابه: نسبة الأحرف المشتركة
  const set1 = new Set(str1);
  const set2 = new Set(str2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

// حساب مدى التشابه بين نصين كاملين
const calculateTextSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  
  // تقسيم النصوص إلى كلمات
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  // حساب الكلمات المشتركة
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  let commonWords = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      commonWords++;
    }
  }
  
  // حساب معامل التشابه
  return commonWords / Math.max(set1.size, set2.size);
};

// الحصول على إحصائيات التعلم
export const getLearningStats = (): { 
  totalCorrections: number, 
  lastUpdated: string,
  fieldStats: Record<string, { count: number, lastValue: string }>
} => {
  const { corrections, lastUpdated } = getLearningData();
  
  const fieldStats: Record<string, { count: number, lastValue: string }> = {};
  
  // حساب إحصائيات لكل حقل
  for (const correction of corrections) {
    for (const [field, value] of Object.entries(correction.correctedData)) {
      if (!fieldStats[field]) {
        fieldStats[field] = { count: 0, lastValue: '' };
      }
      fieldStats[field].count++;
      fieldStats[field].lastValue = value;
    }
  }
  
  return {
    totalCorrections: corrections.length,
    lastUpdated,
    fieldStats
  };
};
