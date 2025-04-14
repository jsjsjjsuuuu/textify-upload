
/**
 * مراقب عمليات التحميل
 * يتتبع الأداء والأخطاء في عمليات تحميل الملفات
 */

interface UploadMetrics {
  startTime: number;
  endTime?: number;
  success: boolean;
  fileCount: number;
  totalSize: number;
  errors: string[];
}

class UploadMonitor {
  private static instance: UploadMonitor;
  private metrics: Map<string, UploadMetrics> = new Map();

  private constructor() {}

  static getInstance(): UploadMonitor {
    if (!UploadMonitor.instance) {
      UploadMonitor.instance = new UploadMonitor();
    }
    return UploadMonitor.instance;
  }

  startUpload(batchId: string, fileCount: number, totalSize: number): void {
    this.metrics.set(batchId, {
      startTime: Date.now(),
      success: false,
      fileCount,
      totalSize,
      errors: []
    });
    console.info(`بدء عملية تحميل جديدة: ${batchId} مع ${fileCount} ملف`);
  }

  recordError(batchId: string, error: string): void {
    const metrics = this.metrics.get(batchId);
    if (metrics) {
      metrics.errors.push(error);
      console.error(`خطأ في عملية التحميل ${batchId}:`, error);
    }
  }

  completeUpload(batchId: string, success: boolean): void {
    const metrics = this.metrics.get(batchId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.success = success;
      
      const duration = (metrics.endTime - metrics.startTime) / 1000;
      console.info(`اكتملت عملية التحميل ${batchId}:`, {
        duration: `${duration}s`,
        success,
        errors: metrics.errors.length
      });
    }
  }

  getMetrics(batchId: string): UploadMetrics | undefined {
    return this.metrics.get(batchId);
  }
}

export const uploadMonitor = UploadMonitor.getInstance();
