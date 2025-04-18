
import { ImageData } from "@/types/ImageData";
import { hashImage, getImageHash } from "./duplicateDetection/imageHasher";
import { compareImageHashes, calculateSimilarity } from "./duplicateDetection/imageMatcher";

interface DuplicateDetectionOptions {
  enabled: boolean;
  threshold?: number;
}

/**
 * يتحقق مما إذا كانت الصورة مكررة بناءً على الصور الموجودة
 * @param image الصورة المراد التحقق منها
 * @param allFiles جميع الصور الموجودة
 * @param options خيارات الكشف عن التكرارات
 * @returns true إذا كانت الصورة مكررة، false إذا لم تكن كذلك
 */
export const checkDuplicateImage = async (
  image: ImageData,
  allFiles: ImageData[],
  options: DuplicateDetectionOptions = { enabled: true, threshold: 0.9 }
): Promise<boolean> => {
  if (!options.enabled) {
    return false;
  }

  // استبعاد الصور التي لم يتم معالجتها بعد أو التي هي قيد المعالجة
  const processedFiles = allFiles.filter(file => file.status === 'completed' && file.id !== image.id);

  // إذا لم تكن هناك صور معالجة، فليست هناك حاجة للتحقق من التكرارات
  if (processedFiles.length === 0) {
    return false;
  }

  // مقارنة الصورة الجديدة مع كل صورة معالجة
  for (const baseImage of processedFiles) {
    // يجب أن تكون الصور من نفس المستخدم
    if (image.userId !== baseImage.userId) {
      continue;
    }

    // حساب تشابه الصور
    const similarity = await compareImages(image, baseImage);

    // إذا تجاوز التشابه الحد المحدد، تعتبر الصورة مكررة
    if (similarity >= (options.threshold || 0.9)) {
      console.log(`تم العثور على صورة مكررة (التشابه: ${similarity})`);
      return true;
    }
  }

  // إذا لم يتم العثور على أي تكرارات، تعتبر الصورة فريدة
  return false;
};

/**
 * يقارن بين صورتين ويحسب التشابه بينهما
 * @param imageA الصورة الأولى
 * @param imageB الصورة الثانية
 * @returns قيمة التشابه بين الصورتين
 */
const compareImages = async (imageA: ImageData, imageB: ImageData): Promise<number> => {
  try {
    // الحصول على بصمات الصور
    const hashA = await hashImage(imageA);
    const hashB = await hashImage(imageB);

    // إذا فشل الحصول على البصمات، يتم إرجاع 0
    if (!hashA || !hashB) {
      return 0;
    }

    // حساب التشابه بين البصمات
    const similarity = calculateSimilarity(hashA, hashB);
    return similarity;
  } catch (error) {
    console.error("خطأ في مقارنة الصور:", error);
    return 0;
  }
};

/**
 * إزالة الصور المكررة من قائمة الصور
 * @param allFiles قائمة الصور
 * @returns قائمة الصور بعد إزالة المكررات
 */
export const removeDuplicateImages = async (allFiles: ImageData[]): Promise<ImageData[]> => {
  const uniqueImages: ImageData[] = [];
  const processedHashes: Set<string> = new Set();

  for (const image of allFiles) {
    // يجب أن تكون الصور من نفس المستخدم
    const userFiles = allFiles.filter(file => file.userId === image.userId);

    // الحصول على بصمة الصورة
    const hash = await hashImage(image);

    // إذا لم يتم العثور على بصمة، يتم تجاهل الصورة
    if (!hash) {
      continue;
    }

    // إذا كانت البصمة موجودة بالفعل، تعتبر الصورة مكررة
    if (!processedHashes.has(hash)) {
      uniqueImages.push(image);
      processedHashes.add(hash);
    }
  }

  return uniqueImages;
};

/**
 * ترتيب الصور حسب التشابه
 * @param image الصورة المراد ترتيب الصور بناءً عليها
 * @param allFiles جميع الصور الموجودة
 * @returns قائمة الصور المرتبة حسب التشابه
 */
export const sortImagesBySimilarity = async (image: ImageData, allFiles: ImageData[]): Promise<ImageData[]> => {
  const userFiles = allFiles.filter(file => file.userId === image.userId);

  // حساب التشابه بين الصورة المرجعية وكل صورة أخرى
  const similarityScores = await Promise.all(
    userFiles.map(async (file) => {
      const similarity = await compareImages(image, file);
      return { file, similarity };
    })
  );

  // ترتيب الصور حسب التشابه تنازليًا
  similarityScores.sort((a, b) => b.similarity - a.similarity);

  // إرجاع قائمة الصور المرتبة
  return similarityScores.map(item => item.file);
};
