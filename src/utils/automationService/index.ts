
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
    interval: 5000,
    maxRetries: 3,
    taskTypes: ['image_processing', 'data_extraction', 'api_submission']
  } as AutomationConfig,
  
  // تهيئة الخدمة
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
  
  // الحصول على الحالة
  getStatus: () => {
    return {
      isEnabled: AutomationService.isEnabled,
      config: AutomationService.config,
      lastExecutionAt: new Date(),
      nextExecutionAt: new Date(Date.now() + AutomationService.config.interval)
    };
  },
  
  // إضافة مهمة للمعالجة
  addTask: (taskType: string, data: any): AutomationTask => {
    if (!AutomationService.config.taskTypes.includes(taskType)) {
      throw new Error(`نوع المهمة غير مدعوم: ${taskType}`);
    }
    
    const task: AutomationTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retries: 0,
      data
    };
    
    console.log(`تمت إضافة مهمة جديدة: ${taskType}`, task.id);
    return task;
  }
};

export default AutomationService;
