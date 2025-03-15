
/**
 * واجهة خيارات البوكماركلت
 */

export interface BookmarkletOptions {
  version: string;
  includeFormFiller: boolean;
  includeExportTools: boolean;
  includeSeleniumLike?: boolean;
  debugMode?: boolean;
  /**
   * خيارات متقدمة لتخصيص البوكماركلت
   */
  advancedOptions?: {
    /**
     * استخدام تقنية متقدمة للكشف عن الحقول
     */
    useAdvancedFieldDetection?: boolean;
    /**
     * محاولة تحديث الصفحة بعد ملء الحقول
     */
    refreshAfterFill?: boolean;
  };
}
