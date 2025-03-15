
/**
 * واجهة خيارات البوكماركلت
 */

export interface BookmarkletOptions {
  version: string;
  includeFormFiller: boolean;
  includeExportTools: boolean;
  includeSeleniumLike?: boolean;
  debugMode?: boolean;
}
