
// خدمة الأتمتة
import { AutomationService } from './automationService/index';

export const toggleAutomation = async (enabled: boolean): Promise<void> => {
  AutomationService.setEnabled(enabled);
  console.log("تم تغيير حالة الأتمتة إلى:", enabled);
};

export const isAutomationEnabled = async (): Promise<boolean> => {
  return AutomationService.isEnabled;
};

export const checkAutomationStatus = async (): Promise<{
  enabled: boolean;
  lastExecutionAt: Date | null;
  nextExecutionAt: Date | null;
}> => {
  const status = AutomationService.getStatus();
  return {
    enabled: status.isEnabled,
    lastExecutionAt: new Date(),
    nextExecutionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
};

export { AutomationService };
export default AutomationService;
