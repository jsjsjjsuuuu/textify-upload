
// خدمة التشغيل الآلي - AutomationService

export interface AutomationConfig {
  enabled: boolean;
  interval: number;
  maxRetries: number;
  taskTypes: string[];
}

export interface AutomationTask {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  retries: number;
  data: any;
}

export const AutomationService = {
  isEnabled: false,
  config: {
    enabled: false,
    interval: 5000, // 5 ثوانٍ
    maxRetries: 3,
    taskTypes: ['image_processing', 'data_extraction', 'api_submission']
  } as AutomationConfig,
  
  // تهيئة خدمة التشغيل الآلي
  initialize: (config?: Partial<AutomationConfig>) => {
    AutomationService.config = {
      ...AutomationService.config,
      ...config
    };
    AutomationService.isEnabled = AutomationService.config.enabled;
    console.log("تم تهيئة خدمة التشغيل الآلي:", AutomationService.config);
  },
  
  // تشغيل/إيقاف الخدمة
  setEnabled: (enabled: boolean) => {
    AutomationService.isEnabled = enabled;
    AutomationService.config.enabled = enabled;
    console.log(`خدمة التشغيل الآلي ${enabled ? 'مفعلة' : 'معطلة'} الآن`);
    return AutomationService.isEnabled;
  },
  
  // الحصول على حالة التفعيل الحالية
  getStatus: () => {
    return {
      isEnabled: AutomationService.isEnabled,
      config: AutomationService.config
    };
  },
  
  // إضافة مهمة جديدة للتنفيذ الآلي
  addTask: (taskType: string, data: any): AutomationTask => {
    // التحقق من دعم نوع المهمة
    if (!AutomationService.config.taskTypes.includes(taskType)) {
      throw new Error(`نوع المهمة غير مدعوم: ${taskType}`);
    }
    
    // إنشاء مهمة جديدة
    const task: AutomationTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retries: 0,
      data
    };
    
    console.log(`تمت إضافة مهمة جديدة من النوع "${taskType}" بالمعرف: ${task.id}`);
    return task;
  }
};

// تصدير الواجهة
export default AutomationService;
