
/**
 * وظائف لتحليل استجابات Gemini API
 */

import { enhanceExtractedData, calculateConfidenceScore, formatPrice } from "./utils";
import { correctProvinceName, IRAQ_PROVINCES } from "@/utils/provinces";

/**
 * استخراج JSON من نص الاستجابة ومعالجته
 */
export function parseGeminiResponse(extractedText: string): {
  parsedData: Record<string, string>;
  confidenceScore: number;
} {
  // محاولة استخراج JSON من النص
  let parsedData: Record<string, string> = {};
  
  try {
    console.log("تحليل استجابة Gemini:", extractedText.substring(0, 100) + "...");
    
    // نبحث عن أي نص JSON في الاستجابة
    const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                      extractedText.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
      console.log("تم العثور على JSON في الاستجابة:", jsonText);
      try {
        parsedData = JSON.parse(jsonText);
        console.log("تم تحليل JSON بنجاح:", parsedData);
      } catch (jsonError) {
        console.error("خطأ في تحليل JSON:", jsonError);
        
        // إذا فشل تحليل JSON، نحاول إصلاحه
        try {
          // تنظيف النص وإضافة علامات اقتباس للمفاتيح والقيم
          const cleanedText = jsonText
            .replace(/([{,]\s*)([^"}\s][^":,}]*?)(\s*:)/g, '$1"$2"$3')
            .replace(/(:(?:\s*)(?!true|false|null|{|\[|"|')([^,}\s]+))/g, ':"$2"')
            .replace(/'/g, '"');
          
          console.log("تم تنظيف نص JSON:", cleanedText);
          parsedData = JSON.parse(cleanedText);
          console.log("تم تحليل JSON المنظف بنجاح:", parsedData);
        } catch (cleanJsonError) {
          console.error("خطأ في تحليل JSON المنظف:", cleanJsonError);
          
          // إذا فشل تنظيف JSON، نحاول استخراج أزواج المفاتيح والقيم
          try {
            const keyValuePattern = /"?([^":,}\s]+)"?\s*:\s*"?([^",}]+)"?/g;
            const matches = [...extractedText.matchAll(keyValuePattern)];
            
            matches.forEach(match => {
              const key = match[1].trim();
              const value = match[2].trim();
              if (key && value) {
                parsedData[key] = value;
              }
            });
            
            console.log("تم استخراج أزواج المفاتيح والقيم:", parsedData);
          } catch (extractionError) {
            console.error("خطأ في استخراج أزواج المفاتيح والقيم:", extractionError);
          }
        }
      }
    }
    
    // إذا لم يتم العثور على JSON أو كان فارغًا، فنبحث في النص عن أنماط محددة
    if (Object.keys(parsedData).length === 0) {
      console.log("لم يتم العثور على تنسيق JSON في الاستجابة أو كان JSON فارغًا. استخراج البيانات من النص مباشرة.");
      
      // استخراج رقم الكود - أنماط مختلفة
      const codePatterns = [
        /رقم الوصل[:\s]+([0-9]+)/i,
        /كود[:\s]+([0-9]+)/i,
        /الكود[:\s]+([0-9]+)/i,
        /code[:\s]+([0-9]+)/i,
        /رقم[:\s]+([0-9]+)/i,
        /رمز[:\s]+([0-9]+)/i,
        /وصل[:\s]+([0-9]+)/i,
        /تتبع[:\s]+([0-9]+)/i,
        /رقم الاستلام[:\s]+([0-9]+)/i,
        /رقم الشحنة[:\s]+([0-9]+)/i,
        /\b(كود|رمز|code)[:نسخة #.\s]*([0-9]{5,})/i,
        /\b(كود|رمز|code)[:#\s\\\/\-]*([0-9]{4,})/i,
        /\b([0-9]{5,})\b/ // البحث عن أي رقم من 5 أرقام أو أكثر
      ];
      
      // تجربة كل نمط من أنماط الكود
      for (const pattern of codePatterns) {
        const match = extractedText.match(pattern);
        if (match && match.length > 1) {
          // استخدام المجموعة 1 إذا كانت الأنماط العادية
          if (match[1] && /^\d+$/.test(match[1])) {
            parsedData.code = match[1].trim();
            console.log("تم استخراج الكود من النمط:", pattern, "القيمة:", parsedData.code);
            break;
          }
          // استخدام المجموعة 2 في حال الأنماط المعقدة
          else if (match[2] && /^\d+$/.test(match[2])) {
            parsedData.code = match[2].trim();
            console.log("تم استخراج الكود من النمط المعقد:", pattern, "القيمة:", parsedData.code);
            break;
          }
        }
      }
      
      // استخراج اسم المرسل - أنماط مختلفة
      const senderNamePatterns = [
        /اسم المرسل[:\s]+([^\n]+)/i,
        /المرسل[:\s]+([^\n]+)/i,
        /اسم الزبون[:\s]+([^\n]+)/i,
        /الزبون[:\s]+([^\n]+)/i,
        /اسم المستلم[:\s]+([^\n]+)/i,
        /المستلم[:\s]+([^\n]+)/i,
        /اسم العميل[:\s]+([^\n]+)/i,
        /العميل[:\s]+([^\n]+)/i,
        /اسم[:\s]+([^\n]+)/i,
        /الاسم[:\s]+([^\n]+)/i,
        /customer[:\s]+([^\n]+)/i,
        /sender[:\s]+([^\n]+)/i,
        /name[:\s]+([^\n]+)/i
      ];
      
      // تجربة كل نمط من أنماط اسم المرسل
      for (const pattern of senderNamePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          parsedData.senderName = match[1].trim();
          console.log("تم استخراج اسم المرسل:", parsedData.senderName);
          break;
        }
      }
      
      // استخراج رقم الهاتف - أنماط مختلفة وتركيز على الأرقام العراقية
      const phonePatterns = [
        /هاتف[:\s]+([0-9\s\-]+)/i,
        /رقم الهاتف[:\s]+([0-9\s\-]+)/i,
        /الهاتف[:\s]+([0-9\s\-]+)/i,
        /رقم الموبايل[:\s]+([0-9\s\-]+)/i,
        /الموبايل[:\s]+([0-9\s\-]+)/i,
        /موبايل[:\s]+([0-9\s\-]+)/i,
        /تلفون[:\s]+([0-9\s\-]+)/i,
        /phone[:\s]+([0-9\s\-]+)/i,
        /mobile[:\s]+([0-9\s\-]+)/i,
        /tel[:\s]+([0-9\s\-]+)/i,
        // البحث عن أرقام هواتف عراقية نموذجية (تبدأ بـ 07)
        /\b(07\d{2}[\s\-]*\d{3}[\s\-]*\d{4})\b/,
        /\b(07\d{2}[\s\-]*\d{7})\b/,
        /\b(07\d{9})\b/
      ];
      
      // تجربة كل نمط من أنماط رقم الهاتف
      for (const pattern of phonePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          // تنظيف رقم الهاتف (إزالة المسافات والشرطات)
          const phoneNumber = match[1].replace(/\D/g, '');
          // التحقق من أن الرقم عراقي (يبدأ بـ 07) وطوله 11
          if (phoneNumber.startsWith('07') && phoneNumber.length === 11) {
            parsedData.phoneNumber = phoneNumber;
            console.log("تم استخراج رقم الهاتف:", parsedData.phoneNumber);
            break;
          } else if (phoneNumber.length >= 9) {
            // إذا كان الرقم طويل بما فيه الكفاية ولكن لا يبدأ بـ 07، نضيف 07 في البداية
            if (!phoneNumber.startsWith('07')) {
              const correctedPhone = phoneNumber.length <= 9 ? `07${phoneNumber}` : phoneNumber;
              // نتأكد من أنه 11 رقم
              parsedData.phoneNumber = correctedPhone.substring(0, 11);
              console.log("تم تصحيح رقم الهاتف:", parsedData.phoneNumber);
              break;
            }
          }
        }
      }
      
      // بحث عن أي رقم هاتف في النص
      if (!parsedData.phoneNumber) {
        const phoneRegex = /\b(07[0-9]{2}[0-9\s\-]{7,8})\b/;
        const phoneMatch = extractedText.match(phoneRegex);
        if (phoneMatch && phoneMatch[1]) {
          parsedData.phoneNumber = phoneMatch[1].replace(/\D/g, '');
          console.log("تم العثور على رقم هاتف عراقي مباشرة:", parsedData.phoneNumber);
        } else {
          // بحث عن سلسلة من الأرقام المتتالية
          const numberSequences = extractedText.match(/\b\d{9,11}\b/g);
          if (numberSequences) {
            // فحص كل سلسلة من الأرقام
            for (const seq of numberSequences) {
              // تفضيل السلاسل التي تبدأ بـ 07
              if (seq.startsWith('07') && seq.length === 11) {
                parsedData.phoneNumber = seq;
                console.log("تم العثور على رقم هاتف محتمل:", parsedData.phoneNumber);
                break;
              }
            }
            
            // إذا لم نجد رقم يبدأ بـ 07، نأخذ أول سلسلة
            if (!parsedData.phoneNumber && numberSequences.length > 0) {
              const possiblePhone = numberSequences[0];
              if (possiblePhone.length >= 10) {
                parsedData.phoneNumber = possiblePhone.substring(0, 11);
                console.log("استخدام أول سلسلة أرقام كرقم هاتف محتمل:", parsedData.phoneNumber);
              }
            }
          }
        }
      }
      
      // استخراج المحافظة - أنماط مختلفة وقائمة محافظات العراق
      const provincePatterns = [
        /المحافظة[:\s]+([^\n]+)/i,
        /محافظة[:\s]+([^\n]+)/i,
        /عنوان الزبون[^:\n]*[:\s]+([^\n]+)/i,
        /العنوان[:\s]+([^\n]+)/i,
        /المنطقة[:\s]+([^\n]+)/i,
        /المدينة[:\s]+([^\n]+)/i,
        /province[:\s]+([^\n]+)/i,
        /city[:\s]+([^\n]+)/i,
        /address[:\s]+([^\n]+)/i
      ];
      
      // تجربة كل نمط من أنماط المحافظة
      for (const pattern of provincePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          // استخراج اسم المحافظة من النص وتصحيحه
          const provinceText = match[1].trim();
          parsedData.province = correctProvinceName(provinceText);
          console.log("تم استخراج المحافظة:", parsedData.province);
          break;
        }
      }
      
      // إذا لم نجد المحافظة، نبحث عن أسماء المحافظات العراقية في النص
      if (!parsedData.province) {
        for (const province of IRAQ_PROVINCES) {
          if (extractedText.includes(province)) {
            parsedData.province = province;
            console.log("تم العثور على اسم محافظة في النص:", parsedData.province);
            break;
          }
        }
      }
      
      // استخراج السعر - أنماط مختلفة
      const pricePatterns = [
        /السعر[:\s]+([0-9\s\-,.]+)/i,
        /المبلغ[:\s]+([0-9\s\-,.]+)/i,
        /سعر[:\s]+([0-9\s\-,.]+)/i,
        /قيمة[:\s]+([0-9\s\-,.]+)/i,
        /المجموع[:\s]+([0-9\s\-,.]+)/i,
        /الإجمالي[:\s]+([0-9\s\-,.]+)/i,
        /الكلفة[:\s]+([0-9\s\-,.]+)/i,
        /price[:\s]+([0-9\s\-,.]+)/i,
        /amount[:\s]+([0-9\s\-,.]+)/i,
        /total[:\s]+([0-9\s\-,.]+)/i,
        /cost[:\s]+([0-9\s\-,.]+)/i,
        /\b(\d+[\d,.]*)\s*(?:دينار|الف|د\.ع|ع\.د|IQD)/i, // البحث عن أرقام متبوعة بكلمة دينار أو مختصراتها
        /\b(?:دينار|الف|د\.ع|ع\.د|IQD)\s*(\d+[\d,.]*)\b/i // البحث عن أرقام مسبوقة بكلمة دينار أو مختصراتها
      ];
      
      // تجربة كل نمط من أنماط السعر
      for (const pattern of pricePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          // تنظيف السعر (إزالة الحروف غير الرقمية باستثناء النقطة والفاصلة)
          const price = match[1].replace(/[^\d.,]/g, '');
          parsedData.price = price;
          console.log("تم استخراج السعر:", parsedData.price);
          break;
        }
      }
      
      // البحث عن أي رقم قد يكون سعراً إذا لم نجد
      if (!parsedData.price) {
        const potentialPrices = extractedText.match(/\b\d{3,6}\b/g); // أرقام من 3-6 خانات
        if (potentialPrices && potentialPrices.length > 0) {
          // اختيار أكبر رقم كسعر محتمل
          const prices = potentialPrices.map(p => parseInt(p, 10)).filter(p => p > 100);
          if (prices.length > 0) {
            const highestPrice = Math.max(...prices);
            parsedData.price = highestPrice.toString();
            console.log("تم اختيار أكبر رقم كسعر محتمل:", parsedData.price);
          }
        }
      }
      
      // استخراج اسم الشركة - أنماط مختلفة
      const companyNamePatterns = [
        /شركة\s+([^\n]+)/i,
        /مؤسسة\s+([^\n]+)/i,
        /مكتب\s+([^\n]+)/i,
        /اسم الشركة[:\s]+([^\n]+)/i,
        /الشركة[:\s]+([^\n]+)/i,
        /company[:\s]+([^\n]+)/i,
        /office[:\s]+([^\n]+)/i
      ];
      
      // تجربة كل نمط من أنماط اسم الشركة
      for (const pattern of companyNamePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          parsedData.companyName = match[1].trim();
          console.log("تم استخراج اسم الشركة:", parsedData.companyName);
          break;
        }
      }
      
      // إذا لم نجد اسم الشركة، نستخدم السطر الأول أو الثاني من النص
      if (!parsedData.companyName) {
        const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          // استخدام السطر الأول إذا كان مناسباً (أقل من 50 حرف)
          const firstLine = lines[0].trim();
          if (firstLine.length > 3 && firstLine.length < 50 && !firstLine.match(/^\d+$/)) {
            parsedData.companyName = firstLine;
            console.log("استخدام السطر الأول كاسم الشركة:", parsedData.companyName);
          } 
          // أو استخدام السطر الثاني إذا كان السطر الأول غير مناسب
          else if (lines.length > 1) {
            const secondLine = lines[1].trim();
            if (secondLine.length > 3 && secondLine.length < 50 && !secondLine.match(/^\d+$/)) {
              parsedData.companyName = secondLine;
              console.log("استخدام السطر الثاني كاسم الشركة:", parsedData.companyName);
            }
          }
        }
      }
    }
    
    // تحسين النتائج: إذا لم نجد رقم الهاتف، نبحث مرة أخرى بطريقة أكثر شمولاً
    if (!parsedData.phoneNumber) {
      // البحث عن أي سلسلة أرقام قد تكون رقم هاتف عراقي
      const allNumbers = extractedText.match(/\b\d{9,12}\b/g);
      if (allNumbers && allNumbers.length > 0) {
        // البحث عن أرقام تبدأ بـ 07 أولاً
        const iraqiNumbers = allNumbers.filter(num => num.startsWith('07') && num.length >= 10);
        
        if (iraqiNumbers.length > 0) {
          // استخدام أول رقم يبدأ بـ 07
          parsedData.phoneNumber = iraqiNumbers[0].substring(0, 11);
          console.log("تم العثور على رقم هاتف عراقي محتمل:", parsedData.phoneNumber);
        } else if (allNumbers.length > 0) {
          // استخدام أول رقم طويل وإضافة 07 في البداية إذا لزم الأمر
          let possiblePhone = allNumbers[0];
          if (!possiblePhone.startsWith('07')) {
            possiblePhone = possiblePhone.length <= 9 ? `07${possiblePhone}` : possiblePhone;
          }
          parsedData.phoneNumber = possiblePhone.substring(0, 11);
          console.log("تم اختيار رقم محتمل كرقم هاتف:", parsedData.phoneNumber);
        }
      }
    }
    
    // تحسين النتائج: إذا لم نجد الكود، نبحث عن أي رقم قد يكون كوداً
    if (!parsedData.code) {
      const possibleCodes = extractedText.match(/\b\d{4,10}\b/g);
      if (possibleCodes && possibleCodes.length > 0) {
        // تجنب استخدام الأرقام التي تبدو كأرقام هواتف (تبدأ بـ 07)
        const nonPhoneNumbers = possibleCodes.filter(num => !num.startsWith('07'));
        
        if (nonPhoneNumbers.length > 0) {
          // استخدام أطول رقم غير رقم هاتف
          const longestCode = nonPhoneNumbers.reduce((a, b) => a.length >= b.length ? a : b);
          parsedData.code = longestCode;
          console.log("تم اختيار أطول رقم غير هاتف كرمز محتمل:", parsedData.code);
        } else if (parsedData.phoneNumber && possibleCodes.length > 1) {
          // استخدام رقم آخر غير رقم الهاتف الذي تم تحديده
          const otherNumbers = possibleCodes.filter(num => num !== parsedData.phoneNumber);
          if (otherNumbers.length > 0) {
            parsedData.code = otherNumbers[0];
            console.log("تم اختيار رقم مختلف عن رقم الهاتف كرمز محتمل:", parsedData.code);
          }
        } else {
          // استخدام أول رقم إذا لم نجد رقم هاتف سابقاً
          parsedData.code = possibleCodes[0];
          console.log("تم اختيار أول رقم طويل كرمز محتمل:", parsedData.code);
        }
      }
    }
    
    // معالجة وتحسين البيانات المستخرجة
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    console.log("البيانات المحسنة:", enhancedData);
    
    // تصحيح اسم المحافظة إذا وجد
    if (enhancedData.province) {
      enhancedData.province = correctProvinceName(enhancedData.province);
      console.log("تم تصحيح اسم المحافظة:", enhancedData.province);
    }
    
    // تنسيق السعر وفقًا لقواعد العمل
    if (enhancedData.price) {
      enhancedData.price = formatPrice(enhancedData.price);
      console.log("تم تنسيق السعر:", enhancedData.price);
    }
    
    // تقييم جودة البيانات المستخرجة
    const confidenceScore = calculateConfidenceScore(enhancedData);
    console.log("درجة الثقة المحسوبة:", confidenceScore);
    
    return {
      parsedData: enhancedData,
      confidenceScore
    };
  } catch (error) {
    console.error("خطأ في parseGeminiResponse:", error);
    return {
      parsedData: {},
      confidenceScore: 0
    };
  }
}
